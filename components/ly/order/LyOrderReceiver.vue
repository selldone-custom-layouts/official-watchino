<!--
  Who receives the order and how (pages-buy.js order, the Receiver
  card): icon lines as the mockup — the receiver and phone, the address
  (with "Change address" until it is sent: Selldone allows it then; the
  address sheet works with the map on or off), the way · window and its
  reach. A pickup shows the counter and "Directions". Then what Selldone
  adds when it has it: the time asked for, the courier, the carrier and
  tracking code, the billing details (changeable until sent), the shop's
  own checkout questions, "Has it arrived?" once it is sent, and the trip.
  KalioOrderDelivery's script: it writes Selldone's order.
-->
<template>
  <div class="od-c ly-od-rcv">
    <h2 class="co-h">{{ is_pickup ? t("ly.od.pickup", "Pickup") : t("ly.od.receiver", "Receiver") }}</h2>

    <div v-if="canConfirmReceived" class="ly-od-ask">
      <b>{{ is_pickup ? t("ly.od.askPickup", "Picked it up?") : t("ly.od.askArrived", "Has it arrived?") }}</b>
      <p>{{ t("ly.od.askLede", "Let the shop know once your order is with you.") }}</p>
      <s-order-delivery-auto-complete :basket="basket" class="ly-od-auto" />
      <button :aria-disabled="busy_receive ? 'true' : undefined" class="btn sm" type="button" @click="busy_receive || confirmReceived()">
        <ly-icon name="check" />{{ is_pickup ? t("ly.od.confirmPickup", "I’ve picked it up") : t("ly.od.confirmArrived", "I’ve got my order") }}
      </button>
    </div>

    <p v-if="delivered" class="ly-od-done">
      <ly-icon name="check" /><span
        ><b>{{ is_pickup ? t("ly.od.pickedUp", "Picked up") : t("ly.od.delivered", "Delivered") }}</b
        ><template v-if="basket.delivery_at">{{ " · " + when(basket.delivery_at) }}</template></span
      >
    </p>

    <ul class="ils sm">
      <ly-ic-line v-if="!is_pickup && (receiver.name || receiver.phone)" :text="receiver.name ? receiver.phone || '' : ''" :title="receiver.name || receiver.phone" icon="user" />
      <ly-ic-line v-if="is_pickup && pickupContact" :text="pickupContact" :title="t('ly.od.collectedBy', 'Collected by')" icon="user" />
      <li class="il">
        <span class="il-ic"><ly-icon :name="is_pickup ? 'store' : 'pin'" /></span>
        <div class="il-tx">
          <b>{{ addressTitle }}</b><span v-if="addressText">{{ addressText }}</span>
          <span v-if="receiver.message" class="ly-od-note">“{{ receiver.message }}”</span>
          <span v-if="canEditAddress || (is_pickup && directions)" class="ly-il-acts">
            <button v-if="canEditAddress" :aria-disabled="busy_address ? 'true' : undefined" class="qlink" type="button" @click="busy_address || (address_sheet = true)">
              <ly-icon name="edit" />{{ t("ly.od.changeAddress", "Change address") }}
            </button>
            <a v-if="is_pickup && directions" :href="directions" class="qlink" rel="noopener" target="_blank"><ly-icon name="pin" />{{ t("ly.od.directions", "Directions") }}</a>
          </span>
        </div>
      </li>
      <ly-ic-line v-if="methodLine" :icon="wayIcon(delivery_info?.type)" :text="reach || whenText || ''" :title="methodLine" />
      <ly-ic-line v-if="whenText && reach" :text="whenText" :title="t('ly.od.when', 'When')" icon="cal" />
      <li v-if="courier" class="il">
        <span class="il-ic"><ly-icon name="bike" /></span>
        <div class="il-tx">
          <b>{{ courier.name }}</b><span>{{ t("ly.od.courier", "Courier") }}</span>
          <span v-if="courier.phone" class="ly-il-acts"
            ><a :href="`tel:${courier.phone}`" class="qlink"><ly-icon name="phone" />{{ t("ly.od.call", "Call {phone}", { phone: courier.phone }) }}</a></span
          >
        </div>
      </li>
      <ly-ic-line v-if="carrier" :text="t('ly.od.carrier', 'Carrier')" :title="carrier" icon="box" />
      <li v-if="tracking.code || tracking.url" class="il">
        <span class="il-ic"><ly-icon name="link" /></span>
        <div class="il-tx">
          <b>{{ tracking.code || t("ly.od.tracking", "Tracking") }}</b><span v-if="tracking.code">{{ t("ly.od.tracking", "Tracking") }}</span>
          <span class="ly-il-acts">
            <button v-if="tracking.code" class="qlink" type="button" @click="copyCode"><ly-icon :name="copied ? 'check' : 'copy'" />{{ copied ? t("ly.od.copied", "Copied") : t("ly.od.copy", "Copy") }}</button>
            <a v-if="tracking.url" :href="tracking.url" class="qlink" rel="noopener" target="_blank"><ly-icon name="arrow" />{{ t("ly.od.follow", "Follow the parcel") }}</a>
          </span>
        </div>
      </li>
      <li v-if="showBilling" class="il">
        <span class="il-ic"><ly-icon name="doc" /></span>
        <div class="il-tx">
          <template v-if="!edit_billing">
            <b>{{ billingWho }}</b><span v-if="billingLine">{{ billingLine }}</span
            ><span v-if="billing.tax_id">{{ t("ly.od.taxId", "Tax ID {id}", { id: String(billing.tax_id) }) }}</span>
            <span v-if="canEditAddress" class="ly-il-acts"
              ><button class="qlink" type="button" @click="openBilling"><ly-icon name="edit" />{{ t("ly.od.changeBilling", "Change billing") }}</button></span
            >
          </template>
          <form v-else class="ly-od-bill" @submit.prevent="saveBilling">
            <b>{{ t("ly.od.billing", "Billing") }}</b>
            <div :aria-label="t('ly.od.billing', 'Billing')" class="chips-r" role="radiogroup">
              <button :aria-checked="same_billing ? 'true' : 'false'" :class="['chip', { on: same_billing }]" role="radio" type="button" @click="same_billing = true">{{ t("ly.od.billingSame", "Same as delivery") }}</button>
              <button :aria-checked="!same_billing ? 'true' : 'false'" :class="['chip', { on: !same_billing }]" role="radio" type="button" @click="same_billing = false">{{ t("ly.od.billingOther", "Different details") }}</button>
            </div>
            <template v-if="!same_billing">
              <div class="fld">
                <label :for="'bl-n-' + basket.id" class="fl">{{ t("ly.od.billingName", "Name on the receipt") }}</label>
                <input :id="'bl-n-' + basket.id" v-model="billing_name" autocomplete="name" class="inp" type="text" />
              </div>
              <div class="fld">
                <label :for="'bl-a-' + basket.id" class="fl">{{ t("ly.od.billingAddress", "Billing address") }}</label>
                <input :id="'bl-a-' + basket.id" v-model="billing_address" autocomplete="street-address" class="inp" type="text" />
              </div>
            </template>
            <div class="ly-od-acts">
              <button :aria-disabled="busy_billing ? 'true' : undefined" class="btn sm" type="submit">{{ t("ly.od.save", "Save") }}</button>
              <button class="qlink" type="button" @click="edit_billing = false">{{ t("ly.od.cancel", "Cancel") }}</button>
            </div>
          </form>
        </div>
      </li>
      <ly-ic-line v-for="a in formAnswers" :key="a.name" :text="a.value || t('ly.od.notGiven', 'Not given')" :title="a.label" icon="info" />
    </ul>

    <div v-if="trip.length" class="ly-od-trip">
      <p class="eyebrow">{{ t("ly.od.trip", "The trip") }}</p>
      <ol>
        <li v-for="step in trip" :key="step.key" :class="'-' + step.tone">
          <span aria-hidden="true" class="ly-od-dot"></span>
          <span class="ly-od-tw"
            ><b>{{ step.title }}</b><small v-if="step.note">{{ step.note }}</small></span
          >
          <time v-if="step.at" :datetime="step.at">{{ step.time }}</time>
        </li>
      </ol>
    </div>

    <kalio-address-sheet
      v-if="canEditAddress"
      v-model="address_sheet"
      :center="receiver.location || null"
      :countries="$shop.countries?.length ? $shop.countries : null"
      :heading="t('ly.od.sheetHeading', 'Change the address')"
      :lede="t('ly.od.sheetLede', 'Until your order is sent, the shop delivers wherever you put the pin.')"
      :no-map="noMap"
      :receiver-info="receiver"
      @save="saveAddress"
    />
  </div>
</template>

<script>
import KalioOrderDelivery from "../../kalio/order/KalioOrderDelivery.vue";
import LyIcon from "../LyIcon.vue";
import LyIcLine from "../ui/LyIcLine.vue";
import { t } from "../../kalio/i18n/kalio-i18n";

export default {
  name: "LyOrderReceiver",
  extends: KalioOrderDelivery,
  components: { LyIcon, LyIcLine },
  computed: {
    addressTitle() {
      if (this.is_pickup) return this.addressLines[0] || t("ly.od.pickAt", "Pick it up at the counter");
      return this.addressLines[0] || t("ly.od.noAddress", "No address on this order");
    },
    addressText() {
      return this.addressLines.slice(1).join(", ");
    },
  },
  methods: { t },
};
</script>
