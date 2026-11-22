<!--
  About (design/about-b.html, pages-read.js about): the
  title band ("About <shop>", the counter's address); "Who we are" beside
  the About photo (skins/<name>/photos/about.webp; without it, the shop's
  own pastries spread on the counter), with the counter's lines (address,
  hours, the way to pay); three panels — the counter, a collection photo,
  "Sold one by one"; the collections with their photos; and a collage of
  pastries with "A small table of favourites".

  The story is the shop's own About page (Selldone dashboard › Shop ›
  Profile) when it has written one; until then sample copy built only from
  the shop's facts (its address, collections, delivery ways and way to
  pay), with the label "Sample text — the shop has not written this page
  yet". Never invented history, awards, names or counts.
-->
<template>
  <div class="ly ly-about">
    <ly-pt :crumbs="[{ label: t('ly.rd.about', 'About') }]" :lead="bandLead" :title="t('ly.rd.aboutT', 'About {shop}', { shop: name })" art="croissant" art2="macaron" />

    <section aria-labelledby="ab-h" class="sec ab-in">
      <ly-art name="cupcake" wrap="ab-a1" />
      <div class="wrap ab-g">
        <div class="ab-tx">
          <p class="eyebrow">{{ t("ly.rd.whoWeAre", "Who we are") }}</p>
          <h2 id="ab-h" class="h2">{{ own ? t("ly.rd.aboutT", "About {shop}", { shop: name }) : t("ly.rd.aboutH", "Made to be chosen one at a time") }}</h2>
          <ly-sample-tag v-if="!own" />
          <div v-if="own" class="art-body ly-own" v-html="ownHtml"></div>
          <template v-else>
            <p>{{ storyP1 }}</p>
            <p v-if="storyP2">{{ storyP2 }}</p>
          </template>
          <ul v-if="lines.length" class="ils">
            <ly-ic-line v-for="l in lines" :key="l.key" :icon="l.icon" :text="l.text" :title="l.title" />
          </ul>
        </div>
        <ly-photo art="croissant" class="ab-ph" name="about">
          <template v-if="spread.length" #fallback><ly-cuts :products="spread" kind="spread" /></template>
        </ly-photo>
      </div>
    </section>

    <section :aria-label="t('ly.rd.theCounter', 'The counter')" class="trio-s ab-trio">
      <div class="wrap trio">
        <div class="tri dark">
          <ly-art cls="tri-ic" name="cake" />
          <h3>{{ t("ly.rd.theCounter", "The counter") }}</h3>
          <p>{{ counterText }}</p>
          <router-link :to="contactTo" class="btn sm on-dark">{{ t("ly.rd.findUs", "Find us") }}</router-link>
        </div>
        <router-link v-if="photoCat" :to="catTo(photoCat)" aria-hidden="true" class="tri photo" tabindex="-1">
          <img v-if="colPhoto(photoCat)" :src="colPhoto(photoCat)" alt="" loading="lazy" />
          <ly-cuts v-else :products="bySells(inCat(photoCat.id))" kind="trio" />
        </router-link>
        <div class="tri light">
          <ly-art cls="tri-ic" name="whisk" />
          <h3>{{ t("ly.rd.oneByOne", "Sold one by one") }}</h3>
          <p>{{ oneByOne }}</p>
          <router-link :to="shopTo" class="btn sm">{{ t("ly.rd.everyPiece", "See every piece") }}</router-link>
        </div>
      </div>
    </section>

    <section v-if="ly.cats.length" aria-labelledby="abc-h" class="sec ab-cols">
      <div class="wrap">
        <header class="sec-hd">
          <p class="eyebrow">{{ t("ly.rd.theCollections", "The collections") }}</p>
          <h2 id="abc-h" class="h2">{{ t("ly.rd.colsH", { one: "One collection at the counter", other: "{w} collections at the counter" }, { n: ly.cats.length, w: numberWord(ly.cats.length) }) }}</h2>
          <p class="lead c">{{ t("ly.rd.colsP", "Each one is a short list of individual pieces, each with its own price.") }}</p>
        </header>
        <div class="acg">
          <article v-for="c in ly.cats" :key="c.id" class="acc-c">
            <router-link :to="catTo(c)" aria-hidden="true" class="acc-ph" tabindex="-1">
              <img v-if="colPhoto(c)" :src="colPhoto(c)" alt="" loading="lazy" />
              <ly-cuts v-else :products="bySells(inCat(c.id))" kind="trio" />
            </router-link>
            <div class="acc-tx">
              <h3>
                <router-link :to="catTo(c)"><bdi>{{ catTitle(c) }}</bdi></router-link>
              </h3>
              <p v-if="c.description"><bdi>{{ c.description }}</bdi></p>
              <router-link :to="catTo(c)" class="qlink">{{ t("ly.rd.shopCol", "Shop {name}", { name: catTitle(c).toLowerCase() }) }}<ly-icon cls="flip-rtl" name="arrow" /></router-link>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section v-if="collage.length >= 6" aria-labelledby="abl-h" class="sec band ab-col">
      <div class="wrap ab-cg">
        <div aria-hidden="true" class="clg">
          <span v-for="(p, i) in collage" :key="p.id" :class="['clg-i', 'c' + i]"><img :src="productImage(p)" alt="" loading="lazy" /></span>
        </div>
        <div class="ab-tx">
          <p class="eyebrow">{{ t("ly.rd.pieceByPiece", "Piece by piece") }}</p>
          <h2 id="abl-h" class="h2">{{ t("ly.rd.tableH", "A small table of favourites") }}</h2>
          <p>{{ tableText }}</p>
          <div class="ab-acts">
            <router-link :to="shopTo" class="btn">{{ t("ly.rd.startOrder", "Start an order") }}</router-link>
            <router-link :to="faqTo" class="qlink">{{ t("ly.rd.questions", "Questions") }}</router-link>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import LyIcon from "@app-storefront/components/ly/LyIcon.vue";
import LyArt from "@app-storefront/components/ly/LyArt.vue";
import LyCuts from "@app-storefront/components/ly/LyCuts.vue";
import LyPhoto from "@app-storefront/components/ly/LyPhoto.vue";
import LyPt from "@app-storefront/components/ly/ui/LyPt.vue";
import LyIcLine from "@app-storefront/components/ly/ui/LyIcLine.vue";
import LySampleTag from "@app-storefront/components/ly/ui/LySampleTag.vue";
import { bySells, catTitle, catTo, ly, inCat, loadDm, mixed, openLine as openWords, productImage, shopFacts, unitOf } from "@app-storefront/components/ly/ly";
import { collectionPhoto } from "@app-storefront/components/ly/ly-photos";
import { numberWord } from "@app-storefront/components/ly/product/pd";
import { listWords, ownText, paySentence, shopName, shopProfile, shortAddress } from "@app-storefront/components/ly/read/rd";
import { catalogueRoute } from "@app-storefront/components/kalio/kalio-catalog";
import { t } from "@app-storefront/components/kalio/i18n/kalio-i18n";

export default {
  name: "StorefrontPageOfficialAboutUs",
  components: { LyIcon, LyArt, LyCuts, LyPhoto, LyPt, LyIcLine, LySampleTag },
  inject: ["$shop"],

  data: () => ({ ly, profile: null as any }),

  computed: {
    shop() {
      return this.$store.getters.getShop;
    },
    f() {
      return shopFacts(this.shop);
    },
    name() {
      return shopName(this.shop);
    },
    own() {
      return ownText(this.profile?.body);
    },
    ownHtml() {
      return String(this.profile?.body || "").replace(/\scontenteditable="[^"]*"/g, "");
    },
    bandLead() {
      const at = shortAddress(this.f);
      return at ? t("ly.rd.aboutLead", "A pâtisserie counter at {place}.", { place: at }) : "";
    },
    units() {
      return [...new Set(this.ly.cats.map((c: any) => unitOf(this.ly.products.find((p: any) => p.category_id === c.id) || {}).toLowerCase()).filter(Boolean))] as string[];
    },
    collectionsWords() {
      return listWords(this.ly.cats.map((c: any) => catTitle(c).toLowerCase()));
    },
    storyP1() {
      const where = this.f.address;
      const lead = where ? t("ly.rd.storyAt", "{shop} is a bakery counter at {address}.", { shop: this.name, address: where }) : t("ly.rd.storyIs", "{shop} is a bakery counter.", { shop: this.name });
      const small = this.units[0] ? t("ly.rd.storySmall", ", so an order can be a single {unit} or a small table of favourites", { unit: this.units[0] }) : "";
      const hold = this.collectionsWords ? t("ly.rd.storyCase", "Its collections — {names} — are sold as individual pieces{small}.", { names: this.collectionsWords, small }) : "";
      return [lead, hold].filter(Boolean).join(" ");
    },
    storyP2() {
      const f = this.f;
      const open = f.hours ? (f.everyDay ? t("ly.rd.openEveryFrom", "The counter is open every day from {hours}.", { hours: f.hours }) : t("ly.rd.openFrom", "The counter is open {hours}.", { hours: f.hours })) : "";
      const kinds: string[] = [];
      if (f.courier) kinds.push(f.courier.distance ? t("ly.rd.byCourierKm", "travel with the {name} within {km} km", { name: f.courier.title, km: f.courier.distance }) : t("ly.rd.byCourier", "travel with the {name}", { name: f.courier.title }));
      if (f.shipping) kinds.push(t("ly.rd.byShipping", "ship further away"));
      if (f.pickup) kinds.push(t("ly.rd.byPickup", "wait at the counter for pickup"));
      const how = kinds.length ? t("ly.rd.ordersHow", "Orders {kinds}", { kinds: listWords(kinds) }) : "";
      const pay = f.gateway?.cod ? t("ly.rd.paidCod", ", and they are paid in cash on delivery.") : how ? "." : "";
      return [open, how ? how + pay : ""].filter(Boolean).join(" ");
    },
    /* The counter's lines: where, when, how it is paid. */
    lines() {
      const f = this.f;
      const out: any[] = [];
      if (f.address) out.push({ key: "pin", icon: "pin", title: f.address, text: f.pickupNote });
      const open = openWords(f);
      if (open) out.push({ key: "clock", icon: "clock", title: open, text: f.everyDay ? t("ly.rd.monSun", "Monday to Sunday") : "" });
      if (f.gateway) out.push({ key: "cash", icon: "cash", title: f.gateway.name, text: f.gateway.cod ? t("ly.rd.nothingOnline", "Nothing is charged online") : f.gateway.description || paySentence(f) });
      return out;
    },
    spread() {
      return mixed(bySells(this.ly.products)).slice(0, 5);
    },
    counterText() {
      return this.f.pickupNote || [shortAddress(this.f), openWords(this.f)].filter(Boolean).join(". ") || t("ly.rd.counterP", "Every piece is baked and packed at the counter.");
    },
    /* The collection with the most sold pieces, in its photo. */
    photoCat() {
      const cats = this.ly.cats.slice();
      const sold = (c: any) => inCat(c.id).reduce((n: number, p: any) => n + (Number(p.sells) || 0), 0);
      return cats.sort((a: any, b: any) => sold(b) - sold(a))[0] || null;
    },
    oneByOne() {
      const u = this.units;
      if (u.length >= 3) return t("ly.rd.oneByOneP3", "One {a}, one {b}, one {c} — every pastry is its own piece, with its own price.", { a: u[0], b: u[1], c: u[2] });
      return t("ly.rd.oneByOneP", "Every pastry is its own piece, with its own price.");
    },
    tableText() {
      const u = this.units;
      const tail = t("ly.rd.tableTail", "Each piece is chosen on its own, and the bag shows the full price, the saving and the total before checkout.");
      if (u.length >= 3) return `${t("ly.rd.tableMix", "Mix a {a} with a {b}, and add a {c} for later.", { a: u[0], b: u[1], c: u[2] })} ${tail}`;
      return tail;
    },
    collage() {
      return mixed(bySells(this.ly.products)).slice(0, 6);
    },
    shopTo() {
      return catalogueRoute({});
    },
    contactTo() {
      return { name: window.$storefront.routes.SHOP_CONTACT_US };
    },
    faqTo() {
      return this.$router.hasRoute("ShopFAQ") ? { name: "ShopFAQ" } : this.contactTo;
    },
  },

  created() {
    loadDm();
    this.setPageTitle?.(t("ly.rd.aboutT", "About {shop}", { shop: shopName(this.$store.getters.getShop) }));
    shopProfile(this.$shop.name, "about-us").then((p) => (this.profile = p));
  },

  methods: { t, catTo, catTitle, productImage, bySells, inCat, numberWord, colPhoto: collectionPhoto },
};
</script>
