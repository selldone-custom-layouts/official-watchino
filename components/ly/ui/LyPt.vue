<!--
  The page-title band (design/src/shell.js pt()): a quiet family tint, the breadcrumb
  (Home first), the serif title and a lead; one faint drawing. cls: "compact", "slim" (breadcrumb only),
  "art-pt" (the article: its cover overlaps the band). With `photo` (a collection's own photo) or
  `cuts` (its best sellers, when it has no photo) the band is the collection page's: the words left and
  the photo bleeding to the window edge on the right (on a phone, the photo first, inside the gutters).
  The default slot is the band's extra (a search form, the checkout steps, a sample tag).
-->
<template>
  <section :aria-label="label || undefined" :class="['pt', cls, { 'has-ph': hasPh }]">
    <div v-if="hasPh" class="pt-ph">
      <img v-if="photo" :src="photo" alt="" decoding="async" height="1050" width="1400" />
      <ly-cuts v-else :products="cuts" kind="trio" />
    </div>
    <ly-art v-else :name="art" wrap="pt-a1" />
    <div class="wrap pt-in">
      <nav :aria-label="t('ly.pt.crumbs', 'Breadcrumb')" class="crumbs">
        <ol>
          <li>
            <router-link :to="{ path: '/' }">{{ t("ly.pt.home", "Home") }}</router-link>
          </li>
          <li v-for="(c, i) in crumbs" :key="i">
            <router-link v-if="c.to" :to="c.to"><bdi>{{ c.label }}</bdi></router-link>
            <span v-else aria-current="page"><bdi>{{ c.label }}</bdi></span>
          </li>
        </ol>
      </nav>
      <p v-if="eyebrow" class="eyebrow pt-e">{{ eyebrow }}</p>
      <h1 v-if="title" class="pt-h"><bdi>{{ title }}</bdi></h1>
      <p v-if="lead" class="pt-l">{{ lead }}</p>
      <slot />
    </div>
  </section>
</template>

<script>
import LyArt from "../LyArt.vue";
import LyCuts from "../LyCuts.vue";
import { t } from "../../kalio/i18n/kalio-i18n";

export default {
  name: "LyPt",
  components: { LyArt, LyCuts },
  props: {
    crumbs: { type: Array, default: () => [] },
    title: { type: String, default: "" },
    lead: { type: String, default: "" },
    eyebrow: { type: String, default: "" },
    cls: { type: String, default: "" },
    label: { type: String, default: "" },
    art: { type: String, default: "croissant" },
    art2: { type: String, default: "macaron" },
    /** the collection's own photo (url) */
    photo: { type: String, default: "" },
    /** its best sellers, drawn when it has no photo */
    cuts: { type: Array, default: () => [] },
  },
  computed: {
    hasPh() {
      return !!this.photo || this.cuts.length > 0;
    },
  },
  methods: { t },
};
</script>
