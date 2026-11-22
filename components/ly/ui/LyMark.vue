<!--
  The shop's monogram (pages.css .mark): the title's first letter in Cormorant Garamond on the
  family dark, the avatar of the order's messages, the account and the map's pin. From the live title (or
  BRAND.name), never written in. sm: the 32px one beside a message.
-->
<template>
  <span :class="['mark', { sm }]" aria-hidden="true"><i>{{ letter }}</i></span>
</template>

<script>
import { BRAND } from "../../kalio/kalio-brand";

export default {
  name: "LyMark",
  inject: { $shop: { default: null } },
  props: { sm: { type: Boolean, default: false }, word: { type: String, default: "" } },
  computed: {
    letter() {
      const w = (this.word || BRAND.name || this.$shop?.title || "").trim();
      return Array.from(w)[0]?.toUpperCase() || "";
    },
  },
};
</script>
