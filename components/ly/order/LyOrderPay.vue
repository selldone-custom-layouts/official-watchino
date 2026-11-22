<!--
  How the order is paid (pages-buy.js order, the Payment card):
  the big line ("Pay on delivery $14.89", "Pay at pickup", "Paid", "To pay",
  "Nothing to pay") and the way under it with the shop's own words (its
  cash gateway's description, the card that paid, gift cards, cashback);
  "Pay now" and "Use another way to pay" while an online payment waits.
  KalioOrderReceipt's script reads Selldone's payment and transactions.
-->
<template>
  <div class="od-c ly-od-pay">
    <h2 class="co-h">{{ t("ly.od.payment", "Payment") }}</h2>
    <p :class="['pay-big', 'ly-' + pay.tone]">
      <span>{{ bigWord }}</span><b class="money">{{ money(total) }}</b>
    </p>
    <ul class="ils sm">
      <ly-ic-line :icon="lineIcon" :text="lineText" :title="pay.title" />
      <ly-ic-line v-for="card in basket.gift_cards || []" :key="card.number" :text="money(card.amount, card.currency)" :title="t('ly.od.giftCard', 'Gift card {number}', { number: lastFour(card.number) })" icon="gift" />
      <ly-ic-line v-if="basket.cashback_order" :text="basket.cashback_order.cashback?.title || ''" :title="t('ly.od.cashback', '{amount} comes back to you', { amount: money(basket.cashback_order.amount_cashback, basket.cashback_order.currency) })" icon="cash" />
    </ul>
    <div v-if="pay.canPay || pay.canSwitch" class="ly-od-acts">
      <button v-if="pay.canPay" class="btn sm" type="button" @click="payNow"><ly-icon name="lock" />{{ t("ly.od.payNow", "Pay now") }}</button>
      <button v-if="pay.canSwitch" class="qlink" type="button" @click="switchWay">{{ t("ly.od.payOther", "Use another way to pay") }}</button>
    </div>
  </div>
</template>

<script>
import KalioOrderReceipt from "../../kalio/order/KalioOrderReceipt.vue";
import LyIcon from "../LyIcon.vue";
import LyIcLine from "../ui/LyIcLine.vue";
import { shopFacts } from "../ly";
import { isPickupWay } from "../buy/ly-cart";
import { money } from "../../region-switcher/region";
import { t } from "../../kalio/i18n/kalio-i18n";

export default {
  name: "LyOrderPay",
  extends: KalioOrderReceipt,
  components: { LyIcon, LyIcLine },
  inject: { $shop: { default: null } },
  computed: {
    pickup() {
      return isPickupWay(this.basket?.delivery_info);
    },
    paidOnDelivery() {
      return this.pay.tone === "ok" && this.basket?.status !== "Payed";
    },
    bigWord() {
      if (this.pay.tone === "off") return t("ly.od.nothing", "Nothing to pay");
      if (this.basket?.status === "Payed") return t("ly.od.paid", "Paid");
      if (this.paidOnDelivery) return this.pickup ? t("ly.od.payAtPickup", "Pay at pickup") : t("ly.od.payOnDelivery", "Pay on delivery");
      return t("ly.od.toPay", "To pay");
    },
    lineIcon() {
      if (this.basket?.status === "Payed") return "check";
      if (this.pay.tone === "off") return "close";
      if (this.paidOnDelivery) return "cash";
      return this.pay.canPay ? "lock" : "clock";
    },
    /* Cash on delivery: the shop's own words for its gateway, as the
       mockup ("The buyer pays the courier when the order is delivered");
       at the counter, the counter. */
    lineText() {
      if (this.paidOnDelivery) {
        if (this.pickup) return t("ly.od.payAtCounter", "You pay in cash at the counter when you collect it.");
        return shopFacts(this.$shop).gateway?.description || this.pay.note || "";
      }
      return this.pay.note || "";
    },
  },
  methods: {
    t,
    money(amount, currency) {
      return money(Number(amount) || 0, currency || this.basket?.currency);
    },
  },
};
</script>
