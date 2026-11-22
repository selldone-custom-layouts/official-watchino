# Install with AI

An AI coding agent (for example **Claude Code** or **OpenAI Codex**) can set {{Name}} up on your Selldone shop. It copies the repository, puts your theme in, checks your shop's data, builds it, proves the built bundle starts, uploads it with the official CLI and puts it live on one domain, while you do the few steps that need you. This page gives you what to prepare, a prompt to paste, and what to expect.

## 1. Prepare (10 minutes)

| You need | Why | Where |
| --- | --- | --- |
| A Selldone shop with collections (categories) and products | The Layout shows your live data | [selldone.com](https://selldone.com) |
| Your shop's **OAuth client id**, set up for the shop | Shopper sign-in. Without it, sign-in leaves for Selldone and shows an error. **Do this first.** | Shop dashboard (the shop's login / OAuth client settings), or the Selldone MCP connector (`selldone_shop_client_list`, `selldone_shop_client_create`) |
| Your shop's **handle** (the name in `name.myselldone.com`) and **shop id** | The agent uses them in `.env` and when attaching | Shop dashboard |
| Your shop's title and address | The title is drawn as the wordmark (with a capital first letter) and opens the hero; the city from your address sits under the wordmark | Shop dashboard |
| Your theme | One file for the colours | You choose: a palette ({{palette_ids}}) or a brand colour `#RRGGBB`, and light or dark. The whole page takes the colour's family, not only the buttons |
| A domain to try it on | {{Name}} goes live on one domain first; the whole shop only when you say | A domain of your shop, for example `shop.example.com` (see [Go Live](Go-Live)) |
| A GitHub account | Your own copy (fork) of this repository | [github.com](https://github.com) |
| A computer with **Git**, **Node.js 22.15 or newer**, **Python 3** (as `python`) and **Bash** (Git Bash on Windows) | Building and packaging | — |
| **Playwright** with its Chromium, installed anywhere on that computer | Every release loads the built bundle in a headless browser before it uploads (step 5b of `scripts/release.sh`); the checks use it too | `npm i playwright` and `npx playwright install chromium` in a folder of your choice |
| An AI coding agent that can run terminal commands | Does the work | Claude Code, Codex… |
| Optional: the **Selldone MCP connector** for your shop | Lets the agent attach the Layout and set your Home page for you | [selldone.com/mcp/connections](https://selldone.com/mcp/connections) |
| Optional: your own **photos** for the photo slots | The repository ships the 14 photos made for {{shop}}; you can replace them, or remove them to get each slot's designed fallback | Made by you, with the exact names and sizes in [Customize](Customize#photos) |

**Your part.** Only you should do these, and the agent will ask you when the time comes:

- **Sign in to the Selldone CLI.** Run `selldone`, choose **Login**, approve the sign-in in your browser and type your **2FA code**. Never give a password or code to the agent.
- **Approve the GitHub fork** (or create the repository yourself).
- **Attach the Layout to your domain or shop,** unless the agent has the Selldone MCP connector.

**Your settings stay yours.** Guest checkout, payment methods, delivery ways, pickup points, the checkout map and login modes are set by you in the dashboard. {{Name}} works with whatever you choose (see [Shop Requirements](Shop-Requirements)); the agent must not change them.

## 2. Paste this prompt into your agent

Fill in the values in braces first.

```text
Set up the Selldone custom Layout "{{title}}" on my Selldone shop.

My shop handle: {SHOP_HANDLE}        (as in {SHOP_HANDLE}.myselldone.com)
My shop id: {SHOP_ID}
My GitHub account: {GITHUB_USER}
New Layout package name (lowercase, permanent, unique to me): {PACKAGE}   e.g. mybakery-classic
My theme: {THEME}   e.g. palette "{{brand}}", light   or   brandColor "#F5C400", dark
Where it goes live first: {DOMAIN}   one domain of my shop, e.g. shop.example.com
(The whole shop only when I say so.)
Playwright on this computer: {PLAYWRIGHT}   the folder that holds node_modules/playwright

Source: https://github.com/{{org}}/{{repo}} (branch main)
It is based on the official Vue 3 storefront, https://github.com/selldone/storefront.

Before you change anything, read completely: README.md, LAYOUT.md, BASE.md, AGENTS.md (its "Theme"
and "Words and languages" sections), KALIO.md, every file in docs/wiki/, and
.ai-agent/AGENTS.md, .ai-agent/SKILL.md, .ai-agent/AI_WORKFLOW.md.

Then:
0. Check that my shop has an OAuth client for sign-in (Selldone MCP: selldone_shop_client_list).
   If it has none, stop and tell me how to add it. Do not create one without asking me.
1. Fork the repository to my GitHub account (or create {GITHUB_USER}/{PACKAGE}) and clone it
   with git. Run npm run setup (Selldone's six modules in modules/), then apply the patches:
   for p in components translate; do git -C modules/$p apply ../../patches/modules-$p.kalio.patch; done
   Keep https://github.com/selldone/storefront as a fetch-only "upstream".
2. npm install --force. Put my shop in .env: VITE_APP_SAMPLE_SHOP_NAME={SHOP_HANDLE},
   and my currency, country and language. Run the dev server (npm run serve, port {{port}}) and
   check the home, a collection, a product page, the bag and the checkout against my shop.
   Compare my shop's data with docs/wiki/Shop-Requirements.md and tell me what is missing
   (cut-out photos, units, pros, flat spec, collection descriptions, delivery ways with their
   days and windows, the pickup note's hours, the shop's address, city, location and open days,
   articles with covers, FAQ, About/Terms/Privacy) instead of hard-coding anything. Do not
   change my shop's data without asking me.
3. Name: {{Name}} draws my shop's title as its wordmark, with my city under it. Keep BRAND.name
   null in components/kalio/kalio-brand.ts unless I ask for a different name.
   Photos: the photo slots read skins/{{name}}/photos/<slot>.webp and each collection reads
   skins/{{name}}/photos/col-<slug of its title>.webp (names in components/ly/pr-photos.ts
   and docs/wiki/Customize.md); a slot without its file shows its designed fallback. The 14
   photos in the repository were made for {{shop}}: the eight slot photos, and six collection
   photos (cookies, croissants, danish-pastries, mini-cakes, muffins, tarts). Remove the six
   col-*.webp unless my collections have the same names and I want those photos. Ask
   me whether to keep, replace or remove the eight slot photos. Add only photos I give you,
   with the exact names and sizes.
4. Theme: edit only components/ly/ly-theme.settings.ts, as AGENTS.md "Theme" says.
   Set my palette or brandColor (with textOnBrand), and mode. Keep themeSwitcher "showcase"
   unless I asked for my visitors to have the switcher ("on") or none ("off").
5. In manifest.json set "package" to {PACKAGE}, "name" to a display name of at least
   8 characters (my shop's name plus "Patisserie" is fine), "version" to 1.0.0 and a
   one-sentence "description". The description is what Selldone shows for the Layout and
   later uploads do not change it, so get it right before the first upload. Leave
   deploy_server and deploy_path as they are. The package name is permanent after the first
   upload. Update selldone-layout.json (name, package, live address) to match.
6. Install the official CLI (npm i -g selldone-cli) and clone https://github.com/selldone/cli
   for its packager. Ask me to sign in to the CLI myself (I type my 2FA code). Never print or
   store tokens, never type a password or 2FA code for me.
7. Release with:
   PW={PLAYWRIGHT}/node_modules/playwright/index.js SELLDONE_CLI_SRC=<cli clone> \
     bash scripts/release.sh 1.0.0 desk
   Step 5b of release.sh loads the built bundle through a live shop's own HTML
   (SHOP_URL, by default https://{{domain}}) and walks home, a collection, a
   product, the journal, a post, the bag and the checkout; it must print PROD-CHECK OK, or
   nothing is uploaded. Read my new Layout id (printed after this first upload), then verify
   with node --use-system-ca scripts/kalio-verify-deploy.mjs <cli root> <layout id> dist/app:
   extracting false, error null, js_match and css_match true. Every later release:
   LAYOUT_ID=<id> PW=... SELLDONE_CLI_SRC=<cli clone> bash scripts/release.sh <new version> desk.
   Never reuse a version number. The build must stay at 300 files or fewer (release.sh
   refuses more).
8. Pin the exact version (never "latest") on {DOMAIN} only: api.shops.domains.layout.set on
   that domain, mode private, and set that domain's Home to the shop page. Do not touch the
   shop default. Only if I ask for the whole shop: api.shops.layout.set, mode private, and
   make every domain inherit it. Without the MCP connector, tell me the dashboard steps.
9. Open https://{DOMAIN} without a query and confirm window.sdShopLayout names the new
   release. Check it on a phone-sized screen too. If I chose a brand colour, run the contrast
   check from docs/wiki/Theme-and-colours.md; it must print TOTAL 0. Send me screenshots.
10. Commit and push to my repository. Report what you did, what you could not test, and what
   is mine to set (OAuth client, guest checkout, payment methods, delivery ways and their
   windows, the pickup point and its hours, login modes, photos for the photo slots).

Do not change my shop's settings (guest checkout, payments, delivery ways, pickup points,
login modes). Do not place real orders. Run browser checks one at a time.
```

## 3. What the agent does

1. **Checks sign-in:** the shop's OAuth client, before anything else.
2. **Forks and clones** the repository, fetches Selldone's six modules (`npm run setup`, into `modules/`) and applies the two patches in `patches/`.
3. **Installs and configures** `.env` for your shop, then runs the dev server on port {{port}}. In development the Layout reads your shop's public data from Selldone.
4. **Checks your data** against [Shop Requirements](Shop-Requirements): cut-out product photos, units, pros, flat specs, collection descriptions, delivery ways with their days and windows, the pickup note's hours, the shop's address, city, location and open days, a payment method, articles with covers, FAQ and the shop's pages.
5. **Leaves the name to your shop:** the wordmark, the hero's first line, the footer's name, the tab icon and the page titles come from your shop's title (`BRAND.name` stays `null` in `components/kalio/kalio-brand.ts`).
6. **Sorts out the photos** in `skins/{{name}}/photos/`: keeps, replaces or removes {{shop}}'s 14 as you say, and adds yours with the exact names (see [Customize](Customize#photos)).
7. **Sets your theme** in `components/ly/ly-theme.settings.ts` (see [Theme and colours](Theme-and-colours)).
8. **Sets your identity** in `manifest.json`: the package name, a display name, a description and a first version.
9. **Releases** with `scripts/release.sh`: build, SVG flattening, safety checks, the production-bundle check, packaging, upload with the official CLI and a server check. See [Build and Upload](Build-and-Upload).
10. **Goes live** by pinning the exact version on your domain, and setting that domain's Home to the shop page. See [Go Live](Go-Live).
11. **Verifies** the live HTML and takes screenshots.

## 4. Check the result yourself

- Open your domain. You should see a dark top bar with your counter's hours and the way to pay, a white header with your shop's title as a centred serif wordmark and your city under it, then the hero: your shop's name and "Pastry, one by one" beside the counter photo running to the window's edge, a framed photo across the seam and your three most-ordered collections on the photo's dark corner. Then "<shop> in numbers" on a soft tint band. Not Selldone's default home.
- If you picked another palette or a brand colour, the bands, plates, the top bar and the footer take its hue too, not only the buttons.
- Tap **Add to bag** on a card: it becomes "− 1 +" in place, and the bag's count goes up.
- Tap the account, then Sign in: the sign-in sheet opens with your shop's own ways in. It should never end on an error page at Selldone.
- Open the bag from the header, then Checkout: the step pills, your delivery ways as cards, and their time windows.
- A pastry sitting on a white or coloured square inside its plate is a photo with its own ground: use a cut-out (see [Shop Requirements](Shop-Requirements#products)).
- About, Terms, Privacy and FAQ show "Sample text" until you write those pages in Selldone.
- If something is off, see [Troubleshooting](Troubleshooting).

## What the agent must never do

- Type a password or a 2FA code, or print or store a token.
- Change your shop's settings or data without asking (payments, delivery ways, guest checkout, login modes, products).
- Place a real order.
- Hard-code your products, prices, collections, hours or delivery ways into the Layout. A gap in your data is reported to you, not filled in the code.
- Reuse a version number, or pin `latest`.
- Upload a build whose production-bundle check failed.
- Move the shop default when you asked for one domain.

## Tips for working with the agent

- Let it work on its own: the prompt has everything it needs. Answer only the sign-in, photo and attach steps.
- To change the colours later, ask in plain words ("make it dark", "use the rose theme", "my brand colour is #F5C400"). The agent edits one file and releases a new version.
- If you change your mind about a design, ask for **2–3 mockups first**, then pick one.
- Every new upload needs a **new version number**. Ask the agent to bump it each time.
- Selldone limits how many requests one address may send in a minute: ask the agent to run its browser checks one at a time.
