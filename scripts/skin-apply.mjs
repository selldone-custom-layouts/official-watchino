#!/usr/bin/env node
/*
 * skin-apply.mjs — writes every file the active skin decides, from skins/<name>/skin.json (Node 22.6+, it imports
 * the colour maths in components/ly/ly-family-core.ts directly).
 *
 *   node scripts/skin-apply.mjs            apply the active skin (skins/ACTIVE, or the only folder in skins/)
 *   node scripts/skin-apply.mjs --check    exit 1 when a generated file is out of date or the skin is invalid
 *
 * Writes (GENERATED, never edit them; edit the skin and re-run):
 *   components/ly/skin.gen.ts        the runtime skin: names, storage keys, palettes (with their action colours),
 *                                    fonts, wordmark, basket word, home sections, photo art, splash, words, mark
 *   style/ly-skin.gen.scss           the first paint: type, radius scale, wordmark, the brand palette's family in
 *                                    light (:root) and dark (html.ly-dark)
 *   manifest.json                    package, name, description (the version is kept: release.sh sets it)
 *   selldone-layout.json             the org gallery's card (name, shop, kind, summary, live, tags, package)
 *   package.json                     repository / bugs / homepage of the Layout's GitHub repo
 *   .env                             the dev server: shop, port, currency, country, language, theme colours
 *   index.html                       the dev page's <title>
 *   scripts/loading/config.json      the domain's loading screen (node scripts/loading/make-loading.cjs)
 *   checks/checks.env                test inputs and names for scripts/run-checks.sh
 *   checks/fast-checks.json          the same for new-shop-kits/fast-checks
 *   components/ly/ly-theme.settings.ts  only its palette line, when the palette it names is not in the skin
 * The photos are not copied: components/ly/ly-photos.ts reads skins/<name>/photos/*.webp at build time.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { family, actionPalette, normalizeHex } from "../components/ly/ly-family-core.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { activeName } = require("./lib/skin.cjs");
const CHECK = process.argv.includes("--check");
const SECTIONS = JSON.parse(fs.readFileSync(path.join(ROOT, "components/ly/home/sections.json"), "utf8"));
const ARTS = ["croissant", "cupcake", "tart", "whisk", "cake", "macaron", "none"];
const LOADER_ARTS = ["croissant", "cupcake", "tart", "whisk", "none"];

const name = activeName(ROOT);
const skinDir = path.join(ROOT, "skins", name);
const skin = JSON.parse(fs.readFileSync(path.join(skinDir, "skin.json"), "utf8"));

/* ───────── validation ───────── */
const errors = [];
const warnings = [];
const need = (ok, msg) => ok || errors.push(msg);
need(skin.name === name, `skin.name "${skin.name}" must equal its folder "${name}"`);
need(/^[a-z][a-z0-9-]{1,30}$/.test(skin.name || ""), "name: lower case letters, digits and -");
need(/^[a-z0-9][a-z0-9-]{2,60}$/.test(skin.package || ""), "package: lower case letters, digits and - (permanent after the first upload)");
need(String(skin.title || "").length >= 8, "title: at least 8 characters (Selldone refuses shorter Layout names)");
need(String(skin.description || "").length >= 40, "description: write the real description now; Selldone keeps the FIRST upload's text");
need(skin.shop?.xapi && skin.shop?.domain, "shop.xapi and shop.domain are needed (dev server, checks, prod-bundle check)");
const pals = skin.palettes?.list || [];
need(pals.length >= 1, "palettes.list: at least one palette");
for (const p of pals) need(/^[a-z][a-z0-9-]*$/.test(p.id || "") && normalizeHex(p.seed), `palette ${p.id}: id and seed (#rrggbb)`);
const brand = pals.find((p) => p.id === skin.palettes?.brand) || pals[0];
need(!!brand, "palettes.brand must be one of palettes.list");
need(["light", "dark"].includes(skin.palettes?.mode || "light"), 'palettes.mode: "light" or "dark"');
need(skin.fonts?.display?.family && skin.fonts?.text?.family, "fonts.display and fonts.text (Google families)");
const panel = Number(skin.shape?.panel ?? 8);
const inner = Number(skin.shape?.inner ?? 4);
need(panel >= 0 && panel <= 40 && inner >= 0 && inner <= panel, "shape: 0 <= inner <= panel <= 40 (px)");
const home = (skin.home || []).map((s, i) => {
  const def = SECTIONS[s.section];
  need(!!def, `home[${i}]: unknown section "${s.section}" (${Object.keys(SECTIONS).filter((k) => k[0] !== "$").join(", ")})`);
  if (!def) return s;
  const variant = s.variant || Object.keys(def.variants)[0];
  need(!!def.variants[variant], `home[${i}] ${s.section}: unknown variant "${variant}" (${Object.keys(def.variants).join(", ")})`);
  if (s.band !== undefined && s.band !== def.band && !def.tone) errors.push(`home[${i}] ${s.section}: its tone is fixed`);
  return { section: s.section, variant, band: s.band ?? def.band };
});
need(home.length > 0, "home: at least one section");
home.forEach((s, i) => {
  if (i && s.band && home[i - 1].band) errors.push(`home: ${home[i - 1].section} and ${s.section} are both tint bands; bands alternate white and tint`);
});
const seen = new Set();
home.forEach((s) => {
  if (seen.has(s.section)) warnings.push(`home: ${s.section} appears twice (its #anchor is then not unique)`);
  seen.add(s.section);
});
const slots = Object.fromEntries(Object.entries(skin.photos || {}).filter(([k]) => k !== "collections"));
for (const [slot, def] of Object.entries(slots)) if (def.art) need(ARTS.includes(def.art), `photos.${slot}.art: one of ${ARTS.join(", ")}`);
const photoDir = path.join(skinDir, "photos");
const files = fs.existsSync(photoDir) ? fs.readdirSync(photoDir).filter((f) => !f.startsWith(".")) : [];
for (const f of files) {
  if (!/\.webp$/.test(f)) errors.push(`photos/${f}: only .webp ships (resize to the slot size first)`);
  const base = f.replace(/\.webp$/, "");
  if (!slots[base] && !/^col-[a-z0-9-]+$/.test(base)) warnings.push(`photos/${f}: no slot of that name (slots: ${Object.keys(slots).join(", ")}, col-<slug>)`);
  const size = webpSize(path.join(photoDir, f));
  const want = slots[base]?.size || (base.startsWith("col-") ? skin.photos?.collections?.size : null);
  if (size && want && (size[0] !== want[0] || size[1] !== want[1])) warnings.push(`photos/${f}: ${size.join("×")}, the slot is ${want.join("×")}`);
  if (fs.statSync(path.join(photoDir, f)).size > 400 * 1024) warnings.push(`photos/${f}: over 400 KB`);
}
for (const slot of Object.keys(slots)) if (!files.includes(slot + ".webp")) warnings.push(`photo slot ${slot}: no photo, its designed fallback shows`);
const loading = skin.loading || {};
if (loading.art) need(LOADER_ARTS.includes(loading.art), `loading.art: one of ${LOADER_ARTS.join(", ")}`);
if (skin.splash?.art) need(LOADER_ARTS.includes(skin.splash.art), `splash.art: one of ${LOADER_ARTS.join(", ")}`);
const basket = typeof skin.basket === "string" ? { one: skin.basket, many: skin.basket + "s" } : { one: "bag", many: "bags", ...(skin.basket || {}) };
need(/^[a-z]+$/.test(basket.one) && /^[a-z]+$/.test(basket.many), 'basket: { "one": "bag", "many": "bags" } (lower case)');

if (errors.length) {
  console.error(`skin "${name}": ${errors.length} problem(s)\n  - ` + errors.join("\n  - "));
  process.exit(1);
}

/* ───────── derived values ───────── */
const fam = family(brand.seed);
const palettes = pals.map((p) => {
  const a = actionPalette(p.seed);
  const f = family(p.seed);
  /* the dark soft fill is the family's own (what the palette rows of the first Layout carried) */
  return { id: p.id, name: p.name || p.id, seed: normalizeHex(p.seed), light: { ...a.light, ...(p.light || {}) }, dark: { ...a.dark, soft: f.dark["act-soft"], ...(p.dark || {}) } };
});
const bp = palettes.find((p) => p.id === brand.id);
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(", ");
const google = (f) => f.google || f.family.replace(/ /g, "+") + ":wght@400;500;600;700";
const fontCss = `https://fonts.googleapis.com/css2?family=${google(skin.fonts.display)}${skin.fonts.text.family !== skin.fonts.display.family ? "&family=" + google(skin.fonts.text) : ""}&display=swap`;
const generic = (stack) => (/serif\s*$/.test(stack) && !/sans-serif\s*$/.test(stack) ? "serif" : /monospace\s*$/.test(stack) ? "monospace" : "sans-serif");
const stack = (f) => f.stack || `"${f.family}", ${f.generic === "serif" ? "Georgia, serif" : "system-ui, sans-serif"}`;
const wm = { case: "first", italic: false, dot: false, sub: "city", weight: 500, tracking: ".04em", size: 40, font: "display", ...(skin.wordmark || {}) };
const hWeight = skin.fonts.headingWeight ?? 500;
const words = skin.words || {};
const storage = { theme: `${name}-theme`, splash: `${name}-splash`, splashHold: `${name}-splash-hold`, devLanguages: `${name}-dev-languages` };

const vuetifyDark = {
  background: fam.dark.bg,
  surface: fam.dark.surface,
  "surface-bright": fam.dark.plate,
  "surface-variant": fam.dark.tint2,
  "on-background": fam.dark.ink,
  "on-surface": fam.dark.ink,
  "on-surface-variant": fam.dark.muted,
  secondary: fam.dark["act-dk"],
  "on-secondary": fam.dark.bg,
  error: "#f1a497",
  info: fam.dark["act-dk"],
  success: "#9fbf8f",
  warning: "#e8c27f",
};
const vuetifyLight = { background: "#ffffff", surface: "#ffffff", "on-background": fam.light.ink, "on-surface": fam.light.ink, secondary: fam.light.dark, "on-secondary": "#ffffff", error: "#a3322a" };

const runtime = {
  name,
  title: skin.title,
  package: skin.package,
  storage,
  palettes,
  brand: brand.id,
  mode: skin.palettes.mode || "light",
  showcaseShops: skin.palettes.showcaseShops || (skin.shop.id ? [{ id: skin.shop.id, name: skin.shop.xapi }] : []),
  vuetify: { darkColors: vuetifyDark, lightColors: vuetifyLight },
  fonts: { css: fontCss, display: stack(skin.fonts.display), text: stack(skin.fonts.text), displayFamily: skin.fonts.display.family, textFamily: skin.fonts.text.family },
  wordmark: wm,
  basket,
  home,
  photoArt: Object.fromEntries(Object.entries(slots).map(([k, v]) => [k, v.art || "croissant"])),
  splash: { art: skin.splash?.art || loading.art || "croissant" },
  mark: { bg: fam.light.dark, ink: skin.mark?.ink || fam.light["dark-ink"], font: stack(skin.fonts.display) },
  words: { en: words.en || {}, ar: words.ar || {} },
};

/* ───────── outputs ───────── */
const out = new Map();
const GEN = `GENERATED by scripts/skin-apply.mjs from skins/${name}/skin.json. Do not edit: edit the skin and run node scripts/skin-apply.mjs.`;
out.set("components/ly/skin.gen.ts", `/* ${GEN} */\nexport const SKIN = ${JSON.stringify(runtime, null, 2)} as const;\n\nexport type SkinSection = { section: string; variant: string; band: boolean };\n`);

const famVars = (f, a) =>
  Object.entries(f)
    .map(([k, v]) => `  --ly-${k}: ${v};`)
    .concat([`  --ly-act: ${a.primary};`, `  --ly-act-deep: ${a.deep};`, `  --ly-act-on: ${a.onPrimary};`, `  --ly-act-text: ${a.text};`, `  --ly-act-rgb: ${rgb(a.primary)};`])
    .join("\n");
out.set(
  "style/ly-skin.gen.scss",
  `/* ${GEN}
   The first paint: the skin's type, its radius scale (one shape language: circle 50% · panel · inner), its wordmark,
   and the brand palette's colour family (${brand.id}, ${brand.seed}). After the app starts, components/ly/ly-family.ts
   repaints the family inline on <html> for the palette and mode on the page, and the theme switcher the action colour. */
:root {
  --ly-serif: ${stack(skin.fonts.display)};
  --ly-sans: ${stack(skin.fonts.text)};
  --ly-h-weight: ${hWeight};
  --ly-h1-weight: ${skin.fonts.h1Weight ?? hWeight};
  --ly-r-pn: ${panel}px;
  --ly-r-in: ${inner}px;
  --ly-wm-font: ${wm.font === "text" ? "var(--ly-sans)" : "var(--ly-serif)"};
  --ly-wm-weight: ${wm.weight};
  --ly-wm-track: ${wm.tracking};
  --ly-wm-style: ${wm.italic ? "italic" : "normal"};
  --ly-wm-size: ${wm.size}px;
${famVars(fam.light, bp.light)}
}

html.ly-dark {
${famVars(fam.dark, bp.dark)}
}
`,
);

const manifestPath = path.join(ROOT, "manifest.json");
const oldManifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : {};
const version = oldManifest.package === skin.package && oldManifest.version ? oldManifest.version : skin.version || "1.0.0";
out.set(
  "manifest.json",
  JSON.stringify({ deploy_server: "https://layouts.selldone.com", deploy_path: "", package: skin.package, name: skin.title, version, storefront: true, backoffice: false, description: skin.description }, null, 2) + "\n",
);
const gh = { org: "selldone-custom-layouts", repo: `official-${name}`, ...(skin.github || {}) };
const repoUrl = `https://github.com/${gh.org}/${gh.repo}`;
const shots = ["desktop-home", "desktop-category", "desktop-product", "desktop-cart", "phone-home", "phone-category", "phone-product", "phone-cart"];
out.set(
  "selldone-layout.json",
  JSON.stringify(
    {
      name: skin.title,
      shop: skin.shop.name || skin.shop.xapi,
      kind: skin.kind || "",
      summary: skin.summary || skin.description,
      live: `https://${skin.shop.domain}`,
      cover: "docs/screenshots/cover.jpg",
      screenshots: shots.map((s) => `docs/screenshots/${s}.jpg`),
      tags: skin.tags || [],
      package: skin.package,
      base: "selldone/storefront",
      status: skin.status || "draft",
    },
    null,
    2,
  ) + "\n",
);
const pkgPath = path.join(ROOT, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
pkg.repository = { type: "git", url: `git+${repoUrl}.git` };
pkg.bugs = { url: `${repoUrl}/issues` };
out.set("package.json", JSON.stringify(pkg, null, 2) + "\n");

const dev = skin.dev || {};
const tc = dev.themeColors || {};
out.set(
  ".env",
  `# ${GEN}
# These VITE_* values are public client configuration, read on the dev server only. In production Selldone
# injects the real shop, its defaults and its theme for whichever shop runs this Layout.

# ${skin.shop.name || skin.shop.xapi}${skin.shop.id ? ` (shop ${skin.shop.id})` : ""}: the shop the dev server reads (its public xapi name).
VITE_APP_SAMPLE_SHOP_NAME=${skin.shop.xapi}

# The designed home is the shop page. Values: blog | avocado | hyper | community | shop | map | <page id>
VITE_APP_SAMPLE_SHOP_CUSTOM_HOME=shop

VITE_APP_SAMPLE_DEFAULT_CURRENCY=${skin.shop.currency || "USD"}
VITE_APP_SAMPLE_DEFAULT_COUNTRY=${skin.shop.country || "US"}
VITE_APP_SAMPLE_DEFAULT_LANGUAGE=${skin.shop.language || "en"}

# The brand palette (${brand.id}).
VITE_APP_SAMPLE_THEME_COLOR_LIGHT="${tc.light || bp.light.primary.toUpperCase()}"
VITE_APP_SAMPLE_THEME_COLOR_DARK="${tc.dark || bp.light.deep.toUpperCase()}"
VITE_APP_SAMPLE_THEME_COLOR_DEEP_DARK="${tc.deepDark || fam.light.dark.toUpperCase()}"
VITE_APP_SAMPLE_THEME_COLOR_INFO="${tc.info || bp.light.primary.toUpperCase()}"

# ▃▃▃▃▃▃▃▃▃▃▃▃ Dev Server ▃▃▃▃▃▃▃▃▃▃▃▃

VITE_APP_DEV_SERVER_HOST=localhost
VITE_APP_DEV_SERVER_PORT=${dev.port || 9160}
VITE_APP_DEV_SERVER_HTTPS=FALSE
# The account design: A, "desk" (side rail and order cards). Releases set it themselves (release.sh <version> desk).
VITE_KALIO_ACCOUNT=desk
`,
);
const idx = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
out.set("index.html", idx.replace(/<title>[^<]*<\/title>/, `<title>${skin.title.replace(/[<&]/g, "")}</title>`));

const fq = (f, w, italic) => `${f.family.replace(/ /g, "+")}:${italic ? "ital,wght@1," : "wght@"}${w}`;
const css1 = (f) => `"${f.family}",${generic(stack(f)) === "serif" ? "Georgia,serif" : "system-ui,sans-serif"}`;
const wmFont = wm.font === "text" ? skin.fonts.text : skin.fonts.display;
out.set(
  "scripts/loading/config.json",
  JSON.stringify(
    {
      name: loading.name || skin.shop.name || skin.title,
      ...(loading.sub ? { sub: loading.sub } : {}),
      ...(loading.logo ? { logo: loading.logo } : {}),
      art: loading.art || "croissant",
      bg: loading.bg || (skin.palettes.mode === "dark" ? fam.dark.bg : "#ffffff"),
      ink: loading.ink || (skin.palettes.mode === "dark" ? fam.dark.ink : fam.light.ink),
      muted: loading.muted || (skin.palettes.mode === "dark" ? fam.dark.muted : fam.light.muted),
      accent: loading.accent || (skin.palettes.mode === "dark" ? bp.dark.text : bp.light.primary),
      line: loading.line || (skin.palettes.mode === "dark" ? fam.dark.line : fam.light.line),
      serif: fq(wmFont, loading.nameWeight || wm.weight, wm.italic),
      sans: fq(skin.fonts.text, loading.sansWeight || 700),
      serifCss: css1(wmFont),
      sansCss: css1(skin.fonts.text),
      ...(wm.weight !== 500 ? { nameWeight: wm.weight } : {}),
      ...(wm.tracking !== ".04em" ? { nameTracking: wm.tracking } : {}),
      ...(wm.italic ? { nameItalic: true } : {}),
      ...(wm.case === "lower" ? { nameLower: true } : {}),
      ...(wm.dot ? { dot: bp.light.primary } : {}),
    },
    null,
    1,
  ) + "\n",
);

/* the checks' test inputs: the skin's own (checks.*) or what the shop's data needs to have */
const ck = { product: "", product2: "", category: "", search: "", article: "", compare: "", ...(skin.checks || {}) };
const port = dev.port || 9160;
out.set(
  "checks/checks.env",
  `# ${GEN}
# Sourced by scripts/run-checks.sh. Test inputs only (the shop's own product ids and pages), never in the Layout.
SKIN_NAME='${name}'
SHOP='${skin.shop.xapi}'
LIVE='https://${skin.shop.domain}'
DEV='http://localhost:${port}'
SK='${storage.theme}'
DEV_LANG_KEY='${storage.devLanguages}'
BRAND_PALETTE='${brand.id}'
OTHER_PALETTES='${palettes
    .filter((p) => p.id !== brand.id)
    .map((p) => p.id)
    .join(" ")}'
T_PRODUCT='${ck.product}'
T_PRODUCT2='${ck.product2 || ck.product}'
T_CATEGORY='${ck.category}'
T_SEARCH='${ck.search}'
T_ARTICLE='${ck.article}'
T_COMPARE='${ck.compare}'
I18N_IGNORE='${(ck.i18nIgnore || "").replace(/'/g, "")}'
`,
);
out.set(
  "checks/fast-checks.json",
  JSON.stringify(
    {
      $comment: `${GEN} The input for new-shop-kits/fast-checks (one file per Layout).`,
      layout: name,
      title: skin.title,
      package: skin.package,
      shop: skin.shop.xapi,
      live: `https://${skin.shop.domain}`,
      dev: `http://localhost:${port}`,
      root: ".ly",
      home: ".ly-home",
      wait: ".ly .ftr",
      darkClass: "ly-dark",
      storage,
      palettes: palettes.map((p) => p.id),
      brand: brand.id,
      mode: runtime.mode,
      custom: ["#ffff00", "#00ffff", "#111111"],
      radius: { circle: "50%", panel, inner },
      frame: 1920,
      widths: [1440, 1024, 390],
      wide: [1920, 2560, 2880, 3840],
      basket: basket.one,
      selectors: { bag: ".bag-btn", menu: ".menu-btn", mega: "[aria-controls=dd-shop]", footer: ".ftr", themeRow: ".ftr .ts-row" },
      pages: {
        home: "/",
        category: ck.category || "#cat",
        deals: '/?filter={"only_has_discount":true}',
        search: ck.search ? `/?search=${ck.search}` : "",
        product: ck.product ? `/product/${ck.product}` : "",
        compare: ck.compare ? `/comparison?list=${ck.compare}` : "",
        blog: "/blog",
        article: ck.article || "",
        about: "/about-us",
        contact: "/contact-us",
        faq: "/faq",
        terms: "/terms",
        privacy: "/privacy",
        404: "/no-such-page",
        cart: "/basket/PHYSICAL",
        checkout: "/basket/PHYSICAL?step=checkout",
        account: "/user",
      },
      home_sections: home,
      photo_slots: Object.keys(slots),
      photos: files,
    },
    null,
    2,
  ) + "\n",
);

const setPath = path.join(ROOT, "components/ly/ly-theme.settings.ts");
if (fs.existsSync(setPath)) {
  const s = fs.readFileSync(setPath, "utf8");
  const m = s.match(/^\s*palette:\s*"([^"]+)"/m);
  if (m && !palettes.some((p) => p.id === m[1])) out.set("components/ly/ly-theme.settings.ts", s.replace(/^(\s*palette:\s*)"[^"]+"/m, `$1"${brand.id}"`));
  const md = s.match(/^\s*mode:\s*"([^"]+)"/m);
  if (!m && !md) warnings.push("ly-theme.settings.ts: no palette line");
}

/* ───────── write or check ───────── */
let stale = 0;
for (const [rel, text] of out) {
  const p = path.join(ROOT, rel);
  const now = fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null;
  if (now === text) continue;
  stale++;
  if (CHECK) console.log(`out of date: ${rel}`);
  else {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, text);
    console.log(`wrote ${rel}`);
  }
}
for (const w of warnings) console.log(`note: ${w}`);
console.log(`skin "${name}": ${home.length} sections, ${palettes.length} palettes (brand ${brand.id}), radius ${panel}/${inner}px, ${files.length} photos, basket "${basket.one}"${CHECK ? (stale ? `, ${stale} file(s) out of date` : ", up to date") : ""}`);
if (CHECK && stale) process.exit(1);

/* the size of a .webp (VP8, VP8L, VP8X) */
function webpSize(file) {
  try {
    const d = fs.readFileSync(file).subarray(0, 40);
    const t = d.toString("latin1", 12, 16);
    if (t === "VP8X") return [1 + d.readUIntLE(24, 3), 1 + d.readUIntLE(27, 3)];
    if (t === "VP8 ") return [d.readUInt16LE(26) & 0x3fff, d.readUInt16LE(28) & 0x3fff];
    if (t === "VP8L") {
      const b = d.readUInt32LE(21);
      return [(b & 0x3fff) + 1, ((b >> 14) & 0x3fff) + 1];
    }
  } catch {}
  return null;
}
