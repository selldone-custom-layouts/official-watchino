/*
 * the Layout — the theme switcher's config (the footer's Theme row: the owner's rules:
 * colour palettes, a custom colour and Light / Dark, a click changes the whole site; the same shared
 * package in every Layout, components/theme-switcher/).
 *
 * the Layout is light first (design/home-a.html, set A "Classic"): white and soft-tint bands, the
 * family's near-black ink, a tan accent. ONE COLOUR FAMILY: components/ly/ly-family.ts writes
 * every colour of the chosen palette's family (grounds, plates, lines, words, the dark bars) inline on
 * <html>; this config writes the action colour (--ly-act, -deep, -on, -text) and Vuetify's primary, and
 * keeps the inherited names (--bk-act*, which Vuetify's --v-theme-primary in kalio-tokens.scss and the
 * shared Kalio pages read) on the same colour.
 *
 * The palettes are the mockup's (design/src/tokens.js PRESETS): Tan (the brand), Rose, Sage,
 * Slate and Ink, each built by paletteFromColor() on its own family's surfaces, exactly as tokens.js
 * vars() builds them (the values below are its output). Contrast (WCAG 2.1): white on every light
 * primary 5.1:1 or more (Tan #8b6640 5.16); every link colour 4.6:1 or more on the white page, the tint
 * band and the plate; the dark primaries keep white words (5.1:1+) and their link colours read 7:1 on
 * the dark grounds.
 */
import type { ThemeSwitcherConfig } from "../theme-switcher/theme-switcher";
import { THEME_SETTINGS } from "./ly-theme.settings";
import { t } from "../kalio/i18n/kalio-i18n";
import { SKIN } from "./skin.gen";

/* One palette; the name is read when drawn, so it follows the visitor's language. */
function pal(id: string, name: () => string, light: Record<string, string>, dark: Record<string, string>) {
  return {
    id,
    get name() {
      return name();
    },
    light,
    dark,
  };
}

/* The surfaces a Custom colour is made readable on: every family's grounds sit at these lightnesses
   (white, the band L .985, the plate L .966; dark: page .17, band .195, card .225, plate .26). */
const LIGHT_SURFACES = ["#ffffff", "#fafafa", "#f4f4f4"];
const DARK_SURFACES = ["#0f0f0f", "#151515", "#1c1c1c", "#242424"];

export const LY_THEME: ThemeSwitcherConfig = {
  /* The merchant's choice: ly-theme.settings.ts, the one file to edit. */
  settings: THEME_SETTINGS,

  /* The owner (9 November 2026): a merchant who imports the Layout into their
     own shop must not see the switcher. With themeSwitcher "showcase" it
     shows only on these shops (window.shop.id, else <meta name="shop-name">). */
  showcaseShops: SKIN.showcaseShops.map((x) => ({ ...x })),

  storageKey: SKIN.storage.theme,
  darkClass: "ly-dark",
  defaultMode: "light",

  /* skins/<name>/skin.json palettes.list: each palette's action colours come from its seed, on its own
     family's surfaces (ly-family-core.ts actionPalette(), written by scripts/skin-apply.mjs). The names are
     read when drawn, so they follow the visitor's language (ly.palette.<id>, else the skin's name). */
  palettes: SKIN.palettes.map((p) => pal(p.id, () => t("ly.palette." + p.id, p.name), { ...p.light }, { ...p.dark })),

  /* Palette value -> the variables that carry it. --ly-* are the Layout's own
     (style/ly-theme.scss); --bk-act* are the inherited names that
     Vuetify's primary (kalio-tokens.scss) and the pages not yet ported read. */
  /* Palette value -> the variables that carry it. --ly-act* are the Layout's own (the rest of the family:
     ly-family.ts); --bk-act* are the inherited names that Vuetify's primary (kalio-tokens.scss)
     and the shared Kalio pages read. */
  tokens: {
    "--ly-act": "primary",
    "--ly-act-deep": "deep",
    "--ly-act-on": "onPrimary",
    "--ly-act-text": "text",
    "--ly-act-rgb": "primary:rgb",
    "--bk-act": "primary",
    "--bk-act-deep": "deep",
    "--bk-act-soft": "soft",
    "--bk-act-on": "onPrimary",
    "--bk-act-text": "text",
    "--bk-act-rgb": "primary:rgb",
    "--bk-act-on-rgb": "onPrimary:rgb",
  },

  /* The grounds, lines and words of each mode: ly-family.ts (and ly-theme.scss for the first paint). */
  dark: {},
  light: {},

  vuetify: {
    light: "light",
    dark: "dark",
    paletteColors: { primary: "primary", "on-primary": "onPrimary" },
    /* The brand palette's family (ly-family.ts repaints these for the palette on the page). */
    darkColors: { ...SKIN.vuetify.darkColors },
    lightColors: { ...SKIN.vuetify.lightColors },
  },

  /* The browser's own bar: the page's ground, not the action colour. */
  metaThemeColor: false,
  /* The row sits on the family-dark footer in both modes (style/ly-layout.scss). */
  ui: { ink: "var(--ly-dark-ink)", muted: "var(--ly-dark-muted)", line: "var(--ly-dark-line-2)", surface: "var(--ly-dark)", font: "var(--ly-sans)" },
  /* Read when drawn, so they follow the visitor's language (theme.* are the
     shared Kalio words). */
  labels: {
    get theme() {
      return t("theme.title", "Theme");
    },
    get palettes() {
      return t("theme.palettes", "Colour");
    },
    get mode() {
      return t("theme.mode", "Light or dark");
    },
    get modeTitle() {
      return t("theme.modeTitle", "Mode");
    },
    get light() {
      return t("theme.light", "Light");
    },
    get dark() {
      return t("theme.dark", "Dark");
    },
    get custom() {
      return t("theme.custom", "Custom colour");
    },
    get adjusted() {
      return t("theme.adjusted", "Adjusted for readability");
    },
    get brand() {
      return t("theme.brand", "Brand colour");
    },
  },

  /* "Custom colour" (the owner, 9 November 2026): any colour, made readable by paletteFromColor()
     against the lightnesses of the Layout's grounds (above). No band carries the action colour under
     words, so 4.5:1. */
  custom: {
    headerContrast: 4.5,
    lightSurfaces: LIGHT_SURFACES,
    darkSurfaces: DARK_SURFACES,
    darkText: "#111111",
  },
};
