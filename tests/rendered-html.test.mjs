import assert from "node:assert/strict";
import { access, readFile, readdir, stat } from "node:fs/promises";
import test from "node:test";
import {
  contentIdFromPath,
  contentSlugFromId,
  selectLocalizedEntries,
} from "../src/utils/localizedContent.ts";
import {
  compareContentDateTimeDescending,
  contentDateTime,
  contentDateTimeIso,
} from "../src/utils/contentDateTime.ts";
import {
  groupContentByYear,
  selectSecondLevelHeadings,
} from "../src/utils/contentNavigation.ts";

const readOutput = (path) =>
  readFile(new URL(`../dist/${path}`, import.meta.url), "utf8");

test("selects one localized version per logical content item", () => {
  const pairedZh = {
    id: "2026/paired.zh",
    data: { language: "zh", translationKey: "paired" },
  };
  const pairedEn = {
    id: "2026/paired.en",
    data: { language: "en", translationKey: "paired" },
  };
  const chineseOnly = {
    id: "2026/chinese-only.zh",
    data: { language: "zh" },
  };
  const englishOnly = {
    id: "2027/english-only.en",
    data: { language: "en" },
  };
  const entries = [pairedZh, pairedEn, chineseOnly, englishOnly];

  const zhEntries = selectLocalizedEntries(entries, "zh");
  const enEntries = selectLocalizedEntries(entries, "en");

  assert.equal(entries.length, 4);
  assert.equal(zhEntries.length, 3);
  assert.equal(enEntries.length, 3);
  assert.equal(zhEntries[0], pairedZh);
  assert.equal(enEntries[0], pairedEn);
  assert.ok(enEntries.includes(chineseOnly));
  assert.ok(zhEntries.includes(englishOnly));

  const routes = [
    ...zhEntries.map((entry) => `zh:${contentSlugFromId(entry.id)}`),
    ...enEntries.map((entry) => `en:${contentSlugFromId(entry.id)}`),
  ];
  assert.equal(routes.length, 6);
  assert.equal(new Set(routes).size, 6);
  assert.deepEqual(
    enEntries.map((entry) => contentSlugFromId(entry.id)),
    ["2026/paired", "2026/chinese-only", "2027/english-only"],
  );

  assert.equal(contentIdFromPath("2026/paired.zh.md"), "2026/paired.zh");
  assert.equal(contentIdFromPath("2026\\paired.en.mdx"), "2026/paired.en");
  assert.equal(contentSlugFromId("2026/nested-post.en.md"), "2026/nested-post");
  assert.equal(contentSlugFromId("2026/nested-post/index.zh.mdx"), "2026/nested-post");

  assert.throws(
    () =>
      selectLocalizedEntries(
        [
          pairedZh,
          { id: "2026/paired-copy.zh", data: { language: "zh", translationKey: "paired" } },
        ],
        "zh",
      ),
    /multiple zh entries/,
  );
  assert.throws(
    () =>
      selectLocalizedEntries(
        [
          pairedZh,
          { id: "2027/renamed.en", data: { language: "en", translationKey: "paired" } },
        ],
        "en",
      ),
    /same relative path and base filename/,
  );
  assert.throws(
    () =>
      selectLocalizedEntries(
        [
          { id: "2026/collision.zh", data: { language: "zh" } },
          { id: "2026/collision.en", data: { language: "en" } },
        ],
        "en",
      ),
    /shared by unrelated entries/,
  );
  assert.throws(
    () =>
      selectLocalizedEntries(
        [{ id: "2026/wrong-language.en", data: { language: "zh" } }],
        "zh",
      ),
    /\.en filename suffix but declares language: zh/,
  );
  assert.throws(() => contentSlugFromId("index.zh.md"), /safe public slug/);
});

test("orders content by the authored date and time in Shanghai", () => {
  const morning = { id: "morning", data: { date: "2026-08-27", time: "09:15" } };
  const evening = { id: "evening", data: { date: "2026-08-27", time: "21:30" } };
  const nextDay = { id: "next-day", data: { date: "2026-08-28", time: "00:05" } };

  assert.equal(contentDateTimeIso(evening.data), "2026-08-27T21:30:00+08:00");
  assert.equal(contentDateTime(evening.data).toISOString(), "2026-08-27T13:30:00.000Z");
  assert.deepEqual(
    [morning, nextDay, evening].sort(compareContentDateTimeDescending).map(({ id }) => id),
    ["next-day", "evening", "morning"],
  );
});

test("groups archives by descending year and selects only second-level headings", () => {
  const olderFeatured = { id: "older", data: { date: "2025-12-01" } };
  const current = { id: "current", data: { date: "2026-02-01" } };
  const newest = { id: "newest", data: { date: "2027-01-01" } };
  const groups = groupContentByYear([olderFeatured, current, newest]);

  assert.deepEqual(groups.map(({ year }) => year), ["2027", "2026", "2025"]);
  assert.deepEqual(groups[2].entries, [olderFeatured]);

  const headings = [
    { depth: 1, slug: "title", text: "Title" },
    { depth: 2, slug: "overview", text: "Overview" },
    { depth: 3, slug: "detail", text: "Detail" },
    { depth: 2, slug: "result", text: "Result" },
  ];
  assert.deepEqual(
    selectSecondLevelHeadings(headings).map(({ slug }) => slug),
    ["overview", "result"],
  );
});

test("wires localized content selection into collections and routes", async () => {
  const [
    contentConfig,
    contentMeta,
    dateTimeUtility,
    home,
    blogIndex,
    blogDetail,
    projectsIndex,
    projectsDetail,
    blogTemplate,
    projectTemplate,
    guide,
    contentNavigation,
    contentCover,
    contentSideNav,
    articleCard,
    projectCard,
    contentEnhancements,
    componentsCss,
    pagesCss,
    proseCss,
    astroConfig,
  ] =
    await Promise.all([
      readFile(new URL("../src/content.config.ts", import.meta.url), "utf8"),
      readFile(new URL("../src/data/contentMeta.ts", import.meta.url), "utf8"),
      readFile(new URL("../src/utils/contentDateTime.ts", import.meta.url), "utf8"),
      readFile(new URL("../src/pages/[lang]/index.astro", import.meta.url), "utf8"),
      readFile(new URL("../src/pages/[lang]/blog/index.astro", import.meta.url), "utf8"),
      readFile(new URL("../src/pages/[lang]/blog/[...slug].astro", import.meta.url), "utf8"),
      readFile(new URL("../src/pages/[lang]/projects/index.astro", import.meta.url), "utf8"),
      readFile(new URL("../src/pages/[lang]/projects/[...slug].astro", import.meta.url), "utf8"),
      readFile(new URL("../src/content/blog/_template.md", import.meta.url), "utf8"),
      readFile(new URL("../src/content/projects/_template.md", import.meta.url), "utf8"),
      readFile(new URL("../src/content/README.md", import.meta.url), "utf8"),
      readFile(new URL("../src/utils/contentNavigation.ts", import.meta.url), "utf8"),
      readFile(new URL("../src/utils/contentCover.ts", import.meta.url), "utf8"),
      readFile(new URL("../src/components/ContentSideNav.astro", import.meta.url), "utf8"),
      readFile(new URL("../src/components/ArticleCard.astro", import.meta.url), "utf8"),
      readFile(new URL("../src/components/ProjectCard.astro", import.meta.url), "utf8"),
      readFile(new URL("../src/components/ContentEnhancements.astro", import.meta.url), "utf8"),
      readFile(new URL("../src/styles/components.css", import.meta.url), "utf8"),
      readFile(new URL("../src/styles/pages.css", import.meta.url), "utf8"),
      readFile(new URL("../src/styles/prose.css", import.meta.url), "utf8"),
      readFile(new URL("../astro.config.mjs", import.meta.url), "utf8"),
    ]);

  assert.equal((contentConfig.match(/generateId:\s*\(\{ entry \}\)/g) ?? []).length, 2);
  assert.equal((contentConfig.match(/contentIdFromPath\(entry\)/g) ?? []).length, 2);
  assert.equal((contentConfig.match(/pattern:\s*"\*\*\/\*\.\{md,mdx\}"/g) ?? []).length, 2);
  assert.match(contentConfig, /translationKey:\s*optionalText/);
  assert.match(contentConfig, /author:\s*z\.string\(\)\.trim\(\)\.min\(1\)/);
  assert.match(contentConfig, /date,/);
  assert.match(contentConfig, /time,/);
  assert.match(contentConfig, /category:\s*z\.enum\(contentCategories\)/);
  assert.match(contentConfig, /series:\s*optionalText/);
  assert.match(contentConfig, /featured:\s*z\.boolean\(\)\.default\(false\)/);
  assert.match(contentConfig, /status:\s*z\.enum\(publicationStatuses\)\.default\("draft"\)/);
  assert.match(contentConfig, /cover:\s*optionalText/);
  assert.equal((contentConfig.match(/schema:\s*contentSchema/g) ?? []).length, 2);
  assert.match(contentMeta, /"software"[\s\S]*"design"[\s\S]*"handcraft"[\s\S]*"research"[\s\S]*"learning"/);
  assert.match(contentMeta, /publicationStatuses = \["draft", "publish"\]/);
  assert.doesNotMatch(contentConfig, /"other"/);
  assert.doesNotMatch(contentConfig, /publishedAt|updatedAt|completedAt|\bkind:|\bdraft:/);
  assert.match(dateTimeUtility, /CONTENT_TIME_ZONE_OFFSET = "\+08:00"/);
  assert.match(dateTimeUtility, /compareContentDateTimeDescending/);
  assert.match(home, /selectLocalizedEntries\(allProjects, lang\)/);
  assert.match(home, /selectLocalizedEntries\(allPosts, lang\)/);
  assert.equal((home.match(/data\.status === "publish"/g) ?? []).length, 2);

  assert.match(blogIndex, /selectLocalizedEntries\([\s\S]*?getCollection\("blog"[\s\S]*?lang,/);
  assert.match(blogDetail, /selectLocalizedEntries\(posts, lang\)\.map/);
  assert.match(projectsIndex, /selectLocalizedEntries\([\s\S]*?getCollection\("projects"[\s\S]*?lang,/);
  assert.match(projectsDetail, /selectLocalizedEntries\(projects, lang\)\.map/);
  for (const source of [blogIndex, blogDetail, projectsIndex, projectsDetail]) {
    assert.match(source, /selectLocalizedEntries\(/);
    assert.match(source, /contentSlugFromId\(/);
    assert.match(source, /data\.status === "publish"/);
    assert.doesNotMatch(source, /const slugFromId/);
    assert.doesNotMatch(source, /data\.(?:draft|publishedAt|updatedAt|completedAt|kind)\b/);
  }
  for (const source of [blogDetail, projectsIndex, projectsDetail]) {
    assert.match(source, /contentCategoryLabels/);
  }

  assert.match(blogIndex, /featured=\{post\.data\.featured\}/);
  assert.doesNotMatch(blogIndex, /timeStyle:/);
  assert.match(projectsIndex, /featuredLabel=\{project\.data\.featured/);
  for (const source of [blogIndex, projectsIndex]) {
    assert.match(source, /groupContentByYear\(/);
    assert.match(source, /<ContentSideNav/);
    assert.equal((source.match(/<ContentSideNav/g) ?? []).length, 1);
    assert.match(source, /resolveContentCover\(/);
    assert.match(source, /image=\{resolveContentCover\(/);
    assert.match(source, /content-year-section/);
  }
  assert.match(blogDetail, /entry\.data\.author/);
  assert.match(blogDetail, /entry\.data\.series/);
  assert.match(blogDetail, /entry\.data\.links/);
  assert.match(projectsDetail, /entry\.data\.author/);
  assert.match(projectsDetail, /entry\.data\.series/);
  for (const source of [blogDetail, projectsDetail]) {
    assert.match(source, /const \{ Content, headings \} = await render\(entry\)/);
    assert.match(source, /selectSecondLevelHeadings\(headings\)/);
    assert.match(source, /label:\s*heading\.text/);
    assert.match(source, /href:\s*`#\$\{heading\.slug\}`/);
    assert.match(source, /<ContentSideNav/);
    assert.equal((source.match(/<ContentSideNav/g) ?? []).length, 1);
    assert.match(source, /class="content-detail-cover"/);
    assert.match(source, /mainClass="content-detail-page"/);
    assert.match(source, /class="content-detail-hero"/);
    assert.match(source, /class="content-detail-byline"/);
    assert.match(source, /const showSummary = entry\.data\.summary\.trim\(\) !== entry\.data\.title\.trim\(\)/);
    assert.match(source, /\{showSummary && <p class="content-detail-summary">/);
    assert.match(source, /const dateFormatter = new Intl\.DateTimeFormat/);
    assert.doesNotMatch(source, /timeStyle:/);
    const headerMeta = source.match(/<div class="content-detail-meta"[\s\S]*?<\/div>/)?.[0] ?? "";
    assert.match(headerMeta, /<time datetime=\{publishedAtIso\}>/);
    assert.doesNotMatch(headerMeta, /contentCategoryLabels|content-language-badge|localeLabels|<span/);
    assert.match(source, /<dt>\{text\.author\}<\/dt>[\s\S]*?<dt>\{text\.category\}<\/dt>/);
    assert.match(source, /<footer class="content-detail-end-meta"/);
    assert.doesNotMatch(source, /content-detail-byline-tags/);
    assert.match(source, /<ContentEnhancements/);
  }
  assert.match(contentNavigation, /heading\.depth === 2/);
  assert.match(contentNavigation, /sort\(\(a, b\) => b\.localeCompare\(a\)\)/);
  assert.match(contentCover, /\^\(\?:https\?:\)\?\\\/\\\//);
  assert.match(contentCover, /assetPath\(value\)/);
  assert.match(contentSideNav, /data-content-side-nav-link/);
  assert.match(contentSideNav, /data-content-side-nav-active-frame/);
  assert.match(contentSideNav, /aria-current=\{index === 0 \? "location"/);
  assert.match(contentSideNav, /positionActiveFrame/);
  assert.match(contentSideNav, /ResizeObserver/);
  assert.doesNotMatch(contentSideNav, /\bvariant\b/);
  assert.match(articleCard, /class="article-card-visual"/);
  assert.match(articleCard, /class="article-card-content"/);
  assert.match(articleCard, /"has-cover": Boolean\(image\)/);
  assert.doesNotMatch(articleCard, /article-card-footer|actionLabel|MaterialSymbol/);
  assert.match(projectCard, /class="project-visual"/);
  const listCardRule = componentsCss.match(/\.project-card,\s*\.article-card\s*\{([^}]*)\}/)?.[1] ?? "";
  assert.match(listCardRule, /background:\s*var\(--md-sys-color-surface-container\)/);
  assert.doesNotMatch(listCardRule, /surface-container-lowest/);
  const listCardVisualRule = componentsCss.match(/\.project-visual,\s*\.article-card-visual\s*\{([^}]*)\}/)?.[1] ?? "";
  assert.match(listCardVisualRule, /aspect-ratio:\s*16 \/ 9/);
  assert.doesNotMatch(listCardVisualRule, /min-height:\s*220px/);
  assert.match(componentsCss, /\.article-card\s*\{[\s\S]*?--article-card-radius:\s*var\(--md-sys-shape-corner-extra-large\)/);
  assert.match(componentsCss, /\.article-card:is\(:hover, :focus-visible\)\s*\{[^}]*--article-card-radius:\s*var\(--md-sys-shape-corner-extra-extra-large\)/);
  assert.match(componentsCss, /\.article-card-visual\s*\{[\s\S]*?border-radius:\s*var\(--article-card-radius\)[\s\S]*?transition:\s*border-radius/);
  assert.match(componentsCss, /\.article-card-copy p\s*\{[^}]*-webkit-line-clamp:\s*2/);
  assert.match(pagesCss, /\.content-index-layout/);
  assert.match(pagesCss, /\.content-detail-layout/);
  assert.match(pagesCss, /grid-template-columns:\s*minmax\(0, 1fr\) minmax\(168px, 190px\)/);
  assert.match(pagesCss, /grid-template-areas:\s*"header header"\s*"main nav"/);
  assert.match(pagesCss, /\.page-main\.content-detail-page > \.content-detail-layout\s*\{[^}]*width:\s*100%[^}]*max-width:\s*none/);
  assert.match(pagesCss, /\.content-detail-layout\s*\{\s*--content-detail-inline-inset[\s\S]*?grid-template-areas:\s*"hero hero"\s*"main nav"/);
  assert.match(pagesCss, /\.content-detail-header\.has-cover\s*\{[^}]*grid-template-columns:\s*minmax\(420px, 1fr\) clamp\(420px, 42vw, 760px\)[^}]*grid-template-rows:\s*clamp\(320px, 24vw, 428px\)/);
  assert.match(pagesCss, /\.content-side-nav-inner[\s\S]*?position:\s*sticky/);
  assert.match(pagesCss, /\.content-side-nav-inner\s*\{[^}]*padding:\s*12px 0 24px 24px/);
  assert.match(pagesCss, /--content-side-nav-shape-overhang:\s*24px/);
  assert.match(pagesCss, /\.content-side-nav a\s*\{[^}]*width:\s*calc\(100% \+ var\(--content-side-nav-shape-overhang\)\)[^}]*margin-inline-start:\s*calc\(-1 \* var\(--content-side-nav-shape-overhang\)\)[^}]*padding:\s*10px 12px 10px var\(--content-side-nav-shape-overhang\)/);
  assert.match(pagesCss, /\.content-side-nav\s*\{[\s\S]*?align-self:\s*stretch/);
  assert.match(pagesCss, /\.content-side-nav-active-frame\[data-ready\][\s\S]*?var\(--motion-duration-long\)[\s\S]*?var\(--motion-expressive\)/);
  assert.match(pagesCss, /@media \(max-width: 1199px\)[\s\S]*?grid-template-areas:\s*"header"\s*"nav"\s*"main"/);
  assert.match(pagesCss, /@media \(max-width: 1199px\)[\s\S]*?grid-template-areas:\s*"hero"\s*"nav"\s*"main"/);
  assert.match(pagesCss, /@media \(max-width: 1079px\)[\s\S]*?\.content-detail-header\.has-cover\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)[^}]*grid-template-rows:\s*auto auto[^}]*\}[\s\S]*?\.content-detail-cover\s*\{[^}]*aspect-ratio:\s*16 \/ 9/);
  assert.doesNotMatch(pagesCss, /content-side-nav--(?:compact|wide)/);
  assert.doesNotMatch(pagesCss, /\.content-side-nav\s*\{[^}]*order:\s*-1/);
  assert.match(pagesCss, /--content-detail-reading-width:\s*860px/);
  assert.match(pagesCss, /--content-detail-reading-shift:\s*clamp\(24px, 3vw, 48px\)/);
  assert.match(pagesCss, /\.content-detail-main > \.prose,[\s\S]*?max-width:\s*var\(--content-detail-reading-width\)[\s\S]*?margin-inline-start:\s*max\(/);
  assert.match(pagesCss, /\.content-detail-header h1\s*\{[^}]*max-width:\s*none/);
  assert.doesNotMatch(pagesCss, /\.content-detail-header h1\s*\{[^}]*max-width:\s*16ch/);
  assert.match(pagesCss, /\.content-detail-meta > time\s*\{[^}]*color:\s*var\(--md-sys-color-on-surface\)/);
  assert.doesNotMatch(pagesCss, /\.content-detail-meta > time\s*\{[^}]*background/);
  assert.match(pagesCss, /\.content-detail-byline\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(pagesCss, /\.content-detail-end-meta/);
  assert.match(astroConfig, /themes:\s*\{\s*light:\s*"github-light",\s*dark:\s*"github-dark"/);
  assert.match(astroConfig, /defaultColor:\s*false/);
  assert.match(proseCss, /\.prose pre\.astro-code\s*\{[\s\S]*?background-color:\s*var\(--md-sys-color-surface-container\) !important/);
  assert.match(proseCss, /:root\[data-theme="dark"\] \.prose \.astro-code span/);
  assert.match(proseCss, /\.prose table\s*\{[^}]*border:\s*1px solid var\(--md-sys-color-outline-variant\)[^}]*border-radius:\s*var\(--md-sys-shape-corner-small\)/);
  assert.match(proseCss, /\.prose-table-scroll\s*\{[^}]*overflow-x:\s*auto[^}]*border:\s*1px solid var\(--md-sys-color-outline-variant\)/);
  assert.match(contentEnhancements, /<dialog[\s\S]*?data-content-image-dialog/);
  assert.match(contentEnhancements, /\.content-detail-main \.prose img/);
  assert.match(contentEnhancements, /event\.key !== "Enter" && event\.key !== " "/);
  assert.match(contentEnhancements, /scrollContainer\.className = "prose-table-scroll"/);

  const frontmatterKeys = (source) =>
    (source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "")
      .split(/\r?\n/)
      .filter((line) => /^[a-zA-Z][\w-]*:/.test(line))
      .map((line) => line.slice(0, line.indexOf(":")));
  const sharedTemplateKeys = [
    "title",
    "summary",
    "cover",
    "language",
    "translationKey",
    "author",
    "date",
    "time",
    "category",
    "series",
    "tags",
    "featured",
    "status",
    "links",
  ];
  assert.deepEqual(frontmatterKeys(blogTemplate), sharedTemplateKeys);
  assert.deepEqual(frontmatterKeys(projectTemplate), sharedTemplateKeys);
  assert.match(blogTemplate, /status: draft/);
  assert.match(projectTemplate, /status: draft/);

  assert.match(guide, /astro-content-guide\.zh\.md/);
  assert.match(guide, /astro-content-guide\.en\.md/);
  assert.match(guide, /中文界面优先中文、英文界面优先英文/);
  assert.match(guide, /status.*draft.*publish/);
  assert.match(guide, /cover: "https:\/\//);
  assert.match(guide, /右侧文章目录只收集这些二级标题/);
});

test("builds the root language entry and both localized homepages", async () => {
  const [root, zh, en] = await Promise.all([
    readOutput("index.html"),
    readOutput("zh/index.html"),
    readOutput("en/index.html"),
  ]);

  assert.match(root, /选择语言/);
  assert.match(root, /Choose a language/);
  assert.match(root, /portfolio-locale/);

  assert.match(zh, /<html[^>]+lang="zh-CN"/i);
  assert.match(zh, /你好，我是/);
  assert.match(zh, /黄明睿/);
  assert.match(zh, /href="\/en\/"[^>]+data-language-switch/);

  assert.match(en, /<html[^>]+lang="en"/i);
  assert.match(en, /Hello, I am/);
  assert.match(en, /Mingrui HUANG/);
  assert.match(en, /href="\/zh\/"[^>]+data-language-switch/);

  for (const html of [zh, en]) {
    assert.match(html, /<html[^>]+data-palette="tonal-spot"/);
    assert.match(html, /\/images\/profile\/avatar\.jpg/);
    assert.match(
      html,
      /<a class="brand-mark"[^>]*><img[^>]+src="\/images\/profile\/avatar\.jpg"[^>]+alt="[^"]+"/,
    );
    const mobileBrand = html.match(/<a class="mobile-brand"[^>]*>[\s\S]*?<\/a>/)?.[0] ?? "";
    assert.match(mobileBrand, /<img[^>]+src="\/images\/profile\/avatar\.jpg"[^>]+alt="[^"]+"/);
    assert.doesNotMatch(mobileBrand, />\s*G\s*</);
    assert.match(html, /data-theme-toggle/);
    assert.match(html, /portfolio-theme/);
    assert.equal((html.match(/class="mobile-nav-item/g) ?? []).length, 5);
    assert.match(html, /class="mobile-more-drawer"/);
    assert.match(html, /class="mobile-navigation-drawer"/);
    assert.match(html, /data-mobile-drawer-trigger/);
    assert.match(html, /material-symbol/);
    assert.match(html, /<hero-ascii-portrait[^>]+class="hero-ascii-portrait"[^>]+aria-hidden="true"/);
    assert.match(html, /data-ascii-ramp="%#\*\+=-:\."/);
    assert.match(html, /<pre[^>]+data-ascii-art[^>]*>[^<]*[#%*+=:.\-][^<]*<\/pre>/);
    assert.doesNotMatch(html, /data-ascii-glyph/);
    assert.doesNotMatch(html, /profile-portrait/);
    assert.doesNotMatch(html, /hero-geometry/);
    assert.doesNotMatch(html, /fonts\.googleapis\.com/);
    assert.doesNotMatch(html, /__next|data-reactroot|vinext/i);
  }
});

test("builds every profile section in Chinese and English", async () => {
  const sections = ["about", "projects", "research", "blog", "skills", "contact"];
  const outputs = await Promise.all(
    ["zh", "en"].flatMap((locale) =>
      sections.map((section) => readOutput(`${locale}/${section}/index.html`)),
    ),
  );
  const allHtml = outputs.join("\n");

  assert.match(allHtml, /关于我/);
  assert.match(allHtml, />About</);
  assert.match(allHtml, /光学工程/);
  assert.match(allHtml, /Optical Engineering/);
  assert.match(allHtml, /C\+\+/);
  assert.match(allHtml, /Zemax/);
  assert.match(allHtml, /Blender/);
  assert.match(allHtml, /https:\/\/github\.com\/Galaxy-rio/);
  assert.match(allHtml, /https:\/\/orcid\.org\/0009-0000-0685-3045/);
  assert.match(allHtml, /https:\/\/space\.bilibili\.com\/13755352/);
  assert.doesNotMatch(allHtml, /虚拟头像|Virtual avatar/i);
  assert.doesNotMatch(allHtml, /原始语言|自动翻译|original language|translated automatically/i);
  assert.doesNotMatch(allHtml, /src\/content|不虚构|不推测|without inventing|without inferring/i);
  assert.doesNotMatch(allHtml, /galaxyrio\.h\.gmail\.com/i);
  assert.doesNotMatch(allHtml, /mailto:galaxyrio\.h\.gmail\.com/i);
});

test("renders article reading enhancements and simplified metadata", async () => {
  const html = await readOutput(
    "zh/blog/2026/personal image host based on cloudflare r2/index.html",
  );
  const headerMeta = html.match(/<div class="content-detail-meta"[\s\S]*?<\/div>/)?.[0] ?? "";
  const byline = html.match(/<dl class="content-detail-byline"[\s\S]*?<\/dl>/)?.[0] ?? "";

  assert.match(headerMeta, /<time[^>]*>2026年8月27日<\/time>/);
  assert.equal((headerMeta.match(/<span/g) ?? []).length, 0);
  assert.match(byline, /<dt>作者<\/dt>[\s\S]*?<dt>类别<\/dt>/);
  assert.doesNotMatch(byline, /content-tags/);
  assert.ok(
    html.indexOf('class="content-detail-end-meta"') > html.indexOf('class="prose"'),
    "expected tags after the article body",
  );
  assert.match(html, /<dialog class="content-image-dialog"/);
  assert.match(html, /class="astro-code astro-code-themes github-light github-dark"/);
  assert.doesNotMatch(html, /class="astro-code[^"]*" style="background-color:#24292e/);
  assert.match(html, /<table>/);
});

test("keeps the Astro architecture, content model, and design system explicit", async () => {
  const [layout, desktopNavigation, mobileHeader, mobileNavigation, themeToggle, heroAsciiPortrait, i18n, contentConfig, globalCss, tokensCss, baseCss, layoutCss, componentsCss, pagesCss, symbol, packageJson, config, avatar, symbolFont, spaceMonoFont] =
    await Promise.all([
      readFile(new URL("../src/layouts/BaseLayout.astro", import.meta.url), "utf8"),
      readFile(new URL("../src/components/DesktopNavigation.astro", import.meta.url), "utf8"),
      readFile(new URL("../src/components/MobileHeader.astro", import.meta.url), "utf8"),
      readFile(new URL("../src/components/MobileNavigation.astro", import.meta.url), "utf8"),
      readFile(new URL("../src/components/ThemeToggle.astro", import.meta.url), "utf8"),
      readFile(new URL("../src/components/HeroAsciiPortrait.astro", import.meta.url), "utf8"),
      readFile(new URL("../src/i18n/config.ts", import.meta.url), "utf8"),
      readFile(new URL("../src/content.config.ts", import.meta.url), "utf8"),
      readFile(new URL("../src/styles/global.css", import.meta.url), "utf8"),
      readFile(new URL("../src/styles/tokens.css", import.meta.url), "utf8"),
      readFile(new URL("../src/styles/base.css", import.meta.url), "utf8"),
      readFile(new URL("../src/styles/layout.css", import.meta.url), "utf8"),
      readFile(new URL("../src/styles/components.css", import.meta.url), "utf8"),
      readFile(new URL("../src/styles/pages.css", import.meta.url), "utf8"),
      readFile(new URL("../src/components/MaterialSymbol.astro", import.meta.url), "utf8"),
      readFile(new URL("../package.json", import.meta.url), "utf8"),
      readFile(new URL("../astro.config.mjs", import.meta.url), "utf8"),
      stat(new URL("../public/images/profile/avatar.jpg", import.meta.url)),
      stat(new URL("../public/fonts/material-symbols-rounded-subset.woff2", import.meta.url)),
      stat(new URL("../public/fonts/space-mono-latin-400-italic.woff2", import.meta.url)),
    ]);

  assert.match(layout, /DesktopNavigation/);
  assert.match(layout, /MobileNavigation/);
  assert.match(layout, /avatarSrc=\{assetPath\(profile\.avatar\.src\)\}/);
  assert.match(layout, /avatarAlt=\{profile\.avatar\.alt\[lang\]\}/);
  assert.match(desktopNavigation, /<img[\s\S]*?src=\{avatarSrc\}[\s\S]*?alt=\{avatarAlt\}/);
  assert.match(mobileHeader, /class="mobile-brand-avatar"/);
  assert.match(mobileHeader, /<img[\s\S]*?src=\{avatarSrc\}[\s\S]*?alt=\{avatarAlt\}/);
  assert.doesNotMatch(mobileHeader, /\{brand\}/);
  assert.match(mobileHeader, /data-mobile-drawer-trigger/);
  assert.match(mobileHeader, /aria-controls=\{drawerId\}/);
  assert.match(mobileNavigation, /class="mobile-navigation-drawer"/);
  assert.match(mobileNavigation, /items\.map\(\(item\)/);
  assert.match(mobileNavigation, /<LanguageSwitch/);
  assert.match(mobileNavigation, /<ThemeToggle/);
  assert.match(mobileNavigation, /mobile-navigation-drawer-collapse-icon/);
  assert.match(mobileNavigation, /drawer\.showModal\(\)/);
  assert.match(mobileNavigation, /activeTrigger\?\.focus\(\)/);
  assert.doesNotMatch(mobileNavigation, /arrow_forward|menu_open|drawerTitle/);
  assert.match(themeToggle, /data-theme-icon/);
  assert.match(heroAsciiPortrait, /String\.raw/);
  assert.match(heroAsciiPortrait, /<hero-ascii-portrait[\s\S]*?class="hero-ascii-portrait"[\s\S]*?aria-hidden="true"/);
  assert.match(heroAsciiPortrait, /const densityRamp = "%#\*\+=-:\."/);
  assert.match(heroAsciiPortrait, /densityRamp\[toneIndex \+ direction\]/);
  assert.match(heroAsciiPortrait, /connectedCallback\(\)/);
  assert.match(heroAsciiPortrait, /disconnectedCallback\(\)/);
  assert.match(heroAsciiPortrait, /IntersectionObserver/);
  assert.match(heroAsciiPortrait, /visibilitychange/);
  assert.match(heroAsciiPortrait, /prefers-reduced-motion: reduce/);
  assert.match(heroAsciiPortrait, /forced-colors: active/);
  assert.match(heroAsciiPortrait, /setTimeout/);
  assert.match(heroAsciiPortrait, /clearTimeout/);
  assert.match(heroAsciiPortrait, /requestAnimationFrame/);
  assert.match(heroAsciiPortrait, /CHARACTER_LANE_COUNT = 56/);
  assert.match(heroAsciiPortrait, /TONE_LANES = \{ compact: 20, medium: 24, wide: 28 \}/);
  assert.match(heroAsciiPortrait, /TONE_LEVELS = \["bright", "light", "shade", "dim"\]/);
  assert.match(heroAsciiPortrait, /randomBetween\(1000, 1700\)/);
  assert.match(heroAsciiPortrait, /customElements\.define\("hero-ascii-portrait"/);
  assert.doesNotMatch(heroAsciiPortrait, /setInterval|innerHTML|insertAdjacentHTML|data-ascii-glyph/);
  const portraitSource = heroAsciiPortrait.match(/String\.raw`([\s\S]*?)`\.trimEnd\(\)/)?.[1] ?? "";
  assert.equal(portraitSource.split(/\r?\n/).length, 45);
  assert.equal((portraitSource.match(/\S/g) ?? []).length, 1888);
  assert.deepEqual(new Set(portraitSource.replace(/\s/g, "")), new Set("%#*+=-:."));
  assert.doesNotMatch(heroAsciiPortrait, /<(?:img|svg)\b/i);
  assert.match(layout, /portfolio-locale/);
  assert.match(layout, /const colorPalette:\s*"tonal-spot" \| "expressive" = "tonal-spot"/);
  assert.match(layout, /<html lang=\{htmlLang\} data-palette=\{colorPalette\}>/);
  assert.match(i18n, /BASE_URL/);
  assert.match(i18n, /switchLocalePath/);
  assert.match(contentConfig, /defineCollection/);
  assert.match(contentConfig, /language/);
  assert.match(globalCss, /tokens\.css/);
  assert.match(tokensCss, /--md-sys-color-primary:/);
  assert.match(tokensCss, /SchemeTonalSpot, spec 2025/);
  assert.match(tokensCss, /--md-sys-color-primary:\s*#655789/);
  assert.match(tokensCss, /--md-sys-color-surface:\s*#fdf7fe/);
  assert.match(tokensCss, /:root\[data-palette="expressive"\]/);
  assert.match(tokensCss, /:root\[data-theme="dark"\]\[data-palette="expressive"\]/);
  assert.match(tokensCss, /:root\[data-palette="expressive"\][\s\S]*?--md-sys-color-primary:\s*#6850a5/);
  assert.match(tokensCss, /:root\[data-theme="dark"\]\[data-palette="expressive"\][\s\S]*?--md-sys-color-primary:\s*#d4c3ff/);
  assert.match(tokensCss, /--rail-width:\s*96px/);
  assert.match(tokensCss, /--shadow-ambient:/);
  assert.match(tokensCss, /--elevation-2:\s*0 8px 28px -8px var\(--shadow-color\)/);
  assert.doesNotMatch(tokensCss, /rgb\(0 0 0 \/ 0\.2\)/);
  assert.doesNotMatch(tokensCss, /--accent-/);
  assert.match(baseCss, /prefers-reduced-motion:\s*reduce/);
  assert.match(baseCss, /focus-visible/);
  assert.match(baseCss, /material-symbols-rounded-subset\.woff2/);
  assert.match(baseCss, /font-family:\s*"Space Mono"/);
  assert.match(baseCss, /space-mono-latin-400-italic\.woff2/);
  assert.match(layoutCss, /\.rail-link-indicator/);
  assert.match(layoutCss, /\.brand-mark > img/);
  assert.match(layoutCss, /\.mobile-brand-avatar > img/);
  assert.match(layoutCss, /@media \(max-width: 599px\)[\s\S]*?\.mobile-nav\s*\{[\s\S]*?display:\s*none/);
  assert.match(layoutCss, /\.mobile-navigation-drawer\s*\{[\s\S]*?width:\s*min\(86vw, 360px\)/);
  assert.match(layoutCss, /\.mobile-drawer-trigger\s*\{[\s\S]*?display:\s*grid/);
  assert.match(layoutCss, /\.mobile-navigation-drawer-collapse-icon::before/);
  assert.match(layoutCss, /\.mobile-navigation-drawer-link\s*\{[\s\S]*?grid-template-columns:\s*32px minmax\(0, 1fr\)/);
  assert.match(layoutCss, /@media \(max-width: 599px\)[\s\S]*?\.mobile-brand-avatar\s*\{[\s\S]*?width:\s*36px[\s\S]*?border-radius:\s*var\(--md-sys-shape-corner-full\)/);
  assert.match(componentsCss, /\[data-theme-icon\][\s\S]*?height:\s*24px[\s\S]*?line-height:\s*0/);
  assert.match(layoutCss, /\.brand-mark::after/);
  assert.match(layoutCss, /\.brand-mark:focus-visible::after/);
  assert.match(layoutCss, /width:\s*56px/);
  assert.match(layoutCss, /height:\s*32px/);
  const railRule = layoutCss.match(/\.navigation-rail\s*\{([^}]*)\}/)?.[1] ?? "";
  assert.match(railRule, /background:\s*var\(--md-sys-color-surface-container\)/);
  assert.doesNotMatch(railRule, /box-shadow/);
  assert.match(componentsCss, /\.overview-card:is\(:hover, :focus-visible\)/);
  assert.match(componentsCss, /\.overview-card-decoration\s*\{/);
  assert.match(componentsCss, /transform:\s*rotate\(15deg\)/);
  assert.match(componentsCss, /transform:\s*rotate\(15deg\) scale\(1\.08\)/);
  assert.doesNotMatch(componentsCss, /\.overview-card::after\s*\{/);
  const overviewActionIconRule = componentsCss.match(/\.overview-card-action-icon\s*\{([^}]*)\}/)?.[1] ?? "";
  assert.match(overviewActionIconRule, /color:\s*currentColor/);
  assert.doesNotMatch(overviewActionIconRule, /background|border-radius/);
  assert.match(componentsCss, /a\.project-card:is\(:hover, :focus-visible\)/);
  assert.match(componentsCss, /--md-sys-shape-corner-extra-extra-large/);
  assert.match(componentsCss, /box-shadow:\s*var\(--elevation-2\)/);
  assert.match(pagesCss, /\.social-card:is\(:hover, :focus-within\)/);
  assert.doesNotMatch(pagesCss, /hero-ascii-drift|translateX\(-1%\)|scale\(1\.015\)/);
  const asciiRule = pagesCss.match(/\.hero-ascii-portrait\s*\{([^}]*)\}/)?.[1] ?? "";
  assert.match(asciiRule, /inset:\s*auto -5% 0 42%/);
  assert.match(asciiRule, /height:\s*80%/);
  assert.match(asciiRule, /container-type:\s*size/);
  assert.doesNotMatch(asciiRule, /(?:border|box-shadow|background):/);
  const copyScrimRule = pagesCss.match(/\.home-hero-copy::before\s*\{([^}]*)\}/)?.[1] ?? "";
  assert.match(copyScrimRule, /radial-gradient/);
  assert.match(copyScrimRule, /--md-sys-color-surface-container-low/);
  assert.match(copyScrimRule, /transparent 100%/);
  assert.match(copyScrimRule, /filter:\s*blur/);
  assert.match(copyScrimRule, /pointer-events:\s*none/);
  const asciiTextRule = pagesCss.match(/\.hero-ascii-stack\s*\{([^}]*)\}/)?.[1] ?? "";
  assert.match(asciiTextRule, /font-family:\s*"Space Mono", var\(--font-mono\)/);
  assert.match(asciiTextRule, /font-size:\s*clamp\(5px, min\(2\.64cqh, 2\.5cqw\), 16px\)/);
  assert.match(asciiTextRule, /font-style:\s*italic/);
  assert.match(asciiTextRule, /font-weight:\s*400/);
  const compactHeroCss = pagesCss.slice(
    pagesCss.indexOf("@media (max-width: 839px)"),
    pagesCss.indexOf("@media (max-width: 599px)"),
  );
  const phoneHeroCss = pagesCss.slice(
    pagesCss.indexOf("@media (max-width: 599px)"),
    pagesCss.indexOf("@media (prefers-reduced-motion: reduce)"),
  );
  assert.match(compactHeroCss, /grid-template-columns:\s*1fr/);
  assert.match(compactHeroCss, /inset:\s*auto -5% 0 auto/);
  assert.match(compactHeroCss, /width:\s*105%/);
  const desktopAsciiOpacity = Number(asciiRule.match(/--hero-ascii-layer-opacity:\s*([\d.]+)/)?.[1]);
  const compactAsciiOpacity = Number(compactHeroCss.match(/--hero-ascii-layer-opacity:\s*([\d.]+)/)?.[1]);
  const phoneAsciiOpacity = Number(phoneHeroCss.match(/--hero-ascii-layer-opacity:\s*([\d.]+)/)?.[1]);
  assert.ok(compactAsciiOpacity < desktopAsciiOpacity);
  assert.ok(phoneAsciiOpacity < compactAsciiOpacity);
  const asciiGradientRule = pagesCss.match(/@supports[\s\S]*?\.hero-ascii-base\s*\{([^}]*)\}/)?.[1] ?? "";
  assert.match(asciiGradientRule, /--md-sys-color-primary-fixed-dim/);
  assert.doesNotMatch(asciiGradientRule, /--md-sys-color-(?:secondary|tertiary)/);
  const brightToneRule = pagesCss.match(/\.hero-ascii-tone-layer\.is-bright\s*\{([^}]*)\}/)?.[1] ?? "";
  const lightToneRule = pagesCss.match(/\.hero-ascii-tone-layer\.is-light\s*\{([^}]*)\}/)?.[1] ?? "";
  const shadeToneRule = pagesCss.match(/\.hero-ascii-tone-layer\.is-shade\s*\{([^}]*)\}/)?.[1] ?? "";
  const dimToneRule = pagesCss.match(/\.hero-ascii-tone-layer\.is-dim\s*\{([^}]*)\}/)?.[1] ?? "";
  assert.match(brightToneRule, /--md-sys-color-primary-fixed/);
  assert.match(lightToneRule, /--md-sys-color-primary-fixed-dim/);
  assert.match(shadeToneRule, /color-mix[\s\S]*--md-sys-color-on-primary-fixed-variant/);
  assert.match(dimToneRule, /color-mix[\s\S]*--md-sys-color-on-primary-fixed-variant/);
  assert.doesNotMatch(dimToneRule, /var\(--md-sys-color-on-primary-fixed\)/);
  assert.match(pagesCss, /\.hero-ascii-tone-layer\s*\{[\s\S]*?transition:\s*opacity 650ms/);
  assert.doesNotMatch(pagesCss, /hero-geometry/);
  assert.match(pagesCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(pagesCss, /@media \(forced-colors: active\)/);
  assert.match(symbol, /Material Symbols ligature name/);
  assert.doesNotMatch(layout, /rail-clock|fonts\.googleapis\.com/);
  assert.match(packageJson, /"astro"/);
  assert.match(config, /output:\s*"static"/);
  assert.doesNotMatch(packageJson, /"(?:next|react|react-dom|vinext)"/);
  assert.ok(avatar.size > 0);
  assert.ok(symbolFont.size > 0);
  assert.ok(spaceMonoFont.size > 0);
});

test("uses one native link for each navigable content card", async () => {
  const [overviewCard, articleCard, projectCard, zhHome] = await Promise.all([
    readFile(new URL("../src/components/OverviewCard.astro", import.meta.url), "utf8"),
    readFile(new URL("../src/components/ArticleCard.astro", import.meta.url), "utf8"),
    readFile(new URL("../src/components/ProjectCard.astro", import.meta.url), "utf8"),
    readOutput("zh/index.html"),
  ]);

  assert.match(overviewCard, /<a\s+[\s\S]*?class="overview-card"[\s\S]*?href=\{href\}/);
  assert.match(articleCard, /<a\s+[\s\S]*?class:list=\{\["article-card"[\s\S]*?href=\{href\}/);
  assert.match(projectCard, /const CardElement = href \? "a" : "article"/);
  assert.equal((overviewCard.match(/<a\b/g) ?? []).length, 1);
  assert.equal((articleCard.match(/<a\b/g) ?? []).length, 1);
  assert.equal((projectCard.match(/<a\b/g) ?? []).length, 0);

  for (const card of [overviewCard, articleCard, projectCard]) {
    assert.doesNotMatch(card, /<h2>\s*<a\b/);
    assert.doesNotMatch(card, /<a\b[^>]*class="(?:concept-label|overview-card-action)"/);
  }

  assert.equal((zhHome.match(/<a class="overview-card"/g) ?? []).length, 6);
  assert.doesNotMatch(zhHome, /<article class="overview-card"/);
  assert.match(overviewCard, /class="overview-card-decoration"[\s\S]*?filled/);
  for (const icon of ["badge", "work", "science", "article", "construction", "mail"]) {
    assert.match(zhHome, new RegExp(`class="material-symbols-rounded material-symbol overview-card-decoration"[^>]*>${icon}<`));
  }
  assert.equal((zhHome.match(/>arrow_outward<\/span>/g) ?? []).length, 7);
});

test("keeps generated internal links and assets resolvable", async () => {
  const distRoot = new URL("../dist/", import.meta.url);

  const findHtml = async (directory) => {
    const entries = await readdir(directory, { withFileTypes: true });
    const nested = await Promise.all(
      entries.map((entry) => {
        const url = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, directory);
        return entry.isDirectory()
          ? findHtml(url)
          : entry.name.endsWith(".html")
            ? [url]
            : [];
      }),
    );
    return nested.flat();
  };

  const htmlFiles = await findHtml(distRoot);
  assert.ok(htmlFiles.length >= 15, "expected every base page plus published content pages");

  for (const htmlFile of htmlFiles) {
    const html = await readFile(htmlFile, "utf8");
    const localReferences = [...html.matchAll(/(?:href|src)="(\/[^"]+)"/g)]
      .map((match) => match[1].split(/[?#]/, 1)[0])
      .filter(Boolean);

    for (const pathname of localReferences) {
      const target = pathname.endsWith("/") ? `${pathname}index.html` : pathname;
      await assert.doesNotReject(
        access(new URL(`.${target}`, distRoot)),
        `${htmlFile.pathname} references missing ${pathname}`,
      );
    }
  }
});
