import type { Locale } from "../i18n/config";

interface LocalizedContentData {
  language: Locale;
  translationKey?: string;
}

interface LocalizedContentEntry {
  id: string;
  data: LocalizedContentData;
}

/** Preserve relative folders and the authored .zh/.en suffix in Astro entry ids. */
export const contentIdFromPath = (entryPath: string) =>
  entryPath
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\.(?:md|mdx)$/i, "");

/** Convert a collection entry id into its public, language-neutral route slug. */
export function contentSlugFromId(id: string): string {
  const withoutExtension = contentIdFromPath(id);
  const withoutLanguageSuffix = withoutExtension.replace(/\.(?:zh|en)$/i, "");
  const slug = withoutLanguageSuffix.replace(/(?:^|\/)index$/i, "");

  if (
    !slug ||
    slug.split("/").some((segment) => segment === "." || segment === "..") ||
    /[\u0000-\u001f\u007f?#]/.test(slug)
  ) {
    throw new Error(`Content entry "${id}" does not produce a safe public slug.`);
  }

  return slug;
}

const groupIdentity = (entry: LocalizedContentEntry) => {
  const translationKey = entry.data.translationKey?.trim();
  return translationKey
    ? { id: `translation:${translationKey}`, translationKey }
    : { id: `entry:${contentIdFromPath(entry.id)}`, translationKey: undefined };
};

const filenameLocaleFromId = (id: string): Locale | undefined => {
  const match = contentIdFromPath(id).match(/\.(zh|en)$/i);
  return match?.[1]?.toLowerCase() as Locale | undefined;
};

/**
 * Return one entry per logical item, preferring the interface locale and
 * falling back to the other authored language when no preferred version exists.
 */
export function selectLocalizedEntries<T extends LocalizedContentEntry>(
  entries: readonly T[],
  locale: Locale,
): T[] {
  const groups = new Map<
    string,
    { translationKey?: string; entries: T[] }
  >();

  for (const entry of entries) {
    const filenameLocale = filenameLocaleFromId(entry.id);
    if (filenameLocale && filenameLocale !== entry.data.language) {
      throw new Error(
        `Content entry "${entry.id}" uses the .${filenameLocale} filename suffix but declares language: ${entry.data.language}.`,
      );
    }

    const identity = groupIdentity(entry);
    const group = groups.get(identity.id) ?? {
      translationKey: identity.translationKey,
      entries: [],
    };
    group.entries.push(entry);
    groups.set(identity.id, group);
  }

  const selected: Array<{ entry: T; groupId: string }> = [];

  for (const [groupId, group] of groups) {
    if (group.translationKey) {
      for (const language of ["zh", "en"] satisfies Locale[]) {
        const matches = group.entries.filter((entry) => entry.data.language === language);
        if (matches.length > 1) {
          throw new Error(
            `translationKey "${group.translationKey}" has multiple ${language} entries: ${matches.map((entry) => entry.id).join(", ")}`,
          );
        }
      }

      const slugs = new Set(group.entries.map((entry) => contentSlugFromId(entry.id)));
      if (slugs.size > 1) {
        throw new Error(
          `translationKey "${group.translationKey}" must use the same relative path and base filename in every language: ${group.entries.map((entry) => entry.id).join(", ")}`,
        );
      }
    }

    const preferred = group.entries.find((entry) => entry.data.language === locale);
    selected.push({ entry: preferred ?? group.entries[0], groupId });
  }

  const slugOwners = new Map<string, string>();
  for (const item of selected) {
    const slug = contentSlugFromId(item.entry.id);
    const existingOwner = slugOwners.get(slug);
    if (existingOwner && existingOwner !== item.groupId) {
      throw new Error(
        `Content slug "${slug}" is shared by unrelated entries. Add the same translationKey to translated versions or rename one of the files.`,
      );
    }
    slugOwners.set(slug, item.groupId);
  }

  return selected.map(({ entry }) => entry);
}
