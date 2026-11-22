# Shop Requirements

The Layout reads everything from your shop. Nothing about {{shop}} is hard-coded. Here is what your shop's data needs so that each part looks as it does on [{{domain}}](https://{{domain}}). A section with no data folds away or shrinks to what the shop has; it never shows an empty box, and no fact is invented to fill one.

## Settings (yours to choose)

| Setting | What to set | What the Layout does |
| --- | --- | --- |
| **OAuth client id** | Set it up for your shop first | Sign-in uses your shop's own sign-in. Without it, sign-in leaves for Selldone and shows an error. |
| **Business model** | A normal shop with one seller | {{Name}} is made for one bakery. |
| **Shop title** | The name you want read | It is drawn as the wordmark (with a capital first letter), the hero's first line, the footer's name, the tab icon's letter, the shop's mark and the page titles. |
| **Guest checkout** | Your choice | When guests may buy, the sign-in sheet offers "Continue as guest", the checkout's Contact card says "Checkout does not need an account", and a guest's account shows the orders kept on that device; otherwise the shopper signs in to place the order. |
| **Payment methods** | At least one, for your currency (cash on delivery is fine) | The top bar, About, How ordering works (the method's name and its own description), the strip under a collection, the product page's payment line, the bag ("Pay in cash when the order arrives"), the checkout ("Place order · pay $x on delivery", or "at pickup") and the order page name it. With cash on delivery, How ordering works says "pay when they arrive. Nothing is charged online." Without one, the checkout says "This shop is not taking payment right now" instead of showing Place order. |
| **Delivery ways** (transportations) | What you offer, each with a title, a fixed fee, a free-shipping threshold if you have one, a distance for a courier, its **days** and **time windows** | The hero's line ("brought by the <courier>, shipped or picked up"), the numbers ("n ways to receive an order"), About, How ordering works (Pick a window, Or have it shipped, the courier's card with its radius, days, fee and how it is paid), the courier's numbers (windows, radius, free shipping from), **<n> ways to receive it**, the footer's line, the strip under each collection, the product page's delivery lines, the bag's "How it reaches you", the delivery sheet, the checkout's method cards and windows, and the order page. A way without a title gets words from its kind ("<Shop> courier", "Worldwide shipping", "By post", "Pickup"). The windows (`time_spans`) are the choices at checkout; a window shows only for the way that offers it. |
| **Pickup point** | If you have a counter: a pickup point with an address and a note that holds the hours, e.g. "Open daily, 8:00-18:00" | The counter hours are read from that note (a time range like `8:00-18:00`, `8:00–18:00` or `8:00 to 18:00`), else from the shop info's own hours line. They show in the top bar ("Open every day 8:00–18:00"), the numbers, How ordering works, the footer's Visit column and Contact. The street shows as "Pickup at <street>" in the top bar. With no hours anywhere, the hours are left out. |
| **Checkout map** | On or off | On: the address sheet has a map and a pin. Off: it is a short form with search. |
| **Login modes** | Your choice | The sign-in sheet shows your shop's own ways in (social logins as you switch them on, an email code, phone). |
| **Currency, country, language** | Your market | Prices, the address form, and the language and currency pill in the top bar (the phone menu's "Language & currency" row). The pill shows even with one currency and one language ("EN · USD"). {{Name}}'s own words are in English and Arabic; another language needs a few files (see [Customize](Customize#languages)). |
| **Home of the domain** | The shop page | The designed home is the shop page. A Page Builder page set as Home replaces it on `/`. |

## Shop info

The facts on the home, the header, the footer, Contact and the sample pages come from the shop's own info (Selldone dashboard, the shop's contact information). Until it has loaded, every line built from it is left out, so no sentence is drawn half-made and then rewritten:

- **Address**, city, region and postal code: the top bar's "Pickup at <street>" (the pickup point's street first), the **city under the wordmark**, the hero's line, About ("<Shop> is a bakery counter at <street> in <city>."), How ordering works' pickup line, the footer's Visit column, the copyright line, the About page and Contact.
- **Location** (the pin on the map): the map on Contact. Without a location (or without a map key), Contact shows the map's calm water colour and the pin, nothing invented.
- **Open days:** "Open every day" or "Open n days a week", in the top bar, the numbers, the footer and Contact's Hours card.
- **Phone** and **email:** the top bar, the footer's Contact column (the phone set large), Contact and the FAQ's "Still wondering?".

## Collections (categories)

- Each **top-level category** is a collection: a link in **Shop ⌄** and the phone menu, a photo row or a gallery tile on the home, a word in the marquee, a chip on every collection page, a tab on search, a link in the footer's Shop column (the first eight), and its own collection page.
- **Shop ⌄** shows each collection's **best seller's photo** and its lowest price ("From $2.81"); a product count is never shown.
- Each collection's photo is `skins/{{name}}/photos/col-<slug of its title>.webp` in the Layout (see [Photos](#photos-for-the-photo-slots)); without it, its best sellers on a plate. It shows on the home's photo rows and gallery, in the collection page's title band, in the strip under the collection, on About and in Shop ⌄'s feature card.
- Give each one a short **description**: it shows on the home's collection rows, in the collection page's title band and on About.
- Order them in Selldone; collections with the same sales keep your order.
- The hero names the three collections with the most pieces sold; **The collections people order most** shows the top four (or two, or one); the gallery puts the most-ordered collection in its centre; **Buy together** takes the best sellers of two other collections.

## Photos for the photo slots

The home's hero (two), About, How ordering works, the offer card, the photo band, the journal and the footer's texture are **photo slots**, and each collection has a photo. Each reads one file from `skins/{{name}}/photos/` in the repository. The repository ships all 14 for {{shop}} (photos generated with Magnific (Freepik) for {{shop}} under the owner's Premium plan):

| File | Size |
| --- | --- |
| `hero-back.webp` (the hero's counter photo; it runs to the window's edge, and the collection names sit on its dark corner) | 2000 × 1250 |
| `hero-inset.webp` (the framed photo across the hero's seam) | 900 × 1100 |
| `about.webp` (About on the home and the top of the About page) | 1200 × 800 |
| `how.webp` (How ordering works) | 1200 × 1500 |
| `offer.webp` (the tall dark offer card; its words sit at the foot) | 900 × 1350 |
| `parallax.webp` (the full-width photo band) | 2400 × 1100 |
| `journal.webp` (beside the journal's posts; "Journal" sits over it) | 1200 × 1400 |
| `footer.webp` (the footer's dark texture, under a family scrim) | 2400 × 900 |
| `col-<slug>.webp` (a collection's photo, where `<slug>` is made from its title: "Danish Pastries" → `danish-pastries`; its address name in Selldone is tried too) | 1400 × 1050 |

- A slot without its file shows its designed fallback (the family tint with one of the mockup's drawings, or your own pastries as cut-outs), so a new collection or a missing photo never shows an empty box, a caption or a file name.
- No words, logos, price tags or people on any photo, and no pastry cut by the edge. Where the Layout's words sit over a photo (the hero's dark corner, the offer card's foot, the journal's word) leave that part of the photo calm and plain.
- The photos are part of the Layout, so a new one needs a new release, and each one is a file of the 300 the build may have. See [Customize](Customize#photos).

## Products

- The **main photo** as a **transparent cut-out** (PNG or WebP, the pastry alone on no ground). Every card, the quick view, the product page, the bag and the photo slots' fallbacks set it on a tinted plate; a photo with its own ground shows as a square on the plate. More photos make the product page's gallery.
- A **unit** (Selldone's `unit` field, for example "croissant"): "Per croissant" on every card, the quick view and the product page, "Sold as one croissant" in the Description tab, and the home's "an order can be as small as a single croissant" and "one croissant, one tart or a single mini cake". Without one, the Layout says "piece".
- A **price**, and a **discount** for a saving: the struck was-price, the `−%` roundel, the saving line, "Save $X · n%" on the product page. The header's deals line, the hero's line, the numbers and the offer card say "25% off every piece" when every product has the same saving, else "Up to X% off".
- **Deals** (in the header and the menus) lists the pieces that have a saving, biggest saving first. When every piece has one, as on {{shop}}, that is every piece.
- **Discount dates:** a deal with a real end date gets a clock on the product page. Without an end date there is no clock; no date is ever invented.
- **Pros** (Selldone's product pros, a title and a line each): "Why you'll love it" in the product page's Description tab; Compare's "Why pick it" lists the first two.
- **Spec for the Description's lead:** when a product's spec has a "Visual Finish" (or "Surface") and a "Suggested Pairing" value, the Description tab opens with them (the finish, then "Sold as one <unit>, and good with <pairing>."). Without them the lead is shorter.
- **Rating criteria** (for example "Flakiness", "Flavor"): shown as "No score yet" in the Reviews tab's honest card until the first review; "No reviews yet" beside the unit.
- **Stock:** "only n left" on a card at five or fewer; the product page, the quick view and the bag show the stock.
- **Variants** only when the product really has options: tiles with their own photo on the product page; the quick view then says "Choose options" and opens the product.
- A **product code** (SKU) shows in the Additional information tab.
- **Sales:** the hero, the collection rows, the gallery, Today's selection, Shop ⌄'s photos, the 404's pastries and Buy together are ranked by Selldone's own sales count. With no sales yet, the shop's order comes first.
- {{Name}} reads up to **250 products** in one go; a larger catalogue shows its first 250 in the listings and on the home.

## Specs and filters

The filter panel, the product page's Additional information and Compare come from each product's **spec**:

- Write specs **flat**: `{"Group": "group", "Key": ["value"]}` with `spec_order`. A nested spec is not shown anywhere.
- Every spec key of the products on the page becomes a filter group, the groups with **two or more different values** first. A note in sentences is never a filter: a key whose every value is longer than 80 characters, or that has one value longer than 30 characters. A group with a value longer than 30 characters shows four values, then "Show N more". Keep the values you want as filters short.
- **Price** (a two-thumb range with short boxes) is always there, and **On offer** whenever something on the page has a saving. Nothing else is invented, so a collection may show fewer filters than another.
- The filters open in a side panel (a side sheet below 1200px). They are read live from the products, so a spec change shows on the next visit. No category filter list is needed.
- Sort: Featured, Best sellers, Customer review, Price low to high, Price high to low, Newest. Deals starts on Biggest saving; search starts on Best sellers.
- Compare shows the spec in your own groups, with the collections' "… Profile" groups as one "Profile".

## Content

- **Articles** (blog posts) with **cover images**: the home's journal shows the four newest; the journal page shows the newest as a featured card, then every other post in a grid with a search, newest first, and "More posts". Publish **five or more** to fill both. A post without a cover gets the card's plate with the whisk drawing.
- In an article's text, **link the pastries** it talks about (`/product/<id>` links): the article has one panel of those pastries (four at most) with "Add all". Without links, the panel shows the pastries the text names. Links inside a post's own text are underlined, the only underlined words in the Layout.
- **FAQ** entries: the FAQ page, grouped by topic (each entry's first tag), with the topics as chips. Until you add some, it shows sample questions (ordering pieces, delivery windows, pickup, the way to pay, allergens) built from your shop's facts, under the sample label below.
- **About us, Terms, Privacy, Contact us** pages (Selldone's shop profiles). Until you write them, About, Terms and Privacy show sample text built only from your shop's facts (no invented history, names or reviews), under a clear "Sample text — the shop has not written this page yet" label. Your own Terms and Privacy headings become the page's index. Contact always shows your real lines and the message form; your own Contact text shows above the form.
- **Social links:** shown in the footer's legal row.
- {{Name}}'s footer does not read a Selldone footer menu: its columns come from your shop's facts and collections, and its legal row links Privacy, Terms and FAQ.

## Checklist

- [ ] The shop's OAuth client id is set up
- [ ] The shop's title reads the way the wordmark should, and the address has a city
- [ ] Collections have a short description
- [ ] Products have a cut-out main photo, a unit, pros, flat specs with short values, and an SKU
- [ ] Some products have discounts, with end dates only where the deal really ends
- [ ] At least one payment method (cash on delivery is fine)
- [ ] Delivery ways with titles, fees, days and time windows; a pickup point whose note holds the hours
- [ ] The shop info has an address, a location on the map, open days, a phone and an email
- [ ] Five or more articles with covers, linking the pastries they talk about
- [ ] FAQ entries, and your own About, Terms and Privacy
- [ ] The photos in `skins/{{name}}/photos/`: {{shop}}'s kept on purpose, replaced with yours, or removed for the fallbacks
- [ ] The domain's Home is the shop page
