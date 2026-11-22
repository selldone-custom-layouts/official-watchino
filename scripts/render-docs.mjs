#!/usr/bin/env node
/*
 * render-docs.mjs — README.md, LAYOUT.md and docs/wiki/*.md from templates/ and the active skin.
 *
 *   node scripts/render-docs.mjs            write them
 *   node scripts/render-docs.mjs --keep     do not overwrite files that exist (LAYOUT.md is kept by default:
 *                                           it is the Layout's own release notes once work starts)
 *
 * Templates use {{name}} placeholders (the list is VARS below); a placeholder with no value is an error, so a
 * template change never ships a literal "{{…}}". The section and photo tables come from the skin and
 * components/ly/home/sections.json.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { family, actionPalette, contrast } from "../components/ly/ly-family-core.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { readSkin } = require("./lib/skin.cjs");
const { skin } = readSkin(ROOT);
const KEEP = process.argv.includes("--keep");
const SECTIONS = JSON.parse(fs.readFileSync(path.join(ROOT, "components/ly/home/sections.json"), "utf8"));
const TPL = path.join(ROOT, "templates");

const gh = { org: "selldone-custom-layouts", repo: `official-${skin.name}`, ...(skin.github || {}) };
const pals = skin.palettes.list;
const brand = pals.find((p) => p.id === skin.palettes.brand) || pals[0];
const bp = actionPalette(brand.seed);
const fam = family(brand.seed);
const basket = typeof skin.basket === "string" ? { one: skin.basket, many: skin.basket + "s" } : { one: "bag", many: "bags", ...(skin.basket || {}) };
const home = (skin.home || []).map((s) => ({ ...s, variant: s.variant || Object.keys(SECTIONS[s.section].variants)[0] }));
const slots = Object.entries(skin.photos || {}).filter(([k]) => k !== "collections");
const photoDir = path.join(ROOT, "skins", skin.name, "photos");
const photoFiles = fs.existsSync(photoDir) ? fs.readdirSync(photoDir) : [];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const VARS = {
  title: skin.title,
  name: skin.name,
  Name: cap(skin.name),
  package: skin.package,
  tagline: skin.tagline || skin.description,
  description: skin.description,
  summary: skin.summary || skin.description,
  kind: skin.kind || "",
  shop: skin.shop.name || skin.shop.xapi,
  shop_id: String(skin.shop.id || ""),
  xapi: skin.shop.xapi,
  domain: skin.shop.domain,
  org: gh.org,
  repo: gh.repo,
  repo_url: `https://github.com/${gh.org}/${gh.repo}`,
  wiki_url: `https://github.com/${gh.org}/${gh.repo}/wiki`,
  raw_url: `https://raw.githubusercontent.com/${gh.org}/${gh.repo}/main`,
  port: String(skin.dev?.port || 9160),
  basket: basket.one,
  baskets: basket.many,
  Basket: cap(basket.one),
  brand: brand.id,
  brand_name: brand.name || brand.id,
  brand_hex: bp.light.primary,
  badge_color: bp.light.primary.slice(1).toUpperCase(),
  badge_dark: fam.light.dark.slice(1).toUpperCase(),
  badge_soft: bp.light.soft.slice(1).toUpperCase(),
  palettes: pals.map((p) => p.name || p.id).join(", "),
  palette_ids: pals.map((p) => "`" + p.id + "`").join(", "),
  mode: skin.palettes.mode || "light",
  display_font: skin.fonts.display.family,
  text_font: skin.fonts.text.family,
  panel: String(skin.shape?.panel ?? 8),
  inner: String(skin.shape?.inner ?? 4),
  showcase: (skin.palettes.showcaseShops || []).map((s) => s.name).join(", ") || skin.shop.xapi,
  sections_list: home.map((s, i) => `${i + 1}. **${s.section}** (${s.variant}${s.band ?? SECTIONS[s.section].band ? ", tint band" : ""}): ${SECTIONS[s.section].variants[s.variant]}`).join("\n"),
  sections_table:
    "| # | Section | Variant | What it shows |\n| --- | --- | --- | --- |\n" +
    home.map((s, i) => `| ${i + 1} | \`${s.section}\` | \`${s.variant}\` | ${SECTIONS[s.section].variants[s.variant].replace(/\|/g, "/")} |`).join("\n"),
  library_table:
    "| Section | Variants |\n| --- | --- |\n" +
    Object.entries(SECTIONS)
      .filter(([k]) => k[0] !== "$")
      .map(([k, v]) => `| \`${k}\` | ${Object.keys(v.variants).map((x) => "`" + x + "`").join(", ")} |`)
      .join("\n"),
  photos_table:
    "| Slot | File | Size | In the build |\n| --- | --- | --- | --- |\n" +
    slots.map(([k, v]) => `| ${k} | \`skins/${skin.name}/photos/${k}.webp\` | ${(v.size || []).join(" × ")} | ${photoFiles.includes(k + ".webp") ? "yes" : "no: the designed fallback shows"} |`).join("\n") +
    `\n| each collection | \`skins/${skin.name}/photos/col-<slug of its title>.webp\` | ${(skin.photos?.collections?.size || [1400, 1050]).join(" × ")} | ${photoFiles.filter((f) => f.startsWith("col-")).length} file(s); a collection without one shows its best sellers on a plate |`,
  year: String(new Date().getFullYear()),
  brand_seed: brand.seed,
  look_grounds: `a white page \`#ffffff\` with soft tint bands and cards \`${fam.light.band}\`, plates \`${fam.light.plate}\`, a deeper tint \`${fam.light.tint2}\`, near-black ink \`${fam.light.ink}\`, muted words \`${fam.light.muted}\`, lines \`${fam.light.line}\`; a dark top bar and footer in the family's darkest shade \`${fam.light.dark}\` with words \`${fam.light["dark-ink"]}\`. These are the ${brand.name || brand.id} values: with another palette or a custom colour every one of them takes that colour's hue`,
  look_action: `${brand.name || brand.id} \`${bp.light.primary}\` (white words ${contrast("#ffffff", bp.light.primary).toFixed(2)}:1) on every button, chosen state and link; on the dark top bar and footer the family's light shade (\`--ly-act-dk\`, \`${fam.light["act-dk"]}\`) marks the hover`,
  look_dark: `the page and header \`${fam.dark.bg}\`, bands and fields \`${fam.dark.band}\`, cards \`${fam.dark.surface}\`, plates \`${fam.dark.plate}\`, words \`${fam.dark.ink}\`, muted words \`${fam.dark.muted}\`, lines \`${fam.dark.line}\`, the top bar and footer \`${fam.dark.dark}\`, the action colour \`${bp.dark.primary}\` with white words and links \`${bp.dark.text}\``,
  look_dark_short: `for ${brand.name || brand.id}: page \`${fam.dark.bg}\`, cards \`${fam.dark.surface}\`, words \`${fam.dark.ink}\`, links \`${bp.dark.text}\``,
  contrast_table:
    "| Palette | Seed of the family | Light: action colour, white words on it | Light: link colour on the tint band / the plate | Dark: action colour, white words on it | Dark: link colour on the card |\n| --- | --- | --- | --- | --- | --- |\n" +
    pals
      .map((p) => {
        const a = actionPalette(p.seed);
        const f = family(p.seed);
        const r = (x, y) => contrast(x, y).toFixed(2) + ":1";
        return `| ${p.name || p.id} | \`${p.seed}\` | \`${a.light.primary}\` ${r("#ffffff", a.light.primary)} | ${r(a.light.text, f.light.band)} / ${r(a.light.text, f.light.plate)} | \`${a.dark.primary}\` ${r("#ffffff", a.dark.primary)} | \`${a.dark.text}\` on \`${f.dark.surface}\` ${r(a.dark.text, f.dark.surface)} |`;
      })
      .join("\n"),
  photo_credit: skin.photoCredit || (photoFiles.length ? `Photos: see \`skins/${skin.name}/photos/\` and their licence notes in \`LAYOUT.md\`.` : "The photo slots show their designed fallbacks until the shop's own photos are added."),
};

function render(text, file) {
  return text.replace(/\{\{(\w+)\}\}/g, (m, k) => {
    if (!(k in VARS)) throw new Error(`${file}: unknown placeholder ${m}`);
    return VARS[k];
  });
}

const jobs = [
  ["README.md.tpl", "README.md"],
  ["LAYOUT.md.tpl", "LAYOUT.md", true],
  ...fs.readdirSync(path.join(TPL, "wiki")).map((f) => [path.join("wiki", f), path.join("docs/wiki", f.replace(/\.tpl$/, ""))]),
];
for (const [from, to, keepByDefault] of jobs) {
  const dest = path.join(ROOT, to);
  if ((KEEP || keepByDefault) && fs.existsSync(dest)) continue;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, render(fs.readFileSync(path.join(TPL, from), "utf8"), from));
  console.log(`wrote ${to}`);
}
