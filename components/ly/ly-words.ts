/*
 * The skin's words: its basket word and its own English or Arabic overrides of any Layout key.
 *
 * - basket (skins/<name>/skin.json "basket": { "one": "bag", "many": "bags" }): the base is written with "bag";
 *   another word ("basket", "cart") replaces it in the Layout's English words, in Selldone's own English strings
 *   (kalio-brand.ts bagWords()) and in the English fallbacks of t(). Other languages keep their translators'
 *   word (give them in "words.<lang>" when it must change there too).
 * - words.<lang>: { "<key>": "<text>" } on top of the Layout's words for that language (the home's tagline, a
 *   section's eyebrow…); keys are the t() keys, e.g. "ly.home.tagline".
 */
import { SKIN } from "./skin.gen";

const ONE: string = SKIN.basket.one;
const MANY: string = SKIN.basket.many;
const SAME = ONE === "bag" && MANY === "bags";
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Add to bag" -> "Add to basket" (keeps capitals and the plural). */
export function basketWord(s: string): string {
  if (SAME || typeof s !== "string") return s;
  return s.replace(/\b(bags|Bags|BAGS|bag|Bag|BAG)\b/g, (w) => {
    const base = /s$/i.test(w) ? MANY : ONE;
    if (w === w.toUpperCase()) return base.toUpperCase();
    return w.charAt(0) === w.charAt(0).toUpperCase() ? cap(base) : base;
  });
}

/** Every string in a nested object, with the basket word (Selldone's own message tree). */
export function basketize<T>(x: T): T {
  if (SAME) return x;
  if (typeof x === "string") return basketWord(x) as unknown as T;
  if (Array.isArray(x)) return x.map(basketize) as unknown as T;
  if (x && typeof x === "object") return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, basketize(v)])) as T;
  return x;
}

/** A language's dictionary with the skin's basket word (English) and its own words on top. */
export function withSkinWords(dict: Record<string, string>, lang: string): Record<string, string> {
  const own = ((SKIN.words as any)[lang] || {}) as Record<string, string>;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(dict)) out[k] = lang === "en" ? basketWord(v) : v;
  return Object.assign(out, own);
}
