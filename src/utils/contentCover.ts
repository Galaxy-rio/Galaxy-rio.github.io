import { assetPath } from "../i18n/config";

export function resolveContentCover(cover?: string): string | undefined {
  const value = cover?.trim();
  if (!value) return undefined;

  return /^(?:https?:)?\/\//i.test(value) ? value : assetPath(value);
}
