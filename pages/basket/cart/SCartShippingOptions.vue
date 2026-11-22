<!--
  - Copyright (c) 2024. Selldone® Business OS™
  -
  - Author: M.Pajuhaan
  - Web: https://selldone.com
  - ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  -
  - All rights reserved. In the weave of time, where traditions and innovations intermingle, this content was crafted.
  - From the essence of thought, through the corridors of creativity, each word, and sentiment has been molded.
  - Not just to exist, but to inspire. Like an artist's stroke or a sculptor's chisel, every nuance is deliberate.
  - Our journey is not just about reaching a destination, but about creating a masterpiece.
  - Tread carefully, for you're treading on dreams.
  -->

<!--
  One package's way to the shopper (checkout-b.html "Delivery",
  delivery-b.html): the shop's ways as method cards (the mockup's .mc: a
  radio, the icon, the name, the fee, a line about it), its pickup points as
  cards too, then the way's time windows as chips (one chosen, a ring
  inside). A way that asks for a date gets a date field. The data and every
  rule are Selldone's (the days and windows the way offers, lead time, the
  earliest date); choosing a window writes delivery_info.custom, .days and
  .time_spans, as Selldone's own "choose a time" does.
-->
<template>
  <section class="ly-ship">
    <!-- The delivery sheet (delivery-b): every way as a row with its days,
         its fee and its own windows; a window of another way picks that way. -->
    <div v-if="dmShipSheet && (transportation_exclude_pickup?.length || pickups?.length)" :aria-label="t('ly.co.method', 'Delivery method')" class="dls" role="radiogroup">
      <div v-for="item in transportation_exclude_pickup" :key="item.type" :class="['dl', { on: isWayOn(item) }]">
        <label class="dl-hd">
          <input :aria-label="wayTitleOf(item)" :checked="isWayOn(item)" :name="radioName" class="rdo" type="radio" :value="item.type" @change="pickWay(item)" />
          <span class="mc-ic"><ly-icon :name="wayIcon(item.type)" /></span>
          <span class="dl-t"
            ><b>{{ wayTitleOf(item) }}</b><small v-if="noteOf(item)">{{ noteOf(item) }}</small></span
          >
          <span class="mc-f">{{ feeOf(item) }}</span>
        </label>
        <div class="dl-b">
          <ul class="ils sm">
            <li class="il">
              <span class="il-ic"><ly-icon name="cal" /></span>
              <div class="il-tx">
                <b>{{ daysOf(item) }}</b><span>{{ feeLineOf(item) }}</span>
              </div>
            </li>
          </ul>
          <div v-if="winsOf(item).length" :aria-label="t('ly.co.windowsOf', '{way} windows', { way: wayTitleOf(item) })" class="chips-r" role="radiogroup">
            <button
              v-for="w in winsOf(item)"
              :key="w"
              :aria-checked="isWayOn(item) && isWindow(w) ? 'true' : 'false'"
              class="wchip"
              role="radio"
              type="button"
              @click="pickWayWindow(item, w)"
            >
              <ly-icon name="clock" />{{ windowName({ value: w, name: w }) }}
            </button>
          </div>
        </div>
      </div>
      <div v-for="(pickup, i) in pickups || []" :key="'p' + i" :class="['dl', { on: isPickupOn(pickup) }]">
        <label class="dl-hd">
          <input :aria-label="pickupTitle(pickup)" :checked="isPickupOn(pickup)" :name="radioName" class="rdo" type="radio" :value="'pickup-' + i" @change="pickPickup(pickup)" />
          <span class="mc-ic"><ly-icon name="store" /></span>
          <span class="dl-t"
            ><b>{{ pickupTitle(pickup) }}</b><small v-if="pickup.message">{{ pickup.message }}</small></span
          >
          <span class="mc-f">{{ t("ly.co.free", "Free") }}</span>
        </label>
        <div class="dl-b">
          <ul class="ils sm">
            <li class="il">
              <span class="il-ic"><ly-icon name="pin" /></span>
              <div class="il-tx">
                <b>{{ [pickup.address, pickup.city].filter(Boolean).join(", ") }}</b><span v-if="pickup.message">{{ pickup.message }}</span>
              </div>
            </li>
            <li v-if="openWords" class="il">
              <span class="il-ic"><ly-icon name="clock" /></span>
              <div class="il-tx">
                <b>{{ openWords }}</b><span>{{ t("ly.co.comeToCounter", "Choose a window and come to the counter") }}</span>
              </div>
            </li>
          </ul>
          <div v-if="winsOf(pickup_transportation).length" :aria-label="t('ly.co.windowsOf', '{way} windows', { way: pickupTitle(pickup) })" class="chips-r" role="radiogroup">
            <button
              v-for="w in winsOf(pickup_transportation)"
              :key="w"
              :aria-checked="isPickupOn(pickup) && isWindow(w) ? 'true' : 'false'"
              class="wchip"
              role="radio"
              type="button"
              @click="pickPickupWindow(pickup, w)"
            >
              <ly-icon name="clock" />{{ windowName({ value: w, name: w }) }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="transportation_exclude_pickup?.length || pickups?.length" :aria-label="t('ly.co.method', 'Delivery method')" class="mcs" role="radiogroup">
      <label v-for="item in transportation_exclude_pickup" :key="item.type" :class="['mc', { on: transportation?.type === item.type && !selectedPickup }]">
        <input :aria-label="wayTitleOf(item)" :checked="transportation?.type === item.type && !selectedPickup" :name="radioName" class="rdo" type="radio" :value="item.type" @change="pickWay(item)" />
        <span class="mc-ic"><ly-icon :name="wayIcon(item.type)" /></span>
        <span class="mc-t">{{ wayTitleOf(item) }}</span>
        <span class="mc-f">{{ feeOf(item) }}</span>
        <span v-if="noteOf(item)" class="mc-n">{{ noteOf(item) }}</span>
      </label>
      <label v-for="(pickup, i) in pickups || []" :key="'p' + i" :class="['mc', { on: !!(selectedPickup?.address && selectedPickup.address === pickup.address) }]">
        <input
          :aria-label="pickupTitle(pickup)"
          :checked="!!(selectedPickup?.address && selectedPickup.address === pickup.address)"
          :name="radioName"
          class="rdo"
          type="radio"
          :value="'pickup-' + i"
          @change="pickPickup(pickup)"
        />
        <span class="mc-ic"><ly-icon name="store" /></span>
        <span class="mc-t">{{ pickupTitle(pickup) }}</span>
        <span class="mc-f">{{ t("ly.co.free", "Free") }}</span>
        <span class="mc-n">{{ pickup.message || MapHelper.GenerateFullAddressFromMapInfo(pickup) }}</span>
      </label>
    </div>

    <template v-if="transportation">
      <div v-if="windowsOn && timeItems.length && !dmShipSheet" class="wins">
        <p class="fl">{{ selectedPickup ? t("ly.co.pickupWindow", "Pickup window") : t("ly.co.deliveryWindow", "Delivery window") }}</p>
        <div :aria-label="t('ly.co.window', 'Time window')" class="chips-r" role="radiogroup">
          <button
            v-for="span in timeItems"
            :key="span.value"
            :aria-checked="isWindow(span.value) ? 'true' : 'false'"
            :disabled="span.props?.disabled"
            class="wchip"
            role="radio"
            type="button"
            @click="pickWindow(span.value)"
          >
            <ly-icon name="clock" />{{ windowName(span) }}
          </button>
        </div>
      </div>
      <div v-if="need_ask_shipping_date" class="wins">
        <label class="fld ly-ship-date">
          <span class="fl">{{ t("ly.co.date", "Date") }}</span>
          <input :min="minDate" :type="transportation.eta === ETA.date.code ? 'date' : 'datetime-local'" :value="dateValue" class="inp" @change="setDate($event.target.value)" />
        </label>
      </div>
      <p v-if="max_lead_time > 0 || transportation?.etd" class="cdlv-n">
        <ly-icon name="clock" />{{ t("ly.co.readyIn", { one: "Ready in about {n} hour.", other: "Ready in about {n} hours." }, { n: max_lead_time + (transportation?.etd ? transportation.etd : 0) }) }}
      </p>
    </template>
  </section>
</template>

<script lang="ts">
import { money as moneyFrom } from "../../../components/region-switcher/region";
import { defineComponent } from "vue";
import { t } from "../../../components/kalio/i18n/kalio-i18n";
import ProductsDenseImagesCircles from "@selldone/components-vue/storefront/product/products-dense-images-circles/ProductsDenseImagesCircles.vue";
import { ShopTransportations } from "@selldone/core-js/enums/logistic/ShopTransportations.ts";
import { ETA } from "@selldone/core-js/enums/logistic/ETA.ts";
import { MapHelper, ShopOptionsHelper } from "@selldone/core-js/helper";
import { ProductType } from "@selldone/core-js/enums/product/ProductType.ts";
import { WeekDays } from "@selldone/core-js/enums/logistic/WeekDays.ts";
import { TimeSpans } from "@selldone/core-js/enums/logistic/TimeSpans.ts";
import TemplateMixin from "@selldone/components-vue/mixin/template/TemplateMixin.ts";
import ProductMixin from "@selldone/components-vue/mixin/product/ProductMixin.ts";
import MapMixin from "@selldone/components-vue/mixin/map/MapMixin.ts";
import LyIcon from "../../../components/ly/LyIcon.vue";
import { shopWay, wayIcon } from "../../../components/ly/buy/ly-cart";
import { openLine, shopFacts, wayTitle } from "../../../components/ly/ly";

/* The buyer's own delivery address, kept per basket while a pickup counter stands in for it (Selldone copies
   the counter into the receiver). Going back from the pickup to a delivery way brings it back, instead of an
   empty address and a "Add a delivery address" before Place order. Module level: this component is drawn
   again for the delivery sheet and the card, and both must see it. */
const homeAddress = new Map<string | number, Record<string, any>>();

export default defineComponent({
  name: "SCartShippingOptions",
  mixins: [TemplateMixin, ProductMixin, MapMixin],

  components: {
    ProductsDenseImagesCircles,
    LyIcon,
  },
  inject: { $shop: { default: null }, dmShipSheet: { default: false } },
  emits: ["update:transportation", "set-basket-config", "pickupSelected"],
  props: {
    basket: {
      require: true,
    },

    transportations: {},
    transportation: {},

    deliveryInfo: {},
    /**
     * Included item ids in this shipping option
     */
    itemIds: { type: Array },
    weight: {},
    volume: {},
    distance: {},
    cost: {},
    warehouse: {
      type: Object,
    },

    selectedPickup: {},

    pickupItemBgColor: {},
  },
  data: () => ({
    ETA: ETA,

    show_package_info: false,

    customDeliveryTimes: false,
  }),

  computed: {
    /* One radio group per package (the page and the delivery sheet each draw one). */
    radioName() {
      if (!this._dmUid) this._dmUid = "ly-ship-" + Math.random().toString(36).slice(2, 8);
      return this._dmUid;
    },
    /* The way offers parts of the day to choose from. */
    windowsOn() {
      return !!this.transportation && [ETA.weekday_timeframe.code, ETA.timeframe.code].includes(this.transportation.eta);
    },
    MapHelper() {
      return MapHelper;
    },
    /* "Open every day 8:00–18:00", for the pickup counter in the sheet. */
    openWords() {
      return openLine(shopFacts(this.$shop));
    },
    /** The shop's pickup points for this package. */
    pickups() {
      return this.isPhysicalBasket ? this.pickup_transportation?.pickups || [] : [];
    },
    isPhysicalBasket() {
      return this.basket?.type === ProductType.PHYSICAL.code;
    },
    /** The earliest the shopper may ask for (now + the method's dispatch
     *  time + the slowest product's lead time), as the date input wants it. */
    minDate() {
      if (!this.transportation) return null;
      const hours = (this.transportation.etd || 0) + (this.max_lead_time > 0 ? this.max_lead_time : 0);
      return this.inputDate(new Date(Date.now() + hours * 3600e3));
    },
    dateValue() {
      return this.deliveryInfo?.date ? this.inputDate(new Date(this.deliveryInfo.date)) : "";
    },
    cod_payment_exists() {
      return this.$shop.gateways?.some(
        (gateway) => gateway.currency === this.basket.currency && gateway.cod,
      );
    },
    warehouse_address() {
      return MapHelper.GenerateFullAddressFromMapInfo(this.warehouse);
    },
    // transport_types -> transportations
    //delivery_info->deliveryInfo

    no_map() {
      return !ShopOptionsHelper.HasMap(this.$shop);
    },

    size_unit() {
      return ShopOptionsHelper.GetSizeUnit(this.$shop);
    },

    mass_unit() {
      return ShopOptionsHelper.GetMassUnit(this.$shop);
    },
    distance_unit() {
      return ShopOptionsHelper.GetDistanceUnit(this.$shop);
    },

    isService() {
      return this.type === ProductType.SERVICE.code;
    },

    max_lead_time() {
      if (!this.basket) return 0;
      let max_lead = 0;
      this.basket.items.forEach((item) => {
        let lead = this.leadProduct(
          item.product,
          item.variant,
          item.vendor_product,
        );
        if (lead) max_lead = Math.max(max_lead, lead);
      });

      return max_lead;
    },

    light_checkout() {
      return this.$shop.theme && this.$shop.theme.light_checkout;
    },

    receiver_info() {
      return this.basket?.receiver_info || null;
    },

    has_delivery() {
      return ShopOptionsHelper.AskShippingAddress(this.$shop, this.basket.type);
      /*
      if (this.isPhysical || this.isService) {
        return true;
      }
      return false;*/
    },

    showCustomDeliveryTimeButton() {
      return (
        this.has_delivery &&
        this.receiver_info &&
        this.receiver_info.address &&
        this.is_valid_location
      );
    },

    is_valid_location() {
      if (this.no_map) return !!this.receiver_info.address; // Only enter address!
      return (
        this.receiver_info.location &&
        !!this.receiver_info.location.lat &&
        !!this.receiver_info.location.lng
      );
    },

    // ▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅ Pickup ▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅

    pickup_transportation() {
      return (
        this.transportations &&
        this.transportations.find(
          (t) => t.type === ShopTransportations.Pickup.code,
        )
      );
    },
    transportation_exclude_pickup() {
      return (
        this.transportations &&
        this.transportations.filter(
          (t) => t.type !== ShopTransportations.Pickup.code,
        )
      );
    },

    need_ask_shipping_date() {
      return (
        this.transportation &&
        [ETA.date.code, ETA.date_time.code].includes(this.transportation.eta)
      );
    },

    /**
     * Generates a list of day items based on the transportation days.
     * Each day item corresponds to a day in the WeekDays object.
     *
     * @returns {Array} - An array of day items.
     */
    dayItems() {
      const out = [];

      // If transportation is not defined, return an empty array
      if (!this.transportation) return out;

      // Iterate over each item in transportation.days
      this.transportation.days.forEach((item) => {
        // Check if the day exists in WeekDays
        if (WeekDays[item]) {
          out.push(Object.assign({}, WeekDays[item]));
        } else {
          out.push({
            value: item,
            name: t("shipping.invalid", "Invalid {value}", { value: String(item) }),
            icon: null,
            props: { disabled: true },
          });
        }
      });

      return out;
    },

    /**
     * Generates a list of time items with their properties.
     * Time items are marked as disabled if they are not included in the transportation time spans.
     * Additionally, invalid time spans (not in TimeSpans) are marked as disabled.
     *
     * @returns {{name,value,icon,props}[]} - An array of time items with properties.
     */
    timeItems() {
      let out = [];

      // If transportation is not defined, return an empty array
      if (!this.transportation) return out;

      // Iterate over each item in transportation.time_spans
      this.transportation.time_spans.forEach((item) => {
        // Check if the time_span exists in TimeSpans
        if (TimeSpans[item]) {
          out.push(Object.assign({}, TimeSpans[item]));
        } else {
          out.push({
            value: item,
            name: t("shipping.invalid", "Invalid {value}", { value: String(item) }),
            icon: null,
            props: { disabled: true },
          });
        }
      });

      return out;
    },
  },

  watch: {
    timeItems(timeItems) {
      // FIX MISS MATCH ISSUES:  Filter time_spans based on the values in the out array
      this.deliveryInfo.time_spans = this.deliveryInfo.time_spans?.filter(
        (timeSpan) => timeItems.some((it) => it.value === timeSpan),
      );
    },
    dayItems(dayItems) {
      // FIX MISS MATCH ISSUES:  Filter days based on the values in the out array
      this.deliveryInfo.days = this.deliveryInfo.days?.filter((day) =>
        dayItems.some((it) => it.value === day),
      );
    },

    transportation(transportation) {
      if (!this.has_delivery) return;

      this.deliveryInfo.type = transportation ? transportation.type : null;
      this.$nextTick(() => {
        /* A window picked on another way's row in the sheet: that way, then that window. */
        const w = this._pendingWin;
        this._pendingWin = null;
        if (w && transportation?.time_spans?.includes(w)) this.pickWindow(w);
        else this.firstWindow();
      });
    },

    transportations() {
      this.autoSelectTransportationType();
    },

    customDeliveryTimes(custom) {
      // this.deliveryInfo.days = [];
      //  this.deliveryInfo.time_spans = [];

      if (custom && this.transportation) {
        // Set all times for default custom delivery time!
        this.deliveryInfo.days = this.transportation.days.slice(0);
        this.deliveryInfo.time_spans = this._window ? [this._window] : this.transportation.time_spans.slice(0);
      }

      this.deliveryInfo.custom = custom;

      if (this.deliveryInfo.custom !== this.deliveryInfo?.custom) {
        //console.log("🧨 watch ===> customDeliveryTimes : setBasketConfig (customDeliveryTimes)");
        this.setBasketConfig();
      }
    },

    //------------- Force Show Date & Time inputs -----------
    need_ask_shipping_date(value) {
      if (value) {
        // We should ask user to select a date!
        this.customDeliveryTimes = true;
      }
    },
  },
  mounted() {
    this.customDeliveryTimes =
      this.need_ask_shipping_date || this.deliveryInfo.custom;
    this.autoSelectTransportationType();
    this.$nextTick(() => this.firstWindow());
  },

  methods: {
    moneyFrom,
    t,
    wayIcon,
    /* ── the Layout ── */
    /* A pickup point's card title: the pickup way's own title, else "Pickup at <place>". */
    pickupTitle(pickup) {
      return this.pickup_transportation?.title || t("bakini.way.pickupAt", "Pickup at {place}", { place: pickup.title || pickup.name || pickup.address });
    },
    wayTitleOf(item) {
      return item?.title || wayTitle(item, this.$shop);
    },
    /* A line about the way, from its own data. */
    noteOf(given) {
      if (!given) return "";
      const item = { ...given, ...shopWay(this.$shop, given) };
      if (item.message) return item.message;
      const parts = [];
      if (item.type === "Global") parts.push(t("bakini.n.co.anywhere", "Ships anywhere"));
      else if (item.type !== "Pickup" && item.distance && item.distance < 1000) parts.push(t("bakini.n.co.within", "Local delivery within {km} km of the bakery", { km: item.distance }));
      if (item.free_shipping && item.free_shipping_limit > 0)
        parts.push(t("bakini.n.co.freeOverOrders", "free on orders over {amount}", { amount: moneyFrom(item.free_shipping_limit, item.currency, { short: "auto" }) }));
      const line = parts.join("; ");
      return line.charAt(0).toUpperCase() + line.slice(1);
    },
    /* The fee alone on the card's head (the free threshold is in its line). */
    feeOf(given) {
      if (!given) return "";
      const item = { ...given, ...shopWay(this.$shop, given) };
      const free = item.free_shipping && !(item.free_shipping_limit > 0);
      const fee = Number(item.const) || 0;
      if (free || !fee) return t("bakini.n.co.free", "Free");
      return moneyFrom(fee, item.currency);
    },
    /* ── The delivery sheet's rows ── */
    isWayOn(item) {
      return this.transportation?.type === item.type && !this.selectedPickup;
    },
    isPickupOn(pickup) {
      return !!(this.selectedPickup?.address && this.selectedPickup.address === pickup.address);
    },
    /* "Every day", or the days the way runs. */
    daysOf(given) {
      const item = { ...given, ...shopWay(this.$shop, given) };
      const days = Array.isArray(item.days) ? item.days : [];
      if (!days.length || days.length >= 7) return t("ly.co.everyDay", "Every day");
      const names = days.map((d) => (WeekDays[d] ? this.$t(WeekDays[d].name) : d));
      try {
        return new Intl.ListFormat(document.documentElement.lang || "en", { style: "short", type: "conjunction" }).format(names);
      } catch {
        return names.join(", ");
      }
    },
    /* "Free on orders over $500", "$10.00 per order" or "No delivery fee". */
    feeLineOf(given) {
      const item = { ...given, ...shopWay(this.$shop, given) };
      if (item.free_shipping && item.free_shipping_limit > 0) return t("ly.co.freeOverOrders", "Free on orders over {amount}", { amount: moneyFrom(item.free_shipping_limit, item.currency, { short: "auto" }) });
      const fee = Number(item.const) || 0;
      if (item.free_shipping || !fee) return t("ly.co.noFee", "No delivery fee");
      return t("ly.co.perOrder", "{fee} per order", { fee: moneyFrom(fee, item.currency) });
    },
    /* The parts of the day a way offers (when it offers a choice). */
    winsOf(given) {
      if (!given) return [];
      const item = { ...given, ...shopWay(this.$shop, given) };
      if (![ETA.weekday_timeframe.code, ETA.timeframe.code].includes(item.eta)) return [];
      return (item.time_spans || []).filter((v) => TimeSpans[v]);
    },
    pickWayWindow(item, w) {
      if (this.isWayOn(item)) return this.pickWindow(w);
      this._pendingWin = w;
      this.pickWay(item);
    },
    pickPickupWindow(pickup, w) {
      if (this.isPickupOn(pickup)) return this.pickWindow(w);
      this._pendingWin = w;
      this.pickPickup(pickup);
    },
    /* The shop's window by its own name ("Morning"), not Selldone's hours. */
    windowName(span) {
      const words = {
        Morning: t("bakini.n.co.winMorning", "Morning"),
        Evening: t("bakini.n.co.winEvening", "Evening"),
        Night: t("bakini.n.co.winNight", "Night"),
        Instant: t("bakini.n.co.winInstant", "Instant"),
      };
      return words[span.value] || this.$t(span.name);
    },
    isWindow(value) {
      return !!this.deliveryInfo?.custom && this.deliveryInfo.time_spans?.length === 1 && this.deliveryInfo.time_spans[0] === value;
    },
    /* One window: Selldone's own "choose a time" with that one part of the day. */
    pickWindow(value) {
      this._window = value;
      this.customDeliveryTimes = true;
      this.deliveryInfo.custom = true;
      this.deliveryInfo.days = this.transportation.days.slice(0);
      this.deliveryInfo.time_spans = [value];
      this.setBasketConfig();
    },
    /* A way with windows always has one chosen (the mockup): the first,
       until the shopper picks another. */
    firstWindow() {
      if (!this.transportation) return;
      /* A way without windows reached another way than pickWay (the shop's first way on load): clear a
         kept window too; pickWay already cleared it for a pick, so no second basket update races the first. */
      if (!this.windowsOn || !this.timeItems.length) {
        if (this.deliveryInfo?.custom || this.deliveryInfo?.time_spans?.length) {
          this.deliveryInfo.custom = false;
          this.deliveryInfo.time_spans = [];
          this.setBasketConfig();
        }
        return;
      }
      const cur = this.deliveryInfo?.time_spans;
      if (this.deliveryInfo?.custom && cur?.length === 1 && this.transportation.time_spans.includes(cur[0])) return;
      const first = this.timeItems.find((x) => !x.props?.disabled);
      if (first) this.pickWindow(first.value);
    },
    getShopTransportationObject(type) {
      return ShopTransportations[type];
    },

    autoSelectTransportationType() {
      if (!this.has_delivery || this.isService || !this.deliveryInfo) return; // Service has address (destination) but not need transportation type and delivery!
      /*  console.log(
        "%cautoSelectTransportationType: START",
        "background: #0097A7; color: #fff"
      );*/

      // Return if delivery type selected and valid (exist in acceptable transportations)
      console.log(
        "autoSelectTransportationType | autoSelectTransportationType > type: ",
        this.deliveryInfo.type,
      );
      if (this.deliveryInfo.type) {
        const found = this.transportations?.find(
          (it) => it.type === this.deliveryInfo.type,
        );
        if (found) {
          this.$emit("update:transportation", found);
          /* console.log(
            "autoSelectTransportationType",
            "Found transportation : ",
            found
          );*/
          return;
        }
      }

      if (!this.transportations?.length) {
        //console.log("autoSelectTransportationType", "transportations is null!");

        this.$emit("update:transportation", null);
        return null;
      }

      // Do not auto select pickup!
      const eligible_transportations = this.transportations?.filter(
        (x) => x.type !== "Pickup",
      );

      if (eligible_transportations.length) {
        this.$emit("update:transportation", eligible_transportations[0]);

        console.log(
          "%cautoSelectTransportationType: SELECT :::" +
            this.transportation?.type,
          "background: #0097A7; color: #fff",
        );
      }
    },

    setBasketConfig() {
      this.$emit("set-basket-config");
    },

    // ▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅ Kalio ▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅
    /* The buyer's own phone and note, apart from the counter's (Selldone
       copies the pickup point, with its phone and note, into the receiver). */
    buyerBits() {
      const r = this.basket?.receiver_info || {};
      const point = r.address ? (this.pickups || []).find((p) => p.address === r.address && (p.name || "") === (r.name || "")) : null;
      return {
        point,
        phone: point && r.phone === point.phone ? "" : r.phone || "",
        message: point && r.message === point.message ? "" : r.message || "",
      };
    },
    pickPickup(pickup) {
      const me = this.buyerBits();
      /* leaving a delivery address for the counter: keep the buyer's address for a way back */
      const r = this.basket?.receiver_info;
      if (!me.point && r?.address && this.basket?.id != null) homeAddress.set(this.basket.id, JSON.parse(JSON.stringify(r)));
      this.$emit("pickupSelected", { pickup: { ...pickup, phone: me.phone || pickup.phone, message: me.message || pickup.message }, transportation: this.pickup_transportation });
    },
    pickWay(item) {
      /* leaving pickup: the counter's address is not a delivery address; the buyer's own address comes back
         when they had one before the pickup (with the phone and note they gave since) */
      const me = this.buyerBits();
      if (me.point && this.basket) {
        const home = this.basket.id != null ? homeAddress.get(this.basket.id) : null;
        this.basket.receiver_info = home ? { ...home, phone: me.phone || home.phone, message: me.message || home.message } : { phone: me.phone, message: me.message };
      }
      /* a way without windows (shipping) does not keep the window of the way before it: cleared here, before
         the one basket update below, so the receipt and the order never name it ("Worldwide shipping · Morning") */
      if (!this.winsOf(item).length && this.deliveryInfo && (this.deliveryInfo.custom || this.deliveryInfo.time_spans?.length)) {
        this.deliveryInfo.custom = false;
        this.deliveryInfo.time_spans = [];
      }
      this.$emit("update:transportation", item);
      this.$nextTick(() => this.setBasketConfig());
    },
    /* A day or a part of the day on or off; one always stays on. */
    toggle(field, value) {
      const list = [...(this.deliveryInfo[field] || [])];
      const at = list.indexOf(value);
      if (at >= 0) {
        if (list.length === 1) return;
        list.splice(at, 1);
      } else list.push(value);
      this.deliveryInfo[field] = list;
      this.setBasketConfig();
    },
    setDate(value) {
      this.deliveryInfo.date = value ? new Date(value).toISOString() : null;
      this.setBasketConfig();
    },
    /* yyyy-mm-dd (a date) or yyyy-mm-ddThh:mm (a date and time), local. */
    inputDate(date) {
      const pad = (n) => String(n).padStart(2, "0");
      const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
      return this.transportation?.eta === ETA.date.code ? day : `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    },
  },
});
</script>

<style scoped lang="scss"></style>
