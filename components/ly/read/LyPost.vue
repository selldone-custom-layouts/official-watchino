<!--
  A journal card (pages-read.js postCard(), nicdark's blog grid):
  the cover, the date with the calendar, the title, the post's own
  description and "Read more". Never "1 min read": the list has no text to
  count. No cover: the card's plate with the whisk drawing.
-->
<template>
  <article class="bc">
    <router-link :to="to" aria-hidden="true" class="bc-ph" tabindex="-1">
      <img v-if="img" :src="img" :srcset="srcset" alt="" height="1000" loading="lazy" sizes="(max-width: 760px) 46vw, 400px" width="1600" @error="dropSrcset" />
      <ly-art v-else name="whisk" wrap="ly-bc-art" />
    </router-link>
    <div class="bc-tx">
      <p v-if="post.created_at" class="p-m">
        <ly-icon name="cal" /><time :datetime="post.created_at">{{ fmtDate(post.created_at) }}</time>
      </p>
      <h3 class="bc-t">
        <router-link :to="to">{{ post.title }}</router-link>
      </h3>
      <p v-if="post.description" class="bc-d">{{ post.description }}</p>
      <router-link :to="to" class="qlink">{{ t("ly.rd.readMore", "Read more") }}<ly-icon cls="flip-rtl" name="arrow" /></router-link>
    </div>
  </article>
</template>

<script>
import LyIcon from "../LyIcon.vue";
import LyArt from "../LyArt.vue";
import { fmtDate } from "../ly";
import { postRoute } from "../../kalio/pages/kalio-journal";
import { dropSrcset, photoSrcset } from "../../kalio/kalio-catalog";
import { t } from "../../kalio/i18n/kalio-i18n";

export default {
  name: "LyPost",
  components: { LyIcon, LyArt },
  props: { post: { type: Object, required: true } },
  computed: {
    to() {
      return postRoute(this.post);
    },
    img() {
      return this.post.image ? window.CDN.GET_SHOP_IMAGE_PATH(this.post.image, null) : null;
    },
    srcset() {
      return photoSrcset(this.img);
    },
  },
  methods: { t, fmtDate, dropSrcset },
};
</script>
