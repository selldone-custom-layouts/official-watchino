<!--
  The home's "About + the shop in numbers (tint band)" section (sections.json "about"). Every word and number from the shop's live data
  (home-data.ts); a slot without its photo shows its designed fallback, never a caption or a file name.
-->
<template>
  <section id="about" aria-labelledby="about-h" :class="['sec', 'about', { band, 'v-story': variant === 'story' }]">
    <div class="wrap about-in">
      <div v-if="nums.length && variant !== 'story'" class="about-nums">
        <p class="eyebrow">{{ t("ly.home.numsEyebrow", "{shop} in numbers", { shop: shopName }) }}</p>
        <dl class="nums">
          <div v-for="n in nums" :key="n.k" class="num">
            <dt>{{ n.label }}</dt>
            <dd>
              <span class="nv">{{ n.value }}</span><span v-if="n.unit" class="nu">{{ n.unit }}</span>
            </dd>
          </div>
        </dl>
      </div>
      <div class="about-main">
        <p class="eyebrow">{{ t("ly.home.aboutEyebrow2", "Explore the counter") }}</p>
        <h2 id="about-h" class="h2">{{ t("ly.home.aboutH", "Discover more about {shop}", { shop: shopName }) }}</h2>
        <div class="about-row">
          <ly-photo :alt="t('ly.home.aboutAlt', 'Pastries on the counter')" :art="art('about', 'croissant')" class="about-ph" name="about">
            <template v-if="spread.length" #fallback><ly-cuts :products="spread" kind="spread" /></template>
          </ly-photo>
          <div class="about-copy">
            <template v-if="ready">
              <p>{{ aboutP1 }}</p>
              <p v-if="aboutP2">{{ aboutP2 }}</p>
            </template>
          </div>
        </div>
        <ul v-if="ready" class="about-links">
          <li v-if="facts.ways.length">
            <a href="#ways" @click.prevent="jump('ways')"><span>{{ t("ly.home.linkDelivery", "Delivery") }}</span><ly-icon cls="chev" name="right" /></a>
          </li>
          <li v-if="facts.pickup">
            <router-link :to="contactTo"><span>{{ t("ly.home.linkPickup", "Pickup") }}</span><ly-icon cls="chev" name="right" /></router-link>
          </li>
          <li v-if="facts.gateway">
            <a href="#how" @click.prevent="jump('how')"><span>{{ t("ly.home.linkPayment", "Payment") }}</span><ly-icon cls="chev" name="right" /></a>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script>
import LyIcon from "../../LyIcon.vue";
import LyPhoto from "../../LyPhoto.vue";
import LyCuts from "../../LyCuts.vue";
import homeData from "../home-data";

export default {
  name: "AboutSection",
  components: { LyIcon, LyPhoto, LyCuts },
  mixins: [homeData],
};
</script>
