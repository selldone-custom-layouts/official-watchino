<!--
  The home's "Gallery" section (sections.json "gallery"). Every word and number from the shop's live data
  (home-data.ts); a slot without its photo shows its designed fallback, never a caption or a file name.
-->
<template>
  <section v-if="gallery" aria-labelledby="gal-h" :class="['sec', 'gal', { band }]">
    <div class="wrap">
      <header class="sec-hd">
        <p class="eyebrow">{{ t("ly.home.galEyebrow", "Creative by nature") }}</p>
        <h2 id="gal-h" class="h2">{{ t("ly.home.galH", "{n} collections at the counter", { n: capital(numWord(cats.length)) }) }}</h2>
      </header>
      <div class="g">
        <div v-for="col in gallery.cols" :key="col.k" :class="['gc', col.k]">
          <template v-for="tile in col.tiles" :key="tile.key">
            <router-link v-if="tile.cat" :class="['gt', tile.r]" :to="catTo(tile.cat)">
              <img v-if="colPhoto(tile.cat)" :src="colPhoto(tile.cat)" alt="" decoding="async" loading="lazy" />
              <ly-cuts v-else :products="bySells(inCat(tile.cat.id))" kind="trio" />
              <span class="g-lb"><bdi>{{ catTitle(tile.cat) }}</bdi></span>
            </router-link>
            <router-link v-else :class="['gt', 'plate', tile.r]" :to="productTo(tile.p)">
              <span class="pl"><img :src="img(tile.p)" alt="" loading="lazy" /></span>
              <span class="g-lb">{{ tile.p.title }}</span>
            </router-link>
          </template>
          <router-link v-if="col.centre" :to="catTo(col.centre)" class="gt centre">
            <img v-if="colPhoto(col.centre)" :src="colPhoto(col.centre)" alt="" decoding="async" loading="lazy" />
            <ly-cuts v-else :products="bySells(inCat(col.centre.id))" kind="trio" />
            <span class="g-frame">
              <span class="g-e"><bdi>{{ catTitle(col.centre) }}</bdi></span>
              <span class="g-h">{{ t("ly.home.galFrame", "{n} collections, sold one by one", { n: capital(numWord(cats.length)) }) }}</span>
              <span class="g-more">{{ t("ly.home.shopCol", "Shop {name}", { name: catTitle(col.centre) }) }}<ly-icon name="arrow" /></span>
            </span>
          </router-link>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import LyIcon from "../../LyIcon.vue";
import LyCuts from "../../LyCuts.vue";
import homeData from "../home-data";

export default {
  name: "GallerySection",
  components: { LyIcon, LyCuts },
  mixins: [homeData],
};
</script>
