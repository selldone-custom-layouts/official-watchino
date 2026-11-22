/*
 * The colour family maths, pure (no Vue, no DOM): one palette colour -> every ground, line and word of the
 * Layout in light and dark (OKLCH, hue kept, chroma capped, words walked to their contrast targets), and the
 * action colours the theme switcher writes. Used by the app (ly-family.ts) and by scripts/skin-apply.mjs, which
 * writes the first paint of the skin's brand palette (style/ly-skin.gen.scss) and the theme switcher's palettes
 * (components/ly/skin.gen.ts) from the seeds in skins/<name>/skin.json.
 *
 *   light  band L .985 C<=.012 · plate .966/.018 · tint .925/.045 · 300 .86/.07 · family dark .24/.035
 *   dark   page .17 · band .195 · card .225 · plate .26 · 300 .31 (C<=.035) · family dark .15
 * Ink, muted text and field lines are walked to their contrast targets (ink 7:1 on the 300 tint, muted
 * 4.6:1 on the 200 tint, a field edge 3:1). Words on the family dark bars use the hue at 7:1.
 */
import { paletteFromColor } from "../theme-switcher/theme-color.ts";

/* ───────── OKLCH helpers ───────── */
export function normalizeHex(value: string | null | undefined): string | null {
  const m = String(value || "")
    .trim()
    .match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1];
  return "#" + h.toLowerCase();
}
const toRgb = (hex: string): number[] => [0, 2, 4].map((i) => parseInt(hex.slice(1 + i, 3 + i), 16));
const toHex = (rgb: number[]): string => "#" + rgb.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("");
const lin = (v: number): number => ((v /= 255) <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
function lum(hex: string): number {
  const [r, g, b] = toRgb(hex).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string): number {
  let x = lum(a);
  let y = lum(b);
  if (y > x) [x, y] = [y, x];
  return (x + 0.05) / (y + 0.05);
}
function oklch(hex: string): [number, number, number] {
  const [r, g, b] = toRgb(hex).map(lin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.sqrt(A * A + B * B), Math.atan2(B, A)];
}
function toLin(L: number, C: number, h: number): number[] {
  const A = C * Math.cos(h);
  const B = C * Math.sin(h);
  const l = Math.pow(L + 0.3963377774 * A + 0.2158037573 * B, 3);
  const m = Math.pow(L - 0.1055613458 * A - 0.0638541728 * B, 3);
  const s = Math.pow(L - 0.0894841775 * A - 1.291485548 * B, 3);
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
}
const inGamut = (v: number[]) => v.every((x) => x >= -1e-5 && x <= 1 + 1e-5);
const enc = (v: number) => {
  v = Math.min(1, Math.max(0, v));
  return 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
};
function at(L: number, C: number, h: number): string {
  L = Math.min(1, Math.max(0, L));
  let c = C;
  if (!inGamut(toLin(L, c, h))) {
    let lo = 0;
    let hi = C;
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(toLin(L, mid, h))) lo = mid;
      else hi = mid;
    }
    c = lo;
  }
  return toHex(toLin(L, c, h).map(enc));
}
function rgba(hex: string, a: number): string {
  const c = toRgb(hex);
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;
}

export type Family = Record<string, string>;
const cache: Record<string, { light: Family; dark: Family }> = {};

/** Every family colour of one palette hex, light and dark (the mockup's tokens.js vars(), minus the action colour). */
export function family(input: string): { light: Family; dark: Family } {
  const hex = normalizeHex(input) || "#808080";
  if (cache[hex]) return cache[hex];
  const o = oklch(hex);
  const C0 = o[1] < 0.002 ? 0 : o[1];
  const h = o[2];
  const f = (L: number, cap: number) => at(L, Math.min(C0, cap), h);
  const walk = (L: number, cap: number, step: number, test: (x: string) => boolean) => {
    let x = f(L, cap);
    for (let i = 0; i < 300 && !test(x); i++) x = f((L += step), cap);
    return x;
  };

  const l50 = f(0.985, 0.012);
  const l100 = f(0.962, 0.025);
  const l200 = f(0.925, 0.045);
  const l300 = f(0.86, 0.07);
  const lInkBg = f(0.24, 0.035);
  const lInk = walk(0.25, 0.02, -0.004, (x) => contrast(x, l300) >= 7);
  const lMuted = walk(0.48, 0.02, -0.004, (x) => contrast(x, l200) >= 4.6);
  const lField = walk(0.62, 0.03, -0.004, (x) => contrast(x, l100) >= 3);
  const dBg = f(0.17, 0.012);
  const dBand = f(0.195, 0.014);
  const dSurf = f(0.225, 0.018);
  const dPlate = f(0.26, 0.03);
  const d300 = f(0.31, 0.035);
  const dInkBg = f(0.15, 0.03);
  const dInk = walk(0.955, 0.015, 0.004, (x) => contrast(x, d300) >= 7);
  const dMuted = walk(0.8, 0.02, 0.004, (x) => contrast(x, d300) >= 4.6);
  const dField = walk(0.5, 0.03, 0.004, (x) => contrast(x, dPlate) >= 3);
  const onInk = f(0.975, 0.015);
  const onMuted = f(0.84, 0.03);
  let La = Math.max(o[0], 0.7);
  let onAct = at(La, C0, h);
  for (let i = 0; i < 300 && contrast(onAct, lInkBg) < 7; i++) onAct = at((La += 0.002), C0, h);

  /* the soft fill and the words on it (the switcher's action colour is tested on these same surfaces) */
  const pal = paletteFromColor(hex, { lightSurfaces: ["#ffffff", l50, l100], darkSurfaces: [dBg, dBand, dSurf, dPlate] } as any);
  const lSoft = pal.light.soft;
  const dSoft = f(0.3, 0.05);
  const lSoftInk = contrast(pal.light.text, lSoft) >= 4.6 ? pal.light.text : walk(0.42, 0.08, -0.004, (x) => contrast(x, lSoft) >= 4.6);
  const dSoftInk = walk(0.86, 0.06, 0.004, (x) => contrast(x, dSoft) >= 4.6);

  const light: Family = {
    bg: "#ffffff", band: l50, surface: l50, paper: "#ffffff", card: l50, "card-2": "#ffffff", plate: f(0.966, 0.018), tint2: l200,
    ink: lInk, muted: lMuted, line: f(0.905, 0.025), "line-2": f(0.86, 0.04), field: "#ffffff", "field-line": lField,
    "act-soft": lSoft, "act-dk": onAct, "soft-ink": lSoftInk,
    alt: lInk, "alt-on": "#ffffff", "alt-deep": f(0.16, 0.02),
    "top-bg": lInkBg, "top-ink": onInk, "top-hover": onAct,
    "hdr-bg": "#ffffff", "hdr-ink": lInk, "hdr-hover": "var(--ly-act-text)", "hdr-line": f(0.93, 0.02),
    dark: lInkBg, "dark-2": f(0.31, 0.035), "dark-ink": onInk, "dark-muted": onMuted, "dark-line": rgba(onInk, 0.16),
    art: l200, ph: l100, "ph-2": l50, "ph-3": l200, "ph-line": l300, phd: f(0.38, 0.04), "phd-2": f(0.44, 0.04), "phd-3": f(0.3, 0.035),
    "on-photo": "#ffffff", "on-photo-hover": l200, "phd-ink-btn": lInkBg,
    ring: lInk, "ring-in": "#ffffff", "num-stroke": f(0.8, 0.05), "ck-bg": lInk, "ck-ink": "#ffffff", "icon-line": "var(--ly-act-text)", hash: "var(--ly-act-text)",
    "count-bg": "var(--ly-act)", "count-ink": "var(--ly-act-on)", "sample-bg": lSoft, "sample-ink": lSoftInk,
    "seg-bg": l100, err: "#a3322a", "err-soft": "#fbecea",
    "map-land": l50, "map-block": l200, "map-road": "#ffffff", "map-main": l200, "map-water": l300, "map-park": l100, "map-label": lMuted, "map-pin": lInk,
    scrim: rgba(f(0.16, 0.02), 0.5), "brand-sw": "var(--ly-act)",
  };
  const dark: Family = {
    bg: dBg, band: dBand, surface: dSurf, paper: dSurf, card: dSurf, "card-2": dSurf, plate: dPlate, tint2: d300,
    ink: dInk, muted: dMuted, line: f(0.3, 0.02), "line-2": f(0.36, 0.025), field: dBand, "field-line": dField,
    "act-soft": dSoft, "act-dk": onAct, "soft-ink": dSoftInk,
    alt: dInk, "alt-on": dBg, "alt-deep": "#ffffff",
    "top-bg": dInkBg, "top-ink": onInk, "top-hover": onAct,
    "hdr-bg": dBg, "hdr-ink": dInk, "hdr-hover": "var(--ly-act-text)", "hdr-line": f(0.24, 0.016),
    dark: dInkBg, "dark-2": f(0.24, 0.03), "dark-ink": onInk, "dark-muted": onMuted, "dark-line": rgba(onInk, 0.12),
    art: dPlate, ph: dSurf, "ph-2": dBand, "ph-3": dPlate, "ph-line": d300, phd: f(0.3, 0.035), "phd-2": f(0.34, 0.035), "phd-3": f(0.24, 0.03),
    "on-photo": "#ffffff", "on-photo-hover": l200, "phd-ink-btn": lInkBg,
    ring: dInk, "ring-in": dBg, "num-stroke": f(0.42, 0.04), "ck-bg": dInk, "ck-ink": dBg, "icon-line": "var(--ly-act-text)", hash: "var(--ly-act-text)",
    "count-bg": "var(--ly-act)", "count-ink": "var(--ly-act-on)", "sample-bg": dSoft, "sample-ink": dSoftInk,
    "seg-bg": dPlate, err: "#f1a497", "err-soft": "#3a201c",
    "map-land": f(0.21, 0.016), "map-block": dPlate, "map-road": f(0.3, 0.02), "map-main": f(0.36, 0.03), "map-water": f(0.3, 0.035), "map-park": f(0.25, 0.03), "map-label": dMuted, "map-pin": dInk,
    scrim: rgba(f(0.1, 0.02), 0.62), "brand-sw": "var(--ly-act)",
  };
  return (cache[hex] = { light, dark });
}

/** The theme switcher's action colours for one seed, on its own family's surfaces (the values of a palette row). */
export function actionPalette(input: string): { light: Record<string, string>; dark: Record<string, string> } {
  const hex = normalizeHex(input) || "#808080";
  const f = family(hex);
  const pal = paletteFromColor(hex, { lightSurfaces: ["#ffffff", f.light.band, f.light.ph], darkSurfaces: [f.dark.bg, f.dark.band, f.dark.surface, f.dark.plate] } as any);
  return { light: pal.light, dark: pal.dark };
}
