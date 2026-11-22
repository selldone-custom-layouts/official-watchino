<!--
  The bag drawer (design/src/shell.js drawerHTML(),
  renderDrawer()): "Your bag" from the right; a row per line (the pastry on
  its plate, the name, the price per unit, the line total and − n +); the
  receipt (items at full price, savings, delivery at checkout or the free
  way already chosen, the total with the way to pay); Checkout and "View
  bag"; "Often added" (best sellers from collections not in the bag, with
  their own add box). Empty: the croissant drawing, a calm line and
  "Today's selection", then "Often added". The lines are Selldone's own
  basket (every count through kalio-basket's queue), its amounts in the
  visitor's currency.
-->
<template>
  <aside id="drawer" :aria-label="t('ly.bag.title', 'Your bag')" :class="['panel', 'drawer', { open }]" aria-modal="true" role="dialog">
    <div class="pn-hd">
      <h2 class="pn-t">{{ t("ly.bag.title", "Your bag") }}</h2>
      <button :aria-label="t('ly.bag.close', 'Close bag')" class="ibtn x" type="button" @click="close"><ly-icon name="close" /></button>
    </div>
    <div class="dw-body">
      <template v-if="lines.length">
        <ul class="dw-list">
          <li v-for="it in lines" :key="it.id">
            <router-link :to="productTo(it)" aria-hidden="true" class="th" tabindex="-1" @click="close"><img :src="image(it)" alt="" loading="lazy" /></router-link>
            <div class="dw-tx">
              <router-link :to="productTo(it)" class="dw-n" @click="close">{{ it.product?.title }}</router-link>
              <small
                ><span class="money">{{ amount(it.price, it) }}</span> {{ t("ly.card.perLow", "per {unit}", { unit: unitOf(it.product) }) }}<template v-if="it.dis > 0">
                  · <s class="money">{{ amount(it.price + it.dis, it) }}</s></template
                ></small
              >
            </div>
            <b class="dw-lt money">{{ amount(it.price * shown(it), it) }}</b>
            <div class="dw-q">
              <div :aria-label="t('ly.add.inBag', '{name} in bag', { name: it.product?.title || '' })" class="qb" role="group">
                <button
                  :aria-label="shown(it) > 1 ? t('ly.add.less', 'Remove one {name}', { name: it.product?.title || '' }) : t('ly.add.remove', 'Remove {name} from the bag', { name: it.product?.title || '' })"
                  type="button"
                  @click.prevent.stop="step(it, -1)"
                >
                  <ly-icon name="minus" />
                </button>
                <span aria-live="polite" class="qn">{{ shown(it) }}</span>
                <button
                  :aria-disabled="shown(it) >= maxOf(it) ? 'true' : undefined"
                  :aria-label="t('ly.add.more', 'Add one more {name}', { name: it.product?.title || '' })"
                  type="button"
                  @click.prevent.stop="shown(it) < maxOf(it) && step(it, 1)"
                >
                  <ly-icon name="plus" />
                </button>
              </div>
            </div>
          </li>
        </ul>
        <div class="dw-sum">
          <p>
            <span>{{ t("ly.bag.full", "Items at full price") }}</span><span class="money">{{ money(sum.full, sum.currency) }}</span>
          </p>
          <p v-if="sum.save > 0">
            <span>{{ saveLabel }}</span><span class="money">−{{ money(sum.save, sum.currency) }}</span>
          </p>
          <p>
            <template v-if="freeWay"
              ><span>{{ t("ly.bag.deliveryOf", "Delivery · {way}", { way: freeWay }) }}</span><span>{{ t("ly.bag.free", "Free") }}</span></template
            >
            <template v-else
              ><span>{{ t("ly.bag.delivery", "Delivery") }}</span><span>{{ t("ly.bag.atCheckout", "Chosen at checkout") }}</span></template
            >
          </p>
          <p class="tot">
            <span>{{ gateway ? t("ly.bag.totalWith", "Total · {way}", { way: gateway.toLowerCase() }) : t("ly.bag.total", "Total") }}</span
            ><span class="money">{{ money(sum.total, sum.currency) }}</span>
          </p>
        </div>
        <div class="dw-acts">
          <router-link :to="checkoutTo" class="btn" @click="close">{{ t("ly.bag.checkout", "Checkout") }}<ly-icon name="arrow" /></router-link>
          <router-link :to="bagTo" class="qlink" @click="close">{{ t("ly.bag.view", "View bag") }}</router-link>
        </div>
      </template>
      <div v-else class="dw-empty">
        <ly-art cls="dw-art" name="croissant" />
        <h3>{{ t("ly.bag.emptyT", "Your bag is empty") }}</h3>
        <p>{{ t("ly.bag.emptyP", "Pastries are sold one by one, so add exactly the pieces you want.") }}</p>
        <a class="btn sm" href="#selection" @click.prevent="toSelection">{{ t("ly.bag.selection", "Today’s selection") }}</a>
      </div>
      <div v-if="often.length" class="dw-often">
        <h3 class="dw-h">{{ t("ly.bag.often", "Often added") }}</h3>
        <ul class="minis">
          <li v-for="p in often" :key="p.id" class="mini">
            <router-link :to="pTo(p)" aria-hidden="true" class="mini-th" tabindex="-1" @click="close"><img :src="productImage(p, 128)" alt="" loading="lazy" /></router-link>
            <div class="mini-tx">
              <router-link :to="pTo(p)" class="mini-t" @click="close">{{ p.title }}</router-link>
              <span class="mini-p"
                ><span class="now money">{{ dmMoney(pv(p).now) }}</span><template v-if="pv(p).was">{{ " " }}<s class="was money">{{ dmMoney(pv(p).was) }}</s></template></span
              >
            </div>
            <div class="mini-a"><ly-add :label="t('ly.add.short', 'Add')" :product="p" /></div>
          </li>
        </ul>
      </div>
    </div>
  </aside>
</template>

<script>
import LyIcon from "../LyIcon.vue";
import LyArt from "../LyArt.vue";
import LyAdd from "../LyAdd.vue";
import { bySells, closeLayer, ly, layer, money as dmMoney, priceView, productImage, productTo as pTo, scrollBehavior, shopFacts, unitOf, wayTitle } from "../ly";
import { shownCount, stepTo } from "../../kalio/kalio-basket";
import { productImage as lineImage } from "../../kalio/kalio-catalog";
import { currentCurrency, money } from "../../region-switcher/region";
import { t } from "../../kalio/i18n/kalio-i18n";

export default {
  name: "LyBagDrawer",
  components: { LyIcon, LyArt, LyAdd },
  data: () => ({ layer, ly }),
  computed: {
    open() {
      return this.layer.open === "drawer";
    },
    shop() {
      return this.$store.getters.getShop;
    },
    gateway() {
      return shopFacts(this.shop).gateway?.name || "";
    },
    basket() {
      return this.getBaskets().find((b) => b?.type === "PHYSICAL") || this.getBaskets().find((b) => b?.items?.length) || null;
    },
    lines() {
      return (this.basket?.items || []).filter((it) => shownCount(it.product || { id: it.product_id }, it) > 0);
    },
    sum() {
      const b = this.basket || {};
      let full = 0;
      let save = 0;
      for (const it of this.lines) {
        const n = this.shown(it);
        full += (it.price + (it.dis || 0)) * n;
        save += (it.dis || 0) * n;
      }
      save += this.lines.reduce((s, it) => s + (it.offer_amount || 0), 0);
      return { full, save, total: full - save, currency: b.bill?.currency || b.currency };
    },
    /* The bag's chosen way when it costs nothing (pickup, or no fee and no
       rate by distance or weight; or over its free-shipping amount): the
       receipt names it. Otherwise the checkout says. */
    freeWay() {
      const type = this.basket?.delivery_info?.type;
      const shop = this.shop;
      const way = type && (shop?.transportations || []).find((w) => w && w.type === type && w.enable !== false);
      if (!way) return "";
      const noFee = !(Number(way.const) > 0) && !(Number(way.distance_rate) > 0) && !(Number(way.weight_rate) > 0);
      const overLimit = !!way.free_shipping && (!(Number(way.free_shipping_limit) > 0) || this.sum.total >= Number(way.free_shipping_limit));
      return type === "Pickup" || noFee || overLimit ? wayTitle(way, shop) : "";
    },
    /* "Savings · 25% off" when every line saves the same percent. */
    saveLabel() {
      const offs = this.lines.filter((it) => it.dis > 0).map((it) => Math.round((it.dis / (it.price + it.dis)) * 100));
      if (offs.length && offs.length === this.lines.length && offs.every((x) => x === offs[0])) return t("ly.bag.savingsOff", "Savings · {off}% off", { off: offs[0] });
      return t("ly.bag.savings", "Savings");
    },
    /* Three best sellers, one per collection not already in the bag. */
    often() {
      const inBag = new Set(this.lines.map((it) => it.product_id));
      const cats = new Set(this.lines.map((it) => it.product?.category_id));
      const picks = [];
      const used = new Set();
      const all = bySells(this.ly.products.filter((p) => p.quantity > 0));
      for (const p of all) {
        if (picks.length < 3 && !inBag.has(p.id) && !cats.has(p.category_id) && !used.has(p.category_id)) {
          picks.push(p);
          used.add(p.category_id);
        }
      }
      for (const p of all) if (picks.length < 3 && !inBag.has(p.id) && !picks.includes(p)) picks.push(p);
      return picks;
    },
    bagTo() {
      return { name: window.$storefront.routes.BASKET_PAGE, params: { type: "PHYSICAL" } };
    },
    checkoutTo() {
      return { ...this.bagTo, query: { step: "checkout" } };
    },
  },
  watch: {
    /* The drawer takes the focus when it opens. */
    open(on) {
      if (on) this.$nextTick(() => setTimeout(() => this.$el?.querySelector?.(".pn-hd .x")?.focus({ preventScroll: true }), 60));
    },
  },
  methods: {
    t,
    money,
    dmMoney,
    unitOf,
    productImage,
    pTo,
    close() {
      closeLayer();
    },
    pv(p) {
      void currentCurrency();
      return priceView(this.shop, p);
    },
    shown(it) {
      return shownCount(it.product || { id: it.product_id }, it);
    },
    maxOf(it) {
      const q = it.vendor_product?.quantity ?? it.variant?.quantity ?? it.product?.quantity;
      return Number.isFinite(Number(q)) && Number(q) > 0 ? Number(q) : 99;
    },
    step(it, d) {
      stepTo(this, { id: it.product_id, type: it.product?.type }, it, this.shown(it) + d);
    },
    amount(n, it) {
      return money(n, it.currency || this.sum.currency);
    },
    image(it) {
      return lineImage(it.product || {}, true);
    },
    productTo(it) {
      return { name: window.$storefront.routes.PRODUCT_PAGE, params: { product_id: it.product_id } };
    },
    /* "Today's selection": on the home, scroll to it; elsewhere, the home first. */
    toSelection() {
      closeLayer(true);
      const go = () => document.getElementById("selection")?.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
      if (document.getElementById("selection")) return go();
      this.$router.push({ path: "/" }).then(() => setTimeout(go, 400)).catch(() => {});
    },
  },
};
</script>
