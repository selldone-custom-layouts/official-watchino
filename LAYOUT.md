# Watchino Fine Watches — release notes

**Watchino Fine Watches** (package `watchino-fine-watches`) is a Layout of the Selldone shop **Watchino** (xapi `watchino`), built for **watchino.myselldone.com**. It is a skin of the Layout base (see [`BASE.md`](BASE.md)): everything that makes it this Layout is `skins/watchino/skin.json` and `skins/watchino/photos/`; the code, the flows and the checks are the base's.

## Setup

| Area | What is set |
| --- | --- |
| Repo | `watchino-layout`, branch `main`; remote `upstream` (selldone/storefront, fetch only, push disabled); `origin` = `selldone-custom-layouts/official-watchino` once published (`scripts/publish-github.sh`) |
| Names | `manifest.json` and `selldone-layout.json` from the skin (`package` is permanent after the first upload; the `description` must be right on the FIRST upload, Selldone keeps it) |
| Dev server | port **9175**, shop `watchino` (`.env`); `npm run serve` (launch entry `watchino-layout`) |
| Skin | Blued steel, Racing green, Burgundy, Bronze (brand `blued-steel`), Bodoni Moda over Archivo, radius 4 / 2 px, basket word "bag" |
| Layout id | (after the first upload) |

## Home

1. **hero** (split): The shop's name and line on the left; the counter photo bleeding to the right edge of the frame, a framed inset across the seam with the best seller, the three most-ordered collections set large on the photo's dark corner (from Pralino).
2. **about** (numbers, tint band): The shop in numbers (collections, the saving, days and hours, ways to receive an order) beside its story, photo and Delivery / Pickup / Payment links (from Pralino).
3. **collections** (rows): The four collections people order most as alternating photo rows: an outlined numeral, the description, three best sellers with prices, 'Shop <collection>' (from Pralino).
4. **journal** (photo, tint band): The four newest posts beside a tall photo with the big word 'Journal' (from Pralino; best last).

## Photos

| Slot | File | Size | In the build |
| --- | --- | --- | --- |
| hero | `skins/watchino/photos/hero.webp` | 1672 × 941 | yes |
| hero-phone | `skins/watchino/photos/hero-phone.webp` | 900 × 900 | yes |
| story | `skins/watchino/photos/story.webp` | 1600 × 900 | yes |
| boutique | `skins/watchino/photos/boutique.webp` | 1600 × 900 | yes |
| travel | `skins/watchino/photos/travel.webp` | 1600 × 900 | yes |
| gift | `skins/watchino/photos/gift.webp` | 1600 × 900 | yes |
| empty | `skins/watchino/photos/empty.webp` | 1200 × 900 | yes |
| each collection | `skins/watchino/photos/col-<slug of its title>.webp` | 900 × 1200 | 0 file(s); a collection without one shows its best sellers on a plate |

## Checks

<!-- CHECKS:START -->
(none yet)
<!-- CHECKS:END -->

## Releases

| Version | Date | Layout | Deploy | What |
| --- | --- | --- | --- | --- |
| 1.0.0 | 2026-11-22 | 50 | 787 | First release: the static Watchino site's look on the base (dial ground, index rail, minute markers, header with the collections mega menu, the home, badge-free cards, footer, product details column); en, de, es, fr and ar. 279 files; PROD-CHECK OK through rino.selldone.shop (same shop 8460); server extracting:false, error:null, js/css match. Not pinned yet. |
