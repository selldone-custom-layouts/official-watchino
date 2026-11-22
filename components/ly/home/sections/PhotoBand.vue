<!--
  The home's "Photo band" section (sections.json "photoband"). Every word and number from the shop's live data
  (home-data.ts); a slot without its photo shows its designed fallback, never a caption or a file name.
-->
<template>
  <section :aria-label="t('ly.home.bandAria', 'Photo band')" class="pband">
    <ly-photo :alt="t('ly.home.bandAlt', 'Pastries in the warm light of the shop')" :art="art('parallax', 'croissant')" class="pb-ph" deep name="parallax">
      <template v-if="bandPieces.length" #fallback><ly-cuts :products="bandPieces" kind="row" /></template>
      <a :aria-label="t('ly.home.toMarquee', 'Scroll to the collections')" class="pb-down" href="#marquee" @click.prevent="jump('marquee')"><ly-icon name="down" /></a>
    </ly-photo>
  </section>
</template>

<script>
import LyIcon from "../../LyIcon.vue";
import LyPhoto from "../../LyPhoto.vue";
import LyCuts from "../../LyCuts.vue";
import homeData from "../home-data";

export default {
  name: "PhotoBand",
  components: { LyIcon, LyPhoto, LyCuts },
  mixins: [homeData],
};
</script>
