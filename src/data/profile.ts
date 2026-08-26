import type { Locale } from "../i18n/config";

export type LocalizedText = Record<Locale, string>;

export const profile = {
  handle: "galaxyrio",
  name: {
    zh: "黄明睿",
    en: "Mingrui HUANG",
  },
  fullName: "黄明睿（Mingrui HUANG）",
  email: "",
  avatar: {
    src: "images/profile/avatar.jpg",
    alt: {
      zh: "galaxyrio 的头像",
      en: "galaxyrio's avatar",
    },
  },
} as const;

export type SocialLinkId = "github" | "orcid" | "bilibili";

export interface SocialLink {
  id: SocialLinkId;
  label: string;
  href: string;
  kind: "code" | "research" | "video";
}

export const socialLinks: readonly SocialLink[] = [
  {
    id: "github",
    label: "GitHub",
    href: "https://github.com/Galaxy-rio",
    kind: "code",
  },
  {
    id: "orcid",
    label: "ORCID",
    href: "https://orcid.org/0009-0000-0685-3045",
    kind: "research",
  },
  {
    id: "bilibili",
    label: "bilibili",
    href: "https://space.bilibili.com/13755352",
    kind: "video",
  },
];

export interface ResearchArea {
  id: "optical-engineering" | "testing-technology";
  name: LocalizedText;
}

export const researchAreas: readonly ResearchArea[] = [
  {
    id: "optical-engineering",
    name: { zh: "光学工程", en: "Optical Engineering" },
  },
  {
    id: "testing-technology",
    name: { zh: "测试技术", en: "Testing Technology" },
  },
];
