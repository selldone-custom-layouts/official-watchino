<!--
  The top of the product page (design/product-b.html,
  src/pages-product.js productRender()): the gallery on the left (the pastry
  on its plate with the −25% roundel, one row of thumbnails: Selldone's own
  photos of the product); the buy column on the right, which stays in view
  while the page scrolls: the collection, the name, "Per <unit> · No
  reviews yet" (the reviews' count once there are some; never stars without
  reviews), the price with the struck was-price and "Save $x · n%", the
  deal's own clock only when the deal has a real end date (Selldone's rule),
  the stock, the options (only when the product has real variants: tiles
  with their own photo, the chosen one ringed inside and tinted, no tick;
  Selldone's own picker in the same dress when the variants differ in more
  than one way), "Add to bag" (then − n + in place) beside Compare, and the
  shop's delivery, pickup and payment lines with their icons on one edge.

  On a phone, once the Add box has scrolled away, a buy bar at the foot.

  Every behaviour is Selldone's SProductOverview (through Kalio's): the
  chosen variant, the store, the basket line. A product that needs more than
  a count (a service, a valuation form, extra pricing, a subscription) keeps
  Selldone's own buy section here.
-->
<template>
  <section :aria-label="$product.title" class="pd">
    <div class="wrap pd-in">
      <div class="pd-gal">
        <div class="pd-main">
          <span v-if="pv.off > 0" ref="off" :aria-label="t('ly.card.offAria', '{off} percent off', { off: pv.off })" class="pc-off"><span dir="ltr">−{{ pv.off }}%</span></span>
          <img v-if="photo" :key="photo.src" :alt="photo.alt" :src="photo.src" decoding="async" height="640" loading="eager" width="640" />
        </div>
        <ul v-if="photos.length > 1" :aria-label="t('ly.pd.photos', 'Photos')" class="pd-th">
          <li v-for="(ph, i) in photos" :key="ph.src">
            <button
              :aria-label="t('ly.pd.photoN', 'Photo {n} of {total}', { n: i + 1, total: photos.length })"
              :aria-pressed="i === at ? 'true' : 'false'"
              class="pd-t"
              type="button"
              @click="at = i"
            >
              <img :src="ph.thumb" alt="" loading="lazy" />
            </button>
          </li>
        </ul>
      </div>

      <div class="pd-buy">
        <router-link v-if="cat" :to="catTo(cat)" class="eyebrow pd-cat"><bdi>{{ catName }}</bdi></router-link>
        <h1 class="pd-h">{{ $product.title }}</h1>
        <p class="pd-u">
          {{ t("ly.card.per", "Per {unit}", { unit }) }} ·
          <a class="pd-rv" href="#tabs" @click.prevent="goReviews">{{ reviewsWord }}</a>
        </p>

        <div v-if="isSubscription" class="opts ly-sd-sub">
          <s-subscription-price-select
            v-model="selected_subscription_price"
            :disabled="!$product.quantity"
            :subscription-prices="subscription_prices"
            return-object
          ></s-subscription-price-select>
        </div>
        <template v-else>
          <div class="pd-price">
            <span class="now money">{{ money(pv.now) }}</span><s v-if="pv.was" class="was money">{{ money(pv.was) }}</s
            ><span v-if="pv.save > 0" class="save">{{ t("ly.pd.save", "Save {amount} · {off}%", { amount: money(pv.save), off: pv.off }) }}</span>
          </div>
          <p v-if="dealEndsAt" class="pd-stock ly-pd-deal"><ly-icon name="clock" />{{ t("ly.pd.dealEnds", "Deal ends in") }}{{ " " }}<bakini-deal-clock :end="dealEndsAt" mode="bare" /></p>
        </template>
        <s-product-section-tax></s-product-section-tax>

        <p :class="['pd-stock', { low: stock > 0 && stock <= 5, out: stock <= 0 }]">
          <span aria-hidden="true" class="dot"></span
          ><template v-if="stock <= 0">{{ t("ly.pd.soldOut", "Sold out") }}</template
          ><template v-else-if="stock <= 5">{{ t("ly.card.onlyLeftCap", "Only {n} left", { n: stock }) }}</template
          ><template v-else>{{ stockLine }}</template>
        </p>
        <p v-if="!has_original_warranty" class="pd-u">{{ $t("product_info.fake") }}</p>

        <!-- Options: only for a product that really has them. -->
        <div v-if="tiles.length" class="opts">
          <p class="opts-l">
            {{ dimWord }}<span v-if="currentLabel" class="opts-v">{{ currentLabel }}</span>
          </p>
          <div :aria-label="dimWord" class="opts-g" role="radiogroup">
            <button
              v-for="tl in tiles"
              :key="tl.v.id"
              :aria-checked="current_variant && current_variant.id === tl.v.id ? 'true' : 'false'"
              :class="['opt', { '-out': !(tl.v.quantity > 0) }]"
              role="radio"
              type="button"
              @click="current_variant = tl.v"
            >
              <span class="opt-ph"><img v-if="tl.img" :src="tl.img" alt="" loading="lazy" /><i v-else-if="tl.swatch" :style="{ background: tl.swatch }" aria-hidden="true" class="ly-opt-sw"></i></span>
              <span class="opt-n">{{ tl.label }}</span>
              <small v-if="tl.price !== null" class="opt-p money">{{ money(tl.price) }}</small>
            </button>
          </div>
        </div>
        <div v-else-if="product_variants.length" class="opts ly-sd-variants">
          <s-product-section-variants
            v-model:current-variant="current_variant"
            v-model:filter="filter"
            v-model:selection-values="selection_values"
          ></s-product-section-variants>
        </div>

        <div class="ly-sd-more">
          <s-product-section-service v-model:preferences="preferences"></s-product-section-service>
          <s-product-section-valuation
            v-if="preferences && preferences.valuation"
            :correspondingBasketItem="corresponding_basket_item"
            :current-variant="current_variant"
            :preferences="preferences"
          ></s-product-section-valuation>
          <s-product-section-extra-pricings
            :current-variant="current_variant"
            :preferences="preferences"
            :quantity="corresponding_basket_item?.count"
            :selected-vendor-product="selected_vendor_product"
            @select="(val) => $refs.buy_section?.triggerBuyButton(val.min)"
          ></s-product-section-extra-pricings>
        </div>

        <div id="pd-acts" ref="add" class="pd-acts">
          <div class="pd-add">
            <ly-pd-add v-if="simple" :needs-choice="needsChoice" :product="$product" :variant="current_variant" />
            <s-product-section-buy-button
              v-else
              ref="buy_section"
              :can-buy="canBuy"
              :current-variant="current_variant"
              :hss-sticky-but-button="hssStickyButButton"
              :preferences="preferences"
              :quick-buy-mode="quickBuyMode"
              :selected-subscription-price="selected_subscription_price"
              :selected-vendor-product="selected_vendor_product"
              class="ly-sd-buy"
            ></s-product-section-buy-button>
          </div>
          <button class="btn soft cmpb" type="button" @click="compareNow"><ly-icon name="compare" />{{ t("ly.pd.compare", "Compare") }}</button>
        </div>

        <ul v-if="lines.length" class="ils">
          <ly-ic-line v-for="l in lines" :key="l.key" :icon="l.icon" :text="l.line" :title="l.title" />
        </ul>
      </div>
    </div>

    <!-- The phone's buy bar, once the Add box has scrolled away. -->
    <teleport to="body">
      <div class="ly ly-layers">
        <div :aria-hidden="barOn ? undefined : 'true'" :class="['buybar', { on: barOn }]">
          <div class="wrap bb-in">
            <span class="bb-pl"><img v-if="photos[0]" :src="photos[0].thumb" alt="" /></span>
            <span class="bb-tx"
              ><b>{{ $product.title }}</b
              ><span
                ><span class="now money">{{ money(pv.now) }}</span><template v-if="pv.was">{{ " " }}<s class="was money">{{ money(pv.was) }}</s></template></span
              ></span
            >
            <div class="bb-a">
              <ly-pd-add v-if="simple" :needs-choice="needsChoice" :product="$product" :variant="current_variant" />
              <button v-else class="btn sm" type="button" @click="toAdd">{{ t("ly.add.add", "Add to bag") }}</button>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  </section>
</template>

<script>
import KalioProductOverview from "../../kalio/product/KalioProductOverview.vue";
import BakiniDealClock from "../../bakini/BakiniDealClock.vue";
import LyIcon from "../LyIcon.vue";
import LyIcLine from "../ui/LyIcLine.vue";
import LyPdAdd from "./LyPdAdd.vue";
import { catOf, catTitle, catTo, ly, money, priceView, unitOf } from "../ly";
import { deliveryLines, galleryOf, isEnglish, plural } from "./pd";
import { colourName, dealEnd, moneyOf, swatchBg, variantDimension } from "../../bakini/bakini";
import { currentCurrency } from "../../region-switcher/region";
import { fitInCircle } from "../../bakini/fit-in-circle";
import { fitOnResize } from "../ly-fit";
import { t } from "../../kalio/i18n/kalio-i18n";

export default {
  name: "LyProductOverview",
  extends: KalioProductOverview,
  components: { BakiniDealClock, LyIcon, LyIcLine, LyPdAdd },
  emits: ["reviews"],

  data() {
    return { at: 0, barOn: false, ly };
  },

  computed: {
    currency() {
      return currentCurrency();
    },
    cat() {
      return this.$product?.category || catOf(this.$product?.category_id);
    },
    catName() {
      return catTitle(this.cat);
    },
    unit() {
      return unitOf(this.$product);
    },
    pv() {
      void this.currency;
      return priceView(this.shop || this.$shop, this.$product, this.current_variant);
    },
    dealEndsAt() {
      return dealEnd(this.$product, this.current_variant);
    },
    photos() {
      return galleryOf(this.$product, this.current_variant);
    },
    photo() {
      return this.photos[Math.min(this.at, this.photos.length - 1)] || null;
    },
    stock() {
      const n = this.current_variant ? this.current_variant.quantity : this.$product.quantity;
      return Number(n) || 0;
    },
    stockLine() {
      const n = this.stock;
      if (isEnglish()) return t("ly.pd.inStockUnits", "In stock · {n} {units} ready", { n, units: plural(this.unit, n) });
      return t("ly.pd.inStockN", "In stock · {n} ready", { n });
    },
    reviewsWord() {
      const n = Number(this.$product.rate_count) || 0;
      return n ? t("ly.pd.reviewsN", { one: "{n} review", other: "{n} reviews" }, { n }) : t("ly.pd.noReviews", "No reviews yet");
    },
    lines() {
      return deliveryLines(this.shop || this.$shop);
    },
    enabledVariants() {
      return this.product_variants.filter((v) => v.enable !== false && v.enable !== 0);
    },
    dimension() {
      return variantDimension(this.enabledVariants);
    },
    dimWord() {
      const k = this.dimension?.key;
      if (k === "color") return t("ly.pd.colour", "Colour");
      const w = this.dimension?.word || t("ly.pd.option", "Option");
      return w.charAt(0).toUpperCase() + w.slice(1);
    },
    /* One dimension: a tile per variant with its own photo and price. */
    tiles() {
      const d = this.dimension;
      if (!d || d.key === "mixed") return [];
      return this.enabledVariants.map((v) => {
        const own = v.pricing && v.price != null;
        return {
          v,
          img: v.image ? window.CDN.GET_SHOP_IMAGE_PATH(v.image, 128) : d.key === "color" ? null : window.CDN.GET_SHOP_IMAGE_PATH(this.$product.icon, 128),
          swatch: d.key === "color" ? swatchBg(v.color) : null,
          label: d.key === "color" ? colourName(v.color) || t("ly.pd.colour", "Colour") : v[d.key],
          price: own ? moneyOf(this.shop, this.$product, v, this.currency).now : null,
        };
      });
    },
    currentLabel() {
      const x = this.tiles.find((y) => this.current_variant && y.v.id === this.current_variant.id);
      return x ? x.label : "";
    },
    needsChoice() {
      return this.product_variants.length > 0 && !this.current_variant;
    },
    /* A plain product: the add box; anything Selldone's own button knows
       more about keeps that button. */
    simple() {
      const p = this.$product;
      if (!p || this.isSubscription) return false;
      if ((p.type || "PHYSICAL") !== "PHYSICAL") return false;
      if (this.preferences && (this.preferences.valuation || this.preferences.service)) return false;
      if (p.valuation || (p.extra_pricings && p.extra_pricings.length)) return false;
      return true;
    },
    comparing() {
      return (this.$store.getters.getProductsComparison || []).some((p) => p.id === this.$product.id);
    },
  },

  watch: {
    "$product.id"() {
      this.at = 0;
    },
    "current_variant.id"() {
      this.at = 0;
    },
    "pv.off"() {
      this.$nextTick(() => fitInCircle(this.$refs.off));
    },
  },

  mounted() {
    this.unfit = fitOnResize(() => fitInCircle(this.$refs.off));
    document.documentElement.classList.add("ly-buybar");
    this.$nextTick(() => fitInCircle(this.$refs.off));
    document.fonts?.ready?.then(() => fitInCircle(this.$refs.off));
    if (typeof IntersectionObserver !== "undefined" && this.$refs.add) {
      this.io = new IntersectionObserver(
        (entries) => {
          const e = entries[entries.length - 1];
          this.barOn = !!e && !e.isIntersecting;
        },
        /* the box counts as "in view" while it is anywhere below the top of the window, so the bar
           shows only once it has scrolled away above, and hides again on the way back up */
        { threshold: 0, rootMargin: "0px 0px 100000px 0px" },
      );
      this.io.observe(this.$refs.add);
    }
  },

  beforeUnmount() {
    this.unfit?.();
    document.documentElement.classList.remove("ly-buybar");
    this.io?.disconnect();
  },

  methods: {
    t,
    money,
    catTo,
    goReviews() {
      this.$emit("reviews");
    },
    /* Add this pastry to Selldone's comparison and open the Layout's compare
       page: what the shopper already compares, else this with two of its own
       collection's best sellers. */
    compareNow() {
      if (!this.comparing) this.addToProductComparison(this.$product, this.current_variant, true);
      const stored = (this.$store.getters.getProductsComparison || []).map((p) => ({ p: p.id, v: p.variant?.id || null }));
      let refs = stored.filter((r) => r.p !== this.$product.id);
      refs.unshift({ p: this.$product.id, v: this.current_variant?.id || null });
      if (refs.length < 2) {
        const mates = this.ly.products
          .filter((p) => p.category_id === this.$product.category_id && p.id !== this.$product.id)
          .sort((a, b) => (b.sells || 0) - (a.sells || 0))
          .slice(0, 2);
        refs = refs.concat(mates.map((p) => ({ p: p.id, v: null })));
      }
      const list = refs
        .slice(0, 4)
        .map((r) => `p${r.p}${r.v ? `v${r.v}` : ""}`)
        .join("_");
      this.$router.push({ name: window.$storefront.routes.COMPARISON_PAGE, query: { list } });
    },
    toAdd() {
      this.$refs.add?.scrollIntoView({ behavior: "smooth", block: "center" });
    },
  },
};
</script>
