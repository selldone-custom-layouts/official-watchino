<!--
  A collection, a search, the deals and every pastry
  (design/category-b.html, search-b.html, deals-b.html;
  src/pages-shop.js listing()). From the live catalogue (ly.ts, one read):

  - the page-title band: the collection's name and line with the saving, or
    "Results for “q”" with the search box, or "Deals";
  - a collection: every collection as a chip (this one marked), the filter
    panel (price range with two thumbs and short boxes, On offer, then every
    spec group of the collection's own products: several values first, long
    values four at a time with "Show N more"), a side sheet below 1200px;
  - the bar: the active filters as chips, the sort (Featured, Best sellers,
    Customer review, Price low/high, Newest; deals start on Biggest saving);
  - the grid of cards; a change dims the cards in place with "Updating
    results…", then the new ones fade up in steps (no motion when the
    visitor asks for less); fewer results than columns keep the card width
    and centre the row;
  - deals: the biggest saving today as a cocoa band with its round "Save";
  - search: the collections it found as tabs, posts from the journal, and a
    calm card with suggestions when nothing matches;
  - a collection ends with the strip: the courier, the collection's photo,
    pickup at the counter.

  Nothing names a product, collection or price: another bakery gets its own.
-->
<template>
  <div class="ly ly-listing">
    <!-- The title band -->
    <ly-pt v-if="kind === 'search'" :crumbs="[{ label: t('ly.ls.search', 'Search') }]" :title="search ? t('ly.ls.resultsFor', 'Results for “{q}”', { q: search }) : t('ly.ls.search', 'Search')" art="cupcake" art2="cookie" cls="compact">
      <form class="pt-srch" role="search" @submit.prevent="submitSearch">
        <label class="sr" for="ly-sq">{{ t("ly.ls.searchLabel", "Search the bakery") }}</label>
        <ly-icon name="search" />
        <input id="ly-sq" :placeholder="searchPh" :value="q" autocomplete="off" enterkeyhint="search" type="search" @input="q = $event.target.value" />
        <button class="btn sm" type="submit">{{ t("ly.ls.searchBtn", "Search") }}</button>
      </form>
    </ly-pt>
    <ly-pt v-else-if="kind === 'category'" :crumbs="[{ label: catTitle(cat) || categoryName }]" :cuts="catPhoto ? [] : catCuts" :eyebrow="t('ly.ls.theCollection', 'The collection')" :lead="catLead" :photo="catPhoto" :title="catTitle(cat) || ''" cls="compact" />
    <ly-pt v-else-if="kind === 'deals'" :crumbs="[{ label: t('ly.ls.deals', 'Deals') }]" :lead="dealsLead" :title="t('ly.ls.deals', 'Deals')" art="macaron" art2="cake" cls="compact" />
    <ly-pt v-else :crumbs="[{ label: t('ly.ls.all', 'Every pastry') }]" :lead="allLead" :title="t('ly.ls.all', 'Every pastry')" art="croissant" art2="macaron" cls="compact" />

    <section :aria-label="sectionLabel" class="sec-s">
      <div class="wrap">
        <!-- Search: nothing matches -->
        <template v-if="kind === 'search' && ready && !base.length">
          <ly-empty :text="noMatchLine" :title="search ? t('ly.ls.noMatchT', 'Nothing matches “{q}”', { q: search }) : t('ly.ls.searchT', 'Search the bakery')" cls="boxed" icon="search">
            <template v-if="popular.length" #acts>
              <router-link v-for="w in popular" :key="w" :to="searchTo(w)" class="chip">{{ w }}</router-link>
            </template>
          </ly-empty>
          <nav :aria-label="t('ly.ls.collections', 'Collections')" class="cchips">
            <ul>
              <li v-for="c in ly.cats" :key="c.id">
                <router-link :to="catTo(c)" class="cchip"><span class="cc-pl"><img v-if="topImg(c)" :src="topImg(c)" alt="" loading="lazy" /></span><span><bdi>{{ catTitle(c) }}</bdi></span></router-link>
              </li>
            </ul>
          </nav>
        </template>

        <template v-else>
          <!-- A collection: every collection as a chip -->
          <nav v-if="kind === 'category'" :aria-label="t('ly.ls.collections', 'Collections')" class="cchips">
            <ul>
              <li v-for="c in ly.cats" :key="c.id">
                <router-link :aria-current="cat && c.id === cat.id ? 'page' : undefined" :to="catTo(c)" class="cchip"
                  ><span class="cc-pl"><img v-if="topImg(c)" :src="topImg(c)" alt="" loading="lazy" /></span><span><bdi>{{ catTitle(c) }}</bdi></span></router-link
                >
              </li>
            </ul>
          </nav>

          <!-- Deals: the biggest saving today -->
          <router-link v-if="kind === 'deals' && topSave" :to="productTo(topSave)" class="deal-top">
            <span class="dt-pl"><img :src="img(topSave, true)" alt="" loading="lazy" /></span>
            <span class="dt-tx"
              ><span class="eyebrow">{{ t("ly.ls.biggestToday", "The biggest saving today") }}</span><b>{{ topSave.title }}</b
              ><span class="dt-ly"
                ><span class="now money">{{ money(pv(topSave).now) }}</span><template v-if="pv(topSave).was">{{ " " }}<s class="was money">{{ money(pv(topSave).was) }}</s></template></span
              ></span
            >
            <span ref="dtsv" class="dt-sv"><span>{{ t("ly.ls.saveCap", "Save") }}</span><b>{{ breakable(money(pv(topSave).save)) }}</b></span>
          </router-link>

          <div :class="['lst', { 'has-fp': filters }]">
            <div v-if="tabCats.length > 1" :aria-label="t('ly.ls.collections', 'Collections')" class="tabs" role="group">
              <button :aria-pressed="tab === 'all' ? 'true' : 'false'" class="tab" type="button" @click="setTab('all')">{{ t("ly.ls.allTab", "All") }}</button>
              <button v-for="c in tabCats" :key="c.id" :aria-pressed="tab === c.id ? 'true' : 'false'" class="tab" type="button" @click="setTab(c.id)">
                <bdi>{{ catTitle(c) }}</bdi>
              </button>
            </div>

            <div class="lst-in">
              <!-- The filter panel: a sidebar from 1200px, a side sheet below (teleported over the page). -->
              <teleport v-if="filters" :disabled="wide" to="body">
                <div :dir="rtl ? 'rtl' : 'ltr'" class="ly ly-fpw">
                  <aside :id="fpId" :aria-label="t('ly.ls.filters', 'Filters')" :class="['panel', 'fp', { open: layer.open === fpId }]">
                    <div class="pn-hd">
                      <h2 class="pn-t">{{ t("ly.ls.filters", "Filters") }}</h2>
                      <button :aria-label="t('ly.ls.closeFilters', 'Close filters')" class="ibtn x" type="button" @click="closeLayer()"><ly-icon name="close" /></button>
                    </div>
                    <div class="fp-body">
                      <div class="fp-top">
                        <h2 class="fp-h">{{ t("ly.ls.filter", "Filter") }}</h2>
                        <button class="qlink" type="button" @click="reset">{{ t("ly.ls.clearAll", "Clear all") }}</button>
                      </div>
                      <div v-if="hi > lo" class="fg fg-price">
                        <p class="fg-l">{{ t("ly.ls.price", "Price") }}</p>
                        <div :style="{ '--ly-a': pctA + '%', '--ly-b': pctB + '%' }" class="rng">
                          <span class="rng-tr"></span><span class="rng-fill"></span>
                          <input :aria-label="t('ly.ls.lowest', 'Lowest price')" :max="hi" :min="lo" :value="min" step="1" type="range" @change="update()" @input="onMin($event.target.value)" />
                          <input :aria-label="t('ly.ls.highest', 'Highest price')" :max="hi" :min="lo" :value="max" step="1" type="range" @change="update()" @input="onMax($event.target.value)" />
                        </div>
                        <div class="rng-boxes">
                          <label class="mbox"
                            ><span>{{ sign }}</span
                            ><input :aria-label="t('ly.ls.minPrice', 'Minimum price')" :max="hi" :min="lo" :value="min" inputmode="numeric" type="number" @change="boxMin($event.target.value)"
                          /></label>
                          <span class="rng-to">{{ t("ly.ls.to", "to") }}</span>
                          <label class="mbox"
                            ><span>{{ sign }}</span
                            ><input :aria-label="t('ly.ls.maxPrice', 'Maximum price')" :max="hi" :min="lo" :value="max" inputmode="numeric" type="number" @change="boxMax($event.target.value)"
                          /></label>
                        </div>
                      </div>
                      <div v-if="anyOffer" class="fg fg-sw">
                        <span id="ly-offer-l" class="fg-l">{{ t("ly.ls.onOffer", "On offer") }}</span>
                        <button :aria-checked="offer ? 'true' : 'false'" aria-labelledby="ly-offer-l" class="switch" role="switch" type="button" @click="setOffer(!offer)"><span></span></button>
                      </div>
                      <details v-for="(f, gi) in facets" :key="f.key" :open="gi < 1" class="fg">
                        <summary>
                          <span><bdi>{{ f.key }}</bdi></span><ly-icon cls="chev" name="down" />
                        </summary>
                        <div :class="['fg-body', { long: f.long }]">
                          <template v-for="(v, i) in f.values" :key="v">
                            <div v-if="!f.long || i < 4 || moreOpen[f.key]" class="fg-row">
                              <label class="ck-l"
                                ><span class="cbx-w"><input :checked="picked(f.key, v)" class="cbx" type="checkbox" @change="toggle(f.key, v)" /><ly-icon cls="cbx-i" name="check" /></span
                                ><span class="ck-t"><bdi>{{ v }}</bdi></span></label
                              >
                            </div>
                          </template>
                          <button v-if="f.long && f.values.length > 4" :aria-expanded="moreOpen[f.key] ? 'true' : 'false'" class="fg-more" type="button" @click="moreOpen = { ...moreOpen, [f.key]: !moreOpen[f.key] }">
                            <span class="fm-ic"><ly-icon name="down" /></span
                            ><span>{{ moreOpen[f.key] ? t("ly.ls.fewer", "Show fewer") : t("ly.ls.more", "Show {n} more", { n: f.values.length - 4 }) }}</span>
                          </button>
                        </div>
                      </details>
                    </div>
                    <div class="fp-ft">
                      <button class="btn quiet sm" type="button" @click="reset">{{ t("ly.ls.clearAll", "Clear all") }}</button>
                      <button class="btn sm" type="button" @click="closeLayer()">{{ t("ly.ls.showResults", "Show results") }}</button>
                    </div>
                  </aside>
                </div>
              </teleport>

              <div class="lst-main">
                <div class="lst-bar">
                  <button v-if="filters" :aria-controls="fpId" :aria-expanded="layer.open === fpId ? 'true' : 'false'" class="btn quiet sm fbtn" type="button" @click="toggleLayer(fpId, $event.currentTarget)">
                    <ly-icon name="filter" />{{ t("ly.ls.filterBtn", "Filter") }}<span v-if="active.length" class="fcount">{{ active.length }}</span>
                  </button>
                  <div class="actf">
                    <button v-for="a in active" :key="a.id" :aria-label="t('ly.ls.removeFilter', 'Remove filter {name}', { name: a.label })" class="chip on" type="button" @click="a.clear()">
                      <span><bdi>{{ a.label }}</bdi></span><ly-icon name="close" />
                    </button>
                  </div>
                  <div ref="sortw" class="sortw">
                    <button :aria-controls="'sm-' + id" :aria-expanded="sortOpen ? 'true' : 'false'" class="sort-btn" type="button" @click="sortOpen = !sortOpen">
                      <ly-icon name="sort" /><span class="sb-l">{{ t("ly.ls.sortBy", "Sort:") }}</span><span class="sb-v">{{ sortLabel }}</span><ly-icon cls="chev" name="down" />
                    </button>
                    <ul :id="'sm-' + id" :aria-label="t('ly.ls.sort', 'Sort')" :class="['sortm', { open: sortOpen }]" role="listbox">
                      <li v-for="s in sorts" :key="s[0]">
                        <button :aria-selected="sort === s[0] ? 'true' : 'false'" class="so" role="option" type="button" @click="setSort(s[0])">{{ s[1] }}</button>
                      </li>
                    </ul>
                  </div>
                </div>
                <p :class="['upd', { on: busy }]" aria-live="polite"><span aria-hidden="true" class="spin"></span>{{ t("ly.ls.updating", "Updating results…") }}</p>
                <div v-if="!ready" class="grid">
                  <div v-for="i in 10" :key="i" aria-hidden="true" class="pc ly-skel"><div class="pc-plate"></div><div class="pc-tx"><span class="sk-l"></span><span class="sk-l s"></span></div></div>
                </div>
                <div v-else ref="grid" :class="['grid', { dim: busy }]" :data-n="shown.length" :style="fitStyle">
                  <ly-card v-for="(p, i) in shown" :key="p.id + ':' + drawn" :cls="animate ? 'fu' : ''" :delay="animate ? Math.min(i, 12) * 25 : null" :no-cat="kind === 'category'" :product="p" />
                </div>
                <ly-empty v-if="ready && !shown.length" :text="t('ly.ls.noneP', 'Widen the price range or clear a filter to see more of the collection.')" :title="t('ly.ls.noneT', 'No pastries match these filters')" icon="search">
                  <template #acts>
                    <button class="btn sm" type="button" @click="reset">{{ t("ly.ls.clearFilters", "Clear filters") }}</button>
                  </template>
                </ly-empty>
              </div>
            </div>
          </div>

          <!-- Search: posts from the journal -->
          <div v-if="kind === 'search' && postHits.length" class="sr-posts">
            <h2 class="h3x">{{ t("ly.ls.fromJournal", "From the journal") }}</h2>
            <ul class="jl">
              <li v-for="b in postHits" :key="b.id">
                <router-link :to="postRoute(b)" class="jl-a"
                  ><span class="jl-th"><img v-if="b.image" :src="postImg(b)" alt="" loading="lazy" /></span
                  ><span class="jl-tx"><time v-if="b.created_at" :datetime="b.created_at">{{ fmtDate(b.created_at) }}</time><b>{{ b.title }}</b></span><ly-icon cls="chev" name="right"
                /></router-link>
              </li>
            </ul>
          </div>
        </template>
      </div>
    </section>

    <!-- A collection ends with the strip: the courier, the collection's photo, pickup. -->
    <ly-strip v-if="kind === 'category' && cat" :cat="cat" />
  </div>
</template>

<script>
import LyIcon from "../LyIcon.vue";
import LyPt from "../ui/LyPt.vue";
import LyEmpty from "../ui/LyEmpty.vue";
import LyCard from "../ui/LyCard.vue";
import LyStrip from "./LyStrip.vue";
import { bySells, catOf, catTitle, catTo, closeLayer, ly, fmtDate, inCat, layer, loadDm, money, priceView, productImage, productTo, specGroups, specValue, toggleLayer } from "../ly";
import { percentOff } from "../../kalio/kalio-catalog";
import { journalPage, postRoute } from "../../kalio/pages/kalio-journal";
import { currentCurrency, isRtl, regionState, signOf } from "../../region-switcher/region";
import { breakable, fitInCircle } from "../../bakini/fit-in-circle";
import { fitOnResize } from "../ly-fit";
import { t } from "../../kalio/i18n/kalio-i18n";
import { collectionPhoto } from "../ly-photos";

/* A spec key whose every value reads like a paragraph is a note, not a filter. */
const NOTE = 80;
/* A group with a value this long shows four values, then "Show N more". */
const LONG = 30;

export default {
  name: "LyListing",
  components: { LyIcon, LyPt, LyEmpty, LyCard, LyStrip },
  props: {
    categoryName: { type: String, default: null },
    search: { type: String, default: "" },
    deals: Boolean,
    initialSort: { type: String, default: "" },
  },
  /* fetched: the page's search-engine data (StorefrontSeo.updateProducts). */
  emits: ["fetched"],

  data: () => ({
    ly,
    layer,
    region: regionState,
    q: "",
    tab: "all",
    sort: "featured",
    f: {},
    offer: false,
    min: 0,
    max: 0,
    sortOpen: false,
    busy: false,
    animate: false,
    drawn: 0,
    snapshot: null,
    moreOpen: {},
    wide: true,
    posts: [],
    fitStyle: null,
  }),

  computed: {
    shop() {
      return this.$store.getters.getShop;
    },
    currency() {
      return currentCurrency();
    },
    sign() {
      return signOf(this.currency) || this.currency;
    },
    rtl() {
      void this.region.language;
      return isRtl();
    },
    ready() {
      return this.ly.ready;
    },
    id() {
      return this.kind === "category" ? "cat" : this.kind === "search" ? "sr" : this.kind === "deals" ? "dl" : "all";
    },
    fpId() {
      return "fp-" + this.id;
    },
    kind() {
      if (this.categoryName) return "category";
      if (this.search) return "search";
      if (this.deals) return "deals";
      return "all";
    },
    filters() {
      return this.kind === "category";
    },
    cat() {
      return this.ly.cats.find((c) => c.name === this.categoryName) || null;
    },
    /* The products this page starts from. */
    base() {
      const all = this.ly.products;
      if (this.kind === "category") return this.cat ? inCat(this.cat.id) : all.filter((p) => String(p.category_id) === String(this.categoryName));
      if (this.kind === "search") return this.matches(this.search);
      if (this.kind === "deals") return all.filter((p) => this.pv(p).save > 0);
      return all;
    },
    prices() {
      return this.base.map((p) => this.pv(p).now);
    },
    lo() {
      return this.prices.length ? Math.floor(Math.min(...this.prices)) : 0;
    },
    hi() {
      return this.prices.length ? Math.ceil(Math.max(...this.prices)) : 0;
    },
    pctA() {
      const span = this.hi - this.lo || 1;
      return ((this.min - this.lo) / span) * 100;
    },
    pctB() {
      const span = this.hi - this.lo || 1;
      return ((this.max - this.lo) / span) * 100;
    },
    anyOffer() {
      return this.base.some((p) => this.pv(p).save > 0);
    },
    /* Every spec group of these products (the mockup's facets): groups with
       several values first; a paragraph-like note is left out. */
    facets() {
      const map = new Map();
      for (const p of this.base) {
        for (const g of specGroups(p)) {
          for (const [k, v] of g.rows) {
            if (!map.has(k)) map.set(k, new Set());
            map.get(k).add(String(v));
          }
        }
      }
      return [...map.entries()]
        .map(([key, set]) => {
          const values = [...set].sort((a, b) => a.localeCompare(b));
          return { key, values, long: values.some((v) => v.length > LONG), note: values.every((v) => v.length > NOTE) };
        })
        /* a note in sentences (every value a paragraph, or one long sentence
           shared by all) is not a filter: it would select everything. */
        .filter((x) => !x.note && x.values.length && !(x.values.length === 1 && x.long))
        .sort((a, b) => (a.values.length > 1 ? 0 : 1) - (b.values.length > 1 ? 0 : 1));
    },
    sorts() {
      const s = [
        ["featured", t("ly.ls.sFeatured", "Featured")],
        ["best", t("ly.ls.sBest", "Best sellers")],
        ["review", t("ly.ls.sReview", "Customer review")],
        ["low", t("ly.ls.sLow", "Price: low to high")],
        ["high", t("ly.ls.sHigh", "Price: high to low")],
        ["new", t("ly.ls.sNew", "Newest")],
      ];
      if (this.kind === "deals") return [["saving", t("ly.ls.sSaving", "Biggest saving")], ...s.filter((x) => x[0] !== "featured" && x[0] !== "review")];
      if (this.kind === "search") return s.filter((x) => x[0] !== "review").sort((a, b) => (a[0] === "best" ? -1 : b[0] === "best" ? 1 : 0));
      return s;
    },
    sortLabel() {
      return (this.sorts.find((s) => s[0] === this.sort) || this.sorts[0])[1];
    },
    list() {
      const l = this.base.filter((p) => {
        if (this.tab !== "all" && p.category_id !== this.tab) return false;
        const now = this.pv(p).now;
        if (this.hi > this.lo && (now < this.min - 0.001 || now > this.max + 0.001)) return false;
        if (this.offer && !(this.pv(p).save > 0)) return false;
        for (const k of Object.keys(this.f)) if (this.f[k].length && !this.f[k].includes(String(specValue(p, k)))) return false;
        return true;
      });
      return this.sorted(l);
    },
    shown() {
      return this.snapshot || this.list;
    },
    active() {
      const out = [];
      for (const k of Object.keys(this.f)) for (const v of this.f[k]) out.push({ id: k + ":" + v, label: v, clear: () => this.toggle(k, v) });
      if (this.offer) out.push({ id: "offer", label: t("ly.ls.onOffer", "On offer"), clear: () => this.setOffer(false) });
      if (this.hi > this.lo && (this.min > this.lo || this.max < this.hi))
        out.push({
          id: "price",
          label: `${money(this.min, true)}–${money(this.max, true)}`,
          clear: () => {
            this.min = this.lo;
            this.max = this.hi;
            this.update();
          },
        });
      return out;
    },
    /* "25% off every piece" / "Up to 30% off", from the live deals. */
    offs() {
      void this.currency;
      return this.ly.products.map((p) => percentOff(this.shop, p)).filter((x) => x > 0);
    },
    offLine() {
      if (!this.offs.length) return "";
      const max = Math.max(...this.offs);
      const every = this.offs.length === this.ly.products.length && Math.min(...this.offs) === max;
      return every ? t("ly.ls.offEvery", "{off}% off every piece", { off: max }) : t("ly.ls.offUpTo", "Up to {off}% off", { off: max });
    },
    /* the collection's own photo for the title band, else its three best sellers */
    catPhoto() {
      return this.cat ? collectionPhoto(this.cat) || "" : "";
    },
    catCuts() {
      return this.cat ? bySells(inCat(this.cat.id)).slice(0, 3) : [];
    },
    catLead() {
      const desc = this.cat?.description || "";
      const off = this.offLine ? this.offLine.charAt(0).toUpperCase() + this.offLine.slice(1) + "." : "";
      return [desc, off].filter(Boolean).join(" ");
    },
    dealsLead() {
      if (!this.offLine) return t("ly.ls.dealsNone", "Offers show here when the bakery has some.");
      return t("ly.ls.dealsLead", "{off}, already in the price. No code to enter.", { off: this.offLine.charAt(0).toUpperCase() + this.offLine.slice(1) });
    },
    allLead() {
      return t("ly.ls.allLead", "Every piece on the counter, collection by collection.");
    },
    sectionLabel() {
      if (this.kind === "category") return catTitle(this.cat) || "";
      if (this.kind === "deals") return t("ly.ls.dealsAria", "Every piece on offer");
      return t("ly.ls.pastries", "Pastries");
    },
    tabCats() {
      if (this.kind === "category") return [];
      const ids = new Set(this.base.map((p) => p.category_id));
      return this.ly.cats.filter((c) => ids.has(c.id));
    },
    topSave() {
      return [...this.base].filter((p) => p.quantity > 0).sort((a, b) => this.pv(b).save - this.pv(a).save || a.id - b.id)[0] || null;
    },
    /* "Popular": the words most products share, from the live catalogue. */
    popular() {
      const count = new Map();
      const catWords = new Set(this.ly.cats.flatMap((c) => catTitle(c).toLowerCase().split(/\s+/)));
      for (const p of this.ly.products) {
        const seen = new Set();
        for (const w of String(p.title || "").split(/[^\p{L}]+/u)) {
          const k = w.toLowerCase();
          if (k.length < 4 || catWords.has(k) || catWords.has(k + "s") || seen.has(k)) continue;
          seen.add(k);
          count.set(k, (count.get(k) || 0) + 1);
        }
      }
      return [...count.entries()]
        .filter(([, n]) => n >= 2)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 3)
        .map(([w]) => w.charAt(0).toUpperCase() + w.slice(1));
    },
    noMatchLine() {
      const ex = [...this.ly.cats.slice(0, 2).map((c) => catTitle(c).toLowerCase().replace(/s$/, "")), ...this.popular.map((w) => w.toLowerCase())].slice(0, 5);
      return ex.length ? t("ly.ls.noMatchP", "Search by pastry or flavour — {examples} — or start from a collection.", { examples: ex.join(", ") }) : t("ly.ls.noMatchP0", "Try another word, or start from a collection.");
    },
    searchPh() {
      const names = this.ly.cats.slice(0, 2).map((c) => catTitle(c).toLowerCase());
      return names.length ? t("ly.hdr.searchPh", "Search {examples}, flavours…", { examples: names.join(", ") }) : t("ly.hdr.searchPh0", "Search the bakery…");
    },
    /* Posts whose title or line has every word. */
    postHits() {
      const words = String(this.search || "").toLowerCase().split(/\s+/).filter(Boolean);
      if (!words.length) return [];
      return this.posts.filter((b) => words.every((w) => (String(b.title || "") + " " + String(b.description || "")).toLowerCase().includes(w))).slice(0, 3);
    },
  },

  watch: {
    base: {
      handler(list) {
        this.resetRange();
        this.snapshot = null;
        if (this.ready && (this.kind !== "category" || this.cat)) this.$emit("fetched", { parent: this.cat || null, products: list });
        this.$nextTick(() => this.fit());
      },
      immediate: true,
    },
    search: {
      handler(v) {
        this.q = v || "";
        this.tab = "all";
      },
      immediate: true,
    },
    categoryName() {
      this.f = {};
      this.offer = false;
      this.tab = "all";
      this.animate = false;
      this.moreOpen = {};
    },
    shown() {
      this.$nextTick(() => this.fit());
    },
    topSave() {
      this.$nextTick(() => fitInCircle(this.$refs.dtsv));
    },
    currency() {
      this.$nextTick(() => fitInCircle(this.$refs.dtsv));
    },
  },

  created() {
    loadDm();
    this.sort = this.kind === "deals" ? "saving" : this.kind === "search" ? "best" : { most_sales: "best", newest: "new", cheapest: "low", most_expensive: "high" }[this.initialSort] || "featured";
  },

  mounted() {
    this.unfit = fitOnResize(() => fitInCircle(this.$refs.dtsv));
    this.mq = window.matchMedia("(min-width: 1200px)");
    this.wide = this.mq.matches;
    this.onMq = () => {
      this.wide = this.mq.matches;
      if (this.wide && this.layer.open === this.fpId) closeLayer(true);
    };
    this.mq.addEventListener?.("change", this.onMq);
    this.onDoc = (e) => {
      if (this.sortOpen && this.$refs.sortw && !this.$refs.sortw.contains(e.target)) this.sortOpen = false;
    };
    this.onKey = (e) => {
      if (e.key === "Escape" && this.sortOpen) this.sortOpen = false;
    };
    this.onResize = () => this.fit();
    document.addEventListener("click", this.onDoc, true);
    document.addEventListener("keydown", this.onKey);
    window.addEventListener("resize", this.onResize, { passive: true });
    if (this.kind === "search")
      journalPage({ page: 1, limit: 30 })
        .then(({ articles }) => (this.posts = articles || []))
        .catch(() => (this.posts = []));
    this.$nextTick(() => fitInCircle(this.$refs.dtsv));
    document.fonts?.ready?.then(() => fitInCircle(this.$refs.dtsv));
  },

  beforeUnmount() {
    this.unfit?.();
    this.mq?.removeEventListener?.("change", this.onMq);
    document.removeEventListener("click", this.onDoc, true);
    document.removeEventListener("keydown", this.onKey);
    window.removeEventListener("resize", this.onResize);
    clearTimeout(this.timer);
    if (this.layer.open === this.fpId) closeLayer(true);
  },

  methods: {
    t,
    money,
    catTitle,
    catTo,
    productTo,
    postRoute,
    fmtDate,
    breakable,
    toggleLayer,
    closeLayer,
    pv(p) {
      void this.currency;
      return priceView(this.shop, p);
    },
    img(p, big = false) {
      return productImage(p, big ? null : 128);
    },
    topImg(c) {
      const top = bySells(inCat(c.id))[0];
      return top ? productImage(top, 128) : null;
    },
    postImg(b) {
      return b.image ? window.CDN.GET_SHOP_IMAGE_PATH(b.image, null) : null;
    },
    matches(q) {
      const words = String(q || "").toLowerCase().split(/\s+/).filter(Boolean);
      if (!words.length) return [];
      return this.ly.products
        .map((p) => {
          const title = String(p.title || "").toLowerCase();
          const hay = (title + " " + catTitle(catOf(p.category_id)) + " " + Object.values(p.spec || {}).flat().join(" ")).toLowerCase();
          let s = 0;
          for (const w of words) {
            if (title.includes(w)) s += 3;
            else if (hay.includes(w)) s += 1;
            else return { p, s: 0 };
          }
          return { p, s };
        })
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s || (b.p.sells || 0) - (a.p.sells || 0))
        .map((x) => x.p);
    },
    sorted(l) {
      const out = [...l];
      const key = this.sort;
      if (key === "best") return bySells(out);
      if (key === "review") return out.sort((a, b) => (b.rate || 0) - (a.rate || 0) || (b.rate_count || 0) - (a.rate_count || 0));
      if (key === "low") return out.sort((a, b) => this.pv(a).now - this.pv(b).now || a.id - b.id);
      if (key === "high") return out.sort((a, b) => this.pv(b).now - this.pv(a).now || a.id - b.id);
      if (key === "new") return out.sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")) || b.id - a.id);
      if (key === "saving") return out.sort((a, b) => this.pv(b).save - this.pv(a).save || a.id - b.id);
      return out;
    },
    resetRange() {
      this.min = this.lo;
      this.max = this.hi;
    },
    /* Fewer results than columns: the cards keep their width and the row is centred. */
    fit() {
      const g = this.$refs.grid;
      if (!g) return;
      const n = this.shown.length;
      const cs = getComputedStyle(g);
      const cols = parseInt(cs.getPropertyValue("--ly-cols"), 10) || 5;
      const gap = parseFloat(cs.columnGap) || 0;
      this.fitStyle = n && n < cols ? { gridTemplateColumns: `repeat(${n}, calc((100% - ${(cols - 1) * gap}px) / ${cols}))`, justifyContent: "center" } : null;
    },
    /* Dim, say "Updating results…", then draw the new list fading up. */
    update() {
      const still = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
      if (still) {
        this.animate = false;
        this.snapshot = [...this.list];
        return;
      }
      this.busy = true;
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.busy = false;
        this.animate = true;
        this.drawn++;
        this.snapshot = [...this.list];
      }, 300);
    },
    picked(k, v) {
      return !!(this.f[k] && this.f[k].includes(v));
    },
    toggle(k, v) {
      const cur = [...(this.f[k] || [])];
      const i = cur.indexOf(v);
      if (i >= 0) cur.splice(i, 1);
      else cur.push(v);
      this.f = { ...this.f, [k]: cur };
      this.update();
    },
    setOffer(v) {
      this.offer = v;
      this.update();
    },
    setSort(s) {
      this.sort = s;
      this.sortOpen = false;
      this.update();
    },
    setTab(id) {
      this.tab = id;
      this.update();
    },
    onMin(v) {
      this.min = Math.min(Number(v), this.max);
    },
    onMax(v) {
      this.max = Math.max(Number(v), this.min);
    },
    boxMin(v) {
      const n = parseFloat(v);
      this.min = isNaN(n) ? this.lo : Math.max(this.lo, Math.min(Math.round(n), this.max));
      this.update();
    },
    boxMax(v) {
      const n = parseFloat(v);
      this.max = isNaN(n) ? this.hi : Math.min(this.hi, Math.max(Math.round(n), this.min));
      this.update();
    },
    reset() {
      this.f = {};
      this.offer = false;
      this.resetRange();
      this.update();
    },
    searchTo(q) {
      return { name: window.$storefront.routes.SHOP_PAGE, query: { search: q } };
    },
    submitSearch() {
      const q = this.q.trim();
      if (!q) return;
      this.$router.push(this.searchTo(q));
    },
  },
};
</script>
