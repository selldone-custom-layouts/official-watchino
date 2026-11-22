/*
 * The home's shared reads: every section of components/ly/home/sections/ uses this mixin (the shop's facts, the
 * collections ranked by pieces sold, the best sellers, the saving, the sentences built from the shop's own data).
 * Nothing here names a product, price, collection, address or delivery way; a section draws only what the shop
 * really has. Moved unchanged from the first Layout's single home component, so a section renders exactly as
 * it did there.
 */
import { bySells, catOf, catTitle, catTo, ly, fmtDate, inCat, mixed, money, priceView, productImage, productTo, scrollBehavior, shopFacts, unitOf } from "../ly";
import { collectionPhoto } from "../ly-photos";
import { catalogueRoute, dealsRoute, dropSrcset, percentOff, photoSrcset } from "../../kalio/kalio-catalog";
import { postRoute, journalRoute } from "../../kalio/pages/kalio-journal";
import { currentCurrency } from "../../region-switcher/region";
import { t } from "../../kalio/i18n/kalio-i18n";
import { isEnglish } from "../product/pd";
import { windowWord } from "../buy/ly-cart";
import { SKIN } from "../skin.gen";

const lang = () => document.documentElement.lang || "en";
const list = (items, type = "conjunction") => {
  try {
    return new Intl.ListFormat(lang(), { style: "long", type }).format(items);
  } catch {
    return items.join(", ");
  }
};
const NUM_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];

export default {
  props: {
    /** The variant the skin picked (components/ly/home/sections.json). */
    variant: { type: String, default: "" },
    /** The family tint band (white otherwise); bands alternate, never two tints side by side. */
    band: { type: Boolean, default: false },
  },

  data: () => ({ ly }),

  computed: {
    shop() {
      return this.$store.getters.getShop;
    },
    currency() {
      return currentCurrency();
    },
    facts() {
      return shopFacts(this.shop);
    },
    shopName() {
      const n = this.shop?.title || "";
      return n.charAt(0).toUpperCase() + n.slice(1);
    },
    cats() {
      return this.ly.cats;
    },
    products() {
      return this.ly.products;
    },
    /* The collections with products, by pieces sold (ties keep the shop's order). */
    rank() {
      return this.cats
        .map((c, i) => {
          const ps = bySells(inCat(c.id));
          return { c, i, ps, sold: ps.reduce((s, p) => s + (p.sells || 0), 0) };
        })
        .filter((x) => x.ps.length)
        .sort((a, b) => b.sold - a.sold || a.i - b.i);
    },
    best() {
      return bySells(this.products);
    },
    /* The saving: "25% off every piece" when every piece saves the same, else "Up to 30% off". */
    offs() {
      void this.currency;
      return this.products.map((p) => percentOff(this.shop, p)).filter((x) => x > 0);
    },
    offMax() {
      return this.offs.length ? Math.max(...this.offs) : 0;
    },
    offEvery() {
      return !!this.offs.length && this.offs.length === this.products.length && Math.min(...this.offs) === this.offMax;
    },
    offLine() {
      if (!this.offMax) return "";
      return this.offEvery ? t("ly.home.offEvery", "{off}% off every piece", { off: this.offMax }) : t("ly.home.offUpTo", "Up to {off}% off", { off: this.offMax });
    },
    fromPrice() {
      void this.currency;
      const now = this.products.filter((p) => p.quantity > 0).map((p) => this.pv(p).now);
      return now.length ? money(Math.min(...now)) : "";
    },
    street() {
      const p = this.facts.pickupPoint;
      return p?.address || String(this.facts.address || "").split(",")[0];
    },
    heroLead() {
      const f = this.facts;
      const n = this.cats.length;
      if (!n) return "";
      const count = t("ly.home.nCollections", { one: "{n} collection", other: "{n} collections" }, { n });
      const where = this.street ? t("ly.home.leadWhere", "{count} from the counter at {place}", { count, place: [this.street, f.city].filter(Boolean).join(", ") }) : count;
      const how = [];
      if (f.courier) how.push(t("ly.home.leadCourier", "brought by the {courier}", { courier: f.courier.title }));
      if (f.shipping) how.push(t("ly.home.leadShipped", "shipped"));
      if (f.pickup) how.push(t("ly.home.leadPicked", "picked up"));
      const off = this.offLine ? ` — ${this.offLine.toLowerCase()}` : "";
      return how.length ? `${where}${off}, ${list(how, "disjunction")}.` : `${where}${off}.`;
    },
    insetPiece() {
      const top = this.rank[0];
      return top ? top.ps[1] || top.ps[0] : null;
    },
    /* Four counters (or two): no product count (the owner's rule), only the
       shop's real facts. */
    /* The shop's details, its collections and its catalogue are all in. Every sentence built from them
       (the hero's line, About, How ordering works, the offer card, the counters) waits for this, so
       none is drawn half-made and then rewritten ("Every day" turning into "Right now", "0 days"). */
    ready() {
      return this.facts.ready && this.ly.ready && this.ly.catsReady;
    },
    nums() {
      const f = this.facts;
      if (!this.ready) return [];
      const out = [];
      if (this.cats.length) out.push({ k: "c", value: this.cats.length, unit: "", label: t("ly.home.numCols", { one: "collection", other: "collections" }, { n: this.cats.length }) });
      if (this.offMax) out.push({ k: "o", value: this.offMax, unit: "%", label: this.offEvery ? t("ly.home.numOffEvery", "off every piece") : t("ly.home.numOffMost", "off, at most") });
      if (f.days.length) out.push({ k: "d", value: f.days.length, unit: "", label: f.hours ? t("ly.home.numDaysHours", { one: "day a week, {hours}", other: "days a week, {hours}" }, { n: f.days.length, hours: f.hours }) : t("ly.home.numDays", { one: "day a week", other: "days a week" }, { n: f.days.length }) });
      if (f.ways.length) out.push({ k: "w", value: f.ways.length, unit: "", label: t("ly.home.numWays", { one: "way to receive an order", other: "ways to receive an order" }, { n: f.ways.length }) });
      return out.length >= 4 ? out.slice(0, 4) : out.length >= 2 ? out.slice(0, 2) : out;
    },
    /* About, in the shop's own facts. */
    aboutP1() {
      const f = this.facts;
      const names = list(this.cats.map((c) => catTitle(c).toLowerCase()));
      const at = this.street
        ? t("ly.home.aboutAt", "{shop} is a bakery counter at {street} in {city}.", { shop: this.shopName, street: this.street, city: f.city || "" }).replace(" in .", ".")
        : t("ly.home.aboutIs", "{shop} is a bakery counter.", { shop: this.shopName });
      const unit = this.units[0];
      const sold = names
        ? unit
          ? t("ly.home.aboutCols", "Its collections — {names} — are sold one piece at a time, so an order can be as small as a single {unit}.", { names, unit })
          : t("ly.home.aboutCols0", "Its collections — {names} — are sold one piece at a time.", { names })
        : "";
      return [at, sold].filter(Boolean).join(" ");
    },
    aboutP2() {
      const f = this.facts;
      const how = [];
      if (f.courier) how.push(t("ly.home.aboutCourier", "travel with the {courier}", { courier: f.courier.title }));
      if (f.shipping) how.push(t("ly.home.aboutShip", "ship further away"));
      if (f.pickup) how.push(t("ly.home.aboutPickup", "wait at the counter for pickup"));
      if (!how.length) return "";
      const pay = f.gateway?.name ? t("ly.home.aboutPay", ", and they are paid by {gateway}", { gateway: f.gateway.name.toLowerCase() }) : "";
      return t("ly.home.aboutHow", "Orders {how}{pay}.", { how: list(how, "disjunction"), pay });
    },
    /* The units the collections sell by ("croissant", "tart", "mini cake"). */
    units() {
      return [...new Set(this.rank.map((x) => unitOf(x.ps[0]).toLowerCase()))];
    },
    /* Up to five pieces, one per collection first (the About stand-in). */
    spread() {
      const out = [];
      const used = new Set();
      for (const p of this.best) if (out.length < 5 && !used.has(p.category_id)) out.push(p) && used.add(p.category_id);
      for (const p of this.best) if (out.length < 5 && !out.includes(p)) out.push(p);
      return out;
    },
    /* The top four collections (or two, or one: the 2 × 2 grid stays full). */
    topCols() {
      const n = this.rank.length >= 4 ? 4 : this.rank.length >= 2 ? 2 : this.rank.length;
      return this.rank.slice(0, n);
    },
    colsTitle() {
      const n = this.topCols.length;
      if (n === 1) return t("ly.home.colsH1", "The collection people order most");
      return t("ly.home.colsH", "The {n} collections people order most", { n: this.numWord(n) });
    },
    howLead() {
      return this.facts.gateway?.cod
        ? t("ly.home.howLeadCod", "Choose the pieces, choose how they reach you, and pay when they arrive. Nothing is charged online.")
        : t("ly.home.howLead", "Choose the pieces, choose how they reach you, and pay at checkout.");
    },
    /* The four features (an even number, so the 2 × 2 grid stays full). */
    feats() {
      const f = this.facts;
      const u = this.units;
      const out = [];
      out.push({
        k: "piece",
        art: "croissant",
        title: t("ly.home.featPiece", "Piece by piece"),
        text: u.length >= 3
          ? t("ly.home.featPieceP3", "Every pastry is sold on its own — one {a}, one {b} or a single {c}.", { a: u[0], b: u[1], c: u[2] })
          : t("ly.home.featPieceP", "Every pastry is sold on its own, so you choose exactly the pieces you want."),
      });
      if (f.courier && f.courier.windows.length)
        out.push({ k: "win", art: "clock", title: t("ly.home.featWindow", "Pick a window"), text: t("ly.home.featWindowP", "The {courier} comes in the window you choose: {windows}.", { courier: f.courier.title, windows: list(f.courier.windows, "disjunction") }) });
      if (f.gateway) out.push({ k: "pay", art: "cash", title: f.gateway.name, text: f.gateway.description || t("ly.home.featPayP", "Pay when the order reaches you.") });
      if (f.pickup)
        out.push({
          k: "pick",
          art: "awning",
          title: t("ly.home.featPickup", "Or pick it up"),
          text: this.street
            ? f.hours
              ? f.everyDay
                ? t("ly.home.featPickupP", "At the counter, {street}, every day {hours}.", { street: this.street, hours: f.hours })
                : t("ly.home.featPickupPh", "At the counter, {street}, {hours}.", { street: this.street, hours: f.hours })
              : t("ly.home.featPickupPs", "At the counter, {street}.", { street: this.street })
            : t("ly.home.featPickupP0", "At the counter."),
        });
      if (f.shipping)
        out.push({
          k: "ship",
          art: "cake",
          title: t("ly.home.featShip", "Or have it shipped"),
          text: f.shipping.freeOver ? t("ly.home.featShipFree", "{way}, free on orders over {amount}.", { way: f.shipping.title, amount: money(f.shipping.freeOver, true) }) : t("ly.home.featShipP", "{way}.", { way: f.shipping.title }),
        });
      const n = out.length >= 4 ? 4 : out.length >= 2 ? 2 : out.length;
      return out.slice(0, n);
    },
    howPlate() {
      const x = this.rank[1] || this.rank[0];
      return x ? x.ps[0] : null;
    },
    courierNote() {
      const c = this.facts.courier;
      if (!c) return "";
      return c.distance ? t("ly.home.courierWithin", "Local delivery within {km} km of the bakery.", { km: c.distance }) : t("ly.home.courierLocal", "Local delivery.");
    },
    courierChecks() {
      const c = this.facts.courier;
      if (!c) return [];
      const out = [];
      if (c.days.length) out.push(c.days.length >= 7 ? t("ly.home.everyDayCap", "Every day") : list(c.days.map((d) => String(d).slice(0, 3))));
      out.push(c.fee ? t("ly.home.deliveryFee", "Delivery {fee}", { fee: money(c.fee) }) : t("ly.home.noFee", "No delivery fee"));
      out.push(c.cod ? t("ly.home.payCourier", "Pay the courier in cash") : t("ly.home.paidCheckout", "Paid at checkout"));
      return out;
    },
    /* The courier's windows, its radius, free shipping from. */
    fnums() {
      const f = this.facts;
      const out = [];
      if (f.courier?.windows.length) out.push({ k: "w", value: f.courier.windows.length, unit: "", label: t("ly.home.fnWindows", { one: "Courier window", other: "Courier windows" }, { n: f.courier.windows.length }) });
      if (f.courier?.distance) out.push({ k: "r", value: f.courier.distance, unit: t("ly.home.km", "km"), label: t("ly.home.fnRadius", "Courier radius") });
      if (f.shipping?.freeOver) out.push({ k: "s", value: money(f.shipping.freeOver, true), unit: "", label: t("ly.home.fnFree", "Free shipping from") });
      return out;
    },
    /* The biggest saving, standing in for the offer card's photo. */
    offerPiece() {
      const list = this.products.filter((p) => p.quantity > 0 && p.icon);
      if (!list.length) return null;
      return [...list].sort((a, b) => this.pv(b).save - this.pv(a).save || (b.sells || 0) - (a.sells || 0))[0];
    },
    waysTitle() {
      const n = this.facts.ways.length;
      if (n === 1) return t("ly.home.waysH1", "One way to receive it");
      return t("ly.home.waysH", "{n} ways to receive it", { n: this.capital(this.numWord(n)) });
    },
    /* The gallery: the most-ordered collection in the middle, the others
       around it, product plates wherever a collection is missing (every
       slot is always filled). */
    gallery() {
      if (!this.rank.length) return null;
      const centre = this.rank[0].c;
      const others = this.cats.filter((c) => c.id !== centre.id && inCat(c.id).length);
      /* The plates: best sellers of the collections that sit farthest from
         them (the last tiles first), so a plate never stands next to its
         own collection's tile; then any best seller. */
      const plates = [];
      const seen = new Set();
      for (const c of [...others].reverse()) {
        const p = bySells(inCat(c.id))[0];
        if (p && !seen.has(p.id)) {
          plates.push(p);
          seen.add(p.id);
        }
      }
      for (const p of this.best) if (!seen.has(p.id)) plates.push(p) && seen.add(p.id);
      let oi = 0;
      let pi = 0;
      const tile = (r) => (oi < others.length ? { key: "c" + others[oi].id, cat: others[oi++], r } : { key: "p" + (plates[pi] || {}).id, p: plates[pi++], r });
      const plate = (r) => ({ key: "p" + (plates[pi] || {}).id, p: plates[pi++], r });
      const c1 = [tile("r45"), plate("r11")];
      const c2 = [plate("r11"), tile("r45")];
      const c4 = [tile("r43"), tile("r43"), tile("r43")];
      const ok = (arr) => arr.every((x) => x.cat || x.p);
      if (!ok(c1) || !ok(c2) || !ok(c4)) return null;
      return {
        cols: [
          { k: "c1", tiles: c1 },
          { k: "c2", tiles: c2 },
          { k: "c3", tiles: [], centre },
          { k: "c4", tiles: c4 },
        ],
      };
    },
    /* Best sellers, mixed across collections (never one kind only), in stock. */
    selection() {
      return mixed(bySells(this.products.filter((p) => p.quantity > 0))).slice(0, 6);
    },
    /* The photo band's stand-in: the best seller of each collection. */
    bandPieces() {
      return this.rank.map((x) => x.ps[0]).filter(Boolean).slice(0, 5);
    },
    r() {
      return window.$storefront.routes;
    },
    dealsTo() {
      return dealsRoute();
    },
    allTo() {
      return catalogueRoute({});
    },
    blogTo() {
      return journalRoute();
    },
    contactTo() {
      return { name: this.r.SHOP_CONTACT_US };
    },
  },

  methods: {
    t,
    money,
    catOf,
    catTitle,
    catTo,
    bySells,
    inCat,
    unitOf,
    productTo,
    postRoute,
    fmtDate,
    photoSrcset,
    dropSrcset,
    pv(p) {
      void this.currency;
      return priceView(this.shop, p);
    },
    img(p) {
      return productImage(p);
    },
    thumb(p) {
      return productImage(p, 128);
    },
    colPhoto(c) {
      return collectionPhoto(c);
    },
    postImg(b) {
      return b.image ? window.CDN.GET_SHOP_IMAGE_PATH(b.image, null) : null;
    },
    capital(s) {
      s = String(s || "");
      return s.charAt(0).toUpperCase() + s.slice(1);
    },
    /* "six" in English; the number itself in a language without the word. */
    numWord(n) {
      return isEnglish() && n >= 0 && n < NUM_WORDS.length ? NUM_WORDS[n] : String(n);
    },
    /* the way's own line icon (the courier, shipping, pickup), else a tick */
    wayIcon(w) {
      if (w.pickup) return "store";
      if (w.type === "Global" || w.type === "Post") return "plane";
      if (w.type === "Motorbike" || w.type === "Car" || w.type === "Bicycle" || w.type === "Truck") return "bike";
      return "check";
    },
    feeText(w) {
      if (!w.fee) return t("ly.home.free", "Free");
      return w.freeOver ? t("ly.home.feeFreeOver", "{fee} · free over {amount}", { fee: money(w.fee), amount: money(w.freeOver, true) }) : money(w.fee);
    },
    /* A way's line from its own data: the courier's radius and windows, the
       shipping's free threshold, the pickup counter's own note. */
    wayNote(w) {
      if (w.pickup) return this.facts.pickupNote || (w.windows.length ? list(w.windows.map(windowWord)) : "");
      if (w.type === "Global" || w.type === "Post") return w.freeOver ? t("ly.home.shipsFree", "Ships anywhere; free on orders over {amount}", { amount: money(w.freeOver, true) }) : t("ly.home.ships", "Ships anywhere");
      const near = w.distance ? t("ly.home.courierWithinShort", "Local delivery within {km} km of the bakery", { km: w.distance }) : t("ly.home.courierLocalShort", "Local delivery");
      return w.windows.length ? `${near} · ${list(w.windows.map(windowWord))}` : near;
    },
    selMeta(p) {
      const v = this.pv(p);
      const parts = [t("ly.home.perUnit", "Per {unit}", { unit: unitOf(p) })];
      if (v.off > 0) parts.push(t("ly.home.offPct", "{off}% off", { off: v.off }));
      parts.push(p.quantity > 0 && p.quantity <= 5 ? t("ly.home.onlyLeft", "only {n} left", { n: p.quantity }) : t("ly.home.inStock", "in stock"));
      return parts.join(" · ");
    },
    jump(id) {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
    },
    /** The line art a slot's fallback draws (skins/<name>/skin.json photos.<slot>.art). */
    art(slot: string, fallback = "croissant") {
      return (SKIN.photoArt as Record<string, string>)[slot] || fallback;
    },
  },
};
