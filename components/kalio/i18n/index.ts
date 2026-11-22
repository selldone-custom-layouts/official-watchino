/*
 * The Layout's words, per language: the shared Kalio base (base/<lang>.ts, a copy of new-shop-kits/i18n/kalio-base),
 * the words kept from Bakini (bakini.<lang>.ts, only the keys the code still uses) and the Layout's own
 * (ly.<lang>.ts, keys ly.*), with the skin's basket word and its own words on top (components/ly/ly-words.ts).
 * English is bundled; every other language is its own small chunk, fetched only when a visitor picks it
 * (lang-<code>.ts merges its files). Arabic is kept so a right-to-left language works the day a shop enables one
 * (and the checks run with a forced "ar"). Another language: copy base/<code>.ts from the kit, write
 * bakini.<code>.ts and ly.<code>.ts, add lang-<code>.ts and one line below.
 */
import baseEn from "./base/en";
import bakiniEn from "./bakini.en";
import lyEn from "./ly.en";
import { basketWord, withSkinWords } from "../../ly/ly-words";
import { setEnglishHook } from "./kalio-i18n";

setEnglishHook(basketWord);

export const EN: Record<string, string> = withSkinWords({ ...baseEn, ...bakiniEn, ...lyEn }, "en");

export const LOADERS: Record<string, () => Promise<any>> = {
  ar: () => import("./lang-ar"),
};
