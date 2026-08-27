import type { Locale } from "../i18n/config";

export const contentCategories = [
  "software",
  "design",
  "handcraft",
  "research",
  "learning",
] as const;

export type ContentCategory = (typeof contentCategories)[number];

export const contentCategoryLabels = {
  zh: {
    software: "软件",
    design: "设计",
    handcraft: "手工",
    research: "科研",
    learning: "学习",
  },
  en: {
    software: "Software",
    design: "Design",
    handcraft: "Handcraft",
    research: "Research",
    learning: "Learning",
  },
} as const satisfies Record<Locale, Record<ContentCategory, string>>;

export const publicationStatuses = ["draft", "publish"] as const;
