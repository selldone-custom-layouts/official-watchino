# The Layout base

**What it is.** One storefront codebase for every custom Selldone Layout. A Layout is the base plus a skin
(`skins/<name>/skin.json` and `skins/<name>/photos/`). The base started as Pralino Classic Patisserie 1.0.7 (the last
Layout built by hand, live on pralino.selldone.shop, HEAD 615e2b6 of `pralino-layout`), with every Pralino name
moved into the skin system. Pralino came from Domino 1.0.2, Domino from Bakini Noir, Bakini from Medio and the Kalio
(Molino) base, all on selldone/storefront; their lessons are in `marketplace-guide.md` and the kits.

## Lineage of names

| Was (Pralino) | Is (base) |
| --- | --- |
| `components/pralino/`, `Pralino*.vue`, `Pr*.vue`, `pr.ts`, `pr-*.ts`, `pralino-*.ts` | `components/ly/`, `Ly*.vue`, `ly.ts`, `ly-*.ts` |
| `.pr` root class, `--pr-*` tokens, `html.pr-dark`, keyframes `pr-*` | `.ly`, `--ly-*`, `html.ly-dark`, `ly-*` (checked first: no `ly` class, token or identifier in the storefront, the six modules or Vuetify; `lb` was taken by the map's labels) |
| `style/pralino/{base,pages,pralino}.css`, `style/pralino-{theme,layout,sd}.scss` | `style/ly/{base,pages,look}.css`, `style/ly/variants.css` (new), `style/ly-{theme,layout,sd}.scss`, `style/ly-skin.gen.scss` (generated) |
| i18n keys `pralino.*`, files `pralino.{en,ar}.ts` | `ly.*`, `ly.{en,ar}.ts` |
| storage keys `pralino-theme`, `pralino-splash`, `pralino-splash-hold`, `pralino-dev-languages` | `<skin name>-theme`, `-splash`, `-splash-hold`, `-dev-languages` (so a Pralino skin keeps its keys) |
| photo slots `pralino-hero-back` … `pralino-footer`, `pralino-col-<slug>` in `assets/pralino/` | `hero-back` … `footer`, `col-<slug>` in `skins/<name>/photos/` |
| `PralinoHome.vue` (one 712-line component) | `components/ly/home/LyHome.vue` (the skin's sections in order), `home-data.ts` (the shared reads, unchanged), `sections/*.vue` |
| the Tan values written in `pralino-theme.scss` and `pralino-theme.ts` | computed from each palette's seed by `ly-family-core.ts` at `skin-apply` time (identical for Pralino's five palettes) |
| `scripts/pralino-prod-check.mjs`, `pralino-checkout-walk.mjs`, `card-edge-pr.cjs` | `scripts/prod-check.mjs`, `checkout-walk.mjs`, `card-edge-ly.cjs` (their defaults read the skin) |
| `scripts/pralino-css.cjs` (mockup → CSS generator) | removed: `style/ly/*.css` are now the base's own source |

`new-shop-kits/base/tools/derive-base.mjs` is the repeatable step that did the renaming; comments that say
`design/<page>.html` refer to the first Layout's mockup set (`pralino-design/` in the workspace).

## The skin

| Key | What it decides | Read by |
| --- | --- | --- |
| `name`, `package`, `title`, `description`, `summary`, `tagline`, `kind`, `tags` | names everywhere; `manifest.json` and `selldone-layout.json` (right on the FIRST upload: Selldone keeps the first description) | skin-apply, render-docs |
| `shop` { name, id, xapi, domain, currency, country, language } | the dev server's shop, the live domain the checks and the prod-bundle check use | `.env`, `checks/`, `scripts/lib/skin.cjs` |
| `github` { org, repo, topics } | `package.json` repository, README links, `publish-github.sh` | skin-apply, render-docs |
| `dev` { port, themeColors? } | the dev server port; the dev theme colours (default: from the brand palette) | `.env` |
| `palettes` { brand, mode, list[{ id, name, seed, light?, dark? }], showcaseShops } | the colour families, the switcher's palettes (action colours computed from the seed), the first paint | `skin.gen.ts`, `ly-skin.gen.scss` |
| `fonts` { display, text: { family, google, stack }, headingWeight } | the two faces, one Google request | `kalio-fonts.ts`, `ly-skin.gen.scss` |
| `shape` { panel, inner } | the radius scale (circle 50 % is fixed) | `ly-skin.gen.scss` |
| `wordmark` { case, italic, dot, sub, weight, tracking, size } | the header's wordmark, the splash's name, the loading screen's name | `ly-wordmark.ts`, `LyLogo.vue`, `LySplash.vue`, loader config |
| `basket` { one, many } | the basket word in the Layout's English and Selldone's English | `ly-words.ts` |
| `home` [{ section, variant, band? }] | the home's sections, their order, variants and tint (validated against `components/ly/home/sections.json`; two tints side by side are refused) | `LyHome.vue` |
| `photos` { <slot>: { size, art, note }, collections: { size } } | the slots, their sizes (checked) and the fallback art | `LyPhoto.vue`, skin-apply |
| `loading` { art, sub, name?, logo?, colours? } | the domain's custom loading screen (`scripts/loading/config.json` → `make-loading.cjs`) | skin-apply |
| `splash` { art } | the in-app splash's line art | `LySplash.vue` |
| `words` { en: {}, ar: {} } | any `t()` key's text, per language | `ly-words.ts` |
| `checks` { product, product2, category, search, article, compare, i18nIgnore } | test inputs for the checks (the shop's own ids), never in the Layout | `checks/checks.env`, `checks/fast-checks.json` |

## The home's section library (`components/ly/home/sections.json`)

| Section | Variants | Default tint |
| --- | --- | --- |
| `hero` | `split` (Pralino), `mirror` (Domino: photo left, words right; the photo is flipped so its calm corner stays under the words) | white |
| `about` | `numbers` (Pralino: numbers beside the story), `story` (Domino: centred story, no numbers) | tint |
| `counters` | `band` (Domino's cocoa counters on the family-dark band, without scallops) | dark band |
| `collections` | `rows` (Pralino's alternating photo rows), `cards` (Domino's 2 × 2 cards, photo on top) | white |
| `how` | `photo` | tint |
| `offer` | `ways` | white |
| `gallery` | `mosaic` | white |
| `selection` | `rows` | tint |
| `photoband` | `full` | photo |
| `marquee` | `names` | white |
| `journal` | `photo` | tint |

A new variant: a class on the section's root (`v-<variant>`) and its rules in `style/ly/variants.css`, or a new
component in `sections/` registered in `LyHome.vue`; then list it in `sections.json`.

## Dependencies

`modules/` (the six Selldone modules, with `patches/modules-{components,translate}.kalio.patch` applied) and
`node_modules/` are not in git. On this machine they are copied, never linked (Vite breaks behind a junction):

```powershell
robocopy <from>\modules <to>\modules /E /MT:32 /NFL /NDL /NJH /NJS /NP
robocopy <from>\node_modules <to>\node_modules /E /MT:32 /XD .vite /NFL /NDL /NJH /NJS /NP
```

The base's own copy came from `pralino-layout` (same `package.json` and lock); `new-layout.mjs` copies the base's
into each new Layout (about 2 minutes on the SSD; robocopy's exit codes 1–3 mean success). Elsewhere:
`npm run setup`, the two patches, `npm install --force`.

## Tools find Playwright and sharp

`PW` / `SHARP` (a path), else the installed package, else `../../kalio-marketplace/node_modules/<pkg>` (the
workspace's copy beside the Layout). No absolute paths anywhere in the repo.

## Rules for changing the base

- A fix that every Layout needs goes here, then into each Layout (they are separate repos: copy the commit).
- A Layout-only touch goes in that Layout's `style/ly-layout.scss` or its skin, never in `style/ly/*.css`.
- Keep `scripts/run-checks.sh` and `scripts/fast-checks.config.mjs` in step (same run names).
- Never write a shop's name, price, collection or address in code; never `vw` for anything that bleeds or aligns.
