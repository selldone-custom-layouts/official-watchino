# AI Agent Entry Point

Detailed AI instructions and reusable custom Storefront Layout material live
in the dedicated [`.ai-agent/`](.ai-agent/) directory so they stay separate
from application source.

For tasks that customize, redesign, audit, package, or publish this Storefront
as a custom Selldone Layout, read these files completely:

1. [`.ai-agent/AGENTS.md`](.ai-agent/AGENTS.md)
2. [`.ai-agent/SKILL.md`](.ai-agent/SKILL.md)
3. [`.ai-agent/AI_WORKFLOW.md`](.ai-agent/AI_WORKFLOW.md) when GitHub setup,
   dependency synchronization, packaging, authentication, or deployment is in
   scope

The official Vue 3/Vite Storefront is the implementation baseline. This kit
does not authorize a framework replacement or a parallel storefront app; the
visual design may change completely while the platform and commerce contracts
remain intact. Do not change the official repository's Git remote model or run
release commands merely because this shim exists. Apply publication rules in
the owner's controlled clone, fork, or release branch.

## The skin (what makes this Layout this Layout)

Everything Layout-specific is one file and one folder: `skins/<name>/skin.json` (names, package, description, the shop
and its domain, palettes with their seeds, fonts, the radius scale, the wordmark, the basket word, the home's sections
in order with their variants, the photo slots, the loading screen, the splash art, the skin's own words and the
checks' test inputs) and `skins/<name>/photos/*.webp`. After any change run `node scripts/skin-apply.mjs` (it
validates the skin and rewrites the generated files: `components/ly/skin.gen.ts`, `style/ly-skin.gen.scss`,
`manifest.json`, `selldone-layout.json`, `package.json`, `.env`, `scripts/loading/config.json`, `checks/`) and
`node scripts/render-docs.mjs` (README, wiki). Never edit a generated file; `scripts/release.sh` refuses a build
whose generated files are out of date. The section library is `components/ly/home/sections.json`; a skin can only
order, pick variants of and tint the sections listed there. See `BASE.md` for the base's rules.

## Theme (palette, brand colour, light or dark, the visitor switcher)

When a merchant asks for a theme ("use the rose theme", "my brand colour is #F5C400", "make it dark"), edit **one file only**: `components/ly/ly-theme.settings.ts`. Nothing else needs to change, and the colours are made readable automatically (buttons, links, chosen states, dark mode). The Layout is drawn in **one colour family**: the palette's hue gives every ground (the white page and its soft tint bands, the plates, the lines, the words, the dark top bar and footer) and the action colour, so a palette or a brand colour re-tints the whole page, never just the buttons.

| Setting | Allowed values |
| --- | --- |
| `palette` | one of the skin's palette ids (`skins/<name>/skin.json` palettes.list; its `palettes.brand` is the default) |
| `brandColor` | any `"#RRGGBB"`; when set it replaces `palette` (the whole page takes this colour's family) |
| `mode` | `"light"` (white and the soft tint) or `"dark"` (the family's night) |
| `themeSwitcher` | `"showcase"` (the visitor switcher shows only on the skin's showcase shops; the default), `"on"` (the merchant's visitors get the Theme row in the footer), `"off"` |
| `textOnBrand` | only with `brandColor`: `"auto"` (a light brand such as yellow keeps its colour, with dark words on it) or `"white"` (white words; a light colour is darkened) |

Worked examples (change only these lines; leave the rest of the file as it is):

- **"Use the rose theme"** (when the skin has a rose palette): `palette: "rose"`.
- **"My brand colour is #F5C400"**: `brandColor: "#F5C400", textOnBrand: "auto"`. Use `textOnBrand: "white"` if they want white words; the colour is then darkened.
- **"Make it dark"**: `mode: "dark"`.
- **"Let visitors switch themes"**: `themeSwitcher: "on"`.
- **"Remove the switcher"**: `themeSwitcher: "off"`. On a merchant's own shop it is already hidden with `"showcase"`.
- **"Go back to the original colours"**: remove `brandColor` and set `palette` to the skin's brand palette and `mode` to its mode.

The switcher itself is the shared package in `components/theme-switcher/` (the same code as every other Layout). The palettes come from the skin (`components/ly/skin.gen.ts`, read by `components/ly/ly-theme.ts`), the family that paints every ground from the palette is `components/ly/ly-family.ts` (maths in `ly-family-core.ts`), and the brand palette's first paint and the shape scale are `style/ly-skin.gen.scss`; do not edit them for a merchant's theme.

Then release and check:

1. Build and upload: `LAYOUT_ID=<your Layout id> SELLDONE_CLI_SRC=<cli clone> bash scripts/release.sh <new version> desk`. Put the version live.
2. Check the contrast on the live shop. It must print `TOTAL 0`:
   ```sh
   PAGES="home=/,category=/<a category>,product=/product/<id>" node components/theme-switcher/tools/contrast-audit.cjs https://<your shop> ".ftr"
   ```
3. If the visitor switcher is on, also run the kit's `ring-sweep.cjs` in light and dark (`STORAGE='{"<name>-theme":"{\\"palette\\":\\"<id>\\",\\"mode\\":\\"dark\\"}"}'`). The switcher is the Theme row in the footer.

## Words and languages

The Layout's own words go through `t("ly.<area>.<name>", "English")` (`components/kalio/i18n/kalio-i18n.ts`, the shared i18n runtime). The English is `components/kalio/i18n/base/en.ts` (the shared Kalio words), `bakini.en.ts` (the `bakini.*` words still used by the shared Kalio/Bakini code) and `ly.en.ts` (the Layout's own), generated from the code by the kit's `i18n-extract.cjs` (run it once with the prefix `ly.` and once with `bakini.`); Arabic is `base/ar.ts` + `bakini.ar.ts` + `ly.ar.ts`, merged by `lang-ar.ts` and listed in `index.ts` (`LOADERS`), fetched only when a visitor picks it. A skin can replace any of these words (`skin.json` "words": { "en": { "<key>": "…" }, "ar": { … } }) and the basket word ("basket": { "one", "many" }; the base writes "bag", `components/ly/ly-words.ts` swaps it in the English words, in Selldone's own English strings, `kalio-brand.ts` `bagWords()`, and in t()'s English fallbacks). To add a language the shop enables: translate `ly.en.ts` and `bakini.en.ts` to `<code>` files (same keys, keep every `{…}`, add the language's plural forms), copy `base/<code>.ts` from the shared set, add `lang-<code>.ts` and one `LOADERS` line. A new visible word always gets a `t()` key; a word still in English after a language pick is an unwrapped string. Use logical CSS (`margin-inline`, `inset-inline`, `text-align: start`) so a right-to-left language mirrors.
