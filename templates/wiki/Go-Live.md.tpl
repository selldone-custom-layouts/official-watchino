# Go Live

An uploaded version changes nothing until it is **attached** to your shop, or to one domain of it. {{Name}} goes live on **one domain first**: you see it on a real address while your other addresses stay as they are. Move the whole shop over only when you are happy.

Before you go live, check that your shop's **OAuth client id** is set up (see [Shop Requirements](Shop-Requirements)). Without it, sign-in on the Layout leaves for Selldone and shows an error.

## 1. Attach the version to one domain (how {{Name}} runs)

A shop can show a different Layout on one of its domains. {{Name}} runs on `{{domain}}` alone: one domain of the shop {{shop}} ({{shop_id}}), pinned to its Layout with an exact version. The shop default (`{{xapi}}.myselldone.com`) and {{shop}}'s other domains carry other Layouts and keep their own pins. {{Name}} was put on its one domain only; it is not the shop default.

**In the dashboard:** shop › **Domains**, open the domain's settings and pick your Layout and the exact version for that domain.

**With the Selldone MCP connector:**

1. Confirm that `selldone_current_connection` returns **your** shop id. The connector picks the shop from its own connection, not from anything you pass.
2. Call `selldone_api_call` → `api.shops.domains.layout.set`, with `confirm: true`:

```json
api.shops.domains.layout.set   path { "domain_key": "<the domain's id>" }
body { "mode": "private", "layout_id": <your Layout id>, "layout_version": "1.0.0" }
```

Your Layout id is the one printed after your first upload. Pin the **exact** version, never `latest`, so an unverified upload never goes live.

Set that domain's own Home to the shop page too: `selldone_shop_home_domain_set` with `domain_address` and `page_id: "shop"`.

While the Layout runs on one domain, **don't** pin the shop default when you release it: that would move every other address too. Pin each new version on that domain only, then check both that domain's and the default address's `window.sdShopLayout` after a release.

## 2. The whole shop (when you are ready)

**In the dashboard:** shop › **Domains** › **Default layout** › **Change layout**. Pick your Layout and the exact version.

**With the MCP connector:** `selldone_api_call` → `api.shops.layout.set`, with `confirm: true` and this body:

```json
{ "mode": "private", "layout_id": <your Layout id>, "layout_version": "1.0.0" }
```

Read `api.shops.layout.options` before and after.

### Make every domain inherit it

A custom domain **keeps its own Layout selection**. It can stay on an old version, or on another Layout, while the shop moves on.

- Set each domain to **inherit**: `api.shops.domains.layout.set` with `{ "mode": "inherit" }`, or the same setting on the domain in the dashboard. This also ends the one-domain setup of step 1.
- Check every address after a release: `name.myselldone.com`, your custom domain, and any sub-domain.

Skip this for a domain that carries its own Layout on purpose, as {{shop}}'s `{{domain}}` does.

Or keep the domain's own pin even when the same Layout is the shop default: the domain then survives if the default is ever switched back. The cost is that every release is pinned twice: on the shop default and on that domain, both with the same exact version.

## 3. Home = Shop page

If `/` shows a Page Builder landing page while `/shop` shows the Layout, the Home is a page. Set it to the shop page:

- in the dashboard, set **Home** to **Shop**;
- or call `selldone_shop_home_default_set` with `page_id: "shop"` (for one domain: `selldone_shop_home_domain_set`).

## 4. Verify

Open the address **without a query** (a query shows the catalogue instead of the home). Then:

- the page source's `window.sdShopLayout` → `"saved"` block names your package and the new version;
- the header shows the dark top bar and, under it, the white header with your shop's title as the centred serif wordmark and your city under it; the home starts with the hero (your shop's name and "Pastry, one by one" beside the counter photo running to the window's edge), then "<shop> in numbers" on a soft tint band;
- no blank page and no flash of an old design;
- Sign in opens the sign-in sheet with your shop's own ways in;
- the bag drawer opens from the header, and the checkout lists your delivery ways and their windows;
- check on a phone-sized screen too, and once in dark mode if your theme or your visitors use it.

A headless browser that opens a `/product/` link directly gets Selldone's SEO page, not the Layout. Open the home first and move with the Layout's own links, or test in a normal browser. (The release's production-bundle check does exactly that: see [Build and Upload](Build-and-Upload).)

## 5. Your own loading screen

While Selldone loads the storefront it shows a loading screen. {{Name}} comes with its own, in the same classic look, so the first thing a visitor sees already belongs to the shop: a white ground, a fine ring in the action colour that turns, the skin's line art drawing itself inside it, and your brand under it: your logo, or your shop's name and its sub line set exactly as the header draws them ({{display_font}} over a line of {{text_font}} capitals), so the loader hands over to the header without a jump. Only the ring and the line art move; the brand never does, so any logo or name works. There is no made-up percentage; with reduced motion it is a still frame; it fades out when Selldone posts `selldone-app-loaded`.

![{{Name}}'s loading screen](https://raw.githubusercontent.com/{{org}}/{{repo}}/main/docs/screenshots/loading.png)

1. Copy `scripts/loading/config.json` and set your brand in it:
   - `name` and `sub`: the name as the header shows it (your shop's title, capitalised) and the line under it ({{Name}} shows the city). A long name wraps to two lines and shrinks; a right-to-left name (Arabic, Persian, Hebrew) is set right to left.
   - `logo` (optional): an **https** URL of your logo, any shape; it is fitted inside a fixed box. Without it the name is drawn as text.
   - `art`: the line art in the ring: `croissant` ({{Name}}'s), `cupcake`, `tart`, `whisk`, or leave it out for an empty ring.
   - the colours (`bg`, `ink`, `muted`, `accent` for the ring, `line`) and the two Google Fonts (`serif`, `sans` and their CSS stacks).
2. Write it:
   ```sh
   node scripts/loading/make-loading.cjs scripts/loading/configs/<yours>.json <out folder>
   ```
   It writes `loading.json` (`head` and `body`, with their sizes) and `loading-preview.html`, a full-page preview of the same code. Open the preview in a browser to see it. To prove another brand cannot break it, `node scripts/loading/test-loading.cjs scripts/loading/configs/<yours>.json <out folder>` renders it with your name, a very long name, an Arabic name, a wide logo and a tall logo at 1440 and 390, still and moving, and fails if the brand overflows, touches the ring or a logo is cut (it needs Playwright and sharp; `PW` and `SHARP` may point at them).
3. In Selldone, open the domain's **custom loading** (each domain has its own; a domain without one shows Selldone's default), choose the mode **custom**, and paste `head` and `body` from `loading.json`. Selldone accepts a head of at most **15,360 bytes** and a body of at most **3,072 bytes**, and no data URIs; the script stops with an error if either rule is broken ({{Name}}'s is about 2.5 KB and 0.8 KB).
4. Reload the domain: the loading screen shows first, then the shop.

The loading screen is set per domain in Selldone, not in the Layout's build, so changing it never needs a new version.

## Custom domain on Cloudflare (example: `name.selldone.shop`)

1. Create an **A** record to `34.117.142.64`, **DNS only** (proxy off).
2. Create the **TXT** record Selldone gives you (`<sub>-challenge.<zone>`).
3. Add the domain with `selldone_domain_add`, `ssl_proxy: true`, or in the dashboard. HTTPS is issued within seconds.

Plain HTTP serves the shop too. The first custom domain becomes primary. Then either give the domain its own Layout (step 1) or make it **inherit** the shop's (step 2).
