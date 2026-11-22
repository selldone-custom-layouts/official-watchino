# {{title}}

![{{title}} on desktop and phone](https://raw.githubusercontent.com/{{org}}/{{repo}}/main/docs/screenshots/cover.jpg)

**{{title}}** is a custom storefront **Layout** for Selldone shops: a single pâtisserie dressed as a classic, editorial bakery website. A white page with soft tint bands, near-black ink and one {{brand_name}} accent, {{display_font}} over {{text_font}}, and big photography in every section. A dark top bar with the counter's hours and contact, a white header with the shop's name as a centred serif wordmark (the city under it), a hero where the counter photo runs to the window's edge with a framed photo across the seam, the shop in numbers beside its story, the best-selling collections as photo rows, how ordering works, an offer card beside the ways to receive an order, a gallery of the collections, today's selection as numbered rows with **Add to bag**, a full-width photo band, a marquee of the collections and the journal; collection pages with a filter panel; a product page with a buy column that stays in view, tabs and Buy together; a bag drawer, the checkout with a delivery sheet, the order page, an account and a 404 inside the Layout. Everything is drawn in **one colour family** (every ground, plate, line and word, the dark top bar and the footer follow the palette's hue) and **one shape language** (a circle for round things, 8 px panels, 4 px inner parts). Light is the default, with a dark mode in the same family. It says **bag**, never cart. Every word it writes is in English and Arabic (right to left).

It runs on **[{{domain}}](https://{{domain}})**, one domain of the Selldone shop {{shop}}. The shop's default address and its other domains carry other Layouts; {{Name}} is pinned on its own domain only (see [Go Live](Go-Live)). It is built on the official [selldone/storefront](https://github.com/selldone/storefront), so Selldone's basket, checkout, payments and orders keep working underneath a new design.

## Start here

| I want to… | Page |
| --- | --- |
| Have an AI agent set it up on my shop | **[Install with AI](Install-with-AI)** |
| Set it up myself | [Manual Setup](Manual-Setup) |
| Know what my shop's data needs | [Shop Requirements](Shop-Requirements) |
| Build, upload and verify a release | [Build and Upload](Build-and-Upload) |
| Put it live on my shop or one domain | [Go Live](Go-Live) |
| Change the name, sections, pages, photos, languages | [Customize](Customize) |
| Change the colours, dark or light, the visitor switcher | [Theme and colours](Theme-and-colours) |
| Fix a problem | [Troubleshooting](Troubleshooting) |

## How a Selldone Layout works (one minute)

1. A **Layout** is a complete storefront app (Vue 3) that runs on Selldone's own servers instead of the default storefront.
2. You build it, zip it, and **upload** it to your Selldone developer account with the official [selldone-cli](https://github.com/selldone/cli). Each upload is a new **version**.
3. You **attach** a version to your shop, or to one domain of it.
4. Selldone injects **your** shop into the Layout: its title, collections, products, prices, delivery ways, payment methods, articles, languages, currencies and settings. Nothing about {{shop}} is hard-coded: not the name (the wordmark is your shop's title), not a price, a delivery window or an opening hour. The only shop-specific files are the photos in `skins/{{name}}/photos/`; without them every photo slot shows a designed fallback made of drawings and your own products. Another bakery that imports the Layout gets its own data.

## The look

| Part | {{Name}} |
| --- | --- |
| Grounds | {{look_grounds}} |
| Action colour | {{look_action}} |
| Pastries | transparent cut-outs on a tinted plate, with a round near-black `−%` roundel when there is a saving |
| Type and icons | {{display_font}} for headings, the wordmark and numbers set large; {{text_font}} for reading, and in spaced capitals for eyebrows, buttons, the nav and the top bar; inline line icons; the mockup's line drawings of pastries (croissant, macaron, cupcake, cake, tart, cookie, whisk), faint in the title bands and in the photo slots' fallbacks |
| Shapes | one shape language: a circle for round things (the `−%` roundel, icon buttons, the mark, the map pin), {{panel}} px for panels and photos, {{inner}} px for inner parts (buttons, chips, fields, plates, thumbnails); square only where a band meets the window's edge; outlined serif numerals on the collection rows |
| Buttons | flat; hover changes the colour only; no line under any word or icon (the one exception is a link inside a post's own text); selection rings inside the box |
| Photos | eight photo slots (the hero's two, About, How ordering works, the offer card, the photo band, the journal, the footer's texture) and one photo per collection: your own photo when the Layout has one, else a designed fallback (the family tint with a drawing, or your own pastries as cut-outs); never a caption or a file name |
| Theme | {{mode}} by default; the other mode in the same family ({{look_dark_short}}); five palettes ({{palettes}}) and a custom colour, each re-tinting the whole page; a visitor switcher (a footer row) on the showcase shop only (see [Theme and colours](Theme-and-colours)) |
| Languages | English and Arabic (right to left); the language and currency pill in the top bar |

## What you get

- **Header:** a dark top bar that scrolls away: the counter's days and hours, the way to pay and "Pickup at <street>" on the left; the language and currency pill (`EN · USD`), the phone and the email on the right. Its facts appear only once the shop's details have loaded, so no line is drawn half-made and then rewritten. Under it a white bar that sticks: **Shop ⌄** (every collection with its best seller's photo and "From $x", a feature card with the photo of the most-ordered collection that has one in the Layout, then the deals line, such as "25% off every piece"), Deals, Journal, About and Contact on the left; the wordmark (your shop's title with a capital first letter, in {{display_font}}, with your city in small spaced capitals under it) in the centre; search (live suggestions from the catalogue, a "Popular" row of the words most products share, Enter opens every result), the account, the bag with its count and **Order now** (today's selection on the home) on the right. Shop ⌄ opens on a click; a second click, Esc or a click outside closes it. On a phone (979px and narrower): the menu button, the wordmark, search and the bag; the menu is a panel from the left with the collections (past eight, the first six and "Show N more"), the pages, the account, a "Language & currency" row that opens a bottom sheet, and the counter's lines. There is no bottom tab bar.
- **Footer:** the family's dark band over a linen texture (the `footer` photo when the Layout has it), in four columns: your shop's name set large with one line on how orders reach the buyer (from your delivery ways, such as "Come to the counter, or let the courier come to you."); Visit (the counter's address, days and hours); Shop (your collections); Contact (the email, the phone set large, the Journal, About and Contact pages). Then the Theme row (showcase only) and the legal row (Privacy, Terms, FAQ, Selldone's cookie settings, your social links, the copyright and city, a small "made with" credit).
- **Home,** in this order (a section without its data folds away or shrinks to what the shop has):
  1. **Hero:** your shop's name and "Pastry, one by one"; "What we bake", "Every pastry, sold on its own" and one line from your facts (the collections, the counter's street, the saving, how orders arrive), **Shop the collections**; beside it the `hero-back` counter photo running to the window's edge, the framed `hero-inset` photo across the seam with your best seller and its price under "Most ordered", and your three most-ordered collections set large on the photo's dark corner (under the photo on a phone);
  2. **<shop> in numbers** on a tint band: the collections, the saving, the counter's days and hours, the ways to receive an order (four, two or one; never a count of products), beside **Discover more about <shop>**: the `about` photo and two lines written from your shop's facts (address, collections, ways, payment), with links to Delivery, Pickup and Payment;
  3. **The collections people order most:** four (or two, or one) photo rows, each with an outlined numeral, the collection's photo, its description, three best sellers with their prices and **Shop <collection>**;
  4. **How ordering works** on a tint band: the `how` photo running to the edge; Piece by piece, Pick a window (the courier's windows), the way to pay (its name and its own description), Or pick it up / Or have it shipped; the courier's card (its radius, days, fee and how it is paid);
  5. the courier's numbers (windows, radius, free shipping from), the **offer card** (`offer`: "25% off every piece" or "Up to X% off", "Every pastry on the counter, from $x", **See the deals**; without a saving, "Sold one by one" and **Shop every pastry**) and **<n> ways to receive it** with each way's note and fee;
  6. a **gallery** of the collections around the most-ordered one, with pastry plates where a collection is missing;
  7. **Today's selection** on a tint band: six best sellers in stock, mixed across collections, as numbered rows with one **Add to bag** style;
  8. the **photo band** (`parallax`), full width;
  9. a **marquee** of the collections (it holds on hover and keyboard focus, and stands still for reduced motion);
  10. **the journal** on a tint band: the four newest posts beside the `journal` photo ("Journal" set over it), and All journal posts.
- **Photo slots:** each shows your photo from `skins/{{name}}/photos/` when the Layout has one, else its designed fallback (see [Customize](Customize#photos)).
- **Collection page:** the title band with the collection's photo (or its best sellers as cut-outs), its name, its line and the saving; every collection as a chip, this one marked; the filter panel beside the grid; a bar with the active filters as chips and **Sort**; the grid of cards (a short result keeps the card width and centres the row); then a strip of three panels: the courier (its radius, days and windows), the collection's photo, and pickup at the counter.
- **Search, Deals and every pastry** share the grid: search has "Results for “q”" with its box, the collections it found as tabs, posts from the journal, and a calm card with suggestions when nothing matches; Deals opens with the biggest saving today on a family-dark panel with its round "Save" and sorts by Biggest saving first.
- **Filters:** a side panel (a side sheet below 1200px): the price with two thumbs and short boxes, On offer, then every spec group of the products on the page, the groups with several values first; long values show four at a time with "Show N more". Sort: Featured, Best sellers, Customer review, Price low to high, Price high to low, Newest. A change dims the cards in place with "Updating results…", then the new ones fade up (no motion when the visitor asks for less).
- **Cards:** the cut-out on its tinted plate with a `−%` roundel and a quick-view eye in the plate's top corners (no words there), the collection, the name, "Per <unit>" (and "only n left" at five or fewer), the price with the struck was-price, the saving, then **Add to bag**, which turns into "− n +" in place.
- **Product page:** the slim title band with the breadcrumb; the gallery (the pastry on its plate with the `−%` roundel, a row of thumbnails) beside a buy column that stays in view: the collection, the name, "Per <unit> · No reviews yet" (the count once there are reviews; never stars without them), the price with the was-price and "Save $x · n%", a deal clock only when the deal has a real end date, the stock, options only when the product really has variants (tiles with their own photo), **Add to bag** (then "− n +") beside Compare, and your delivery, pickup and payment lines. Then the tabs: **Description** (a lead from the product's spec, its own article if it has one, and "Why you'll love it": its pros), **Additional information** (the spec in your groups, the SKU) and **Reviews** (an honest card with your rating criteria, each "No score yet", until the first review); **Buy together** (this pastry and the best sellers of two other collections, ticks, the live total and "Add all three to bag"); **More <collection>**; a buy bar on a phone once the Add box has scrolled away.
- **Compare and quick view:** the picks side by side, "Only differences" and "Copy link", rows that differ marked; a quick view sheet from each card's eye.
- **Bag and checkout:** a bag drawer ("Your bag", the lines with "− n +", the receipt, Checkout and View bag, "Often added"); the bag page ("How it reaches you" with your ways as cards, "Compare the options" opens the delivery sheet, the receipt); the checkout: step pills in the title band, numbered cards (Contact, Delivery with its windows, the address or the pickup counter, Billing, a note), the receipt with "Place order · pay $x on delivery", and what is still missing named above the cards. The delivery sheet lists every way with its days, fee line and own windows; the address sheet works with or without a map; then Selldone's payment window. Without a payment method it says plainly that the shop is not taking payment.
- **Orders and account:** the order page ("Order <code>", where it stands, the progress Placed · Baking · On the way · Delivered, or Ready to collect · Collected for pickup, the pastries, how it is paid, who receives it, the invoice, and a chat with the shop); the account (Overview, Orders, Addresses, Profile in a side menu, Selldone's other sections in a quieter list under them); a sign-in sheet with your shop's own ways in and "Continue as guest" when guests may buy.
- **Content pages:** the journal (the newest post as a featured card, then every post with a search), each post (one reading column, a panel with the pastries it links to and "Add all", Share, the comments, More from the journal), About, Terms, Privacy, FAQ, Contact (the counter on your real map and a message form) and a 404 inside the Layout ("This page is not on the counter", a search and six pastries to try).

{{Name}} is a skin of the Layout base (`layout-base`: Pralino 1.0.7 made neutral, itself from Domino and Bakini Noir) and keeps that buy flow underneath (Selldone's and the Kalio base's scripts for the bag, checkout, order, account, sign-in and compare); its colours, type, shapes, wordmark, home sections and photos are its skin's (`skins/{{name}}/skin.json`).

## Screens

| Desktop | Phone |
| --- | --- |
| ![Home](https://raw.githubusercontent.com/{{org}}/{{repo}}/main/docs/screenshots/desktop-home.jpg) | ![Home on a phone](https://raw.githubusercontent.com/{{org}}/{{repo}}/main/docs/screenshots/phone-home.jpg) |
| ![A collection](https://raw.githubusercontent.com/{{org}}/{{repo}}/main/docs/screenshots/desktop-category.jpg) | ![A collection on a phone](https://raw.githubusercontent.com/{{org}}/{{repo}}/main/docs/screenshots/phone-category.jpg) |
| ![A product](https://raw.githubusercontent.com/{{org}}/{{repo}}/main/docs/screenshots/desktop-product.jpg) | ![A product on a phone](https://raw.githubusercontent.com/{{org}}/{{repo}}/main/docs/screenshots/phone-product.jpg) |
| ![The bag](https://raw.githubusercontent.com/{{org}}/{{repo}}/main/docs/screenshots/desktop-cart.jpg) | ![The bag on a phone](https://raw.githubusercontent.com/{{org}}/{{repo}}/main/docs/screenshots/phone-cart.jpg) |

{{photo_credit}}

## Tested

Every release is checked before it goes up (the production bundle through the live shop's own HTML) and on the live shop after it is pinned (the full suite, each check at `TOTAL 0`). The table for each version is in the repository's [`README.md`](https://github.com/{{org}}/{{repo}}/blob/main/README.md#tests).

## Links

- Live shop: <https://{{domain}}>
- Repository: <https://github.com/{{org}}/{{repo}}>
- What {{Name}} is, how the mockup became the Layout, the colour family, the shape language, photos, data rules, checks and releases: [`LAYOUT.md`](https://github.com/{{org}}/{{repo}}/blob/main/LAYOUT.md); the base it is skinned from: [`BASE.md`](https://github.com/{{org}}/{{repo}}/blob/main/BASE.md)
- All official custom Layouts: <https://github.com/selldone-custom-layouts>
- Selldone: <https://selldone.com>
