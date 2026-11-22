<!--
  Terms of use and Privacy (design/terms-b.html,
  privacy-b.html; pages-read.js terms / privacy).

  Terms: the title band ("Terms of use", a line, the sample label), then
  "On this page" (a sticky index; a folding one on a phone) beside the
  sections, each with its outlined numeral. Privacy: the title band, "At a
  glance" (three cards), then every section as a row (its icon and title,
  the words), and where to ask. The same family, not a copy.

  The text is the shop's own page (Selldone dashboard › Shop › Profile)
  when it has written one: its headings become the index. Until then sample
  copy from the shop's own facts, labelled "Sample text — the shop has not
  written this page yet".
-->
<template>
  <div :class="['ly', 'ly-legal', '-' + kind]">
    <ly-pt :crumbs="[{ label: crumb }]" :lead="lead" :title="title" :art="kind === 'terms' ? 'tart' : 'cookie'" :art2="kind === 'terms' ? 'cake' : 'cupcake'">
      <ly-sample-tag v-if="!own && !busy" />
      <p v-else-if="updated" class="art-m">
        <ly-icon name="cal" /><span>{{ t("ly.rd.updated", "Last updated {date}", { date: updated }) }}</span>
      </p>
    </ly-pt>

    <section :aria-label="title" class="sec-s">
      <!-- Terms (the shop's own text, or the sample sections), with the index -->
      <div v-if="kind === 'terms' || own" class="wrap lg2">
        <aside v-if="index.length > 1" class="toc">
          <details class="toc-d" open>
            <summary>{{ t("ly.rd.onPage", "On this page") }}<ly-icon cls="chev" name="down" /></summary>
            <ol class="toc-l">
              <li v-for="(s, i) in index" :key="s.id">
                <a :aria-current="active === s.id ? 'true' : undefined" :href="'#' + s.id" @click.prevent="jump(s.id)"
                  ><span class="toc-n">{{ (i < 9 ? "0" : "") + (i + 1) }}</span>{{ s.title }}</a
                >
              </li>
            </ol>
          </details>
        </aside>
        <div v-if="own" ref="own" class="terms art-body ly-own" v-html="ownHtml"></div>
        <div v-else class="terms">
          <section v-for="(s, i) in sections" :id="'t' + (i + 1)" :key="i" :aria-labelledby="'th' + (i + 1)" class="tsec">
            <ly-numeral :n="i + 1" />
            <div>
              <h2 :id="'th' + (i + 1)" class="tsec-h">{{ s.title }}</h2>
              <p>{{ s.text }}</p>
            </div>
          </section>
        </div>
      </div>

      <!-- Privacy (the sample): at a glance, the sections, where to ask -->
      <div v-else class="wrap pv">
        <div class="pv-glance">
          <h2 class="h3x">{{ t("ly.rd.glance", "At a glance") }}</h2>
          <ul class="pv-g">
            <li v-for="(s, i) in sections.slice(0, 3)" :key="i">
              <span class="em-ic sm"><ly-icon :name="iconOf(s.icon)" /></span><b>{{ s.title }}</b>
              <p>{{ s.text }}</p>
            </li>
          </ul>
        </div>
        <dl class="pv-l">
          <div v-for="(s, i) in sections" :id="'p' + (i + 1)" :key="i" class="pv-r">
            <dt>
              <span class="il-ic"><ly-icon :name="iconOf(s.icon)" /></span>{{ s.title }}
            </dt>
            <dd>{{ s.text }}</dd>
          </div>
          <div v-if="f.email || f.phone" class="pv-r">
            <dt>
              <span class="il-ic"><ly-icon name="mail" /></span>{{ t("ly.rd.contact", "Contact") }}
            </dt>
            <dd>
              {{ t("ly.rd.privAsk", "Questions about privacy:") }}
              <template v-if="f.email"
                ><a :href="'mailto:' + f.email">{{ f.email }}</a></template
              ><template v-if="f.email && f.phone">{{ " " + t("ly.rd.or", "or") + " " }}</template
              ><template v-if="f.phone"
                ><a :href="'tel:' + f.phone.replace(/[^\d+]/g, '')" dir="ltr">{{ f.phone }}</a></template
              >.
            </dd>
          </div>
        </dl>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import LyIcon from "../LyIcon.vue";
import LyPt from "../ui/LyPt.vue";
import LyNumeral from "../ui/LyNumeral.vue";
import LySampleTag from "../ui/LySampleTag.vue";
import { money, shopFacts } from "../ly";
import { ownText, samplePrivacy, sampleTerms, shopName, shopProfile } from "./rd";
import { currentCurrency } from "../../region-switcher/region";
import { formatDate, t } from "../../kalio/i18n/kalio-i18n";

const ICONS: Record<string, string> = { doc: "doc", box: "box", user: "user", clock: "clock", grid: "eye", shield: "lock" };

export default {
  name: "LyLegal",
  components: { LyIcon, LyPt, LyNumeral, LySampleTag },
  inject: ["$shop"],
  props: {
    /** "terms" | "privacy" */
    kind: { type: String, required: true },
  },

  data: () => ({ profile: null as any, busy: true, toc: [] as { id: string; title: string }[], active: "" }),

  computed: {
    shop() {
      return this.$store.getters.getShop;
    },
    f() {
      return shopFacts(this.shop);
    },
    name() {
      return shopName(this.shop);
    },
    crumb() {
      return this.kind === "terms" ? t("ly.rd.terms", "Terms") : t("ly.rd.privacy", "Privacy");
    },
    title() {
      return this.kind === "terms" ? t("ly.rd.termsT", "Terms of use") : t("ly.rd.privacy", "Privacy");
    },
    lead() {
      return this.kind === "terms"
        ? t("ly.rd.termsLead", "How ordering from {shop} works, in plain words.", { shop: this.name })
        : t("ly.rd.privLead", "What {shop} keeps about an order, and why.", { shop: this.name });
    },
    own() {
      return ownText(this.profile?.body);
    },
    ownHtml() {
      return String(this.profile?.body || "").replace(/\scontenteditable="[^"]*"/g, "");
    },
    updated() {
      if (!this.own) return "";
      const d = this.profile?.updated_at || this.profile?.created_at;
      return d ? formatDate(d) : "";
    },
    sections() {
      return this.kind === "terms" ? sampleTerms(this.shop, this.f, (n: number) => money(n, true), currentCurrency()) : samplePrivacy(this.f);
    },
    index() {
      if (this.own) return this.toc;
      return this.sections.map((s: any, i: number) => ({ id: "t" + (i + 1), title: s.title }));
    },
  },

  created() {
    this.setPageTitle?.(this.title);
    shopProfile(this.$shop.name, this.kind).then((p) => {
      this.profile = p;
      this.busy = false;
      this.$nextTick(() => this.makeIndex());
    });
  },

  mounted() {
    this.$nextTick(() => this.follow());
  },

  beforeUnmount() {
    this.io?.disconnect();
  },

  methods: {
    t,
    iconOf(name: string) {
      return ICONS[name] || "doc";
    },
    /* The shop's own headings become the index. */
    makeIndex() {
      const root = this.$refs.own as HTMLElement | undefined;
      if (root) {
        const heads = [...root.querySelectorAll("h2")];
        const list = heads.length > 1 ? heads : [...root.querySelectorAll("h3")];
        this.toc = list.map((el, i) => {
          el.id = `l${i + 1}`;
          return { id: el.id, title: (el.textContent || "").trim() };
        });
      }
      this.$nextTick(() => this.follow());
    },
    /* The index follows the section being read. */
    follow() {
      this.io?.disconnect();
      if (!("IntersectionObserver" in window)) return;
      this.io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && (this.active = (e.target as HTMLElement).id)), { rootMargin: "-30% 0px -60% 0px" });
      this.index.forEach((s: any) => {
        const el = document.getElementById(s.id);
        if (el) this.io.observe(el);
      });
    },
    jump(id: string) {
      const el = document.getElementById(id);
      if (!el) return;
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      this.active = id;
    },
  },
};
</script>
