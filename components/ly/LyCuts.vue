<!--
  Live cut-outs of the shop's own pastries, the designed stand-in
  for a photo that is not in the build yet (a collection photo, or a the Layout
  slot that shows pastries). The cut-outs are Selldone's transparent product
  photos (640 px), never shown larger than they are, each inside its own
  box (object-fit: contain), arranged by `kind`:

  - "one": one piece, centred (the hero's framed photo, the offer card);
  - "trio": three pieces on the collection's plate (collection photos);
  - "spread": up to five pieces loosely across a counter (About);
  - "row": up to five pieces in a row (the photo band).
-->
<template>
  <span :class="['ly-cuts', '-' + kind]" aria-hidden="true">
    <span v-for="(p, i) in shown" :key="p.id" :class="['ly-cut', 'c' + i]"><img :src="src(p)" alt="" decoding="async" draggable="false" loading="lazy" /></span>
  </span>
</template>

<script>
import { productImage } from "./ly";

const MAX = { one: 1, trio: 3, spread: 5, row: 5 };

export default {
  name: "LyCuts",
  props: {
    products: { type: Array, default: () => [] },
    kind: { type: String, default: "trio" },
  },
  computed: {
    shown() {
      return this.products.filter((p) => p && p.icon).slice(0, MAX[this.kind] || 3);
    },
  },
  methods: {
    src(p) {
      return productImage(p);
    },
  },
};
</script>
