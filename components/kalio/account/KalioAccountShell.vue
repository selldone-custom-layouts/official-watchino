<!--
  The account (design/account-b.html, addresses-b.html;
  pages-buy.js accNav): the title band (Home · Account · the open section;
  its own title; one line on where the orders stand), then the side menu
  (the shopper with their mark, Overview · Orders · Addresses · Profile ·
  Sign out, as the mockup; Selldone's other sections — saved, wallet, gift
  cards, returns, reviews — stay reachable in a quieter list under them)
  beside the open section. On a phone the menu is a row of pills above it.
  A guest (orders kept on this device) sees the orders and a way to sign
  in. The data is Kalio's (kalio-account.ts).
-->
<template>
  <div class="ly ly-acct">
    <ly-pt :crumbs="crumbs" :lead="summary" :title="heading" art="cookie" art2="croissant" cls="compact" />
    <section :aria-label="heading" class="sec-s">
      <div class="wrap acc">
        <nav :aria-label="t('ly.acc.nav', 'Account')" class="acc-nav">
          <div class="acc-me">
            <ly-mark :word="user?.name || ''" />
            <div>
              <b>{{ user ? user.name : pending ? t("ly.acc.moment", "One moment…") : t("ly.acc.guest", "Shopping as a guest") }}</b>
              <small>{{ user ? user.email || user.phone : t("ly.acc.guestNote", "Orders placed on this device") }}</small>
            </div>
          </div>
          <ul>
            <li v-for="item in mainItems" :key="item.key">
              <router-link :aria-current="isOn(item) ? 'page' : undefined" :class="['an', { on: isOn(item) }]" :to="item.route"
                ><span class="il-ic"><ly-icon :name="item.icon" /></span><span>{{ item.word }}</span></router-link
              >
            </li>
            <li v-if="user">
              <button :aria-disabled="busy_out ? 'true' : undefined" class="an" type="button" @click="busy_out || signOut()">
                <span class="il-ic"><ly-icon name="out" /></span><span>{{ t("ly.acc.signOut", "Sign out") }}</span>
              </button>
            </li>
            <li v-else-if="!pending">
              <button class="an" type="button" @click="signIn">
                <span class="il-ic"><ly-icon name="user" /></span><span>{{ t("ly.acc.signIn", "Sign in") }}</span>
              </button>
            </li>
          </ul>
          <ul v-if="moreItems.length" :aria-label="t('ly.acc.more', 'More in your account')" class="ly-acc-more">
            <li v-for="item in moreItems" :key="item.key">
              <router-link :aria-current="isOn(item) ? 'page' : undefined" :class="['an', { on: isOn(item) }]" :to="item.route"
                ><span class="il-ic"><ly-icon :name="item.icon" /></span><span>{{ item.word }}</span></router-link
              >
            </li>
          </ul>
        </nav>
        <div class="acc-main">
          <router-view />
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { EventBus } from "@selldone/components-vue/utils/events/EventBus.ts";
import { t } from "../i18n/kalio-i18n";
import LyIcon from "../../ly/LyIcon.vue";
import LyMark from "../../ly/ui/LyMark.vue";
import LyPt from "../../ly/ui/LyPt.vue";
import { ACCOUNT_HOME, ACCOUNT_STYLE, account, greeting, loadAddresses, loadOrders, sections, standing } from "./kalio-account";

export default {
  name: "KalioAccountShell",
  components: { LyIcon, LyMark, LyPt },
  inject: ["$shop"],

  data() {
    return {
      style: ACCOUNT_STYLE,
      ACCOUNT_HOME,
      account,
      avatar_failed: false,
      busy_out: false,
    };
  },

  computed: {
    user() {
      return this.USER();
    },
    /** Still asking who is signed in (just after a reload). */
    pending() {
      return !this.user && !!this.$store.getters.getBusyUser;
    },
    firstName() {
      return (this.user?.name || "").trim().split(/\s+/)[0] || t("account.greeting.there", "there");
    },
    initials() {
      const parts = (this.user?.name || "").trim().split(/\s+/).filter(Boolean);
      return parts.length ? (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() : "";
    },
    avatar() {
      return this.user && !this.avatar_failed ? this.getUserAvatar(this.user.id) : null;
    },
    hello() {
      return greeting();
    },
    /* ── the Layout ── */
    /* The mockup's menu: Overview, Orders, Addresses, Profile. */
    mainItems() {
      const r = window.$storefront.routes;
      const items = [];
      if (this.user) items.push({ key: "home", word: t("ly.acc.overview", "Overview"), icon: "home", route: { name: ACCOUNT_HOME } });
      items.push({ key: "orders", word: t("ly.acc.orders", "Orders"), icon: "box", route: { name: r.HISTORY_ORDERS_PHYSICAL } });
      if (this.user) {
        items.push({ key: "addresses", word: t("ly.acc.addresses", "Addresses"), icon: "pin", route: { name: r.USER_ADDRESSES_PAGE } });
        items.push({ key: "profile", word: t("ly.acc.profile", "Profile"), icon: "user", route: { name: r.USER_PROFILE_PAGE } });
      }
      return items;
    },
    /* Selldone's other sections, kept reachable under the menu. */
    moreItems() {
      if (!this.user) return [];
      const r = window.$storefront.routes;
      return [
        { key: "saved", word: t("ly.acc.saved", "Saved"), icon: "heart", route: { name: r.USER_FAVORITES_PAGE } },
        { key: "wallet", word: t("ly.acc.wallet", "Wallet"), icon: "cash", route: { name: r.USER_WALLETS_PAGE } },
        { key: "gift", word: t("ly.acc.gift", "Gift cards"), icon: "gift", route: { name: r.USER_GIFTCARDS_PAGE } },
        { key: "returns", word: t("ly.acc.returns", "Returns"), icon: "back", route: { name: r.USER_RETURN_REQUESTS } },
        { key: "reviews", word: t("ly.acc.reviews", "Reviews"), icon: "star", route: { name: r.USER_COMMENTS_PAGE } },
      ];
    },
    /* The open section: the band's title and the last crumb. */
    section() {
      const r = window.$storefront.routes;
      const name = this.$route.name;
      if (name === ACCOUNT_HOME) return null;
      if (this.$route.matched.some((m) => m.name === r.ORDERS_PAGE)) return t("ly.acc.orders", "Orders");
      const item = [...this.mainItems, ...this.moreItems].find((x) => x.route.name === name);
      return item ? item.word : null;
    },
    heading() {
      const r = window.$storefront.routes;
      if (!this.section) return t("ly.acc.title", "Your account");
      if (this.$route.matched.some((m) => m.name === r.ORDERS_PAGE)) return t("ly.acc.titleOrders", "Your orders");
      return this.section;
    },
    crumbs() {
      const home = this.user ? { name: ACCOUNT_HOME } : { name: window.$storefront.routes.HISTORY_ORDERS_PHYSICAL };
      if (!this.section) return [{ label: t("ly.acc.account", "Account") }];
      return [{ label: t("ly.acc.account", "Account"), to: home }, { label: this.section }];
    },
    shown() {
      return sections().filter((item) => this.user || !item.user);
    },
    groups() {
      const groups = [];
      for (const item of this.shown) {
        let group = groups.find((g) => g.name === item.group);
        if (!group) groups.push((group = { name: item.group, items: [] }));
        group.items.push(item);
      }
      return groups;
    },
    /** What is happening to the orders, in a sentence. */
    summary() {
      if (this.pending) return t("account.summary.opening", "One moment, opening your account…");
      if (!account.loaded) return this.user ? t("account.summary.default", "Your orders, money and addresses in one place.") : t("account.summary.guest", "The orders placed on this device.");
      const tones = account.orders.map((o) => standing(o).tone);
      const moving = tones.filter((tone) => tone === "go" || tone === "prep").length;
      const paying = tones.filter((tone) => tone === "pay").length;
      if (moving && paying)
        return t("account.summary.both", "{moving}, {paying}.", {
          moving: t("account.summary.movingLead", { one: "One order is on its way to you", other: "{n} orders are on their way to you" }, { n: moving }),
          paying: t("account.summary.payingToo", { one: "one is waiting for payment", other: "{n} are waiting for payment" }, { n: paying }),
        });
      if (moving) return t("account.summary.moving", { one: "One order is on its way to you.", other: "{n} orders are on their way to you." }, { n: moving });
      if (paying) return t("account.summary.paying", { one: "One order is waiting for payment.", other: "{n} orders are waiting for payment." }, { n: paying });
      if (!account.total) return t("bakini.k.account.none", "No orders yet. Your first order is a few taps away.");
      return tones[0] === "ok" ? t("account.summary.allDelivered", "Everything you ordered has reached you.") : t("account.summary.default", "Your orders, money and addresses in one place.");
    },
  },

  watch: {
    // Signed in (or out) here, or known only now after a reload.
    "user.id"() {
      loadOrders(this);
      if (this.user) loadAddresses();
    },
    "$route.fullPath"() {
      this.showActive();
    },
  },

  mounted() {
    this.showActive();
  },

  created() {
    loadOrders(this);
    if (this.user) loadAddresses();
  },

  methods: {
    t,
    /** On a phone the sections are one row that scrolls sideways: bring the
     *  open one into view (Wallet, Profile… were off the right edge). */
    showActive() {
      this.$nextTick(() => {
        for (const nav of this.$el?.querySelectorAll?.(".acc-nav ul") || []) {
          const on = nav.querySelector('[aria-current="page"]');
          if (!on || nav.scrollWidth <= nav.clientWidth + 1) continue;
          const delta = on.getBoundingClientRect().left - nav.getBoundingClientRect().left;
          nav.scrollLeft = Math.max(0, nav.scrollLeft + delta - (nav.clientWidth - on.offsetWidth) / 2);
        }
      });
    },
    isOn(item) {
      if (item.key === "home") return this.$route.name === ACCOUNT_HOME;
      if (item.key === "orders") return this.$route.matched.some((m) => m.name === window.$storefront.routes.ORDERS_PAGE);
      return this.$route.name === item.route.name;
    },
    countOf(item) {
      if (item.key === "orders") return account.total || null;
      if (item.key === "addresses") return account.addresses?.length || null;
      return null;
    },
    signIn() {
      EventBus.$emit("need-login", true);
    },
    signOut() {
      this.busy_out = true;
      this.Logout(() => {
        this.busy_out = false;
        this.$router.push({ path: "/" });
      });
    },
  },
};
</script>
