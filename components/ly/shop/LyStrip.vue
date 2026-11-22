<!--
  The three-panel strip under a collection (pages-shop.js strip(),
  nicdark's dark card · photo · light card): the courier (its radius, days
  and windows, "Order for delivery"), the collection's photo (or its best
  sellers on a plate), and pickup at the counter (the counter's own note and
  the way to pay, "Find the counter"). Without a courier the dark card tells
  the shipping; without pickup the light card tells the way to pay. From the
  shop's own data.
-->
<template>
  <section :aria-label="t('ly.strip.aria', 'Delivery and pickup')" class="trio-s">
    <div class="wrap trio">
      <div v-if="dark" class="tri dark">
        <ly-art cls="tri-ic" name="whisk" />
        <h3>{{ dark.title }}</h3>
        <p>{{ dark.text }}</p>
        <router-link :to="bagTo" class="btn sm on-dark">{{ dark.btn }}</router-link>
      </div>
      <router-link :to="catTo(cat)" aria-hidden="true" class="tri photo" tabindex="-1">
        <img v-if="photo" :src="photo" alt="" loading="lazy" />
        <ly-cuts v-else :products="pieces" kind="trio" />
      </router-link>
      <div v-if="light" class="tri light">
        <ly-art cls="tri-ic" name="cupcake" />
        <h3>{{ light.title }}</h3>
        <p>{{ light.text }}</p>
        <router-link :to="contactTo" class="btn sm">{{ light.btn }}</router-link>
      </div>
    </div>
  </section>
</template>

<script>
import LyArt from "../LyArt.vue";
import LyCuts from "../LyCuts.vue";
import { collectionPhoto } from "../ly-photos";
import { bySells, catTo, inCat, money, shopFacts } from "../ly";
import { t } from "../../kalio/i18n/kalio-i18n";

const list = (items, type = "conjunction") => {
  try {
    return new Intl.ListFormat(document.documentElement.lang || "en", { style: "long", type }).format(items);
  } catch {
    return items.join(", ");
  }
};

export default {
  name: "LyStrip",
  components: { LyArt, LyCuts },
  props: { cat: { type: Object, required: true } },
  computed: {
    facts() {
      return shopFacts(this.$store.getters.getShop);
    },
    photo() {
      return collectionPhoto(this.cat);
    },
    pieces() {
      return bySells(inCat(this.cat.id));
    },
    dark() {
      const f = this.facts;
      const c = f.courier;
      if (c) {
        const near = c.distance ? t("ly.strip.within", "Local delivery within {km} km of the bakery.", { km: c.distance }) : t("ly.strip.local", "Local delivery.");
        const days = c.days.length >= 7 ? t("ly.strip.everyDay", "Every day") : list(c.days.map((d) => String(d).slice(0, 3)));
        const wins = c.windows.length ? list(c.windows.map((w) => String(w).toLowerCase())) : "";
        return { title: c.title, text: [near, [days, wins].filter(Boolean).join(", ") + "."].join(" "), btn: t("ly.strip.orderDelivery", "Order for delivery") };
      }
      const s = f.shipping;
      if (s) return { title: s.title, text: s.freeOver ? t("ly.strip.shipFree", "Ships anywhere; free on orders over {amount}.", { amount: money(s.freeOver, true) }) : t("ly.strip.ship", "Ships anywhere."), btn: t("ly.strip.orderShip", "Order for shipping") };
      return null;
    },
    light() {
      const f = this.facts;
      if (!f.ready) return null;
      if (f.pickup) {
        const note = f.pickupNote ? f.pickupNote.replace(/\.?\s*$/, ".") : "";
        return { title: t("ly.strip.pickupT", "Pickup at the counter"), text: [note, f.gateway?.name ? f.gateway.name + "." : ""].filter(Boolean).join(" "), btn: t("ly.strip.findCounter", "Find the counter") };
      }
      if (f.gateway) return { title: f.gateway.name, text: f.gateway.description, btn: t("ly.strip.contact", "Contact the bakery") };
      return null;
    },
    bagTo() {
      return { name: window.$storefront.routes.BASKET_PAGE, params: { type: "PHYSICAL" } };
    },
    contactTo() {
      return { name: window.$storefront.routes.SHOP_CONTACT_US };
    },
  },
  methods: { t, catTo },
};
</script>
