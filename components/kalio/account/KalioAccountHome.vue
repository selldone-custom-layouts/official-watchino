<!--
  The account's Overview (design/account-b.html): "Hello,
  <first name>" and one line, the last order as the mockup's card (its
  label, the way · window, how it is paid and the total; its pastries with
  how many; the four steps; "View the order", and "Buy again" once it is
  delivered or cancelled), then three tiles: the address book (the saved
  address), the profile (the email) and help (the FAQ). No order yet: the
  mockup's empty card. Nothing shows as an empty box.
-->
<template>
  <div class="acc-p ly-ahome">
    <h2 class="h3x">{{ t("ly.acc.hello", "Hello, {name}", { name: firstName }) }}</h2>
    <p class="co-p">{{ t("ly.acc.helloP", "Your orders, addresses and details in one place.") }}</p>

    <article v-if="latest" class="oc">
      <div class="oc-hd">
        <div>
          <p class="eyebrow">{{ t("ly.acc.lastOrder", "Last order · {code}", { code: code(latest) }) }}</p>
          <h3 class="oc-t">{{ wayLine || longDate(latest.reserved_at || latest.created_at) }}</h3>
        </div>
        <p class="oc-tot">
          <span>{{ payWord }}</span><b class="money">{{ money(latest.price, latest.currency) }}</b>
        </p>
      </div>
      <ul v-if="lines.length" class="oc-th">
        <li v-for="l in lines" :key="l.key">
          <span class="rc-th"><img v-if="l.src" :src="l.src" alt="" loading="lazy" /></span
          ><span
            ><b>{{ l.title || t("ly.acc.anItem", "An item") }}</b><small>× {{ l.count }}</small></span
          >
        </li>
        <li v-if="moreLines" class="ly-oc-more">
          <small>{{ t("ly.acc.moreItems", { one: "and {n} more", other: "and {n} more" }, { n: moreLines }) }}</small>
        </li>
      </ul>
      <ol v-if="tone.tone !== 'off'" :aria-label="t('ly.od.progress', 'Order progress')" class="tl4 sm">
        <li v-for="(s, i) in steps" :key="s.key" :aria-current="stateOf(i) === 'cur' ? 'step' : undefined" :class="['t', stateOf(i)]">
          <span class="t-ic"><ly-icon :name="stateOf(i) === 'done' ? 'check' : s.icon" /></span><span class="t-l">{{ s.label }}</span>
        </li>
      </ol>
      <p v-else class="ly-oc-off"><ly-icon name="close" />{{ tone.word }}</p>
      <div class="ly-od-acts">
        <router-link :to="orderRoute(latest)" class="btn sm"
          ><template v-if="tone.tone === 'pay'"><ly-icon name="lock" />{{ t("ly.acc.payNow", "Pay now") }}</template
          ><template v-else>{{ t("ly.acc.viewOrder", "View the order") }}<ly-icon cls="flip-rtl" name="arrow" /></template
        ></router-link>
        <button v-if="['ok', 'off'].includes(tone.tone)" :aria-disabled="busy_again ? 'true' : undefined" class="qlink" type="button" @click="busy_again || buyAgain()">
          <ly-icon :name="again_done ? 'check' : 'bag'" />{{ again_done ? t("ly.acc.inBag", "In your bag") : t("ly.acc.buyAgain", "Buy again") }}
        </button>
      </div>
    </article>

    <ly-empty
      v-else-if="account.loaded"
      :text="t('ly.acc.noOrdersP', 'When you place an order, it appears here with its delivery window and progress.')"
      :title="t('ly.acc.noOrders', 'No orders yet')"
      cls="boxed"
      icon="box"
    >
      <template #acts
        ><router-link :to="{ path: '/' }" class="btn">{{ t("ly.acc.startShopping", "Start shopping") }}</router-link></template
      >
    </ly-empty>
    <div v-else :aria-label="t('ly.acc.loading', 'Loading your orders')" class="ly-od-load" role="status"><span class="ly-od-sk"></span></div>

    <div class="tiles">
      <router-link :to="sectionRoute('USER_ADDRESSES_PAGE')" class="tile"
        ><span class="il-ic"><ly-icon name="pin" /></span><b>{{ t("ly.acc.book", "Address book") }}</b
        ><span>{{ address ? addressLine(address) : account.addresses ? t("ly.acc.noAddress", "No saved address yet") : t("ly.acc.moment", "One moment…") }}</span></router-link
      >
      <router-link :to="sectionRoute('USER_PROFILE_PAGE')" class="tile"
        ><span class="il-ic"><ly-icon name="user" /></span><b>{{ t("ly.acc.profile", "Profile") }}</b><span>{{ user?.email || user?.phone || user?.name }}</span></router-link
      >
      <router-link :to="helpRoute" class="tile"
        ><span class="il-ic"><ly-icon name="chat" /></span><b>{{ t("ly.acc.help", "Help") }}</b
        ><span>{{ t("ly.acc.helpP", "Delivery, pickup and payment answers") }}</span></router-link
      >
    </div>
  </div>
</template>

<script>
import NotificationService from "@selldone/components-vue/plugins/notification/NotificationService.ts";
import CurrencyMixin from "@selldone/components-vue/mixin/currency/CurrencyMixin.ts";
import { reorder } from "../kalio-basket";
import { t } from "../i18n/kalio-i18n";
import { productImage, productsById, vendors } from "../kalio-catalog";
import LyIcon from "../../ly/LyIcon.vue";
import LyEmpty from "../../ly/ui/LyEmpty.vue";
import { isPickupWay, wayWindowLine } from "../../ly/buy/ly-cart";
import { longDate, orderStep, orderSteps } from "../../ly/order/od";
import { money } from "../../region-switcher/region";
import {
  STATES,
  account,
  loadAddresses,
  loadDetail,
  loadGiftcards,
  loadOrders,
  loadWallets,
  orderCode,
  paidWords,
  standing,
  stepOf,
  userKnown,
  when,
} from "./kalio-account";

const LINES = 4;

export default {
  name: "KalioAccountHome",
  components: { LyIcon, LyEmpty },
  mixins: [CurrencyMixin],
  inject: ["$shop"],

  data() {
    return {
      account,
      states: STATES,
      sellers: new Map(),
      catalogue: new Map(),
      busy_again: false,
      again_done: false,
    };
  },

  computed: {
    // ▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅ the Layout ▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅
    user() {
      return this.USER();
    },
    firstName() {
      return (this.user?.name || "").trim().split(/\s+/)[0] || t("ly.acc.there", "there");
    },
    pickup() {
      return isPickupWay((this.detail || this.latest)?.delivery_info);
    },
    steps() {
      return orderSteps(this.pickup);
    },
    stepAt() {
      return orderStep(this.detail || this.latest);
    },
    wayLine() {
      const info = (this.detail || this.latest)?.delivery_info;
      return info?.type ? wayWindowLine(this.$shop, info) : "";
    },
    payWord() {
      const status = this.latest?.status;
      if (status === "COD") return this.pickup ? t("ly.od.payAtPickup", "Pay at pickup") : t("ly.od.payOnDelivery", "Pay on delivery");
      if (status === "Payed") return t("ly.od.paid", "Paid");
      if (status === "Canceled") return t("ly.acc.cancelled", "Cancelled");
      return t("ly.od.toPay", "To pay");
    },
    helpRoute() {
      return this.$router.hasRoute("ShopFAQ") ? { name: "ShopFAQ" } : { name: window.$storefront.routes.SHOP_CONTACT_US };
    },
    address() {
      return (account.addresses || [])[0] || null;
    },
    /* The last order's products, as the shop sells them now. */
    again() {
      const items = this.detail?.items || this.latest?.items || [];
      const ids = [...new Set(items.map((it) => it.product_id))];
      /* The shop's listing when it has the product; else the order's own copy. */
      return ids
        .map((id) => this.catalogue.get(id) || items.find((it) => it.product_id === id && it.product?.title)?.product)
        .filter((p) => p && p.status !== "Close")
        .slice(0, 3);
    },
    currency() {
      return this.latest?.currency || this.GetUserSelectedCurrency()?.code || this.$shop.currency;
    },
    latest() {
      return account.orders[0] || null;
    },
    detail() {
      return this.latest ? account.details[this.latest.id] : null;
    },
    tone() {
      return standing(this.latest);
    },
    lines() {
      const detail = this.detail;
      if (detail) {
        return (detail.items || []).slice(0, LINES).map((item) => ({
          key: item.id,
          src: this.image(item),
          title: item.product?.title || t("account.home.anItem", "An item"),
          count: item.count,
          price: item.price,
          total: this.lineTotal(item),
          seller: this.sellerName(item),
          currency: detail.currency,
        }));
      }
      // Before the full order (or without it): the list's products and counts.
      const missing = !!account.missing[this.latest?.id];
      return (this.latest?.items || []).slice(0, LINES).map((item, i) => {
        const product = this.catalogue.get(item.product_id);
        return {
          key: `l${i}`,
          src: (product && productImage(product, true)) || this.getProductImage(item.product_id),
          title: product?.title || (missing ? t("account.home.anItem", "An item") : null),
          count: item.count,
          price: null,
          total: null,
          seller: null,
          currency: this.latest.currency,
        };
      });
    },
    moreLines() {
      return Math.max(0, (this.detail?.items || this.latest?.items || []).length - LINES);
    },
    footWords() {
      const parts = [paidWords(this.latest)];
      if (this.detail?.discount > 0) parts.push(t("account.home.youSaved", "you saved {amount}", { amount: this.money(this.detail.discount, this.detail.currency) }));
      return parts.filter(Boolean).join(" · ");
    },
    moving() {
      return account.orders.filter((o) => ["go", "prep"].includes(standing(o).tone)).length;
    },
    /** "orders · 2 on the way", under the count of orders. */
    ordersWords() {
      const orders = t("account.home.tile.orders", { one: "order", other: "orders" }, { n: account.total });
      return this.moving ? t("account.home.tile.ordersMoving", "{orders} · {n} on the way", { orders, n: this.moving }) : orders;
    },
    waiting() {
      return account.orders.find((o) => standing(o).tone === "pay") || null;
    },
    /** What deals took off, over the orders read in full (not cancelled). */
    saved() {
      return Object.values(account.details)
        .filter((o) => o.status !== "Canceled")
        .reduce((sum, o) => sum + (o.discount || 0), 0);
    },
    savedWords() {
      const read = Object.keys(account.details).length;
      return read < account.total ? t("account.home.tile.savedRecent", "saved on recent orders") : t("account.home.tile.savedDeals", "saved with deals");
    },
    wallet() {
      const list = account.wallets || [];
      const mine = list.find((w) => w.currency === this.currency) || list[0];
      return { amount: mine?.balance || 0, currency: mine?.currency || this.currency };
    },
    ordersRoute() {
      return { name: window.$storefront.routes.HISTORY_ORDERS_PHYSICAL };
    },
  },

  watch: {
    latest: {
      handler(order) {
        if (order) loadDetail(this, order.id);
      },
      immediate: true,
    },
  },

  created() {
    this.setPageTitle?.(t("account.pageTitle.home", "My account"));
    vendors().then((list) => (this.sellers = new Map(list.map((v) => [v.id, v]))));
    productsById().then((map) => (this.catalogue = map));
    // After a reload the shopper is read first; a guest has only the
    // orders kept on this device.
    userKnown(this).then(() => {
      if (!this.USER()) {
        this.$router.replace(this.ordersRoute);
        return;
      }
      loadOrders(this);
      loadAddresses();
      loadWallets(this);
      loadGiftcards(this);
    });
  },

  methods: {
    t,
    longDate,
    /* done · cur · next; the last step reached is done. */
    stateOf(i) {
      const at = this.stepAt;
      if (i < at || (i === at && at === this.steps.length - 1)) return "done";
      return i === at ? "cur" : "next";
    },
    when,
    code(order) {
      return orderCode(this, order);
    },
    orderRoute(order) {
      return { name: "MyPhysicalOrderInfoPage", params: { basket_id: order.id } };
    },
    sectionRoute(name) {
      return { name: window.$storefront.routes[name] };
    },
    image(item) {
      if (item.variant?.image) return window.CDN.GET_SHOP_IMAGE_PATH(item.variant.image, 128);
      return productImage(item.product, true);
    },
    sellerName(item) {
      return this.sellers.get(item.vendor_id)?.name || null;
    },
    lineTotal(item) {
      return (item.price || 0) * (item.count || 0) - (item.offer_amount || 0);
    },
    money(amount, currency) {
      return money(Number(amount) || 0, currency);
    },
    addressLine(a) {
      const street = [a.address, a.no, a.unit].filter(Boolean).join(", ");
      const place = [a.city, [a.state_code || a.state, a.postal].filter(Boolean).join(" ")].filter(Boolean).join(", ");
      return [street, place, a.country ? this.countryName(a.country) : null].filter(Boolean).join(", ");
    },
    countryName(code) {
      try {
        return new Intl.DisplayNames([document.documentElement.lang || "en"], { type: "region" }).of(code) || code;
      } catch (e) {
        return code;
      }
    },
    async buyAgain() {
      this.busy_again = true;
      try {
        const full = this.detail || (await loadDetail(this, this.latest.id));
        if (!full) throw new Error("no order");
        const { added, failed } = await reorder(this, full.items);
        if (added) {
          this.again_done = true;
          setTimeout(() => (this.again_done = false), 2400);
        }
        if (failed) NotificationService.showErrorAlert(null, t("orders.reorder.failed", { one: "{n} item is not sold any more and stayed out.", other: "{n} items are not sold any more and stayed out." }, { n: failed }));
      } catch (e) {
        NotificationService.showErrorAlert(null, t("orders.reorder.error", "This order could not be added again."));
      } finally {
        this.busy_again = false;
      }
    },
  },
};
</script>
