<!--
  The product card (design/src/shell.js card(); set A): an open card (no box) with a
  tinted plate (a fixed square, the cut-out contained), the near-black −25% roundel and the quick-view
  disc in the plate's top corners (no words there); then, left-aligned, the collection, the name (two
  lines), "Per <unit>" (and "only n left" when five or fewer), the price with the struck was-price and
  the saving, and "Add to bag", which turns into − n + in place (LyAdd). The roundel's words always fit
  their circle (fit-in-circle).
-->
<template>
  <article :class="['pc', cls]" :style="delay != null ? { '--d': delay + 'ms' } : null">
    <div class="pc-plate">
      <router-link :to="to" aria-hidden="true" class="pc-ph" tabindex="-1">
        <img
          :loading="eager ? 'eager' : 'lazy'"
          :src="img"
          :srcset="srcset"
          alt=""
          decoding="async"
          draggable="false"
          height="640"
          sizes="(max-width: 760px) 40vw, 200px"
          width="640"
          @error="dropSrcset"
        />
      </router-link>
      <span v-if="pv.off > 0" ref="off" :aria-label="t('ly.card.offAria', '{off} percent off', { off: pv.off })" class="pc-off"><span dir="ltr">−{{ pv.off }}%</span></span>
      <button :aria-label="t('ly.card.quick', 'Quick view: {name}', { name: product.title })" aria-controls="qv" class="pc-qv" type="button" @click="quick($event)">
        <ly-icon name="eye" />
      </button>
    </div>
    <div class="pc-tx">
      <p v-if="!noCat && catName" class="pc-c"><bdi>{{ catName }}</bdi></p>
      <h3 class="pc-t">
        <router-link :to="to">{{ product.title }}</router-link>
      </h3>
      <p class="pc-u">
        {{ t("ly.card.per", "Per {unit}", { unit }) }}<template v-if="low">{{ " · " }}<span class="low">{{ t("ly.card.onlyLeft", "only {n} left", { n: product.quantity }) }}</span></template>
      </p>
      <p class="pc-ly">
        <span class="now money">{{ money(pv.now) }}</span><template v-if="pv.was">{{ " " }}<s class="was money">{{ money(pv.was) }}</s></template
        ><span v-if="pv.save > 0" class="pc-sv">{{ t("ly.card.save", "Save {amount}", { amount: money(pv.save) }) }}</span>
      </p>
      <div class="pc-add"><ly-add :product="product" /></div>
    </div>
  </article>
</template>

<script>
import LyIcon from "../LyIcon.vue";
import LyAdd from "../LyAdd.vue";
import { catOf, catTitle, money, openQuick, priceView, productImage, productTo, unitOf } from "../ly";
import { dropSrcset, productSrcset } from "../../kalio/kalio-catalog";
import { currentCurrency } from "../../region-switcher/region";
import { fitInCircle } from "../../bakini/fit-in-circle";
import { fitOnResize } from "../ly-fit";
import { t } from "../../kalio/i18n/kalio-i18n";

export default {
  name: "LyCard",
  components: { LyIcon, LyAdd },
  props: {
    product: { type: Object, required: true },
    noCat: Boolean,
    eager: Boolean,
    cls: { type: [String, Array, Object], default: "" },
    delay: { type: Number, default: null },
  },
  computed: {
    shop() {
      return this.$store.getters.getShop;
    },
    pv() {
      void currentCurrency();
      return priceView(this.shop, this.product);
    },
    to() {
      return productTo(this.product);
    },
    img() {
      return productImage(this.product);
    },
    srcset() {
      return productSrcset(this.product);
    },
    unit() {
      return unitOf(this.product);
    },
    low() {
      const q = Number(this.product.quantity);
      return q > 0 && q <= 5;
    },
    catName() {
      return catTitle(catOf(this.product.category_id));
    },
  },
  watch: {
    "pv.off"() {
      this.$nextTick(() => fitInCircle(this.$refs.off));
    },
  },
  beforeUnmount() {
    this.unfit?.();
  },
  mounted() {
    this.unfit = fitOnResize(() => fitInCircle(this.$refs.off));
    this.$nextTick(() => fitInCircle(this.$refs.off));
    document.fonts?.ready?.then(() => fitInCircle(this.$refs.off));
  },
  methods: {
    t,
    money,
    dropSrcset,
    quick(e) {
      openQuick(this.product, e.currentTarget);
    },
  },
};
</script>
