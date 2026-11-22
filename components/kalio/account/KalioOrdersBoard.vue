<!--
  The shopper's orders (design/account-b.html, the Orders
  panel): a row per order as the mockup's .ol-a — up to three of its photos,
  "Order SM-41" with where it stands, the date and its one line (the way ·
  window and how it is paid), the total and a chevron; the whole row opens
  the order. Filters (All, On the way, To pay, Delivered, Cancelled) count
  the orders read so far; ten show at first and "Show older orders" reads
  on. A guest whose device holds no order is asked to sign in, not shown an
  error. The data is Kalio's (kalio-account.ts).
-->
<template>
  <div :class="['acc-p', 'ly-orders', { '-compact': compact }]">
    <div v-if="!compact" class="ly-or-hd">
      <div>
        <h2 class="h3x">{{ title }}</h2>
        <p v-if="line" class="co-p">{{ line }}</p>
      </div>
      <kalio-order-kinds v-if="otherKinds" current="PHYSICAL" />
    </div>

    <div v-if="!compact && account.orders.length" :aria-label="t('ly.acc.show', 'Show')" class="chips-r" role="tablist">
      <button v-for="f in filters" :key="f.key" :aria-selected="filter === f.key ? 'true' : 'false'" :class="['chip', { on: filter === f.key }]" role="tab" type="button" @click="pick(f.key)">
        {{ f.word }}<small v-if="counts[f.key]" class="ly-chip-n">{{ counts[f.key] }}</small>
      </button>
    </div>

    <div v-if="!account.loaded && !account.failed" :aria-label="t('ly.acc.loading', 'Loading your orders')" class="ly-od-load" role="status">
      <span v-for="n in compact ? 2 : 3" :key="n" class="ly-od-sk -row"></span>
    </div>

    <ly-empty
      v-else-if="account.failed && !account.orders.length && !USER()"
      :text="t('ly.acc.deviceP', 'No orders on this device yet. Sign in to see the orders on your account.')"
      :title="t('ly.acc.noOrders', 'No orders yet')"
      cls="boxed"
      icon="box"
    >
      <template #acts><button class="btn" type="button" @click="askSignIn">{{ t("ly.acc.signIn", "Sign in") }}</button></template>
    </ly-empty>

    <ly-empty v-else-if="account.failed && !account.orders.length" :title="t('ly.acc.loadFailed', 'Your orders did not load')" cls="boxed" icon="info">
      <template #acts><button class="btn quiet" type="button" @click="retry">{{ t("ly.acc.tryAgain", "Try again") }}</button></template>
    </ly-empty>

    <ly-empty
      v-else-if="!visible.length"
      :icon="filter === 'all' ? 'box' : 'filter'"
      :text="filter === 'all' ? t('ly.acc.noOrdersP', 'When you place an order, it appears here with its delivery window and progress.') : ''"
      :title="filter === 'all' ? t('ly.acc.noOrders', 'No orders yet') : emptyWords"
      cls="boxed"
    >
      <template #acts>
        <router-link v-if="filter === 'all'" :to="{ path: '/' }" class="btn">{{ t("ly.acc.startShopping", "Start shopping") }}</router-link>
        <button v-else class="btn quiet" type="button" @click="pick('all')">{{ t("ly.acc.showAll", "Show all orders") }}</button>
      </template>
    </ly-empty>

    <ul v-else class="ol">
      <li v-for="order in visible" :key="order.id">
        <router-link :to="orderRoute(order)" class="ol-a">
          <span aria-hidden="true" class="ol-th"
            ><span v-for="pic in thumbs(order, 3)" :key="pic.id" class="rc-th"><img v-if="pic.src" :src="pic.src" alt="" loading="lazy" /></span
          ></span>
          <span class="ol-tx"
            ><b
              >{{ t("ly.acc.orderCode", "Order {code}", { code: code(order) }) }}<span :class="['tagx', '-' + standing(order).tone]">{{ standing(order).word }}</span></b
            ><small>{{ longDate(order.reserved_at || order.created_at) }} · {{ lineOf(order) }}</small
            ><small v-if="chatCount(order)" class="ly-ol-chat"><ly-icon name="chat" />{{ t("ly.acc.messages", { one: "{n} message", other: "{n} messages" }, { n: chatCount(order) }) }}</small></span
          >
          <span class="ol-v money">{{ money(order.price, order.currency) }}</span>
          <ly-icon cls="chev" name="right" />
        </router-link>
      </li>
    </ul>

    <div v-if="canShowMore" class="ly-or-more">
      <button :aria-disabled="account.loading ? 'true' : undefined" class="btn quiet sm" type="button" @click="account.loading || more()">{{ t("ly.acc.older", "Show older orders") }}</button>
    </div>
    <router-link v-if="compact && filtered.length > limit" :to="allRoute" class="qlink">
      {{ t("ly.acc.seeAll", { one: "See all {n} orders", other: "See all {n} orders" }, { n: account.total }) }}<ly-icon name="right" />
    </router-link>
  </div>
</template>

<script>
import NotificationService from "@selldone/components-vue/plugins/notification/NotificationService.ts";
import { EventBus } from "@selldone/components-vue/utils/events/EventBus.ts";
import { reorder } from "../kalio-basket";
import { t } from "../i18n/kalio-i18n";
import { productImage, vendors } from "../kalio-catalog";
import KalioOrderKinds from "./KalioOrderKinds.vue";
import LyIcon from "../../ly/LyIcon.vue";
import LyEmpty from "../../ly/ui/LyEmpty.vue";
import { longDate, orderLine } from "../../ly/order/od";
import { money } from "../../region-switcher/region";
import {
  ORDERS_DESK,
  FILTERS,
  account,
  joinNames,
  loadDetail,
  loadDetails,
  loadOlder,
  loadOrders,
  orderCode,
  paidWords,
  placeOf,
  productIds,
  sellersOf,
  standing,
  STATES,
  stepOf,
  TRAIL,
  unitsOf,
  when,
} from "./kalio-account";

const STEP = 10;

export default {
  name: "KalioOrdersBoard",
  components: { KalioOrderKinds, LyIcon, LyEmpty },
  inject: ["$shop"],

  props: {
    mode: { type: String, default: ORDERS_DESK ? "cards" : "table" },
    /** On the Overview: the first few, no head or filters. */
    compact: Boolean,
    limit: { type: Number, default: 5 },
  },

  data() {
    return {
      account,
      trail: TRAIL,
      filters: FILTERS,
      filter: "all",
      showing: STEP,
      sellers: new Map(),
      busy: {},
      done: {},
    };
  },

  computed: {
    /* The other kinds of order (downloads, services…) only when the shopper has some. */
    otherKinds() {
      const state = this.getOrdersState?.() || [];
      return state.some((it) => it.type !== "PHYSICAL" && it.count > 0);
    },
    title() {
      return t("ly.acc.orders", "Orders");
    },
    line() {
      if (!account.loaded || !ORDERS_DESK) return null;
      const n = account.total;
      if (!n) return null;
      const moving = account.orders.filter((o) => ["go", "prep"].includes(standing(o).tone)).length;
      const orders = t("orders.line.count", { one: "{n} order", other: "{n} orders" }, { n });
      return moving ? t("orders.line.moving", { one: "{orders} · {n} on its way to you", other: "{orders} · {n} on their way to you" }, { n: moving, orders }) : orders;
    },
    counts() {
      const out = {};
      for (const f of FILTERS) out[f.key] = account.orders.filter(f.test).length;
      out.all = account.total || out.all;
      return out;
    },
    filtered() {
      const f = FILTERS.find((x) => x.key === this.filter) || FILTERS[0];
      return account.orders.filter(f.test);
    },
    visible() {
      return this.filtered.slice(0, this.compact ? this.limit : this.showing);
    },
    canShowMore() {
      if (this.compact) return false;
      return this.filtered.length > this.showing || (this.filter === "all" && account.orders.length < account.total);
    },
    emptyWords() {
      if (this.filter === "all") return t("orders.empty.all", "No orders yet. What you buy shows up here, with where it is.");
      return {
        go: t("orders.empty.go", "Nothing on the way right now."),
        pay: t("orders.empty.pay", "Nothing waiting for payment."),
        ok: t("orders.empty.ok", "Nothing delivered yet."),
        off: t("orders.empty.off", "No cancelled orders."),
      }[this.filter];
    },
    allRoute() {
      return { name: window.$storefront.routes.HISTORY_ORDERS_PHYSICAL };
    },
  },

  watch: {
    visible: {
      handler(list) {
        loadDetails(this, list);
      },
      immediate: true,
    },
  },

  created() {
    loadOrders(this);
    vendors().then((list) => (this.sellers = new Map(list.map((v) => [v.id, v]))));
  },

  methods: {
    t,
    /** The app's sign-in sheet (KalioSignIn). This board has no AuthMixin, so
     *  NeedLogin() was not a function and the guest's "Sign in" did nothing. */
    askSignIn() {
      EventBus.$emit("need-login", true);
    },
    standing,
    productIds,
    paidWords,
    when,
    units: unitsOf,
    code(order) {
      return orderCode(this, order);
    },
    orderRoute(order) {
      return { name: "MyPhysicalOrderInfoPage", params: { basket_id: order.id } };
    },
    chatCount(order) {
      return order.chat?.length || 0;
    },
    /** One picture per product, with how many, from the full order when read. */
    longDate,
    money(amount, currency) {
      return money(Number(amount) || 0, currency);
    },
    lineOf(order) {
      return orderLine(this.$shop, order, account.details[order.id]);
    },
    thumbs(order, max) {
      const full = account.details[order.id];
      const byProduct = new Map();
      for (const item of order.items || []) {
        const at = byProduct.get(item.product_id) || { id: item.product_id, count: 0, src: null };
        at.count += item.count || 0;
        byProduct.set(item.product_id, at);
      }
      if (full) {
        for (const item of full.items || []) {
          const at = byProduct.get(item.product_id);
          if (!at) continue;
          at.src = item.variant?.image ? window.CDN.GET_SHOP_IMAGE_PATH(item.variant.image, 128) : productImage(item.product, true) || at.src;
        }
      }
      for (const at of byProduct.values()) if (!at.src) at.src = this.getProductImage(at.id);
      return [...byProduct.values()].slice(0, max);
    },
    headline(order) {
      const s = standing(order);
      const full = account.details[order.id];
      if (s.tone === "ok") return full?.delivery_at ? t("orders.headline.reached", "Reached you {when}", { when: when(full.delivery_at) }) : t("orders.headline.delivered", "Delivered");
      if (s.tone === "go") return t("orders.headline.onItsWay", "On its way to you");
      if (s.tone === "pay") return t("orders.headline.pay", "Pay to keep this order");
      if (s.tone === "off") return order.reject ? t("orders.headline.rejected", "The shop could not take this order") : t("orders.headline.cancelled", "This order was cancelled");
      if (s.key === "preparing") return t("orders.headline.packing", "The shop is packing it");
      if (s.key === "confirmed") return t("orders.headline.accepted", "The shop has accepted it");
      return t("orders.headline.waiting", "Waiting for the shop to accept it");
    },
    subline(order) {
      const n = unitsOf(order);
      const names = joinNames(sellersOf(order, this.sellers));
      const place = placeOf(order);
      const items = names
        ? t("orders.subline.itemsFrom", { one: "{n} item from {names}", other: "{n} items from {names}" }, { n, names })
        : t("orders.items", { one: "{n} item", other: "{n} items" }, { n });
      return [items, place && standing(order).tone !== "pay" ? t("orders.subline.to", "to {place}", { place }) : null].filter(Boolean).join(" · ");
    },
    /** Selldone's own name for a step, for the tooltip. */
    stepName(i) {
      const name = STATES[i]?.name;
      return name ? this.$t(name) : null;
    },
    barClass(order, i) {
      const step = stepOf(order);
      if (i < step || (i === step && step === 4)) return "-on";
      if (i === step) return "-now";
      return "";
    },
    pick(key) {
      this.filter = key;
      this.showing = STEP;
    },
    more() {
      if (this.filtered.length > this.showing) this.showing += STEP;
      else loadOlder(this).then(() => (this.showing += STEP));
    },
    retry() {
      loadOrders(this, true);
    },
    async buyAgain(order) {
      this.busy[order.id] = true;
      try {
        const full = account.details[order.id] || (await loadDetail(this, order.id));
        if (!full) throw new Error("no order");
        const { added, failed } = await reorder(this, full.items);
        if (added) {
          this.done[order.id] = true;
          setTimeout(() => (this.done[order.id] = false), 2400);
        }
        if (failed) NotificationService.showErrorAlert(null, t("orders.reorder.failed", { one: "{n} item is not sold any more and stayed out.", other: "{n} items are not sold any more and stayed out." }, { n: failed }));
      } catch (e) {
        NotificationService.showErrorAlert(null, t("orders.reorder.error", "This order could not be added again."));
      } finally {
        this.busy[order.id] = false;
      }
    },
  },
};
</script>
