<!--
  The add box (design/src/shell.js addBox()): "Add to bag"
  (a flat pill), then − n + in its place. The count is the bag's own line
  (kalio-basket's queue through the shared buy mixin: a tap shows at once,
  the requests go out one at a time, quick taps are never lost). The "+"
  takes the focus when the box appears, so the keyboard stays on it. No
  toast: the box itself answers. A product with options goes to its page
  ("Choose options"); a sold-out one says so.

  alt: the cocoa button (the mockup's every other selection row).
-->
<template>
  <router-link v-if="choose" :to="productTo" class="btn sm add">{{ t("ly.add.choose", "Choose options") }}</router-link>
  <button v-else-if="soldOut && !q" class="btn sm add" disabled type="button">{{ t("ly.add.soldOut", "Sold out") }}</button>
  <button
    v-else-if="!q"
    :aria-label="t('ly.add.addAria', 'Add {name} to bag', { name: product.title })"
    :class="['btn', 'sm', 'add', { alt }]"
    type="button"
    @click.prevent.stop="add()"
  >
    {{ label || t("ly.add.add", "Add to bag") }}
  </button>
  <div v-else :aria-label="t('ly.add.inBag', '{name} in bag', { name: product.title })" class="qb" role="group">
    <button :aria-label="t('ly.add.less', 'Remove one {name}', { name: product.title })" type="button" @click.prevent.stop="step(-1)">
      <ly-icon name="minus" />
    </button>
    <span aria-live="polite" class="qn">{{ q }}</span>
    <button
      ref="plus"
      :aria-disabled="full ? 'true' : undefined"
      :aria-label="t('ly.add.more', 'Add one more {name}', { name: product.title })"
      :title="full ? t('ly.add.noMore', 'No more in stock') : undefined"
      type="button"
      @click.prevent.stop="!full && step(1)"
    >
      <ly-icon name="plus" />
    </button>
  </div>
</template>

<script>
import BuyMixin from "../bakini/bakini-buy";
import LyIcon from "./LyIcon.vue";
import { t } from "../kalio/i18n/kalio-i18n";

export default {
  name: "LyAdd",
  components: { LyIcon },
  mixins: [BuyMixin],
  props: {
    product: { type: Object, required: true },
    label: { type: String, default: "" },
    alt: { type: Boolean, default: false },
  },
  computed: {
    q() {
      return this.choose ? 0 : this.shown || 0;
    },
    full() {
      if (this.soldOut) return true;
      const max = Number(this.variant ? this.variant.quantity : this.product.quantity);
      return Number.isFinite(max) && max > 0 && this.q >= max;
    },
  },
  watch: {
    /* The box replaced the button that had the focus: the focus moves to "+". */
    q(now, before) {
      if (before === 0 && now > 0 && this.hadFocus) this.$nextTick(() => this.$refs.plus?.focus({ preventScroll: true }));
    },
  },
  methods: {
    t,
    add() {
      this.hadFocus = this.$el?.contains?.(document.activeElement) || document.activeElement === this.$el;
      BuyMixin.methods.add.call(this);
    },
  },
};
</script>
