# Manual Setup

Set {{Name}} up on your shop yourself. Follow these steps in order, or let an agent do it: [Install with AI](Install-with-AI).

## 0. Before you start: sign-in

Set up your shop's **OAuth client id** first (in the shop dashboard's login / OAuth client settings, or with the Selldone MCP connector's `selldone_shop_client_list` and `selldone_shop_client_create`). Without it, sign-in on the Layout leaves for Selldone and shows an error.

Guest checkout, payment methods, delivery ways, pickup points, the checkout map and login modes are your settings. {{Name}} handles each choice; see [Shop Requirements](Shop-Requirements).

## 1. Get your own copy

Fork **{{org}}/{{repo}}** on GitHub (default branch `main`), then clone your fork and fetch Selldone's modules:

```bash
git clone https://github.com/<you>/<your-repo>.git
cd <your-repo>
npm run setup
for p in components translate; do git -C modules/$p apply ../../patches/modules-$p.kalio.patch; done
git remote add upstream https://github.com/selldone/storefront.git
git remote set-url --push upstream DISABLED
```

- `npm run setup` fetches Selldone's six modules into `modules/` (`core`, `components`, `translate`, `storefront-sdk`, `community-sdk`, `pagebuilder`, as listed in `.gitmodules`). Clone with git, not as a ZIP download: the setup needs a git repository.
- The two patches in `patches/` carry the Layout's fixes inside `modules/components` and `modules/translate`.
- `origin` is your repository.
- `upstream` is Selldone's official storefront, used to fetch updates only.
- Never change files inside `modules/*`. A fix there is kept as a patch in `patches/`.

## 2. Install

```bash
npm install --force
```

Node.js 22.15 or newer (the release scripts run `node --use-system-ca`). On Windows use Git Bash for the shell scripts.

For releases you also need **Playwright** with its Chromium, in any folder (`npm i playwright`, then `npx playwright install chromium`): every release loads the built bundle in a headless browser before it uploads. See [Build and Upload](Build-and-Upload).

## 3. Point development at your shop

Edit `.env`. These are public client values, read only in development; in production Selldone injects the shop that runs the Layout.

```dotenv
VITE_APP_SAMPLE_SHOP_NAME=<your shop handle>
VITE_APP_SAMPLE_SHOP_CUSTOM_HOME=shop
VITE_APP_SAMPLE_DEFAULT_CURRENCY=USD
VITE_APP_SAMPLE_DEFAULT_COUNTRY=US
VITE_APP_SAMPLE_DEFAULT_LANGUAGE=en
VITE_APP_DEV_SERVER_PORT={{port}}
```

The repository ships with `VITE_APP_SAMPLE_SHOP_NAME={{xapi}}`, the showcase shop. Leave the `VITE_APP_SAMPLE_THEME_COLOR_*` lines as they are: the Layout's colours come from its theme file (step 4).

`VITE_KALIO_ACCOUNT` (in `.env` and `.env.development.local`) is no longer read, whatever its comment says. {{Name}} always builds the same account: Overview, Orders, Addresses and Profile in a side menu, with Selldone's other sections (saved, wallet, gift cards, returns, reviews) in a quieter list under them.

## 4. Your name, photos and theme

- **Name:** the wordmark is your **shop's title**, drawn by `components/ly/LyLogo.vue` in {{display_font}} with its first letter in capitals, and your shop's **city** in small spaced capitals under it; a long title steps the size down so it never leaves the header. The hero's first line and the footer's name are the same title. Change the title in the Selldone dashboard and the Layout follows. `BRAND.name` in `components/kalio/kalio-brand.ts` is `null`; a string there replaces the shop's title everywhere the storefront names the shop.
- **Mark:** the tab icon and the shop's avatar on order messages are drawn from the title's first letter, a capital in {{display_font}} on the family's dark (`markFor` in `components/kalio/kalio-brand.ts`, `components/ly/ui/LyMark.vue`). They are inline, so there is no image file to replace.
- **Photos:** the eight photo slots read `skins/{{name}}/photos/<slot>.webp`, and each collection's photo reads `skins/{{name}}/photos/col-<slug of its title>.webp` (its address name is tried too). Without a file, a slot shows its designed fallback (the family tint with a pastry drawing, or your own pastries as cut-outs). The repository ships the 14 photos made for {{shop}}: the eight slots, and six collection photos (`cookies`, `croissants`, `danish-pastries`, `mini-cakes`, `muffins`, `tarts`). Replace or remove them for your own. The names and sizes are in [Customize](Customize#photos).
- **Theme:** `components/ly/ly-theme.settings.ts`, the one file for colours, dark or light and the visitor switcher. See [Theme and colours](Theme-and-colours).

## 5. Run it

```bash
npm run serve
```

Open <http://localhost:{{port}}>. Check the home, a collection, a product page, the bag, the checkout and the account against your shop. If a section is missing or a pastry sits on a square, see [Shop Requirements](Shop-Requirements).

## 6. Give the Layout your identity

In `manifest.json`:

```json
{
  "deploy_server": "https://layouts.selldone.com",
  "deploy_path": "",
  "package": "mybakery-classic",
  "name": "Mybakery Patisserie",
  "version": "1.0.0",
  "storefront": true,
  "backoffice": false,
  "description": "One sentence about your storefront."
}
```

- `package`: lowercase, unique to you, and **permanent after the first upload**.
- `name`: at least 8 characters.
- `version`: new for every upload, never reused.
- `description`: the Layout's description on Selldone. Later uploads do not change it, so write it before the first upload.
- `deploy_server` and `deploy_path`: leave them as they are. The upload sends only `package`, `version`, `name`, `description`, `storefront` and `backoffice`.

`selldone-layout.json` is the repository's own summary of the Layout (name, package, summary, live address, screenshots, tags). Keep its name, package and live address in step with yours.

## 7. Release and go live

1. [Build and Upload](Build-and-Upload). The first time: `PW=<path>/node_modules/playwright/index.js SELLDONE_CLI_SRC=<cli clone> bash scripts/release.sh 1.0.0 desk`. After that, with the id printed after the first upload: `LAYOUT_ID=<your Layout id> PW=<path>/node_modules/playwright/index.js SELLDONE_CLI_SRC=<cli clone> bash scripts/release.sh <new version> desk`.
2. [Go Live](Go-Live): pin the exact version on one domain of your shop first (or on the whole shop), and set Home to the shop page.

## 8. Keep up with Selldone

```bash
git fetch upstream main --tags --prune
git merge --no-ff upstream/main
```

Resolve conflicts by keeping {{Name}}'s templates and Selldone's logic. Then re-apply the patches if the modules changed:

```bash
git -C modules/components apply ../../patches/modules-components.kalio.patch
git -C modules/translate apply ../../patches/modules-translate.kalio.patch
```

A patch that no longer applies must be redone by hand, not skipped.
