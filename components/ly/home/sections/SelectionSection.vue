<!--
  The home's "Today's selection (tint band, one button style)" section (sections.json "selection"). Every word and number from the shop's live data
  (home-data.ts); a slot without its photo shows its designed fallback, never a caption or a file name.
-->
<template>
  <section v-if="selection.length" id="selection" aria-labelledby="sel-h" :class="['sec', 'sel', { band }]">
    <div class="wrap">
      <header class="sec-hd">
        <p class="eyebrow">{{ t("ly.home.selEyebrow", "Driven by what sells") }}</p>
        <h2 id="sel-h" class="h2">{{ t("ly.home.selH", "Today’s selection") }}</h2>
      </header>
      <ol class="srows">
        <li v-for="(p, i) in selection" :key="p.id" class="srow">
          <div class="s-idx">
            <span class="s-n">{{ (i < 9 ? "0" : "") + (i + 1) }}</span><span class="s-c"><bdi>{{ catTitle(catOf(p.category_id)) }}</bdi></span>
          </div>
          <div class="s-main">
            <router-link :to="productTo(p)" aria-hidden="true" class="s-th" tabindex="-1"><img :src="thumb(p)" alt="" loading="lazy" /></router-link>
            <div>
              <router-link :to="productTo(p)" class="s-t">{{ p.title }}</router-link>
              <p class="s-m">{{ selMeta(p) }}</p>
            </div>
          </div>
          <p class="s-ly">
            <span class="now money">{{ money(pv(p).now) }}</span><template v-if="pv(p).was">{{ " " }}<s class="was money">{{ money(pv(p).was) }}</s></template>
          </p>
          <div class="s-act"><ly-add :product="p" /></div>
        </li>
      </ol>
    </div>
  </section>
</template>

<script>
import LyAdd from "../../LyAdd.vue";
import homeData from "../home-data";

export default {
  name: "SelectionSection",
  components: { LyAdd },
  mixins: [homeData],
};
</script>
