<!--
  Watchino's home, as the static Watchino site draws it, from the shop's live data only:
  the photo hero (the words on its dark left; under the photo on a phone), the minute-marker divider and the
  service strip (the shop's own delivery ways and payment), the collections as a hairline grid of cut-outs, three
  price registers (the most precious collection on the family dark), the spotlight (the most precious reference in
  stock, on the family dark), new to the vitrine (a hairline rail), how a watch reaches you (the shop's photos with
  its own ways and payment), client care (the shop's real contact) and the journal (four newest posts, last).
  A gallery, not a funnel: no badges, no timers, no counts of products. Every section hides itself when the shop
  has nothing for it.
-->
<template>
  <div class="wt-home">
    <!-- Hero -->
    <section aria-labelledby="wt-hero-h" class="wt-hero">
      <div class="wt-hero-media">
        <ly-photo :alt="t('ly.home.heroAlt', 'Two people in evening dress wearing watches')" class="wt-hero-ph" eager name="hero" />
        <ly-photo :alt="t('ly.home.heroAlt', 'Two people in evening dress wearing watches')" class="wt-hero-ph-m" eager name="hero-phone" />
      </div>
      <div class="wrap wt-hero-in">
        <div class="wt-hero-copy">
          <p class="wt-sweep"><span aria-hidden="true" class="wt-sweep-d"><i></i></span><span>{{ t("wt.hero.sweep", "Running seconds") }}</span></p>
          <p v-if="topCol" class="eyebrow wt-eb-on"><bdi>{{ catTitle(topCol.c) }}</bdi></p>
          <h1 id="wt-hero-h" class="wt-h-hero">{{ t("ly.home.heroH", "Nothing hidden.") }}</h1>
          <p v-if="heroLede" class="wt-lede">{{ heroLede }}</p>
          <div class="wt-cta">
            <router-link v-if="topCol" :to="catTo(topCol.c)" class="wt-btn line">{{ t("wt.hero.enter", "Enter {name}", { name: catTitle(topCol.c) }) }}</router-link>
            <router-link :to="allTo" class="wt-btn text">{{ t("wt.hero.all", "All collections") }} <span aria-hidden="true">→</span></router-link>
          </div>
        </div>
      </div>
    </section>

    <div class="wrap"><div aria-hidden="true" class="wt-ticks"></div></div>

    <!-- Service strip -->
    <section v-if="assure.length" :aria-label="t('wt.as.aria', 'Delivery and payment')" class="wt-sec tight">
      <div class="wrap">
        <ul :class="['wt-assure', 'n' + assure.length]">
          <li v-for="a in assure" :key="a.k"><b>{{ a.title }}</b><span class="wt-cap">{{ a.text }}</span></li>
        </ul>
      </div>
    </section>

    <!-- The collections -->
    <section v-if="cols.length" id="collections" aria-labelledby="wt-cols-h" class="wt-sec">
      <div class="wrap">
        <p class="eyebrow">{{ colsEyebrow }}</p>
        <h2 id="wt-cols-h" class="wt-h1 wt-cols-h">{{ t("wt.cols.h", "Sorted by what a watch is for.") }}</h2>
        <ul :class="['wt-cats', 'n' + cols.length]">
          <li v-for="x in cols" :key="x.c.id">
            <router-link :to="catTo(x.c)" class="wt-cat">
              <span class="wt-cat-art"><img v-if="x.img" :src="x.img" alt="" loading="lazy" /></span>
              <b><bdi>{{ catTitle(x.c) }}</bdi></b>
              <span class="wt-cap">{{ t("ly.hdr.from", "From {price}", { price: money(x.min) }) }}</span>
            </router-link>
          </li>
        </ul>
      </div>
    </section>

    <!-- Three registers -->
    <section v-if="regs.length" :aria-label="t('wt.reg.aria', 'Three price registers')" class="wt-regs">
      <div v-for="(r, i) in regs" :key="i" :class="['wt-tier', { flip: i === 1, dark: i === 2 }]">
        <router-link :to="r.cols.length === 1 ? catTo(r.cols[0].c) : allTo" aria-hidden="true" class="wt-tier-art" tabindex="-1">
          <img v-if="r.piece && img(r.piece)" :src="img(r.piece)" alt="" loading="lazy" />
        </router-link>
        <div class="wt-tier-tx">
          <p class="eyebrow">{{ regWord(i) }}</p>
          <h3 class="wt-h2">
            <bdi>{{ r.cols.length === 1 ? catTitle(r.cols[0].c) : t("wt.reg.colsH", "The collections") }}</bdi>
          </h3>
          <p class="wt-lede">{{ regLede(r) }}</p>
          <p class="wt-range" dir="ltr">{{ money(r.min) }} — {{ money(r.max) }}</p>
          <p class="wt-tier-go">
            <router-link :to="r.cols.length === 1 ? catTo(r.cols[0].c) : allTo" class="wt-btn text">
              {{ r.cols.length === 1 ? t("wt.reg.see", "See {name}", { name: catTitle(r.cols[0].c) }) : t("wt.reg.browse", "Browse the collections") }} <span aria-hidden="true">→</span>
            </router-link>
          </p>
        </div>
      </div>
    </section>

    <!-- Spotlight -->
    <section v-if="spot" aria-labelledby="wt-spot-h" class="wt-sec wt-ink">
      <div class="wrap wt-spot">
        <div>
          <p class="eyebrow">{{ t("wt.spot.eb", "The most precious reference") }}</p>
          <h3 id="wt-spot-h" class="wt-h2">{{ spot.title }}</h3>
          <p v-if="spotLede" class="wt-lede">{{ spotLede }}</p>
          <p class="wt-ref" dir="ltr">{{ t("wt.ref", "Ref. {id}", { id: spot.id }) }}<template v-if="spot.brand"> · <bdi>{{ spot.brand }}</bdi></template></p>
        </div>
        <router-link :to="productTo(spot)" aria-hidden="true" class="wt-spot-art" tabindex="-1"><img :src="img(spot)" alt="" loading="lazy" /></router-link>
        <div class="wt-spot-r">
          <ul class="wt-specs">
            <li v-for="[k, v] in spotSpecs" :key="k"><span class="k"><bdi>{{ k }}</bdi></span><span class="v"><bdi>{{ v }}</bdi></span></li>
          </ul>
          <p class="wt-price big"><span class="money">{{ money(pv(spot).now) }}</span><s v-if="pv(spot).was" class="money">{{ money(pv(spot).was) }}</s></p>
          <router-link :to="productTo(spot)" class="wt-btn line">{{ t("wt.spot.view", "View the reference") }}</router-link>
        </div>
      </div>
    </section>

    <!-- New to the vitrine -->
    <section v-if="newest.length" aria-labelledby="wt-new-h" class="wt-sec">
      <div class="wrap">
        <div class="wt-listhd">
          <div>
            <p class="eyebrow">{{ t("wt.new.eb", "Recently added") }}</p>
            <h2 id="wt-new-h" class="wt-h2">{{ t("wt.new.h", "New to the vitrine") }}</h2>
          </div>
          <router-link :to="allTo" class="wt-btn text">{{ t("wt.new.all", "All references") }} <span aria-hidden="true">→</span></router-link>
        </div>
        <div class="wt-scroller">
          <ly-card v-for="p in newest" :key="p.id" :product="p" />
        </div>
      </div>
    </section>

    <!-- How a watch reaches you -->
    <section v-if="ways.length" aria-labelledby="wt-salon-h" class="wt-sec wt-ink">
      <div class="wrap">
        <div aria-hidden="true" class="wt-ticks"></div>
        <p class="eyebrow wt-sal-eb">{{ t("wt.sal.eb", "From the vitrine to your wrist") }}</p>
        <h2 id="wt-salon-h" class="wt-h1 wt-sal-h">{{ t("wt.sal.h", "How a watch reaches you.") }}</h2>
        <div class="wt-scenes">
          <figure v-for="(w, i) in ways" :key="w.k" :class="['wt-scene', { wide: i === 0 }]">
            <ly-photo :name="w.photo" class="wt-scene-ph" />
            <figcaption><b>{{ w.title }}</b><span>{{ w.text }}</span></figcaption>
          </figure>
        </div>
      </div>
    </section>

    <!-- Client care -->
    <section v-if="facts.ready && (facts.email || facts.phone)" id="service" aria-labelledby="wt-care-h" class="wt-sec">
      <div class="wrap wt-edit">
        <ly-photo :alt="t('ly.home.journalAlt', 'A watch given as a gift')" class="wt-edit-ph" name="gift" />
        <div>
          <p class="eyebrow">{{ t("wt.care.eb", "Client care") }}</p>
          <h3 id="wt-care-h" class="wt-h1">{{ t("wt.care.h", "Questions before you choose?") }}</h3>
          <p class="wt-lede">{{ t("wt.care.p", "Write or call the shop about a reference, its finish or its delivery before you order. The answer comes from the shop itself.") }}</p>
          <p class="wt-care-c">
            <a v-if="facts.email" :href="'mailto:' + facts.email">{{ facts.email }}</a>
            <a v-if="facts.phone" :href="'tel:' + facts.phone.replace(/[^\d+]/g, '')" dir="ltr">{{ facts.phone }}</a>
          </p>
          <p class="wt-cta">
            <router-link :to="{ name: r.SHOP_CONTACT_US }" class="wt-btn line">{{ t("wt.care.contact", "Contact the shop") }}</router-link>
            <router-link :to="faqTo" class="wt-btn text">{{ t("wt.care.faq", "Read the FAQ") }} <span aria-hidden="true">→</span></router-link>
          </p>
        </div>
      </div>
    </section>

    <!-- Journal (last) -->
    <section v-if="posts.length" aria-labelledby="wt-j-h" class="wt-sec wt-j">
      <div class="wrap">
        <div aria-hidden="true" class="wt-ticks"></div>
        <div class="wt-listhd">
          <div>
            <p class="eyebrow">{{ t("wt.j.eb", "The journal") }}</p>
            <h2 id="wt-j-h" class="wt-h2">{{ t("wt.j.h", "Notes on fine watches") }}</h2>
          </div>
          <router-link :to="blogTo" class="wt-btn text">{{ t("ly.home.allPosts", "All journal posts") }} <span aria-hidden="true">→</span></router-link>
        </div>
        <ul class="wt-posts">
          <li v-for="b in posts" :key="b.id">
            <router-link :to="postRoute(b)" class="wt-post">
              <span class="wt-post-ph"><img v-if="b.image" :src="postImg(b)" alt="" loading="lazy" /></span>
              <time v-if="b.created_at" :datetime="b.created_at" class="wt-ref">{{ fmtDate(b.created_at) }}</time>
              <b>{{ b.title }}</b>
            </router-link>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script>
import LyPhoto from "../LyPhoto.vue";
import LyCard from "../ui/LyCard.vue";
import homeData from "../home/home-data";
import { journalPage, journalRoute, postRoute } from "../../kalio/pages/kalio-journal";
import { catalogueRoute } from "../../kalio/kalio-catalog";
import { catTitle, catTo, fmtDate, money, priceView, productImage, productTo } from "../ly";
import { t } from "../../kalio/i18n/kalio-i18n";
import { wtCols, wtNewest, wtRegisters, wtSpecRows, wtSpecValues, wtSpotlight } from "./wt";

const lang = () => document.documentElement.lang || "en";
const list = (items) => {
  try {
    return new Intl.ListFormat(lang(), { style: "long", type: "conjunction" }).format(items);
  } catch {
    return items.join(", ");
  }
};

export default {
  name: "WtHome",
  components: { LyPhoto, LyCard },
  mixins: [homeData],
  data: () => ({ posts: [] }),
  computed: {
    r() {
      return window.$storefront.routes;
    },
    allTo() {
      return catalogueRoute();
    },
    blogTo() {
      return journalRoute();
    },
    faqTo() {
      return this.$router.hasRoute("ShopFAQ") ? { name: "ShopFAQ" } : { name: this.r.SHOP_CONTACT_US };
    },
    cols() {
      void this.currency;
      return this.ly.ready ? wtCols(this.shop) : [];
    },
    topCol() {
      return this.cols.length ? [...this.cols].sort((a, b) => b.median - a.median)[0] : null;
    },
    colsEyebrow() {
      const n = this.cols.length;
      return t("wt.cols.eb", { one: "One collection", other: "{n} collections" }, { n });
    },
    heroLede() {
      if (!this.cols.length) return "";
      const all = this.cols.flatMap((x) => [x.min, x.max]).filter((n) => n > 0);
      return t("wt.hero.p", "{n} collections of fine watches, from {from} to {to}. Every reference shows its specification and its price, nothing hidden.", {
        n: this.cols.length,
        from: money(Math.min(...all)),
        to: money(Math.max(...all)),
      });
    },
    regs() {
      void this.currency;
      return this.ly.ready ? wtRegisters(this.shop) : [];
    },
    spot() {
      void this.currency;
      return this.ly.ready ? wtSpotlight(this.shop) : null;
    },
    spotSpecs() {
      return wtSpecRows(this.spot, 5);
    },
    spotLede() {
      const s = this.spot?.spec || {};
      const pick = (k) => (Array.isArray(s[k]) ? s[k][0] : s[k] && s[k] !== "group" ? s[k] : "");
      const parts = [pick("Special Features"), pick("Movement Type") || pick("Movement"), pick("Power Reserve")].filter(Boolean);
      return parts.length ? parts.join(" · ") : "";
    },
    newest() {
      return this.ly.ready ? wtNewest(10) : [];
    },
    /* the service strip: the shop's own delivery ways and payment */
    assure() {
      const f = this.facts;
      if (!f.ready) return [];
      const out = [];
      if (f.courier) {
        const fee = f.courier.fee > 0 ? money(f.courier.fee) : t("wt.as.free", "free");
        out.push({ k: "c", title: f.courier.title, text: f.courier.distance ? t("wt.as.within", "Within {km} km, {fee}", { km: f.courier.distance, fee }) : fee });
      }
      if (f.shipping) out.push({ k: "s", title: f.shipping.title, text: f.shipping.fee > 0 ? t("wt.as.flat", "{fee} per order", { fee: money(f.shipping.fee) }) : t("wt.as.freeShip", "Free") });
      const names = [...new Set((f.gateways || []).map((g) => g.name).filter(Boolean))];
      if (names.length) out.push({ k: "p", title: t("wt.as.pay", "Payment"), text: list(names.slice(0, 3)) });
      const ps = this.products;
      if (ps.length && ps.every((p) => !p.condition || p.condition === "new")) out.push({ k: "n", title: t("wt.as.newT", "New references"), text: t("wt.as.newP", "Every watch is listed as new") });
      return out.length >= 4 ? out.slice(0, 4) : out.length >= 2 ? out.slice(0, 2) : out;
    },
    /* how a watch reaches you: the shop's photos with its own ways and payment */
    ways() {
      const f = this.facts;
      if (!f.ready) return [];
      const out = [{ k: "c", photo: "boutique", title: t("wt.sal.chooseT", "Choose at leisure"), text: t("wt.sal.chooseP", "Compare references side by side, and ask the shop anything before you order.") }];
      const dl = [];
      if (f.courier) dl.push(f.courier.distance ? t("wt.sal.courier", "{name} within {km} km", { name: f.courier.title, km: f.courier.distance }) : f.courier.title);
      if (f.shipping) dl.push(f.shipping.title);
      if (f.pickup && f.pickupPoint) dl.push(f.pickup.title);
      if (dl.length) out.push({ k: "d", photo: "travel", title: t("wt.sal.sendT", "Sent to you"), text: list(dl) + "." });
      const names = [...new Set((f.gateways || []).map((g) => g.name).filter(Boolean))];
      if (names.length) out.push({ k: "p", photo: "story", title: t("wt.sal.payT", "Paid your way"), text: list(names.slice(0, 3)) + "." });
      return out.length === 3 ? out : out.slice(0, 1).length && out.length === 2 ? out : out;
    },
  },
  mounted() {
    journalPage({ page: 1, limit: 8 })
      .then(({ articles }) => {
        const l = (articles || []).slice().sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
        this.posts = l.slice(0, 4);
      })
      .catch(() => (this.posts = []));
  },
  methods: {
    t,
    money,
    catTitle,
    catTo,
    productTo,
    fmtDate,
    postRoute,
    pv(p) {
      void this.currency;
      return priceView(this.shop, p);
    },
    img(p) {
      return productImage(p);
    },
    regWord(i) {
      return [t("wt.reg.one", "Register one"), t("wt.reg.two", "Register two"), t("wt.reg.three", "Register three")][i];
    },
    regLede(r) {
      const ps = r.cols.flatMap((x) => x.ps);
      const names = r.cols.length > 1 ? list(r.cols.map((x) => catTitle(x.c))) : "";
      const mv = wtSpecValues(ps, "Movement", 2);
      const st = wtSpecValues(ps, "Strap", 3);
      const bits = [];
      if (names) bits.push(t("wt.reg.where", "{names}: where most people begin.", { names }));
      if (mv.length) bits.push(t("wt.reg.mv", "{list} movements", { list: list(mv) }) + (st.length ? t("wt.reg.st", ", on {list}.", { list: list(st.map((s) => s.toLowerCase())) }) : "."));
      return bits.join(" ");
    },
  },
};
</script>
