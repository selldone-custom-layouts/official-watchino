/*
 * The wordmark's rules (skins/<name>/skin.json "wordmark"), shared by the header's LyLogo.vue, the in-app splash
 * LySplash.vue and the loading screen's config (scripts/skin-apply.mjs): always the shop's own live title, never a
 * written name; only its case, slant, dot and sub line come from the skin.
 *   case     "first" (first letter capital, the rest as the shop wrote it) | "upper" | "lower" | "title" | "asis"
 *   italic   true sets the name in the display face's italic
 *   dot      true adds a small dot in the action colour after the name
 *   sub      "city" (the shop's city, small tracked capitals) | "none" | any short text
 */
import { SKIN } from "./skin.gen";

const WM = SKIN.wordmark as { case: string; italic: boolean; dot: boolean; sub: string };

export function wordmarkWord(raw: string): string {
  const w = String(raw || "").trim();
  switch (WM.case) {
    case "upper":
      return w.toUpperCase();
    case "lower":
      return w.toLowerCase();
    case "title":
      return w.replace(/(^|\s)(\S)/g, (_m, s, c) => s + c.toUpperCase());
    case "asis":
      return w;
    default:
      return w.charAt(0).toUpperCase() + w.slice(1);
  }
}

export function wordmarkSub(city: string): string {
  if (!WM.sub || WM.sub === "none") return "";
  if (WM.sub === "city") return city || "";
  return WM.sub;
}

export const wordmarkDot = !!WM.dot;
export const wordmarkItalic = !!WM.italic;
