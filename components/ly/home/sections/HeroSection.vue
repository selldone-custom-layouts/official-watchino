<!--
  The home's "Hero" section (sections.json "hero"). Every word and number from the shop's live data
  (home-data.ts); a slot without its photo shows its designed fallback, never a caption or a file name.
-->
<template>
  <section aria-labelledby="hero-h" :class="['hero', { 'v-mirror': variant === 'mirror' }]">
    <div class="hero-in">
      <div class="hero-copy">
        <h1 id="hero-h" class="hero-h">
          <span class="l1"><bdi>{{ shopName }}</bdi></span><span class="l2">{{ t("ly.home.tagline", "Pastry, one by one") }}</span>
        </h1>
        <div class="hero-sub">
          <p class="eyebrow">{{ t("ly.home.heroEyebrow", "What we bake") }}</p>
          <h2 class="h2">{{ t("ly.home.heroH", "Every pastry, sold on its own") }}</h2>
          <p v-if="ready && heroLead" class="lead">{{ heroLead }}</p>
          <a class="btn" href="#collections" @click.prevent="jump('collections')">{{ t("ly.home.heroBtn", "Shop the collections") }}</a>
        </div>
      </div>
      <div class="hero-media">
        <ly-photo :alt="t('ly.home.heroAlt', 'The counter')" :art="art('hero-back', 'cake')" class="hero-back" deep eager name="hero-back" pos="64% 50%">
          <template v-if="bandPieces.length" #fallback><ly-cuts :products="bandPieces.slice(0, 3)" kind="trio" /></template>
        </ly-photo>
        <figure class="hero-inset">
          <ly-photo :art="art('hero-inset', 'cupcake')" class="hi-ph" eager name="hero-inset">
            <template v-if="insetPiece" #fallback><ly-cuts :products="[insetPiece]" kind="one" /></template>
          </ly-photo>
          <figcaption v-if="best[0]" class="hi-cap">
            <span class="hi-k">{{ t("ly.home.mostOrdered", "Most ordered") }}</span>
            <router-link :to="productTo(best[0])" class="hi-n">{{ best[0].title }}</router-link>
            <span class="hi-p"><span class="now money">{{ money(pv(best[0]).now) }}</span><template v-if="pv(best[0]).was">{{ " " }}<s class="was money">{{ money(pv(best[0]).was) }}</s></template></span>
          </figcaption>
        </figure>
      </div>
      <ul v-if="rank.length" :aria-label="t('ly.home.heroWords', 'Most ordered collections')" class="hero-words" data-over-photo>
        <li v-for="x in rank.slice(0, 3)" :key="x.c.id">
          <router-link :to="catTo(x.c)"><bdi>{{ catTitle(x.c) }}</bdi></router-link>
        </li>
      </ul>
    </div>
  </section>
</template>

<script>
import LyPhoto from "../../LyPhoto.vue";
import LyCuts from "../../LyCuts.vue";
import homeData from "../home-data";

export default {
  name: "HeroSection",
  components: { LyPhoto, LyCuts },
  mixins: [homeData],
};
</script>
