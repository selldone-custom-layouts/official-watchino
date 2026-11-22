<!--
  the Layout — "Buy together" (pages-product.js together()): this pastry and the
  best seller of the two best-selling other collections, each with a tick
  (all ticked to begin), the live total with the was-price and "You save",
  and "Add all three to bag" (the count follows the ticks). The page's
  product needs a chosen option before it can join. From the live catalogue.
-->
<template>
  <section v-if="items.length > 1" aria-labelledby="bt-h" class="bt-s">
    <div class="wrap">
      <div class="bt">
        <div class="bt-hd">
          <p class="eyebrow">{{ t("ly.pd.btEyebrow", "Buy together") }}</p>
          <h2 id="bt-h" class="h2">{{ title }}</h2>
          <p class="lead">{{ lede }}</p>
        </div>
        <ul :class="['bt-l', 'n' + items.length]">
          <li v-for="(x, i) in items" :key="x.p.id" class="bt-i">
            <label class="bt-c"
              ><span class="cbx-w"
                ><input
                  :aria-label="i === 0 ? t('ly.pd.btThis', '{name} (this pastry)', { name: x.p.title }) : x.p.title"
                  :checked="!!picked[x.p.id]"
                  :disabled="i === 0 && !mainReady"
                  class="cbx"
                  type="checkbox"
                  @change="picked = { ...picked, [x.p.id]: $event.target.checked }" /><ly-icon cls="cbx-i" name="check" /></span
            ></label>
            <router-link :to="productTo(x.p)" aria-hidden="true" class="bt-pl" tabindex="-1"><img :src="img(x.p)" alt="" loading="lazy" /></router-link>
            <div class="bt-tx">
              <span class="pc-c"
                ><bdi>{{ i === 0 ? t("ly.pd.btThisK", "This pastry") : catTitle(catOf(x.p.category_id)) }}</bdi></span
              ><router-link :to="productTo(x.p)" class="bt-n">{{ x.p.title }}</router-link
              ><span class="bt-p"
                ><span class="now money">{{ money(x.v.now) }}</span><template v-if="x.v.was">{{ " " }}<s class="was money">{{ money(x.v.was) }}</s></template></span
              >
            </div>
          </li>
        </ul>
        <div class="bt-sum">
          <p class="bt-k">{{ t("ly.pd.btTogether", "Together") }}</p>
          <p class="bt-tot">
            <span class="now money">{{ money(sum.now) }}</span><template v-if="sum.save > 0">{{ " " }}<s class="was money">{{ money(sum.was) }}</s></template>
          </p>
          <p class="bt-sv">{{ chosen.length ? (sum.save > 0 ? t("ly.pd.btSave", "You save {amount}", { amount: money(sum.save) }) : " ") : t("ly.pd.btTick", "Tick the pieces to add") }}</p>
          <button :aria-disabled="!chosen.length || busy ? 'true' : undefined" class="btn" type="button" @click="addAll">
            <ly-icon :name="done ? 'check' : 'bag'" /><span>{{ addLabel }}</span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import LyIcon from "../LyIcon.vue";
import { catOf, catTitle, ly, loadDm, money, priceView, productImage, productTo, unitOf } from "../ly";
import { numberWord, togetherFor } from "./pd";
import { addCount } from "../../kalio/kalio-basket";
import { currentCurrency } from "../../region-switcher/region";
import { t } from "../../kalio/i18n/kalio-i18n";

export default {
  name: "LyTogether",
  components: { LyIcon },
  props: {
    product: { type: Object, required: true },
    variant: { type: Object, default: null },
  },
  data: () => ({ ly, picked: {}, busy: false, done: false }),
  computed: {
    shop() {
      return this.$store.getters.getShop;
    },
    mainReady() {
      return !(this.product.product_variants || []).length || !!this.variant;
    },
    items() {
      void currentCurrency();
      void this.ly.products.length;
      const list = [{ p: this.product, variant: this.variant }].concat(togetherFor(this.product).map((p) => ({ p, variant: null })));
      return list.map((x) => ({ ...x, v: priceView(this.shop, x.p, x.variant) }));
    },
    chosen() {
      return this.items.filter((x) => this.picked[x.p.id] && (x.p.id !== this.product.id || this.mainReady));
    },
    sum() {
      let now = 0;
      let was = 0;
      for (const x of this.chosen) {
        now += x.v.now;
        was += x.v.was || x.v.now;
      }
      return { now, was, save: Math.max(0, was - now) };
    },
    title() {
      const n = this.items.length;
      return n === 2 ? t("ly.pd.btTitle2", "A pair for the morning") : t("ly.pd.btTitle", "A morning for {n}", { n: numberWord(n).toLowerCase() });
    },
    lede() {
      const n = this.items.length - 1;
      const unit = unitOf(this.product).toLowerCase();
      if (n === 1) return t("ly.pd.btLede1", "This {unit} with a favourite from another collection.", { unit });
      return t("ly.pd.btLede", "This {unit} with {n} favourites from other collections.", { unit, n: numberWord(n).toLowerCase() });
    },
    addLabel() {
      if (this.done) return t("ly.pd.btInBag", "In your bag");
      const n = this.chosen.length;
      if (!n) return t("ly.add.add", "Add to bag");
      if (n === this.items.length && n > 1) return n === 2 ? t("ly.pd.btBoth", "Add both to bag") : t("ly.pd.btAll", "Add all {n} to bag", { n: numberWord(n).toLowerCase() });
      return t("ly.pd.btSome", { one: "Add one to bag", other: "Add {w} to bag" }, { n, w: numberWord(n).toLowerCase() });
    },
  },
  watch: {
    items: {
      handler(list) {
        const next = { ...this.picked };
        for (const x of list) if (!(x.p.id in next)) next[x.p.id] = true;
        this.picked = next;
      },
      immediate: true,
    },
    "product.id"() {
      this.picked = {};
      this.done = false;
    },
  },
  created() {
    loadDm();
  },
  beforeUnmount() {
    clearTimeout(this.timer);
  },
  methods: {
    t,
    money,
    catOf,
    catTitle,
    productTo,
    img(p) {
      return productImage(p);
    },
    async addAll() {
      if (!this.chosen.length || this.busy) return;
      this.busy = true;
      try {
        for (const x of this.chosen) await addCount(this, x.p, x.variant, 1);
        this.done = true;
        clearTimeout(this.timer);
        this.timer = setTimeout(() => (this.done = false), 1600);
      } finally {
        this.busy = false;
      }
    },
  },
};
</script>
