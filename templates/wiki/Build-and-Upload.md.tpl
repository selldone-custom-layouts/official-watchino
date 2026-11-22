# Build and Upload

Every release is a **new version** of your Layout on Selldone. `scripts/release.sh` runs every step in order; this page explains each one.

## One-time setup

```bash
npm i -g selldone-cli                                        # the official CLI
git clone https://github.com/selldone/cli selldone-cli-src   # its packager lives in .agents/
npm i playwright && npx playwright install chromium          # in any folder: for step 5b
```

Sign in to the CLI once:

1. Run `selldone`.
2. Choose **Login | Login to your Selldone account.**
3. Approve the sign-in in your browser and type your **2FA code** in the terminal.

`selldone login` is not a command. The sign-in is saved in `~/.selldone-dev/.persist`; if that file is empty, every upload answers 401 until you sign in again.

You also need Python 3 (the script calls it as `python`, for the packager), Node.js 22.15 or newer (the scripts run `node --use-system-ca`) and Bash with `file`, `unzip` and `cmp` (Git Bash on Windows has them).

## Release

The first upload creates your Layout. Leave `LAYOUT_ID` out:

```bash
PW=<path>/node_modules/playwright/index.js SELLDONE_CLI_SRC=../selldone-cli-src \
  bash scripts/release.sh 1.0.0 desk
```

Note the Layout id printed after it (it is also in the Selldone developer panel). Every later release:

```bash
LAYOUT_ID=<your Layout id> PW=<path>/node_modules/playwright/index.js SELLDONE_CLI_SRC=../selldone-cli-src \
  bash scripts/release.sh <new version> desk
```

{{title}} gets its Layout id on its first upload (note it in `LAYOUT.md`); every later upload passes it as `LAYOUT_ID`.

The arguments:
- the **new version**, never used before;
- `desk`, the account design argument of the shared script. {{Name}} no longer reads it (`VITE_KALIO_ACCOUNT`): its account is the same either way.

The variables:
- `SELLDONE_CLI_SRC`: your clone of [selldone/cli](https://github.com/selldone/cli) (required);
- `SELLDONE_CLI`: the installed CLI, by default `$(npm root -g)/selldone-cli`;
- `LAYOUT_ID`: with it, the script also checks the upload on the server;
- `PW`: the `index.js` of your Playwright install, for step 5b;
- `SHOP_URL`: the shop address whose own HTML step 5b loads the build into, by default `https://{{domain}}`. It must be a domain that already has a Layout pinned (any Layout); the showcase shop's address works for everyone, and so does your own domain once a Layout is live on it.

## What the script does, and why

| Step | Why |
| --- | --- |
| 1. Bump `version` in `manifest.json` | A version number is used up even when an upload fails. Never reuse one. |
| 2. `npm run build-production` | Outputs `dist/app/shop.js`, one stylesheet `dist/app/shop.css` and the chunks, with a **relative base**. Releases are served from `cdn.selldone.com/public/layouts/<id>/releases/<ULID>/app/`. The 14 photos in `skins/{{name}}/photos/` ship as files of their own; product, collection and post pictures are the shop's own and come from Selldone. |
| 3. `rm -f dist/index.html` | Every ZIP member must be under `app/`. In production the Layout runs inside Selldone's HTML, so `index.html` is never used. The fonts ({{display_font}}, {{text_font}}) load from the app code (`components/kalio/kalio-fonts.ts`). |
| 4. `scripts/kalio-svg-flatten.mjs` | Selldone accepts only passive SVG attributes. `style`, `<style>`, `xml:space`, `enable-background`, `display`, `fx/fy`, `data-*` and character references in values are refused. |
| 5. MIME check (`file --mime-type`) | Selldone stores the MIME type it sniffs. A chunk starting with `import{` is stored as `text/x-java`, which browsers refuse. Every chunk starts with `"use strict";` (`sniffAsJavaScript` in `vite.config.ts`). |
| 5. No `../shop.js` imports | Selldone's loader reaches `shop.js` through a redirect. A chunk importing `../shop.js` loads the app twice: an old page flashes, then the page goes blank. Shared code lives in a `core` chunk (`coreChunk` in `vite.config.ts`). |
| 5. **At most 300 files** | The archive is extracted inside the upload request, behind a ~100 s limit; at 714 files it was cut off mid-way and the version was burned. `release.sh` refuses a build of more than 300 files; {{Name}} 1.0.0 has **281**. `vite.config.ts` groups code only lazy routes use ({{Name}}'s own shared pieces in one chunk; Selldone's rare pages, such as community, Avocado, POS, hyper, Instagram, maps, vendor listings and other kinds of order, in one; Selldone's language packs four to a file), and only when everything a grouped module imports outside core is in the same group, so no common page loads a group's file. SVGs up to 16 KB and small PNG/JPG icons up to 12 KB ride inline, there is one stylesheet, fonts ship as WOFF2 only and country flags load from jsDelivr. Each photo added to `skins/{{name}}/photos/` is one more file, and a new dependency can push it over. |
| 5b. **Production-bundle check** (`scripts/prod-check.mjs`) | Dev checks never see chunking bugs, because the dev server does not bundle: a Layout can pass every dev check and still be blank live. This step serves the built `dist/app` locally and answers every page address with the live shop's own storefront HTML (`SHOP_URL`), with Selldone's loader pointed at the local `shop.js` and `shop.css`. Headless Chromium opens the home, then moves in the app to a collection, a product of it, the journal, a post, the bag with one piece and the checkout. {{Name}}'s root (`.ly`) must be drawn on every page with no page error, and `shop.js` must come from the build. It prints `PROD-CHECK OK`; on anything else the script stops with "PROD-CHECK FAILED: not uploading". Nothing is ordered: the piece sits in Selldone's guest basket, Selldone's `/buy/` calls are blocked, and the bag is emptied again. |
| 6. `package_layout.py … --force` | Without `--force`, an old `dist.zip` is kept and it still prints PASS. |
| 6. `cmp` of `shop.js` | Proves the ZIP is this build. |
| 7. `scripts/kalio-deploy.mjs` | Uploads with the official CLI's sign-in and checks, sending only the six manifest fields the server accepts. |
| 7. `scripts/kalio-verify-deploy.mjs` | Asks the server: the newest deploy must show `extracting:false`, `error:null`, `js_match:true` and `css_match:true`. **A CLI exit code is not proof.** |

To run the production-bundle check on its own, after a build:

```bash
PW=<path>/node_modules/playwright/index.js node --use-system-ca scripts/prod-check.mjs dist/app
```

It uses port 9151 (`PORT` to change it). If it says the shop has "no private Layout release in its loader", the `SHOP_URL` you gave has no Layout pinned: use the default, or a domain that has one.

To check an upload again later:

```bash
node --use-system-ca scripts/kalio-verify-deploy.mjs <selldone-cli root> <your Layout id> dist/app
```

It prints the two newest deploys, each with its release path.

## Upload rules found by testing (November 2026)

- `manifest` holds only `package, version, name, description, storefront, backoffice`.
- No spaces or brackets in any file name (`safeName` in `vite.config.ts`).
- The `package` name never changes after the first upload.
- The `description` shown on Selldone is the first upload's: later uploads do not change it.
- An upload creates a **beta** version. Your shop doesn't change until you attach it: see [Go Live](Go-Live).

## Styles

The look is `style/ly/*.css` (`base.css`, `pages.css`, `look.css`: the first Layout's mockup stylesheets, now the base's own source, every rule scoped to the Layout's markup `.ly`, custom properties `--ly-…`, dark mode `html.ly-dark`), `style/ly/variants.css` (the home's section variants), `style/ly-layout.scss` (the Layout's own touches) and `style/ly-sd.scss` (Selldone's sheets and windows in the Layout's dress). The skin's values (type, the radius scale, the wordmark, the brand palette's first paint) are `style/ly-skin.gen.scss`, written by `node scripts/skin-apply.mjs` from `skins/{{name}}/skin.json`; edit the skin, never the generated file. Every colour after the first paint is written by `components/ly/ly-family.ts`. `release.sh` refuses to build when a generated file is out of date (step 0).

## Preview a release before it is live

```bash
node --use-system-ca scripts/kalio-live-preview.mjs <release-ULID> 9125
```

This serves a shop's real HTML with the loader pointed at that release, on `http://localhost:9125`. The ULID is in the release path that `kalio-verify-deploy.mjs` prints. It reads the showcase shop {{shop}} (`https://bakini.selldone.shop`) unless you name yours: `SHOP_URL=https://<your handle>.myselldone.com node --use-system-ca scripts/kalio-live-preview.mjs <release-ULID> 9125`.
