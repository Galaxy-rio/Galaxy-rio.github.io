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
    assert.match(source, /contentCategoryLabels/);
    assert.doesNotMatch(source, /const slugFromId/);
    assert.doesNotMatch(source, /data\.(?:draft|publishedAt|updatedAt|completedAt|kind)\b/);
  }

  assert.match(blogIndex, /featured=\{post\.data\.featured\}/);
  assert.match(projectsIndex, /featuredLabel=\{project\.data\.featured/);
  assert.match(blogDetail, /entry\.data\.author/);
  assert.match(blogDetail, /entry\.data\.series/);
  assert.match(blogDetail, /entry\.data\.links/);
  assert.match(projectsDetail, /entry\.data\.author/);
  assert.match(projectsDetail, /entry\.data\.series/);

  const frontmatterKeys = (source) =>
    (source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "")
      .split(/\r?\n/)
      .filter((line) => /^[a-zA-Z][\w-]*:/.test(line))
      .map((line) => line.slice(0, line.indexOf(":")));
  const sharedTemplateKeys = [
    "title",
    "summary",
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

test("keeps the Astro architecture, content model, and design system explicit", async () => {
  const [layout, desktopNavigation, mobileHeader, heroAsciiPortrait, i18n, contentConfig, globalCss, tokensCss, baseCss, layoutCss, componentsCss, pagesCss, symbol, packageJson, config, avatar, symbolFont, spaceMonoFont] =
    await Promise.all([
      readFile(new URL("../src/layouts/BaseLayout.astro", import.meta.url), "utf8"),
      readFile(new URL("../src/components/DesktopNavigation.astro", import.meta.url), "utf8"),
      readFile(new URL("../src/components/MobileHeader.astro", import.meta.url), "utf8"),
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
  assert.match(i18n, /BASE_URL/);
  assert.match(i18n, /switchLocalePath/);
  assert.match(contentConfig, /defineCollection/);
  assert.match(contentConfig, /language/);
  assert.match(globalCss, /tokens\.css/);
  assert.match(tokensCss, /--md-sys-color-primary:/);
  assert.match(tokensCss, /SchemeExpressive, spec 2025/);
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
  assert.equal(htmlFiles.length, 15);

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
