/*
 * The "one colour family" at run time (the owner's rule, Galio 14 November 2026: every colour on a page comes
 * from ONE hue, the chosen palette's, plus white and the family's near-black; switching the palette re-tints
 * the whole page, not only the buttons). The maths is ly-family-core.ts (pure, shared with skin-apply.mjs).
 *
 * Who writes what: the theme switcher (components/theme-switcher/, config ly-theme.ts) writes the action colour
 * (--ly-act, -deep, -on, -text) and Vuetify's primary; this file writes every other colour (--ly-bg, band,
 * surface, paper, plate, ink, muted, lines, fields, the family dark, the soft fill and the words on it, the map,
 * the scrim) for the palette and mode on the page, inline on <html>, after every change. style/ly-skin.gen.scss
 * holds the skin's brand palette as plain CSS, so the first paint is right.
 */
import { watch } from "vue";
import { themeState } from "../theme-switcher/theme-switcher";
import { THEME_SETTINGS } from "./ly-theme.settings";
import { family, normalizeHex } from "./ly-family-core";
import { SKIN } from "./skin.gen";

export { family, contrast, actionPalette, type Family } from "./ly-family-core";

/** The colour each palette's family is built from (skins/<name>/skin.json palettes.list[].seed). */
export const LY_SEEDS: Record<string, string> = Object.fromEntries(SKIN.palettes.map((p) => [p.id, p.seed]));
const BRAND_SEED = LY_SEEDS[SKIN.brand];

/** The colour of the palette on the page now: a preset's seed, the Custom pick, or the merchant's brand colour. */
export function familySeed(): string {
  const root = document.documentElement;
  const id = root.dataset.tsPalette || themeState.palette || THEME_SETTINGS.palette || SKIN.brand;
  if (id === "custom") return normalizeHex(themeState.custom) || BRAND_SEED;
  if (id === "brand") return normalizeHex(THEME_SETTINGS.brandColor) || BRAND_SEED;
  return LY_SEEDS[id] || normalizeHex(THEME_SETTINGS.brandColor) || BRAND_SEED;
}

let vuetifyRef: any = null;

/** Write the family of the current palette and mode on <html> (only what changed). */
export function paintFamily(): void {
  const root = document.documentElement;
  const dark = root.classList.contains("ly-dark");
  const all = family(familySeed());
  const v = dark ? all.dark : all.light;
  for (const [k, val] of Object.entries(v)) {
    const name = "--ly-" + k;
    if (root.style.getPropertyValue(name) !== val) root.style.setProperty(name, val);
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", v["top-bg"]);
  /* Selldone's own dialogs, menus and fields (Vuetify) sit on the family too */
  try {
    const themes = vuetifyRef?.theme?.themes?.value;
    if (themes?.dark) {
      const d = all.dark;
      Object.assign(themes.dark.colors, {
        background: d.bg,
        surface: d.surface,
        "surface-bright": d.plate,
        "surface-variant": d.tint2,
        "on-background": d.ink,
        "on-surface": d.ink,
        "on-surface-variant": d.muted,
        secondary: d["act-dk"],
        "on-secondary": d.bg,
        info: d["act-dk"],
      });
    }
    if (themes?.light) {
      const l = all.light;
      Object.assign(themes.light.colors, { background: "#ffffff", surface: "#ffffff", "on-background": l.ink, "on-surface": l.ink, secondary: l.dark, "on-secondary": "#ffffff" });
    }
  } catch {
    /* Vuetify not ready: the page's own colours are already set */
  }
}

/** Call once, right after bootThemeSwitcher(): paints now and follows every palette, mode and Custom change. */
export function bootFamily(vuetifyInstance?: any): void {
  vuetifyRef = vuetifyInstance || null;
  paintFamily();
  try {
    new MutationObserver(() => paintFamily()).observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-ts-palette", "data-ts-mode"] });
  } catch {
    /* no observer (prerender): the first paint stays */
  }
  watch(
    () => [themeState.palette, themeState.mode, themeState.custom],
    () => paintFamily(),
    { flush: "post" },
  );
}
