<!--
  The − n + of a line already in the bag (the bag page, the
  drawer's look): it steps the bag's own line through kalio-basket's queue (a
  tap shows at once; quick taps are never lost); "−" at 1 takes the line out.
-->
<template>
  <div :aria-label="t('ly.add.inBag', '{name} in bag', { name })" class="qb" role="group">
    <button
      :aria-label="n > 1 ? t('ly.add.less', 'Remove one {name}', { name }) : t('ly.add.remove', 'Remove {name} from the bag', { name })"
      type="button"
      @click.prevent.stop="step(-1)"
    >
      <ly-icon name="minus" />
    </button>
    <span aria-live="polite" class="qn">{{ n }}</span>
    <button
      :aria-disabled="n >= max ? 'true' : undefined"
      :aria-label="t('ly.add.more', 'Add one more {name}', { name })"
      :title="n >= max ? t('ly.add.noMore', 'No more in stock') : undefined"
      type="button"
      @click.prevent.stop="n < max && step(1)"
    >
      <ly-icon name="plus" />
    </button>
  </div>
</template>

<script>
import LyIcon from "../LyIcon.vue";
import { shownCount, stepTo } from "../../kalio/kalio-basket";
import { t } from "../../kalio/i18n/kalio-i18n";

export default {
  name: "LyLineQb",
  components: { LyIcon },
  props: { item: { type: Object, required: true } },
  computed: {
    product() {
      return this.item.product || { id: this.item.product_id };
    },
    name() {
      return this.product.title || "";
    },
    n() {
      return shownCount(this.product, this.item);
    },
    max() {
      const q = this.item.vendor_product?.quantity ?? this.item.variant?.quantity ?? this.item.product?.quantity;
      return Number.isFinite(Number(q)) && Number(q) > 0 ? Number(q) : 99;
    },
  },
  methods: {
    t,
    step(d) {
      stepTo(this, { id: this.item.product_id, type: this.item.product?.type }, this.item, this.n + d);
    },
  },
};
</script>
