<!--
  The home's "How ordering works (tint band)" section (sections.json "how"). Every word and number from the shop's live data
  (home-data.ts); a slot without its photo shows its designed fallback, never a caption or a file name.
-->
<template>
  <section id="how" aria-labelledby="how-h" :class="['sec', 'how', { band }]">
    <div class="how-in">
      <ly-photo :alt="t('ly.home.howAlt', 'A box of pastries by the window')" :art="art('how', 'tart')" class="how-ph" name="how" pos="50% 30%" />
      <div class="how-txt">
        <p class="eyebrow">{{ t("ly.home.howEyebrow", "Smart and simple") }}</p>
        <h2 id="how-h" class="h2">{{ t("ly.home.howH", "How ordering works") }}</h2>
        <p v-if="ready" class="lead">{{ howLead }}</p>
        <ul v-if="ready" class="feats">
          <li v-for="f in feats" :key="f.k" class="feat">
            <ly-art :name="f.art" cls="feat-ic" />
            <h3>{{ f.title }}</h3>
            <p>{{ f.text }}</p>
          </li>
        </ul>
        <div v-if="facts.courier" class="how-card">
          <router-link v-if="howPlate" :to="productTo(howPlate)" aria-hidden="true" class="hc-ph" tabindex="-1"><img :src="img(howPlate)" alt="" loading="lazy" /></router-link>
          <div class="hc-tx">
            <h3>{{ facts.courier.title }}</h3>
            <p>{{ courierNote }}</p>
            <ul class="checks">
              <li v-for="c in courierChecks" :key="c">
                <span class="ck"><ly-icon name="check" /></span>{{ c }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import LyIcon from "../../LyIcon.vue";
import LyArt from "../../LyArt.vue";
import LyPhoto from "../../LyPhoto.vue";
import homeData from "../home-data";

export default {
  name: "HowSection",
  components: { LyIcon, LyArt, LyPhoto },
  mixins: [homeData],
};
</script>
