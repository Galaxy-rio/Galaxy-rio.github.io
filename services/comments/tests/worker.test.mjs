import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { after, before, test } from 'node:test';
import { Miniflare } from 'miniflare';
import { marked } from 'marked';
import { siteConfig } from '../scripts/site-config.mjs';

const md5 = (value) => createHash('md5').update(value).digest('hex');
const adminToken = md5('local-test-password-only');
const origin = 'https://www.galaxyrio.top';
let runtime;
let db;
const notificationRequests = [];

const call = async (event, accessToken = 'test-visitor') => {
  const response = await runtime.dispatchFetch('https://comments.galaxyrio.top/', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': '203.0.113.10' },
    body: JSON.stringify({ ...event, accessToken }),
  });
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  return response.json();
};

before(async () => {
  runtime = new Miniflare({
    modules: true,
    scriptPath: fileURLToPath(new URL('../dist/index.js', import.meta.url)),
    compatibilityDate: '2026-03-02',
    compatibilityFlags: ['nodejs_compat'],
    d1Databases: { DB: 'test-comments' },
    bindings: { QMSG_QQ: '123456789' },
    async outboundService(request) {
      assert.equal(request.url, 'https://qmsg.zendee.cn/v3/send/local-qmsg-test-key');
      assert.equal(request.method, 'POST');
      assert.match(request.headers.get('Content-Type'), /application\/x-www-form-urlencoded/);
      notificationRequests.push(new URLSearchParams(await request.text()));
      return Response.json({ success: true, code: 0, data: 1 });
    },
  });
  db = await runtime.getD1Database('DB');
  const schema = await readFile(new URL('../schema.sql', import.meta.url), 'utf8');
  for (const statement of schema.replace(/^--.*$/gm, '').split(';').map((sql) => sql.trim()).filter(Boolean)) {
    await db.prepare(statement).run();
  }
  await db.prepare('UPDATE config SET value = ?').bind(JSON.stringify({
    ...siteConfig,
    ADMIN_PASS: md5(adminToken),
  })).run();
});

after(async () => { await runtime?.dispose(); });

test('serves public settings and rejects unauthorized management', async () => {
  const config = await call({ event: 'GET_CONFIG' });
  assert.equal(config.config.REQUIRED_FIELDS, 'nick');
  assert.equal(config.config.SHOW_IMAGE, 'false');
  assert.equal(config.config.ADMIN_PASS, undefined);
  const guest = await call({ event: 'GET_CONFIG_FOR_ADMIN' });
  assert.equal(guest.config, undefined);
  const admin = await call({ event: 'GET_CONFIG_FOR_ADMIN' }, adminToken);
  assert.equal(admin.config.SITE_NAME, 'galaxyrio');
});

test('stores comments in D1, isolates articles, and sanitizes submitted HTML', async () => {
  const submitted = await call({
    event: 'COMMENT_SUBMIT',
    url: '/blog/test-article/',
    href: `${origin}/zh/blog/test-article/`,
    nick: 'Test visitor',
    mail: 'private@example.test',
    link: '',
    ua: 'Mozilla/5.0',
    comment: '<p>Hello from the test.</p><script>alert(1)</script><img src=x onerror="alert(2)">',
  });
  assert.ok(submitted.id, JSON.stringify(submitted));
  const saved = await db.prepare('SELECT * FROM comment WHERE _id = ?').bind(submitted.id).first();
  assert.equal(saved.url, '/blog/test-article/');
  assert.doesNotMatch(saved.comment, /<script|onerror=/i);
  const comments = await call({ event: 'COMMENT_GET', url: '/blog/test-article/' });
  assert.equal(comments.count, 1);
  assert.doesNotMatch(JSON.stringify(comments), /private@example\.test|203\.0\.113\.10/);
  const otherArticle = await call({ event: 'COMMENT_GET', url: '/blog/other-article/' });
  assert.equal(otherArticle.count, 0);
  const reply = await call({
    event: 'COMMENT_SUBMIT', url: '/blog/test-article/', href: `${origin}/en/blog/test-article/`,
    nick: 'Another visitor', mail: '', link: '', ua: 'Mozilla/5.0',
    comment: '<p>A reply.</p>', pid: submitted.id, rid: submitted.id,
  }, 'another-visitor');
  assert.ok(reply.id, JSON.stringify(reply));
});

test('preserves code languages after saving without allowing arbitrary HTML attributes', async () => {
  const url = '/blog/highlight-test/';
  const submitted = await call({
    event: 'COMMENT_SUBMIT', url, href: `${origin}${url}`,
    nick: 'Code reader', mail: '', link: '', ua: 'Mozilla/5.0',
    comment: '<pre class="language-python arbitrary" style="color:red">'
      + '<code class="language-python tk-admin" onclick="alert(1)">print(&quot;hello&quot;)</code></pre>'
      + '<p class="language-javascript" onmouseover="alert(2)">Text</p>'
      + '<code class="language-js&quot;onfocus=alert(3)">Invalid marker</code>'
      + '<img src="x" onerror="alert(4)">',
  }, 'code-reader');
  assert.ok(submitted.id, JSON.stringify(submitted));
  const saved = await db.prepare('SELECT comment FROM comment WHERE _id = ?').bind(submitted.id).first();
  assert.match(saved.comment, /<pre class="language-python"><code class="language-python">/);
  assert.match(saved.comment, /<p>Text<\/p>/);
  assert.match(saved.comment, /<code>Invalid marker<\/code>/);
  assert.doesNotMatch(saved.comment, /arbitrary|tk-admin|style=|onclick=|onmouseover=|onfocus=|onerror=/i);
  const loaded = await call({ event: 'COMMENT_GET', url });
  assert.equal(loaded.data.find((comment) => comment.id === submitted.id).comment, saved.comment);
});

test('stores Markdown task lists as disabled checkboxes without allowing active form controls', async () => {
  const url = '/blog/task-list-test/';
  const markdown = '- [ ] a\n- [x] b\n\n```html\n<input type="checkbox">\n```';
  const submitted = await call({
    event: 'COMMENT_SUBMIT', url, href: `${origin}${url}`,
    nick: 'Task reader', mail: '', link: '', ua: 'Mozilla/5.0',
    comment: marked.parse(markdown)
      + '<input TYPE="CHECKBOX" checked="checked" onclick="alert(1)" onchange="alert(2)"'
      + ' autofocus form="comment-form" name="submit" style="position:fixed" value="private">'
      + '<input type="text" value="untrusted"><input type="image" src="https://example.test/">',
  }, 'task-reader');
  assert.ok(submitted.id, JSON.stringify(submitted));
  const saved = await db.prepare('SELECT comment FROM comment WHERE _id = ?').bind(submitted.id).first();
  assert.match(saved.comment, /<li><input type="checkbox" disabled> a<\/li>/);
  assert.match(saved.comment, /<li><input type="checkbox" disabled checked> b<\/li>/);
  const inputs = saved.comment.match(/<input\b[^>]*>/g);
  assert.deepEqual(inputs, [
    '<input type="checkbox" disabled>',
    '<input type="checkbox" disabled checked>',
    '<input type="checkbox" disabled checked>',
  ]);
  assert.doesNotMatch(saved.comment, /onclick=|onchange=|autofocus|form=|name=|style=|private/);
  assert.match(saved.comment, /<code class="language-html">&lt;input type=&quot;checkbox&quot;&gt;/);
  const loaded = await call({ event: 'COMMENT_GET', url });
  assert.equal(loaded.data.find((comment) => comment.id === submitted.id).comment, saved.comment);
});

test('sends Qmsg to the configured QQ recipient and skips the blogger\'s own comments', async () => {
  notificationRequests.length = 0;
  const settings = JSON.parse((await db.prepare('SELECT value FROM config').first()).value);
  try {
    await db.prepare('UPDATE config SET value = ?').bind(JSON.stringify({
      ...settings, PUSHOO_CHANNEL: 'qmsg', PUSHOO_TOKEN: 'local-qmsg-test-key',
      BLOGGER_EMAIL: 'owner@example.test',
    })).run();
    const comment = {
      event: 'COMMENT_SUBMIT', url: '/blog/notification-test/',
      href: `${origin}/zh/blog/notification-test/`,
      nick: 'Notification reader', mail: 'reader@example.test', link: '',
      ua: 'Mozilla/5.0', comment: '<p>Notification delivery check: https://example.test/ 1234567890.</p>',
    };
    const visitor = await call(comment, 'notification-reader');
    assert.ok(visitor.id, JSON.stringify(visitor));
    assert.equal(notificationRequests.length, 1);
    assert.equal(notificationRequests[0].get('qq'), '123456789');
    assert.equal(notificationRequests[0].get('msg'), '博客收到一条新留言，请打开网站查看。');
    const owner = await call({ ...comment, mail: 'owner@example.test' }, adminToken);
    assert.ok(owner.id, JSON.stringify(owner));
    assert.equal(notificationRequests.length, 1, 'The blogger should not receive a self-notification.');
  } finally {
    await db.prepare('UPDATE config SET value = ?').bind(JSON.stringify(settings)).run();
  }
});

test('keeps simultaneous administrator and visitor requests separate', async () => {
  await Promise.all(Array.from({ length: 12 }, async (_, index) => {
    const [admin, guest] = await Promise.all([
      call({ event: 'GET_CONFIG_FOR_ADMIN' }, adminToken),
      call({ event: 'GET_CONFIG_FOR_ADMIN' }, `guest-${index}`),
    ]);
    assert.ok(admin.config);
    assert.equal(guest.config, undefined);
  }));
});

test('blocks unapproved origins and image uploads', async () => {
  const rejected = await runtime.dispatchFetch('https://comments.galaxyrio.top/', {
    headers: { Origin: 'https://unrelated.example' },
  });
  assert.equal(rejected.status, 403);
  const upload = await call({ event: 'UPLOAD_IMAGE', photo: 'data:image/png;base64,AAAA' });
  assert.notEqual(upload.code, 0);
  const reinitialize = await call({ event: 'SET_PASSWORD', password: 'replacement' });
  assert.notEqual(reinitialize.code, 0);
});
