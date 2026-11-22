<!--
  Page not found (design/404-b.html, pages-shop.js "404"):
  inside the Layout, with the header and footer (router: BakiniNotFound).
  Two faint drawings, the outlined 404, "This page is not on the counter"
  and why, a search (Selldone's own catalogue search), "Back to the home
  page" and "See the deals"; then "A few pastries to try instead": six
  best sellers, one collection after another, as cards.
-->
<template>
  <div class="ly ly-404">
    <section aria-labelledby="nf-h" class="nf">
      <ly-art name="cake" wrap="nf-a1" /><ly-art name="whisk" wrap="nf-a2" />
      <div class="wrap nf-in">
        <svg aria-hidden="true" class="nf-num" focusable="false" viewBox="0 0 360 150"><text text-anchor="middle" x="180" y="128">404</text></svg>
        <h1 id="nf-h" class="nf-h">{{ t("ly.nf.h", "This page is not on the counter") }}</h1>
        <p class="nf-p">{{ t("ly.nf.p", "The link may be old, or the page has moved. Search for a pastry, or start again from the home page.") }}</p>
        <form class="nf-srch" role="search" @submit.prevent="go">
          <label class="sr" for="nfq">{{ t("ly.nf.search", "Search the bakery") }}</label><ly-icon name="search" /><input
            id="nfq"
            v-model="q"
            :placeholder="placeholder"
            autocomplete="off"
            enterkeyhint="search"
            type="search"
          /><button class="btn sm" type="submit">{{ t("ly.nf.go", "Search") }}</button>
        </form>
        <div class="nf-acts">
          <router-link :to="{ path: '/' }" class="btn alt">{{ t("ly.nf.home", "Back to the home page") }}</router-link>
          <router-link :to="dealsTo" class="qlink">{{ t("ly.nf.deals", "See the deals") }}</router-link>
        </div>
      </div>
    </section>
    <section v-if="picks.length" aria-labelledby="nft-h" class="sec-s nf-try">
      <div class="wrap">
        <header class="sec-hd sm">
          <p class="eyebrow">{{ t("ly.nf.whileHere", "While you are here") }}</p>
          <h2 id="nft-h" class="h2">{{ t("ly.nf.tryH", "A few pastries to try instead") }}</h2>
        </header>
        <div class="grid six">
          <ly-card v-for="p in picks" :key="p.id" :product="p" />
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import LyIcon from "../../../components/ly/LyIcon.vue";
import LyArt from "../../../components/ly/LyArt.vue";
import LyCard from "../../../components/ly/ui/LyCard.vue";
import { bySells, catTitle, ly, loadDm, mixed } from "../../../components/ly/ly";
import { catalogueRoute, dealsRoute } from "../../../components/kalio/kalio-catalog";
import { t } from "../../../components/kalio/i18n/kalio-i18n";

export default defineComponent({
  name: "StorefrontPageError404",
  components: { LyIcon, LyArt, LyCard },
  data: () => ({ q: "", ly }),
  computed: {
    /* Six best sellers in stock, one collection after another. */
    picks(): any[] {
      return mixed(bySells(this.ly.products.filter((x: any) => x.quantity > 0))).slice(0, 6);
    },
    /* "Search croissants, tarts…" from the shop's own collections. */
    placeholder(): string {
      const names = this.ly.cats.slice(0, 2).map((c: any) => catTitle(c).toLowerCase());
      return names.length ? t("ly.nf.ph", "Search {names}…", { names: names.join(", ") }) : t("ly.nf.search", "Search the bakery");
    },
    dealsTo(): any {
      return dealsRoute();
    },
  },
  created() {
    loadDm();
    (this as any).setPageTitle?.(t("ly.nf.title", "Page not found"));
  },
  methods: {
    t,
    go() {
      const text = this.q.trim();
      const r = (window as any).$storefront.routes;
      this.$router.push(text ? { name: r.SHOP_PAGE, query: { search: text } } : catalogueRoute({}));
    },
  },
});
</script>
