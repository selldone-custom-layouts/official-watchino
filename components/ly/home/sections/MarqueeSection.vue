<!--
  The home's "Marquee" section (sections.json "marquee"). Every word and number from the shop's live data
  (home-data.ts); a slot without its photo shows its designed fallback, never a caption or a file name.
-->
<template>
  <section v-if="cats.length" id="marquee" :aria-label="t('ly.home.marqAria', 'Collections')" class="marq">
    <div class="mq-track">
      <ul v-for="copy in [0, 1]" :key="copy" :aria-hidden="copy ? 'true' : undefined" class="mq-list">
        <li v-for="c in cats" :key="c.id">
          <span aria-hidden="true" class="mq-h">·</span><router-link :tabindex="copy ? -1 : undefined" :to="catTo(c)"><bdi>{{ catTitle(c) }}</bdi></router-link>
        </li>
      </ul>
    </div>
  </section>
</template>

<script>

import homeData from "../home-data";

export default {
  name: "MarqueeSection",
  components: {  },
  mixins: [homeData],
};
</script>
