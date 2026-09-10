import xss from 'xss';

const commentFilter = new xss.FilterXSS({
  onIgnoreTag(tag, html, { isClosing }) {
    if (tag !== 'input' || isClosing) return;

    let type;
    let checked = false;
    const attributes = html.replace(/^<input\b/i, '').replace(/\/?\s*>$/, '');
    xss.parseAttr(attributes, (name, value) => {
      if (name === 'type' && type === undefined) type = value.toLowerCase();
      if (name === 'checked') checked = true;
    });
    if (type !== 'checkbox') return;

    // Markdown task lists are display-only. Rebuild the element instead of
    // allowing visitor-supplied attributes or other kinds of form controls.
    return `<input type="checkbox" disabled${checked ? ' checked' : ''}>`;
  },
  onIgnoreTagAttr(tag, name, value) {
    // Markdown's code language is needed by Prism after the comment is saved.
    // Keep only this marker; other classes and attributes use the default filter.
    if ((tag === 'pre' || tag === 'code') && name === 'class') {
      const language = value.split(/\s+/).find((item) => /^language-[a-z0-9_-]+$/i.test(item));
      if (language) return `class="${language}"`;
    }
  },
});

export function sanitizeComment(html) {
  return commentFilter.process(html);
}
