# Customize

{{Name}}'s design lives in its own components and style sheets. Selldone's commerce logic underneath (basket, bill, checkout, variants, orders, payment) stays untouched. After any change in the code, or a new photo in `skins/{{name}}/photos/`: build and upload a new version ([Build and Upload](Build-and-Upload)) and put it live ([Go Live](Go-Live)). A change in your shop's data (a title, a product photo, a delivery window, an article) needs no release: it shows on the next visit.

## The name and the wordmark

The wordmark is your **shop's title**, read live. `components/ly/LyLogo.vue` draws it in {{display_font}} with its first letter in capitals, and your shop's **city** (from its address, else the pickup point's) in small spaced capitals under it; a long title steps the size down so it never leaves the header. The hero's first line, the footer's name, the copyright, the page titles and the messages use the same title. Rename the shop in Selldone and the Layout follows.

`components/kalio/kalio-brand.ts`: `BRAND.name = null` keeps the shop's title. A string there replaces it everywhere the storefront names the shop.

The mark (the browser tab's icon and the shop's avatar on order messages) is drawn from the title's first letter: `markFor()` in the same file for the tab (a cream capital in {{display_font}} on a dark circle), and `components/ly/ui/LyMark.vue` (the letter on the family's dark) for the messages; the account draws the shopper's own letter the same way. It is inline, so there is no image file to replace; change those two to change it.

## The colours, dark or light

One file: `components/ly/ly-theme.settings.ts`. See [Theme and colours](Theme-and-colours). Do not edit the palettes in `components/ly/ly-theme.ts`, the family maths in `components/ly/ly-family.ts` or the tokens in `style/ly-skin.gen.scss` for a merchant's theme.

## Type, tokens and words

| What | Where |
| --- | --- |
| Fonts ({{display_font}} for headings, the wordmark and numbers set large; {{text_font}} for text, buttons and the nav; Material Symbols Rounded only for Selldone's own parts and the shared pieces; an Arabic face only when Arabic is picked) | `components/kalio/kalio-fonts.ts` |
| Icons (inline line icons, one stroke width) and the mockup's pastry drawings (croissant, macaron, cupcake, cake, tart, cookie, whisk) | `components/ly/pr-icons.ts`, drawn by `LyIcon.vue` and `LyArt.vue` |
| Type and shape tokens, and the brand palette's colours for the first paint (light in `:root`, dark in `html.ly-dark`), all generated from the skin | `style/ly-skin.gen.scss`, every name `--ly-…` |
| Every colour after the first paint: the grounds, plates, lines, words, the dark top bar and footer of the palette on the page | `components/ly/ly-family.ts`, written inline on `<html>` |
| "Bag" instead of basket in Selldone's own English strings | `components/kalio/kalio-brand.ts` (`bagWords()`) |
| {{Name}}'s own words (every one through `t("{{name}}.…", "English")`) | the components; the English in `components/kalio/i18n/ly.en.ts`, Arabic in `ly.ar.ts` (see [Languages](#languages)) |

## Photos

| Picture | Where it comes from |
| --- | --- |
| Pastries on every card, the quick view, the product page, the bag and Today's selection | each product's main photo, a transparent cut-out (PNG or WebP); more photos make the gallery |
| Collections in Shop ⌄ | the collection's best seller's cut-out; the feature card shows the photo of the most-ordered collection that has one |
| Collection photos: the home's photo rows and gallery, the collection page's title band, the strip under a collection, About | `skins/{{name}}/photos/col-<slug of its title>.webp` when the Layout has it, else its best sellers on a plate |
| The photo slots: the hero (two), About, How ordering works, the offer card, the photo band, the journal, the footer's texture | `skins/{{name}}/photos/<slot>.webp` when the Layout has it, else the slot's designed fallback (`components/ly/LyPhoto.vue`, `LyCuts.vue`) |
| The journal and each post | each article's cover image |
| Contact | a static map of the shop's location (Selldone's map service: the dark style in dark mode, the street style in light) with the shop's pin |

Product pictures are changed in the Selldone dashboard, not in the code. The cut-outs matter: the Layout sets every pastry on a tinted plate, and a photo with its own ground shows as a square. See [Shop Requirements](Shop-Requirements#products).

The repository's 14 photos (the eight slots and six collection photos) were made for {{shop}}. Photos generated with Magnific (Freepik) for {{shop}} under the owner's Premium plan.

### The photo slots

| Slot | File in `skins/{{name}}/photos/` | Size | Without the file |
| --- | --- | --- | --- |
| The hero's counter photo (it runs to the window's edge; the three most-ordered collections sit on its dark corner) | `hero-back.webp` | 2000 × 1250 | the best sellers of the three most-ordered collections as cut-outs, or the deep family surface with the cake drawing |
| The hero's framed photo across the seam | `hero-inset.webp` | 900 × 1100 | the most-ordered collection's second best seller as a cut-out |
| About (the home and the top of the About page) | `about.webp` | 1200 × 800 | up to five pieces, one per collection, spread across the surface |
| How ordering works | `how.webp` | 1200 × 1500 | the family tint with the tart drawing |
| The offer card (deep; its words at the foot) | `offer.webp` | 900 × 1350 | the piece with the biggest saving, as a cut-out |
| The photo band (deep) | `parallax.webp` | 2400 × 1100 | the best seller of each collection in a row (up to five) |
| The journal ("Journal" over it) | `journal.webp` | 1200 × 1400 | the family tint with the whisk drawing |
| The footer's texture | `footer.webp` | 2400 × 900 | the plain family dark |
| Each collection's photo | `col-<slug>.webp` | 1400 × 1050 | its best sellers on a plate |

`<slug>` is made from the collection's title: lower case, `&` as "and", every other run of signs a hyphen ("Danish Pastries" → `danish-pastries`). The collection's address name in Selldone is tried too. The repository ships {{shop}}'s six (`col-cookies`, `col-croissants`, `col-danish-pastries`, `col-mini-cakes`, `col-muffins`, `col-tarts`); a collection whose title and address name match none of them shows its plate. To add a photo:

1. Make it at the exact size, as WebP, with the exact name. No words, logos, price tags or people on it, and no pastry cut by the edge. Where the Layout's words sit over the photo (the hero's dark corner, the offer card's foot, the journal's word), leave that part calm and plain.
2. Put it in `skins/{{name}}/photos/`. `components/ly/pr-photos.ts` lists the files that exist at build time, so nothing else changes.
3. Build and release a new version, and check that the file count stays at 300 or fewer.

To drop a photo, delete its file and release: the slot shows its fallback. A slot never shows a caption, a file name or a size, with or without its file.

## Sections and pages

| What | Where |
| --- | --- |
| Header (the top bar with the language and currency pill; the white bar with Shop ⌄, Deals, Journal, About, Contact, the wordmark, search with live suggestions, the account, the bag button and Order now; the phone menu and the language sheet) | `components/ly/shell/LyHeader.vue` |
| Bag drawer (the lines, the receipt, Checkout and View bag, Often added) | `components/ly/shell/LyBagDrawer.vue` |
| Footer (the shop's name and its line, Visit, Shop, Contact; the Theme row; the legal row) | `components/ly/shell/LyFooter.vue` |
| Wordmark | `components/ly/LyLogo.vue` |
| Home (hero, the shop in numbers with About, the collections people order most, How ordering works, the courier's numbers with the offer card and the ways, gallery, Today's selection, photo band, marquee, journal) | `components/ly/home/ (LyHome.vue and sections/)`, inside `pages/products/StorefrontPageProducts.vue` |
| Photo slots and drawings | `components/ly/LyPhoto.vue`, `LyCuts.vue`, `LyArt.vue`, `pr-photos.ts` |
| Shared data and layers (the collections and catalogue read once, the shop's facts, one layer open at a time) | `components/ly/pr.ts` |
| Words in circles (the `−%` roundel, the deals panel's "Save") fitted again when the window changes size | `components/ly/pr-fit.ts` |
| Shared pieces (the title band, card, add box, quick view, modal, empty state, sample label, numerals, icon lines, the shop's mark) | `components/ly/ui/` (`LyPt.vue`, `LyCard.vue`, `LyQuickView.vue`, `LyModal.vue`, `LyEmpty.vue`, `LySampleTag.vue`, `LyNumeral.vue`, `LyIcLine.vue`, `LyMark.vue`), `components/ly/LyAdd.vue` |
| Listings (a collection, search, deals, every pastry; the title band, the chips, the filter panel, sort, the grid, the strip under a collection) | `components/ly/shop/LyListing.vue`, `LyStrip.vue`, inside `pages/products/StorefrontPageProducts.vue` |
| Product page (gallery, buy column, options, add box, the delivery lines, the tabs, Buy together, More <collection>, phone buy bar) | `pages/product/StorefrontPageProduct.vue`, `components/ly/product/` (`LyProductOverview.vue`, `LyPdAdd.vue`, `LyProductTabs.vue`, `LyTogether.vue`, `pd.ts`) |
| Compare | `components/ly/compare/LyCompare.vue`, `pages/comparison/` |
| Bag page and checkout (the lines, How it reaches you, the receipt, step pills, Contact, Delivery and its windows, address or pickup counter, Billing, note) | `pages/basket/cart/StorefrontPageBasketCart.vue` (Selldone's script, {{Name}}'s markup), `components/ly/buy/pr-cart.ts`, `LyLineQb.vue` |
| Delivery ways and the delivery sheet | `pages/basket/cart/SCartShippingOptions.vue`, `components/ly/buy/LyShipSheet.vue` |
| Address sheet and payment window | `components/kalio/checkout/KalioAddressSheet.vue` and Selldone's window, dressed by `style/ly-sd.scss` |
| Order page (title band, progress, pastries, payment, receiver, chat) | `pages/basket/order/` (and `physical/dashbaord/`), `components/ly/order/` (`LyOrderPay.vue`, `LyOrderReceiver.vue`, `LyOrderChat.vue`, `od.ts`) |
| Account (Overview, Orders, Addresses, Profile) | `components/kalio/account/` (`KalioAccountShell.vue`, `KalioAccountHome.vue`, `KalioOrdersBoard.vue`, `kalio-account.ts`), `pages/user/` |
| Sign-in sheet | `components/kalio/shell/KalioSignIn.vue` |
| Journal and post | `pages/blog/list/StorefrontPageBlogsList.vue`, `pages/blog/view/StorefrontPageBlogsView.vue`, `components/ly/read/LyPost.vue` |
| About, Terms, Privacy, Contact, FAQ (with the sample text and its label) | `pages/official/`, `pages/faq/StorefrontPageFaq.vue`, `components/ly/read/` (`LyLegal.vue`, `LyMap.vue`, `rd.ts`) |
| 404 | `pages/errors/404/StorefrontPageError404.vue` |

Every page's markup is {{Name}}'s own; the scripts underneath are Selldone's and the Kalio base's (bag, checkout, order, account, sign-in, compare). A shop with its own custom header or footer code in Selldone keeps Selldone's header or footer (`layouts/StorefrontLayout.vue`).

## Styles

| File | Holds |
| --- | --- |
| `style/ly-skin.gen.scss` | {{Name}}'s tokens (`--ly-…`): type, the shape scale (`--ly-r-pn` {{panel}} px for panels, `--ly-r-in` {{inner}} px for inner parts, 50 % for round things), and the brand palette's colours of both modes for the first paint (`:root` light, `html.ly-dark` dark). |
| `components/ly/ly-family.ts` | not a style sheet, but it writes every colour of the palette on the page inline on `<html>` after the first paint; the theme switcher writes only the action colour (`--ly-act`, `-deep`, `-on`, `-text`) and Vuetify's primary on top. |
| `style/ly/base.css`, `pages.css`, `look.css`; `style/ly/variants.css` | the base's look (the first Layout's mockup stylesheets, now the base's own source): every rule scoped to the Layout's own markup (`:is(.ly, .ly *)`), custom properties `--ly-…`, dark mode `html.ly-dark`, keyframes `ly-*`; the section variants in `variants.css`. Change them in the base (`layout-base`) so every Layout gets the fix; a Layout's own touch goes in `style/ly-layout.scss`. |
| `style/ly-layout.scss` | the Layout's own touches, loaded last: the shell and pages, Selldone's and Vuetify's parts inside {{Name}}'s pages mapped onto the same shape scale, and the places where the Vue markup differs from the mockup's. Change the look here. |
| `style/ly-sd.scss` | the parts {{Name}} borrows, in its dress: Kalio's address sheet (map on or off), Selldone's payment window, the scrim under the sheets |
| `style/storefront.scss` and the shared `kalio-*.scss` / `bakini-*.scss` it loads | the Kalio base's skin for Selldone's own components; their `--bk-act*` colours follow the palette, so Vuetify's primary follows it too |

All of them are loaded from `StorefrontApp.vue`: `storefront.scss` first, then `{{name}}-theme.scss`, the generated files, `{{name}}-sd.scss`, and `{{name}}-layout.scss` last. Every {{Name}} component wraps its markup in an element with the class `pr`, so these rules never touch Selldone's or Vuetify's parts outside it.

## Languages

Every word {{Name}} writes goes through `t("key", "English")` (`components/kalio/i18n/kalio-i18n.ts`). The English is the second argument at the call site; the dictionaries are files beside it:

| File | Holds |
| --- | --- |
| `components/kalio/i18n/base/<code>.ts` | the shared Kalio words (bag, checkout, account, compare, theme…), the same in every Kalio-family Layout |
| `components/kalio/i18n/{{name}}.<code>.ts` | {{Name}}'s own words: `ly.*` |
| `components/kalio/i18n/bakini.<code>.ts` | the `bakini.*` words the shared Kalio and Bakini code still uses |
| `components/kalio/i18n/lang-<code>.ts` | merges the three; loaded only when a visitor picks that language |
| `components/kalio/i18n/index.ts` | `EN` (English, bundled) and `LOADERS`, the list of other languages {{Name}} knows |

{{Name}} ships English and Arabic (`ar`, right to left: the whole page mirrors). The visitor picks one from the language and currency pill in the top bar (the phone menu's "Language & currency" row); the list is the shop's own languages (Selldone dashboard › Shop › Languages).

On the dev server only, `localStorage["{{name}}-dev-languages"] = "ar"` offers Arabic in your own browser even when the shop sells in English only, so you can see the Arabic pages before you switch the language on in the shop. The production build ignores it.

To change a word: edit the English at the call site, and the same key's value in `ly.en.ts` and in each `{{name}}.<code>.ts` (a `bakini.*` word lives in `bakini.en.ts` and `bakini.<code>.ts`; a shared Kalio word, one without a prefix such as `theme.title`, in `base/en.ts` and `base/<code>.ts`).

To add a language your shop offers:

1. Copy `ly.en.ts` to `{{name}}.<code>.ts` and `bakini.en.ts` to `bakini.<code>.ts`, and translate every value (keep `{n}`, `{shop}` and the other `{…}` words; plural keys end in `.one` / `.other`, and a language with more forms adds `.zero`, `.two`, `.few`, `.many`).
2. Translate `base/en.ts` into `base/<code>.ts` the same way.
3. Copy `lang-ar.ts` to `lang-<code>.ts` and change its three imports.
4. Add one line to `LOADERS` in `index.ts`, next to `ar: () => import("./lang-ar")`.
5. Build and check every page in that language. A word still in English is a string that is not wrapped in `t()` yet: wrap it with a new `{{name}}.…` key.

The words the shop writes (product names, collections, units, pros, spec, articles) are the shop's data: translate them in the Selldone dashboard.

Right to left, {{Name}} keeps these rules:

- logical CSS everywhere (`margin-inline`, `inset-inline`, `padding-inline`, `text-align: start`, logical corner radii), so the page mirrors: the hero's photo runs to the left edge with the words on the right, and the photo bands and title bands flip; the theme row's arrow keys follow the direction;
- only the parts that slide with `translateX` (the drawer, the menu, the filter panel, centred toasts) keep physical directions;
- the shop's own words (names, collections, addresses) sit in `<bdi>`, so each keeps its own direction inside a translated sentence; phone numbers and the `−%` stay left to right;
- the words in the `−%` roundel and the deals panel's "Save" are fitted to their circle in every language and currency;
- an Arabic face (Noto Sans Arabic) is loaded only when Arabic is picked.

## Rules the design keeps

- **One colour family.** Every colour on the page comes from the palette's hue, plus white and the family's near-black: the page and its soft tint bands, the plates, the lines, the words, the dark top bar and footer, the chips and the map pin. A palette or a custom colour re-tints the whole page, never just the buttons. Two tint bands never sit side by side. Every colour is a token.
- **One action colour.** {{brand_name}} (or your palette) for every button, chosen state and link.
- **One shape language.** A circle for round things, 8 px for panels and photos, 4 px for inner parts; square only where a band meets the window's edge; never sharp and round on neighbouring parts. Selldone's own sheets, windows and chips are mapped onto the same scale.
- **Flat.** Buttons without shadows; hover changes the colour only; no line under any word or icon. The one exception: links inside a post's own text are underlined, so a reader can see them.
- **Rings inside the box.** Every selection ring and card edge is an inset shadow, never an outline; a focus ring keeps the control's shape, and a field has one inset ring.
- **Cut-outs on plates.** Product photos are transparent cut-outs on tinted plates, so there is no white square in either mode.
- **Words in their circles, corners off words.** The `−%` roundel and the quick-view eye sit in the plate's top corners, where there are no words; the roundel's words always fit inside it.
- **Photos carry no words.** The photo files have no text; where the Layout's own words sit over a photo, they sit on a calm part of it, elsewhere beside or under the photo.
- **A click opens, a second click closes.** Shop ⌄, the search, the menus and the sheets open on a click and close on a second click, Esc, a click outside or a page change; one layer at a time.
- **Moving parts can stop.** The marquee holds on hover and keyboard focus and stands still for reduced motion; the listing's results fade without motion when the visitor asks for less.
- **Bag, not cart.** In the Layout's words and in Selldone's own English strings.
- **Honest words.** No invented history, awards, names, counts or reviews; no product count in the shop's words; sample pages say they are samples; "every piece" only when every piece has the same saving; delivery lines and windows only from the shop's own delivery ways; counter hours only from the pickup note or the shop's hours; deal clocks only to a deal's real end date; no stars without reviews; no options without real variants; "not taking payment" when there is no payment method; no fact drawn before the shop's details have loaded.
- **Live data.** Nothing names a product, price, collection, delivery way or opening hour; another bakery gets its own.
