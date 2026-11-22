<!--
  The journal (design/blog-b.html, pages-read.js blog,
  nicdark's classic list): the title band ("The <shop> journal" and a
  line), the newest post as a wide featured card ("Newest post", its date,
  title and description, "Read the post"), then "Every post" with a search
  field (Selldone's own search, by the address's ?search=) and the others
  in a grid of journal cards. Whatever posts the shop has, newest first;
  "More posts" reads the next page. A topic, tag, author or search narrows
  the list and says so in the band. No posts: the mockup's empty card.
-->
<template>
  <div class="ly ly-journal">
    <ly-pt :crumbs="crumbs" :lead="lede" :title="heading" art="whisk" art2="cookie" cls="compact" />
    <section :aria-label="t('ly.rd.posts', 'Posts')" class="sec-s">
      <div class="wrap">
        <article v-if="feature" class="bf">
          <router-link :to="postRoute(feature)" aria-hidden="true" class="bf-ph" tabindex="-1">
            <img v-if="feature.image" :src="image(feature)" :srcset="srcset(feature)" alt="" height="1000" sizes="(max-width: 760px) 92vw, 760px" width="1600" @error="dropSrcset" />
            <ly-art v-else name="whisk" wrap="ly-bc-art" />
          </router-link>
          <div class="bf-tx">
            <p class="eyebrow">{{ t("ly.rd.newest", "Newest post") }}</p>
            <p v-if="feature.created_at" class="p-m">
              <ly-icon name="cal" /><time :datetime="feature.created_at">{{ fmtDate(feature.created_at) }}</time>
            </p>
            <h2 class="bf-t">
              <router-link :to="postRoute(feature)">{{ feature.title }}</router-link>
            </h2>
            <p v-if="feature.description" class="bf-d">{{ feature.description }}</p>
            <router-link :to="postRoute(feature)" class="btn sm">{{ t("ly.rd.readPost", "Read the post") }}</router-link>
          </div>
        </article>

        <div v-if="articles.length > 1 || filtered" class="bl-bar">
          <h2 class="h3x">{{ filtered ? t("ly.rd.matching", "Matching posts") : t("ly.rd.every", "Every post") }}</h2>
          <form class="bl-s" role="search" @submit.prevent="search">
            <label class="sr" for="bl-q">{{ t("ly.rd.searchJournal", "Search the journal") }}</label><ly-icon name="search" /><input
              id="bl-q"
              v-model="q"
              :placeholder="t('ly.rd.searchJournal', 'Search the journal')"
              autocomplete="off"
              type="search"
              @input="searchSoon"
            />
          </form>
        </div>

        <div v-if="rest.length" class="bgrid">
          <ly-post v-for="b in rest" :key="b.id" :post="b" />
        </div>
        <div v-else-if="busy && !articles.length" :aria-label="t('ly.rd.loading', 'Loading the journal')" class="bgrid" role="status">
          <div v-for="n in 3" :key="n" class="bc ly-bc-skel"><span class="bc-ph"></span><span class="ly-sk-l"></span><span class="ly-sk-l -s"></span></div>
        </div>
        <ly-empty
          v-else-if="!articles.length || filtered"
          :text="filtered ? t('ly.rd.noMatchP', 'Try a collection name, delivery or pickup.') : t('ly.rd.noPostsP', 'The bakery has not published any posts yet.')"
          :title="filtered ? t('ly.rd.noMatchT', 'No post matches this') : t('ly.rd.noPostsT', 'No posts yet')"
          cls="boxed"
          :icon="filtered ? 'search' : 'chat'"
        >
          <template #acts>
            <router-link v-if="filtered" :to="journalRoute()" class="btn">{{ t("ly.rd.allPosts", "All posts") }}</router-link>
            <router-link v-else :to="{ path: '/' }" class="btn">{{ t("ly.rd.backShop", "Back to the shop") }}</router-link>
          </template>
        </ly-empty>
        <div v-if="articles.length && articles.length < total" class="ly-or-more ly-bl-more">
          <button :aria-disabled="busy ? 'true' : undefined" class="btn quiet" type="button" @click="loadMore">{{ t("ly.rd.morePosts", "More posts") }}</button>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import LyIcon from "@app-storefront/components/ly/LyIcon.vue";
import LyArt from "@app-storefront/components/ly/LyArt.vue";
import LyPost from "@app-storefront/components/ly/read/LyPost.vue";
import LyPt from "@app-storefront/components/ly/ui/LyPt.vue";
import LyEmpty from "@app-storefront/components/ly/ui/LyEmpty.vue";
import { fmtDate } from "@app-storefront/components/ly/ly";
import { dropSrcset, photoSrcset } from "@app-storefront/components/kalio/kalio-catalog";
import { journalExtra, journalPage, journalRoute, postRoute } from "@app-storefront/components/kalio/pages/kalio-journal";
import { t } from "@app-storefront/components/kalio/i18n/kalio-i18n";

/* One featured story and a grid of three across: 1 + 12 on the first page. */
const FIRST = 13;

export default {
  name: "StorefrontPageBlogsList",
  components: { LyIcon, LyArt, LyPost, LyPt, LyEmpty },
  inject: ["$shop"],

  data: () => ({ articles: [] as any[], total: 0, busy: false, page: 1, categories: [] as any[], q: "" }),

  computed: {
    current_category() {
      return this.$route.query.category || null;
    },
    current_tag() {
      return this.$route.query.tags || null;
    },
    current_search() {
      return this.$route.query.search || "";
    },
    current_author() {
      return this.$route.params.author || null;
    },
    current_author_id() {
      return this.$route.params.author_id || null;
    },
    filtered() {
      return !!(this.current_category || this.current_tag || this.current_search || this.current_author_id);
    },
    category() {
      return this.categories.find((it: any) => String(it.id) === String(this.current_category)) || null;
    },
    shopName() {
      const n = String(this.$shop?.title || "");
      return n.charAt(0).toUpperCase() + n.slice(1);
    },
    heading() {
      if (!this.filtered) return t("ly.rd.jrTitle", "The {shop} journal", { shop: this.shopName });
      if (this.current_category) return this.category?.title || this.category?.name || t("ly.rd.topic", "Topic");
      if (this.current_author_id) return this.articles[0]?.user?.name || this.current_author || t("ly.rd.author", "Author");
      if (this.current_tag) return `#${this.current_tag}`;
      return t("ly.rd.searchFor", "“{q}”", { q: String(this.current_search) });
    },
    crumbs() {
      const j = { label: t("ly.rd.journal", "Journal") };
      return this.filtered ? [{ ...j, to: journalRoute() }, { label: this.heading }] : [j];
    },
    lede() {
      if (this.current_category) return this.category?.description || t("ly.rd.ledeTopic", "Every post on this topic, newest first.");
      if (this.filtered) return t("ly.rd.ledeMatch", "The posts that match, newest first.");
      return t("ly.rd.jrLede", "Guides to the collections, and plain answers about delivery, pickup and ordering for a group.");
    },
    feature() {
      return this.filtered ? null : this.articles[0] || null;
    },
    rest() {
      return this.feature ? this.articles.slice(1) : this.articles;
    },
  },

  watch: {
    "$route.fullPath"() {
      this.load();
    },
    current_search: {
      handler(v: any) {
        if (document.activeElement?.id !== "bl-q") this.q = String(v || "");
      },
      immediate: true,
    },
  },

  created() {
    this.setPageTitle?.(t("bakini.n.rd.journal", "Journal"));
    this.load();
    journalExtra()
      .then(({ categories }: any) => (this.categories = categories || []))
      .catch(() => {});
  },

  beforeUnmount() {
    clearTimeout(this.timer);
  },

  methods: {
    t,
    fmtDate,
    /* The search field writes Selldone's ?search= (a pause after typing). */
    searchSoon() {
      clearTimeout(this.timer);
      this.timer = setTimeout(this.search, 450);
    },
    search() {
      clearTimeout(this.timer);
      const v = this.q.trim();
      if (v === String(this.current_search || "")) return;
      this.$router.replace({ query: { ...this.$route.query, search: v || undefined } });
    },
    postRoute,
    journalRoute,
    dropSrcset,
    image(a: any) {
      return a?.image ? window.CDN.GET_SHOP_IMAGE_PATH(a.image, null) : null;
    },
    srcset(a: any) {
      return photoSrcset(this.image(a));
    },
    query(offsetPage: number, limit: number) {
      return {
        page: offsetPage,
        limit,
        category: this.current_category,
        author: this.current_author,
        author_id: this.current_author_id,
        tag: this.current_tag,
        search: this.current_search,
      };
    },
    load() {
      const asked = this.$route.fullPath;
      this.busy = true;
      this.page = 1;
      journalPage(this.query(1, FIRST))
        .then(({ articles, total }: any) => {
          if (asked !== this.$route.fullPath) return;
          this.articles = articles || [];
          this.total = total || this.articles.length;
        })
        .catch(() => {
          this.articles = [];
          this.total = 0;
        })
        .finally(() => (this.busy = false));
    },
    /* The next thirteen. */
    loadMore() {
      if (this.busy) return;
      this.busy = true;
      this.page = (this.page || 1) + 1;
      journalPage(this.query(this.page, FIRST))
        .then(({ articles }: any) => {
          const seen = new Set(this.articles.map((a: any) => a.id));
          const fresh = (articles || []).filter((a: any) => !seen.has(a.id));
          this.articles = this.articles.concat(fresh);
          if (!fresh.length) this.total = this.articles.length;
        })
        .catch(() => {})
        .finally(() => (this.busy = false));
    },
  },
};
</script>
