<!--
  The home's "The collections people order most" section (sections.json "collections"). Every word and number from the shop's live data
  (home-data.ts); a slot without its photo shows its designed fallback, never a caption or a file name.
-->
<template>
  <section v-if="topCols.length" id="collections" aria-labelledby="cols-h" :class="['sec', 'cols', { band, 'v-cards': variant === 'cards' }]">
    <div class="wrap">
      <header class="sec-hd">
        <p class="eyebrow">{{ t("ly.home.colsEyebrow", "Tailored for you") }}</p>
        <h2 id="cols-h" class="h2">{{ colsTitle }}</h2>
      </header>
      <div :class="['ccs', 'n' + topCols.length]">
        <article v-for="(x, i) in topCols" :key="x.c.id" :class="['cc', { flip: i % 2 }]">
          <div class="cc-txt">
            <svg aria-hidden="true" class="numeral" focusable="false" viewBox="0 0 132 84"><text x="2" y="74">{{ (i < 9 ? "0" : "") + (i + 1) }}</text></svg>
            <h3 class="cc-t">
              <router-link :to="catTo(x.c)"><bdi>{{ catTitle(x.c) }}</bdi></router-link>
            </h3>
            <p v-if="x.c.description" class="cc-d"><bdi>{{ x.c.description }}</bdi></p>
            <ul class="checks">
              <li v-for="p in x.ps.slice(0, 3)" :key="p.id">
                <span class="ck"><ly-icon name="check" /></span><router-link :to="productTo(p)">{{ p.title }}</router-link
                ><span class="ck-ly"
                  ><span class="now money">{{ money(pv(p).now) }}</span><template v-if="pv(p).was">{{ " " }}<s class="was money">{{ money(pv(p).was) }}</s></template></span
                >
              </li>
            </ul>
            <router-link :to="catTo(x.c)" class="btn sm">{{ t("ly.home.shopCol", "Shop {name}", { name: catTitle(x.c) }) }}</router-link>
          </div>
          <router-link :to="catTo(x.c)" aria-hidden="true" class="cc-ph" tabindex="-1">
            <img v-if="colPhoto(x.c)" :src="colPhoto(x.c)" alt="" decoding="async" height="1050" loading="lazy" width="1400" />
            <ly-cuts v-else :products="x.ps" kind="trio" />
          </router-link>
        </article>
      </div>
    </div>
  </section>
</template>

<script>
import LyIcon from "../../LyIcon.vue";
import LyCuts from "../../LyCuts.vue";
import homeData from "../home-data";

export default {
  name: "CollectionsSection",
  components: { LyIcon, LyCuts },
  mixins: [homeData],
};
</script>
