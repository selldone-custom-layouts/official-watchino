<!--
  The product's tabs (pages-product.js tabs(), nicdark's single
  product): Description (a lead from the product's own spec — its finish,
  "Sold as one <unit>", its pairing, the saving — then the product's own
  article when it has one, and "Why you'll love it": its pros), Additional
  information (the spec in the shop's own groups, the SKU) and Reviews (n).
  Reviews: with none yet, an honest card and the shop's rating criteria,
  each "No score yet" — never stars or numbers; "Write the first review"
  asks a guest to sign in and opens Selldone's own review box for a
  signed-in shopper (only a buyer can rate). With reviews: Selldone's.
  Arrow keys move along the tabs.
-->
<template>
  <section id="tabs" :aria-label="t('ly.pd.details', 'Details')" class="pd-tabs">
    <div class="wrap">
      <div :aria-label="t('ly.pd.detailsAria', 'Product details')" class="tl" role="tablist" @keydown="keys">
        <button
          v-for="tb in tabs"
          :id="'tb-' + tb.k"
          :key="tb.k"
          :aria-controls="'tp-' + tb.k"
          :aria-selected="cur === tb.k ? 'true' : 'false'"
          :tabindex="cur === tb.k ? 0 : -1"
          class="tl-b"
          role="tab"
          type="button"
          @click="cur = tb.k"
        >
          {{ tb.label }}
        </button>
      </div>

      <div id="tp-desc" :hidden="cur !== 'desc'" aria-labelledby="tb-desc" class="tp" role="tabpanel">
        <div :class="['pd-desc', { 'ly-solo': !pros.length }]">
          <div class="pd-lead">
            <p v-for="(l, i) in lead" :key="i">{{ l }}</p>
          </div>
          <template v-if="pros.length">
            <h3 class="pd-sub">{{ t("ly.pd.love", "Why you’ll love it") }}</h3>
            <ul class="pros">
              <li v-for="(x, i) in pros" :key="i">
                <span class="ck"><ly-icon name="check" /></span>
                <div>
                  <b>{{ x[0] }}</b>
                  <p v-if="x[1]">{{ x[1] }}</p>
                </div>
              </li>
            </ul>
          </template>
        </div>
        <div v-if="articleBody" class="ly-pd-article" v-html="articleBody"></div>
      </div>

      <div id="tp-info" :hidden="cur !== 'info'" aria-labelledby="tb-info" class="tp" role="tabpanel">
        <div class="spec">
          <div v-for="g in groups" :key="g.group" class="spec-g">
            <h3 v-if="g.group" class="pd-sub">{{ g.group }}</h3>
            <dl class="spec-t">
              <div v-for="r in g.rows" :key="r[0]">
                <dt>{{ r[0] }}</dt>
                <dd>{{ r[1] }}</dd>
              </div>
            </dl>
          </div>
          <div v-if="product.sku" class="spec-g ly-sku">
            <dl class="spec-t">
              <div>
                <dt>{{ t("ly.pd.sku", "SKU") }}</dt>
                <dd>{{ product.sku }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div id="tp-rev" :hidden="cur !== 'rev'" aria-labelledby="tb-rev" class="tp" role="tabpanel">
        <div v-if="!rated" :class="['revs', { 'ly-solo': !criteria.length }]">
          <ly-empty :text="noReviewsText" :title="t('ly.pd.noReviewsT', 'No reviews yet')" icon="star">
            <template v-if="!writing" #acts>
              <button class="btn sm" type="button" @click="write">{{ user ? t("ly.pd.writeFirst", "Write the first review") : t("ly.pd.signInReview", "Sign in to write a review") }}</button>
            </template>
          </ly-empty>
          <div v-if="criteria.length" class="crit">
            <h3 class="pd-sub">{{ t("ly.pd.willScore", "What reviews will score") }}</h3>
            <ul>
              <li v-for="c in criteria" :key="c">
                <span>{{ c }}</span><span aria-hidden="true" class="crit-bar"></span><span class="crit-v">{{ t("ly.pd.noScore", "No score yet") }}</span>
              </li>
            </ul>
          </div>
        </div>
        <div v-if="rated || writing" class="ly-rv-sd"><kalio-reviews /></div>
      </div>
    </div>
  </section>
</template>

<script>
import LyIcon from "../LyIcon.vue";
import LyEmpty from "../ui/LyEmpty.vue";
import KalioReviews from "../../kalio/product/KalioReviews.vue";
import { percentOff } from "../../kalio/kalio-catalog";
import { prosOf, ratingNames, specGroups, specValue, unitOf } from "../ly";
import { numberWord } from "./pd";
import { EventBus } from "@selldone/components-vue/utils/events/EventBus.ts";
import { t } from "../../kalio/i18n/kalio-i18n";

export default {
  name: "LyProductTabs",
  components: { LyIcon, LyEmpty, KalioReviews },
  props: { product: { type: Object, required: true } },
  data: () => ({ cur: "desc", writing: false }),
  computed: {
    user() {
      return this.$store.getters.getUser;
    },
    rated() {
      return Number(this.product.rate_count) > 0;
    },
    criteria() {
      return ratingNames(this.product);
    },
    pros() {
      return prosOf(this.product).filter((x) => x[0] || x[1]);
    },
    groups() {
      return specGroups(this.product);
    },
    tabs() {
      return [
        { k: "desc", label: t("ly.pd.tabDesc", "Description") },
        { k: "info", label: t("ly.pd.tabInfo", "Additional information") },
        { k: "rev", label: t("ly.pd.tabRev", "Reviews ({n})", { n: Number(this.product.rate_count) || 0 }) },
      ];
    },
    /* The lead: the finish, "Sold as one <unit>, and good with <pairing>",
       the saving. Words the product's own spec gives; nothing invented. */
    lead() {
      const p = this.product;
      const out = [];
      const finish = specValue(p, "Visual Finish") || specValue(p, "Surface");
      if (finish) out.push(finish.charAt(0).toUpperCase() + finish.slice(1).replace(/\.?$/, "."));
      const pairing = specValue(p, "Suggested Pairing");
      const unit = unitOf(p).toLowerCase();
      const off = percentOff(this.$store.getters.getShop, p);
      const sold = pairing ? t("ly.pd.soldPair", "Sold as one {unit}, and good with {pairing}.", { unit, pairing: pairing.toLowerCase() }) : t("ly.pd.sold", "Sold as one {unit}.", { unit });
      out.push(off > 0 ? `${sold} ${t("ly.pd.offIn", "{off}% off, already in the price.", { off })}` : sold);
      return out;
    },
    articleBody() {
      const body = this.product?.article_pack?.article?.body;
      return body && String(body).replace(/<[^>]*>/g, "").trim() ? body : null;
    },
    noReviewsText() {
      const n = this.criteria.length;
      if (!n) return t("ly.pd.noReviewsP0", "Be the first to review the {name}.", { name: this.product.title });
      return t("ly.pd.noReviewsP", "Be the first to review the {name}. Reviews are scored on the {n} points beside this note.", { name: this.product.title, n: numberWord(n).toLowerCase() });
    },
  },
  watch: {
    "product.id"() {
      this.cur = "desc";
      this.writing = false;
    },
  },
  methods: {
    t,
    /* "No reviews yet" in the buy column opens the Reviews tab. */
    open(k) {
      this.cur = k;
      this.$nextTick(() => {
        document.getElementById("tabs")?.scrollIntoView({ behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ? "auto" : "smooth", block: "start" });
        document.getElementById("tb-" + k)?.focus({ preventScroll: true });
      });
    },
    keys(e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const ks = this.tabs.map((x) => x.k);
      const i = ks.indexOf(this.cur);
      const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
      const step = (e.key === "ArrowRight") !== rtl ? 1 : -1;
      this.cur = ks[(i + step + ks.length) % ks.length];
      this.$nextTick(() => document.getElementById("tb-" + this.cur)?.focus());
      e.preventDefault();
    },
    write() {
      if (!this.user) {
        EventBus.$emit("need-login", true);
        return;
      }
      this.writing = true;
    },
  },
};
</script>
