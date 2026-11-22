<!--
  Watchino's signature: the chapter-ring index rail, fixed down the left edge (the right edge in a right-to-left
  language) from 1024 px up. Minute markers, every fifth one longer; the blued marker travels down the ring as the
  page scrolls (scroll progress). The shop's name at the top; at the foot, the page's own reference (a product's
  id, a collection's name), else nothing. Hidden below 1024 px, as on the static site.
-->
<template>
  <aside aria-hidden="true" class="ly wt-rail">
    <span class="wt-rail-l"><bdi>{{ shopName }}</bdi></span>
    <div class="wt-rail-t"><span :style="{ top: pct + '%' }" class="wt-rail-m"></span></div>
    <span class="wt-rail-l">{{ foot }}</span>
  </aside>
</template>

<script>
import { t } from "../../kalio/i18n/kalio-i18n";
import { catOf, catTitle } from "../ly";

export default {
  name: "WtRail",
  data: () => ({ pct: 0 }),
  computed: {
    shopName() {
      return String(this.$store.getters.getShop?.title || "").toUpperCase();
    },
    foot() {
      const r = this.$route || {};
      if (r.params?.product_id) return t("wt.rail.ref", "Ref. {id}", { id: r.params.product_id });
      return "";
    },
  },
  mounted() {
    this.onScroll = () => {
      const h = document.documentElement.scrollHeight - innerHeight;
      this.pct = h > 0 ? Math.min(100, Math.max(0, (scrollY / h) * 100)) : 0;
    };
    addEventListener("scroll", this.onScroll, { passive: true });
    addEventListener("resize", this.onScroll, { passive: true });
    this.onScroll();
  },
  beforeUnmount() {
    removeEventListener("scroll", this.onScroll);
    removeEventListener("resize", this.onScroll);
  },
  methods: { catOf, catTitle },
};
</script>
