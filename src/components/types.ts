import type { Locale } from "../i18n/config";

export type { Locale };

export interface NavItem {
  /** Human-readable UI label in the current interface locale. */
  label: string;
  /** Locale-aware absolute path, including Astro's configured base when needed. */
  href: string;
  /** Material Symbols ligature name. It is decorative because the adjacent label names the link. */
  icon?: string;
  /** Use exact matching instead of treating nested routes as active. */
  exact?: boolean;
}

export interface SocialLink {
  label: string;
  href: string;
  rel?: string;
}

export interface ContentLanguage {
  /** BCP 47 language code for the actual content, independent of the interface language. */
  code: string;
  /** Display label, for example “English” or “中文”. */
  label: string;
}

export interface SkillItem {
  name: string;
  /** Optional factual context such as “daily use”; no proficiency is inferred. */
  note?: string;
}
