<!--
  The home's "Counters, the offer, the ways" section (sections.json "offer"). Every word and number from the shop's live data
  (home-data.ts); a slot without its photo shows its designed fallback, never a caption or a file name.
-->
<template>
  <section id="ways" aria-labelledby="focus-h" :class="['sec', 'focus', { band }]">
    <div :class="['wrap', 'focus-in', { 'no-fnums': !fnums.length }]">
      <dl v-if="fnums.length" class="fnums">
        <div v-for="n in fnums" :key="n.k" class="fnum">
          <dt>{{ n.label }}</dt>
          <dd>
            <span class="nv">{{ n.value }}</span><span v-if="n.unit" class="nu">{{ n.unit }}</span>
          </dd>
        </div>
      </dl>
      <ly-photo :art="art('offer', 'macaron')" class="offer" deep name="offer" pos="50% 30%">
        <template v-if="offerPiece" #fallback><ly-cuts :products="[offerPiece]" kind="one" /></template>
        <div v-if="ready" class="offer-tx" data-over-photo>
          <p class="offer-e">{{ offLine ? t("ly.home.rightNow", "Right now") : t("ly.home.everyDay", "Every day") }}</p>
          <h3>{{ offLine ? capital(offLine) : t("ly.home.soldOne", "Sold one by one") }}</h3>
          <p v-if="fromPrice">{{ t("ly.home.fromLine", "Every pastry on the counter, from {price}", { price: fromPrice }) }}</p>
          <router-link :to="offLine ? dealsTo : allTo" class="btn sm">{{ offLine ? t("ly.home.seeDeals", "See the deals") : t("ly.home.shopAll", "Shop every pastry") }}</router-link>
        </div>
      </ly-photo>
      <div class="focus-txt">
        <p class="eyebrow">{{ t("ly.home.waysEyebrow", "Your next step") }}</p>
        <h2 id="focus-h" class="h2">{{ waysTitle }}</h2>
        <ul class="ways">
          <li v-for="(w, i) in facts.ways" :key="w.id" :class="['way', { alt: i === 1 }]">
            <span class="cb"><ly-icon :name="wayIcon(w)" /></span>
            <div>
              <h3>{{ w.title }}</h3>
              <p v-if="wayNote(w)">{{ wayNote(w) }}</p>
              <p class="way-fee">{{ feeText(w) }}</p>
            </div>
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
  name: "OfferSection",
  components: { LyIcon, LyPhoto, LyCuts },
  mixins: [homeData],
};
</script>
