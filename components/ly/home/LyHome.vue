<!--
  The home: the skin's sections, in the skin's order (skins/<name>/skin.json "home", each { section, variant, band };
  the library is components/ly/home/sections.json, one component per section in sections/). Every section is
  drawn from the shop's live data only (home-data.ts) and hides itself when the shop has nothing for it; a photo
  slot without its photo shows its designed fallback, never a caption or a file name. Bands alternate white and
  the family tint (scripts/skin-apply.mjs refuses two tints side by side).
-->
<template>
  <div class="ly ly-home">
    <component :is="s.component" v-for="(s, i) in sections" :key="s.section + '-' + i" :band="s.band" :variant="s.variant" />
  </div>
</template>

<script>
import { markRaw } from "vue";
import { SKIN } from "../skin.gen";
import { loadDm } from "../ly";
import HeroSection from "./sections/HeroSection.vue";
import AboutSection from "./sections/AboutSection.vue";
import CountersBand from "./sections/CountersBand.vue";
import CollectionsSection from "./sections/CollectionsSection.vue";
import HowSection from "./sections/HowSection.vue";
import OfferSection from "./sections/OfferSection.vue";
import GallerySection from "./sections/GallerySection.vue";
import SelectionSection from "./sections/SelectionSection.vue";
import PhotoBand from "./sections/PhotoBand.vue";
import MarqueeSection from "./sections/MarqueeSection.vue";
import JournalSection from "./sections/JournalSection.vue";

/* section id (sections.json) -> its component; the variant is a prop the component draws */
const REGISTRY = {
  hero: HeroSection,
  about: AboutSection,
  counters: CountersBand,
  collections: CollectionsSection,
  how: HowSection,
  offer: OfferSection,
  gallery: GallerySection,
  selection: SelectionSection,
  photoband: PhotoBand,
  marquee: MarqueeSection,
  journal: JournalSection,
};

export default {
  name: "LyHome",

  computed: {
    sections() {
      return SKIN.home.filter((s) => REGISTRY[s.section]).map((s) => ({ ...s, component: markRaw(REGISTRY[s.section]) }));
    },
  },

  created() {
    loadDm();
  },
};
</script>
