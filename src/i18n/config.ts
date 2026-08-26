export const locales = ["zh", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "zh";

/** Normalized Astro base with leading and trailing slashes (for example `/portfolio/`). */
export const basePath =
  import.meta.env.BASE_URL === "/"
    ? "/"
    : `/${import.meta.env.BASE_URL.replace(/^\/+|\/+$/g, "")}/`;

export const localeLabels: Record<Locale, string> = {
  zh: "中文",
  en: "English",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && locales.includes(value as Locale);
}

const zh = {
  "meta.siteName": "galaxyrio",
  "meta.description": "黄明睿（Mingrui HUANG）的个人网站，分享软件开发、视觉设计与光学工程研究。",
  "a11y.skipToContent": "跳到主要内容",
  "a11y.primaryNavigation": "主要导航",
  "a11y.socialLinks": "社交与学术链接",
  "nav.home": "首页",
  "nav.resume": "关于",
  "nav.portfolio": "作品集",
  "nav.research": "科研",
  "nav.blog": "博客",
  "nav.skills": "技能",
  "nav.contact": "联系",
  "actions.themeToggle": "切换明暗主题",
  "actions.languageSwitch": "切换语言",
  "actions.readMore": "继续阅读",
  "actions.viewProject": "查看项目",
  "actions.viewAll": "查看全部",
  "actions.backHome": "返回首页",
  "content.comingSoon": "内容更新中",
  "content.empty": "暂无内容",
  "home.eyebrow": "计算机 · 设计 · 科研",
  "home.greeting": "你好，我是",
  "home.intro": "我在计算机、设计与光学工程之间探索，并在这里分享项目、研究与思考。",
  "home.explore": "开始浏览",
  "section.resume.kicker": "简介与经历",
  "section.resume.title": "关于我",
  "section.portfolio.kicker": "软件与设计",
  "section.portfolio.title": "作品集",
  "section.research.kicker": "光学工程与测试技术",
  "section.research.title": "科研",
  "section.blog.kicker": "学习记录与小作品",
  "section.blog.title": "博客",
  "section.skills.kicker": "工具与能力",
  "section.skills.title": "技能",
  "section.contact.kicker": "保持联系",
  "section.contact.title": "联系方式",
  "footer.builtWith": "黄明睿 · Mingrui HUANG",
  "footer.copyright": "版权所有",
} as const;

export type UiKey = keyof typeof zh;

const en: Record<UiKey, string> = {
  "meta.siteName": "galaxyrio",
  "meta.description": "The personal website of Mingrui HUANG, featuring software, design, and optical engineering research.",
  "a11y.skipToContent": "Skip to main content",
  "a11y.primaryNavigation": "Primary navigation",
  "a11y.socialLinks": "Social and academic links",
  "nav.home": "Home",
  "nav.resume": "About",
  "nav.portfolio": "Portfolio",
  "nav.research": "Research",
  "nav.blog": "Blog",
  "nav.skills": "Skills",
  "nav.contact": "Contact",
  "actions.themeToggle": "Toggle color theme",
  "actions.languageSwitch": "Switch language",
  "actions.readMore": "Read more",
  "actions.viewProject": "View project",
  "actions.viewAll": "View all",
  "actions.backHome": "Back to home",
  "content.comingSoon": "Coming soon",
  "content.empty": "Nothing here yet",
  "home.eyebrow": "Computing · Design · Research",
  "home.greeting": "Hello, I am",
  "home.intro": "I work across computing, design, and optical engineering, sharing projects, research, and ideas here.",
  "home.explore": "Start exploring",
  "section.resume.kicker": "Profile & experience",
  "section.resume.title": "About",
  "section.portfolio.kicker": "Software & design",
  "section.portfolio.title": "Portfolio",
  "section.research.kicker": "Optical engineering & testing technology",
  "section.research.title": "Research",
  "section.blog.kicker": "Learning notes & small creations",
  "section.blog.title": "Blog",
  "section.skills.kicker": "Tools & capabilities",
  "section.skills.title": "Skills",
  "section.contact.kicker": "Keep in touch",
  "section.contact.title": "Contact",
  "footer.builtWith": "Mingrui HUANG",
  "footer.copyright": "All rights reserved",
};

export const ui = { zh, en } as const;

export function t(locale: Locale, key: UiKey): string {
  return ui[locale][key];
}

function splitSuffix(path: string): { pathname: string; suffix: string } {
  const suffixIndex = path.search(/[?#]/);
  return suffixIndex === -1
    ? { pathname: path, suffix: "" }
    : { pathname: path.slice(0, suffixIndex), suffix: path.slice(suffixIndex) };
}

function removeBasePath(pathname: string): string {
  if (basePath === "/") return pathname;

  const baseWithoutTrailingSlash = basePath.replace(/\/$/, "");
  if (pathname === baseWithoutTrailingSlash) return "/";
  if (pathname.startsWith(`${baseWithoutTrailingSlash}/`)) {
    return pathname.slice(baseWithoutTrailingSlash.length) || "/";
  }
  return pathname;
}

function removeLocalePrefix(pathname: string): string {
  const segments = removeBasePath(pathname).split("/").filter(Boolean);
  if (isLocale(segments[0])) segments.shift();
  return `/${segments.join("/")}`;
}

function addBasePath(pathname: string): string {
  return basePath === "/" ? pathname : `${basePath.replace(/\/$/, "")}${pathname}`;
}

/** Prefix a public asset path with Astro's deployment base. */
export function assetPath(path: string): string {
  return `${basePath}${path.replace(/^\/+/, "")}`;
}

/** Build a language-prefixed URL such as `/zh/blog/` or `/en/projects/demo/`. */
export function routeFor(locale: Locale, path = "/"): string {
  const { pathname, suffix } = splitSuffix(path);
  const unprefixed = removeLocalePrefix(pathname);
  const segments = unprefixed.split("/").filter(Boolean);
  const localized = `/${locale}/${segments.length ? `${segments.join("/")}/` : ""}`;
  return `${addBasePath(localized)}${suffix}`;
}

export function localeFromUrl(url: URL | string): Locale {
  const pathname = url instanceof URL ? url.pathname : splitSuffix(url).pathname;
  const candidate = removeBasePath(pathname).split("/").filter(Boolean)[0];
  return isLocale(candidate) ? candidate : defaultLocale;
}

/** Change only the locale prefix while preserving the rest of the route. */
export function switchLocalePath(pathname: string, nextLocale: Locale): string {
  return routeFor(nextLocale, pathname);
}
