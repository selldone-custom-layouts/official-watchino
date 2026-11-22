<!--
  The home's "Journal (tint band, last)" section (sections.json "journal"). Every word and number from the shop's live data
  (home-data.ts); a slot without its photo shows its designed fallback, never a caption or a file name.
-->
<template>
  <section v-if="posts.length" aria-labelledby="j-h" :class="['journal', { band }]">
    <div class="j-in">
      <ly-photo :alt="t('ly.home.journalAlt', 'A café table by the window')" :art="art('journal', 'whisk')" class="j-ph" name="journal">
        <span aria-hidden="true" class="j-word" data-over-photo>{{ t("ly.home.journalWord", "Journal") }}</span>
      </ly-photo>
      <div class="j-txt">
        <p class="eyebrow">{{ t("ly.home.jEyebrow", "Inspired by the counter") }}</p>
        <h2 id="j-h" class="h2">{{ t("ly.home.jH", "Notes from the {shop} journal", { shop: shopName }) }}</h2>
        <p class="lead">{{ t("ly.home.jLead", "Guides to the collections, and plain answers about ordering, delivery and pickup.") }}</p>
        <ul class="posts">
          <li v-for="b in posts" :key="b.id">
            <router-link :to="postRoute(b)" class="post">
              <span class="p-th"><img v-if="postImg(b)" :src="postImg(b)" :srcset="photoSrcset(postImg(b))" alt="" loading="lazy" sizes="112px" @error="dropSrcset" /></span>
              <span class="p-tx"
                ><span v-if="b.created_at" class="p-m"><ly-icon name="cal" /><time :datetime="b.created_at">{{ fmtDate(b.created_at) }}</time></span
                ><span class="p-t">{{ b.title }}</span></span
              >
              <ly-icon cls="chev" name="right" />
            </router-link>
          </li>
        </ul>
        <router-link :to="blogTo" class="btn sm">{{ t("ly.home.allPosts", "All journal posts") }}</router-link>
      </div>
    </div>
  </section>
</template>

<script>
import LyIcon from "../../LyIcon.vue";
import LyPhoto from "../../LyPhoto.vue";
import homeData from "../home-data";
import { journalPage } from "../../../kalio/pages/kalio-journal";

export default {
  name: "JournalSection",
  components: { LyIcon, LyPhoto },
  mixins: [homeData],

  data: () => ({ posts: [] }),

  mounted() {
    journalPage({ page: 1, limit: 8 })
      .then(({ articles }) => {
        const list = (articles || []).slice().sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
        this.posts = list.slice(0, 4);
      })
      .catch(() => (this.posts = []));
  },
};
</script>
