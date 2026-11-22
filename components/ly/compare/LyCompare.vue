<!--
  The compare page (design/compare-b.html,
  src/pages-product.js compare): the title band; "Only differences" and
  "Copy link"; the heads (each pastry with ✕ inside its card, the photo, the
  name, the price, "Per <unit>" and Add), which stay under the header while
  the rows scroll, plus an "Add a pastry" column until there are four; then
  the spec in the shop's own groups (the collections' "… Profile" groups as
  one "Profile"): a row that differs is marked with a dot and its values in
  bold, a row that is the same for all is one line ("· all"); "Why pick it"
  (each pastry's first two pros) and the reviews' state; the share card. On
  a phone the heads and rows scroll sideways together, the labels ride
  along. The address keeps Selldone's ?list= format (KalioCompare's logic).
-->
<template>
  <div class="ly ly-cmp">
    <ly-pt
      :crumbs="[{ label: t('ly.cmp.crumb', 'Compare') }]"
      :lead="t('ly.cmp.lead', 'Side by side, from each pastry’s own details. Rows that match are folded into one line.')"
      :title="t('ly.cmp.title', 'Compare pastries')"
      art="tart"
      art2="macaron"
      cls="compact"
    />
    <section :aria-label="t('ly.cmp.aria', 'Comparison')" class="sec-s cmp-s">
      <div class="wrap">
        <ly-empty v-if="!items.length && !busy" :text="t('ly.cmp.emptyP', 'Choose two or more pastries to see them side by side.')" :title="t('ly.cmp.emptyT', 'Nothing to compare yet')" cls="boxed" icon="compare">
          <template #acts>
            <button aria-controls="cmp-pick" class="btn" type="button" @click="openPick($event)">{{ t("ly.cmp.addOne", "Add a pastry") }}</button>
          </template>
        </ly-empty>
        <template v-else>
          <div class="cmp-bar">
            <div class="cmp-sw">
              <button :aria-checked="diffOnly ? 'true' : 'false'" :disabled="items.length < 2" aria-labelledby="ly-diff-l" class="switch" role="switch" type="button" @click="diffOnly = !diffOnly"><span></span></button
              ><span id="ly-diff-l">{{ t("ly.cmp.onlyDiff", "Only differences") }}</span>
            </div>
            <button class="btn quiet sm" type="button" @click="copyLink('top')"><ly-icon :name="copied === 'top' ? 'check' : 'link'" />{{ copied === "top" ? t("ly.cmp.copied", "Link copied") : t("ly.cmp.copy", "Copy link") }}</button>
          </div>

          <div :class="['cmp', { 'only-diff': diffOnly }]">
            <div ref="heads" class="cmp-heads" @scroll="syncTo($event, 'body')">
              <div :style="{ '--ly-n': cols }" class="cmp-row hd">
                <div class="cl lab">
                  <p class="cl-k">{{ t("ly.cmp.comparing", "Comparing") }}</p>
                  <p class="cl-t">{{ catsLine }}</p>
                </div>
                <div v-for="it in items" :key="it.key" class="cl">
                  <div class="ch">
                    <button :aria-label="t('ly.cmp.remove', 'Remove {name} from the comparison', { name: it.product.title })" class="ibtn x ch-x" type="button" @click="remove(it)"><ly-icon name="close" /></button>
                    <router-link :to="productRoute(it)" aria-hidden="true" class="ch-pl" tabindex="-1"><img :src="it.image" alt="" loading="lazy" /></router-link>
                    <router-link :to="productRoute(it)" class="ch-n">{{ it.product.title }}</router-link>
                    <p class="ch-p">
                      <span class="now money">{{ fmt(it.price.now) }}</span><template v-if="it.price.was && it.price.was > it.price.now">{{ " " }}<s class="was money">{{ fmt(it.price.was) }}</s></template>
                    </p>
                    <p class="ch-u">{{ t("ly.card.per", "Per {unit}", { unit: unitOf(it.product) }) }}</p>
                    <div class="ch-a"><ly-add :label="t('ly.add.short', 'Add')" :product="it.product" /></div>
                  </div>
                </div>
                <div v-if="items.length < MAX_N" class="cl">
                  <div class="ch add">
                    <button :aria-expanded="layer.open === 'cmp-pick' ? 'true' : 'false'" aria-controls="cmp-pick" class="ch-add" type="button" @click="openPick($event)">
                      <span class="ch-addic"><ly-icon name="plus" /></span><b>{{ t("ly.cmp.addOne", "Add a pastry") }}</b><span>{{ t("ly.cmp.upTo", "Up to four, from any collection") }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div ref="body" class="cmp-body" @scroll="syncTo($event, 'heads')">
              <div v-for="g in dGroups" :key="g.title" class="cmp-g">
                <h2 class="cmp-gh">{{ g.title }}</h2>
                <template v-for="r in g.rows" :key="r.key">
                  <div v-if="!r.diff" :style="{ '--ly-n': cols }" class="cmp-row same" data-same>
                    <div class="cl lab"><span>{{ r.key }}</span></div>
                    <div class="cl all">
                      <span>{{ r.values[0] || "—" }}</span><span v-if="items.length > 1" class="all-k"> · {{ t("ly.cmp.all", "all") }}</span>
                    </div>
                  </div>
                  <div v-else :style="{ '--ly-n': cols }" class="cmp-row diff">
                    <div class="cl lab">
                      <span aria-hidden="true" class="dot"></span><span>{{ r.key }}</span><span class="sr"> ({{ t("ly.cmp.differs", "differs") }})</span>
                    </div>
                    <div v-for="(v, i) in r.values" :key="i" class="cl">
                      <b>{{ v || "—" }}</b>
                    </div>
                    <div v-if="items.length < MAX_N" aria-hidden="true" class="cl empty-c"></div>
                  </div>
                </template>
              </div>

              <div v-if="!diffOnly" class="cmp-g">
                <h2 class="cmp-gh">{{ t("ly.cmp.why", "Why pick it") }}</h2>
                <div v-if="anyPros" :style="{ '--ly-n': cols }" class="cmp-row why">
                  <div class="cl lab"><span>{{ t("ly.cmp.fromPage", "From each product page") }}</span></div>
                  <div v-for="it in items" :key="it.key" class="cl">
                    <ul class="why-l">
                      <li v-for="(x, i) in prosOf(it.product).slice(0, 2)" :key="i">
                        <span class="ck"><ly-icon name="check" /></span
                        ><span
                          ><b>{{ x[0] }}</b> {{ x[1] }}</span
                        >
                      </li>
                    </ul>
                  </div>
                  <div v-if="items.length < MAX_N" aria-hidden="true" class="cl empty-c"></div>
                </div>
                <div :style="{ '--ly-n': cols }" class="cmp-row">
                  <div class="cl lab"><span>{{ t("ly.cmp.reviews", "Reviews") }}</span></div>
                  <div v-for="it in items" :key="it.key" class="cl">
                    <span class="nr"
                      ><ly-icon name="star" />{{
                        it.rateCount ? t("ly.cmp.rated", { one: "{rate} · {n} review", other: "{rate} · {n} reviews" }, { n: it.rateCount, rate: it.rate.toFixed(1) }) : t("ly.pd.noReviews", "No reviews yet")
                      }}</span
                    >
                  </div>
                  <div v-if="items.length < MAX_N" aria-hidden="true" class="cl empty-c"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="cmp-share">
            <span class="il-ic"><ly-icon name="share" /></span>
            <p>
              <b>{{ t("ly.cmp.share", "Share this comparison") }}</b><span class="mono">{{ linkShown }}</span>
            </p>
            <button class="btn sm" type="button" @click="copyLink('card')">{{ copied === "card" ? t("ly.cmp.copied", "Link copied") : t("ly.cmp.copy", "Copy link") }}</button>
          </div>
        </template>
      </div>
    </section>

    <ly-modal id="cmp-pick" :title="t('ly.cmp.addOne', 'Add a pastry')" cls="small" @open="pickQ = ''">
      <label class="fld"
        ><span class="fl">{{ t("ly.cmp.find", "Find a pastry") }}</span
        ><input :placeholder="pickPh" :value="pickQ" autocomplete="off" class="inp" data-autofocus type="search" @input="pickQ = $event.target.value"
      /></label>
      <div class="pick-out">
        <template v-for="g in pickGroups" :key="g.c.id">
          <p class="dd-h"><bdi>{{ catTitle(g.c) }}</bdi></p>
          <ul class="pick-l">
            <li v-for="p in g.list" :key="p.id">
              <button class="pick" type="button" @click="choose(p)">
                <span class="th"><img :src="thumb(p)" alt="" loading="lazy" /></span><span class="pk-n">{{ p.title }}</span><span class="pk-p money">{{ fmt(priceView(shop, p).now) }}</span>
              </button>
            </li>
          </ul>
        </template>
        <p v-if="!pickGroups.length" class="md-lead">{{ t("ly.cmp.noPick", "No pastry matches “{q}”.", { q: pickQ }) }}</p>
      </div>
    </ly-modal>
  </div>
</template>

<script>
import KalioCompare from "../../kalio/compare/KalioCompare.vue";
import LyIcon from "../LyIcon.vue";
import LyAdd from "../LyAdd.vue";
import LyPt from "../ui/LyPt.vue";
import LyEmpty from "../ui/LyEmpty.vue";
import LyModal from "../ui/LyModal.vue";
import { catOf, catTitle, closeLayer, ly, layer, loadDm, money as fmt, openLayer, priceView, productImage, prosOf, unitOf } from "../ly";
import { t } from "../../kalio/i18n/kalio-i18n";

const list = (items) => {
  try {
    return new Intl.ListFormat(document.documentElement.lang || "en", { style: "long", type: "conjunction" }).format(items);
  } catch {
    return items.join(", ");
  }
};

export default {
  name: "LyCompare",
  extends: KalioCompare,
  components: { LyIcon, LyAdd, LyPt, LyEmpty, LyModal },

  data() {
    return { layer, ly, pickQ: "", MAX_N: 4 };
  },

  computed: {
    cols() {
      return this.items.length + (this.items.length < this.MAX_N ? 1 : 0);
    },
    catsLine() {
      const names = [...new Set(this.items.map((it) => catTitle(it.product.category || catOf(it.product.category_id))).filter(Boolean))];
      return list(names);
    },
    anyPros() {
      return this.items.some((it) => prosOf(it.product).length);
    },
    /* The shop's groups, the collections' "… Profile" groups as one. */
    dGroups() {
      const out = [];
      const at = new Map();
      for (const g of this.shownGroups) {
        const key = /Profile$/i.test(g.title || "") ? "Profile" : g.title || "";
        if (!at.has(key)) {
          at.set(key, out.length);
          out.push({ title: g.title || "", titles: new Set([g.title]), rows: [], seen: new Set() });
        }
        const G = out[at.get(key)];
        G.titles.add(g.title);
        if (G.titles.size > 1) G.title = t("ly.cmp.profile", "Profile");
        for (const r of g.shown) {
          if (G.seen.has(r.key)) continue;
          G.seen.add(r.key);
          G.rows.push(r);
        }
      }
      return out;
    },
    /* The pastries to add, the first pick's collection first. */
    pickGroups() {
      const q = this.pickQ.trim().toLowerCase();
      const first = this.items[0]?.product?.category_id;
      const cats = [...this.ly.cats].sort((a, b) => (b.id === first) - (a.id === first));
      return cats
        .map((c) => ({ c, list: this.ly.products.filter((p) => p.category_id === c.id && !this.ids.includes(p.id) && (!q || String(p.title).toLowerCase().includes(q))) }))
        .filter((g) => g.list.length);
    },
    pickPh() {
      const names = this.ly.cats.slice(0, 2).map((c) => catTitle(c).toLowerCase().replace(/s$/, ""));
      return names.length ? names.join(", ") + "…" : "";
    },
  },

  created() {
    loadDm();
  },

  beforeUnmount() {
    if (this.layer.open === "cmp-pick") closeLayer(true);
  },

  methods: {
    t,
    fmt,
    catTitle,
    prosOf,
    unitOf,
    priceView,
    thumb(p) {
      return productImage(p, 128);
    },
    openPick(e) {
      openLayer("cmp-pick", e?.currentTarget || null);
    },
    choose(p) {
      closeLayer(true);
      this.add(p);
    },
    /* The heads and the rows scroll sideways together. */
    syncTo(e, other) {
      if (this.syncing) return;
      const to = this.$refs[other];
      if (!to) return;
      this.syncing = true;
      to.scrollLeft = e.target.scrollLeft;
      requestAnimationFrame(() => (this.syncing = false));
    },
    copyLink(where) {
      const done = () => {
        this.copied = where;
        clearTimeout(this.copy_timer);
        this.copy_timer = setTimeout(() => (this.copied = null), 1600);
      };
      try {
        navigator.clipboard.writeText(this.link).then(done, done);
      } catch {
        done();
      }
    },
  },
};
</script>
