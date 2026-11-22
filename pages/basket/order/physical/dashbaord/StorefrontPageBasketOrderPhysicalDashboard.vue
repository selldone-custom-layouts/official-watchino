<!--
  - Copyright (c) 2023-2024. Selldone® Business OS™
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
  A physical order's page (design/order-b.html, pages-buy.js
  order): the title band is the parent page's (StorefrontPageBasketOrder);
  here the progress card (Placed · Baking · On the way · Delivered over
  Selldone's delivery states, a pickup's "Ready to collect · Collected", and
  the way · window · fee under it), the pastries with Selldone's sums, how
  it is paid (LyOrderPay), who receives it (LyOrderReceiver), and the
  messages beside them (LyOrderChat). The invoice and a share link sit by
  the pastries. A bank transfer's details, the sellers' own orders, returns
  and refunds stay Selldone's own, under the cards.
-->
<template>
  <section :aria-label="t('ly.od.aria', 'Order')" class="sec-s">
    <div class="wrap od">
      <div v-if="tone !== 'off'" class="od-tl">
        <ol :aria-label="t('ly.od.progress', 'Order progress')" class="tl4">
          <li v-for="(s, i) in steps" :key="s.key" :aria-current="stateOf(i) === 'cur' ? 'step' : undefined" :class="['t', stateOf(i)]">
            <span class="t-ic"><ly-icon :name="stateOf(i) === 'done' ? 'check' : s.icon" /></span><span class="t-l">{{ s.label }}</span>
          </li>
        </ol>
        <p v-if="wayLine" class="od-line">
          <ly-icon :name="wayIcon(basket.delivery_info?.type)" /><span
            ><b>{{ wayLine }}</b>{{ " · " }}{{ basket.delivery_price > 0 ? amount(basket.delivery_price) : t("ly.od.free", "Free") }}</span
          >
        </p>
      </div>
      <div v-else class="od-tl ly-od-off">
        <ly-empty :text="t('ly.od.offP', 'Nothing more will happen with it. Write to the bakery if you have a question.')" :title="t('ly.od.offT', 'This order was cancelled')" icon="close" tag="h2" />
      </div>

      <div class="od-g">
        <div class="od-main">
          <div class="od-c">
            <div class="ly-od-hd">
              <h2 class="co-h">{{ t("ly.od.pastries", "Pastries") }}</h2>
              <div class="ly-od-tools">
                <button :aria-disabled="busy_invoice ? 'true' : undefined" class="qlink" type="button" @click="busy_invoice || downloadInvoice()"><ly-icon name="doc" />{{ t("ly.od.invoice", "Invoice") }}</button>
                <s-shop-share-order-button :basket="basket" class="ly-od-share"></s-shop-share-order-button>
              </div>
            </div>
            <ul class="rc-l">
              <li v-for="item in basket.items" :key="item.id">
                <span class="rc-th"><img v-if="image(item)" :src="image(item)" alt="" /></span>
                <span class="rc-n"
                  ><router-link :to="productRoute(item.product_id)"><b>{{ item.product?.title }}</b></router-link
                  ><small>{{ item.count }} × <span class="money">{{ amount(item.price) }}</span><template v-if="size(item)">{{ " · " + size(item) }}</template></small></span
                >
                <span class="rc-v money">{{ amount(item.price * item.count - (item.offer_amount || 0)) }}</span>
              </li>
            </ul>
            <dl class="rc-s">
              <div>
                <dt>{{ t("ly.od.full", "Items at full price") }}</dt>
                <dd class="money">{{ amount(sums.full) }}</dd>
              </div>
              <div v-if="sums.save > 0" class="sv">
                <dt>{{ t("ly.od.savings", "Savings") }}</dt>
                <dd class="money">−{{ amount(sums.save) }}</dd>
              </div>
              <div v-if="sums.other > 0.004" class="sv">
                <dt>{{ t("ly.od.offers", "Offers and codes") }}</dt>
                <dd class="money">−{{ amount(sums.other) }}</dd>
              </div>
              <div>
                <dt>
                  {{ t("ly.od.delivery", "Delivery") }}<small v-if="wayName">{{ wayName }}</small>
                </dt>
                <dd>{{ basket.delivery_price > 0 ? amount(basket.delivery_price) : t("ly.od.free", "Free") }}</dd>
              </div>
              <div v-if="basket.tax > 0">
                <dt>{{ basket.tax_included ? t("ly.od.taxIn", "Tax (included)") : t("ly.od.tax", "Tax") }}</dt>
                <dd class="money">{{ amount(basket.tax) }}</dd>
              </div>
              <div class="tot">
                <dt>{{ t("ly.od.total", "Total") }}</dt>
                <dd class="money">{{ amount(basket.price) }}</dd>
              </div>
            </dl>
          </div>

          <div class="od-two">
            <ly-order-pay :basket="basket" />
            <ly-order-receiver :basket="basket" />
          </div>

          <div v-if="transfers.length" class="od-c ly-od-sd">
            <h2 class="co-h">{{ t("ly.od.transfer", "Pay by bank transfer") }}</h2>
            <table>
              <tbody>
                <s-shop-row-customer-pending-payment v-for="tr in transfers" :key="tr.id" :order="basket" :transaction="tr" />
              </tbody>
            </table>
          </div>
          <s-basket-vendor-orders v-if="basket.vendor_orders?.length" :basket="basket" class="od-c ly-od-sd"></s-basket-vendor-orders>
          <s-order-basket-return :basket="basket" class="ly-od-sd" />
          <s-shop-customer-order-withdraw :order="basket" :payment="basket.payment" class="ly-od-sd" @request:refresh="$emit('request:refresh')" />
        </div>

        <ly-order-chat :basket="basket" />
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import SOrderBasketReturn from "@selldone/components-vue/storefront/order/basket/return/SOrderBasketReturn.vue";
import SShopRowCustomerPendingPayment from "@selldone/components-vue/storefront/order/payment/rows/SShopRowCustomerPendingPayment.vue";
import SShopCustomerOrderWithdraw from "@selldone/components-vue/storefront/order/payment/withdraw/SShopCustomerOrderWithdraw.vue";
import LyOrderReceiver from "../../../../../components/ly/order/LyOrderReceiver.vue";
import LyOrderChat from "../../../../../components/ly/order/LyOrderChat.vue";
import LyOrderPay from "../../../../../components/ly/order/LyOrderPay.vue";
import LyIcon from "../../../../../components/ly/LyIcon.vue";
import LyEmpty from "../../../../../components/ly/ui/LyEmpty.vue";

import SShopShareOrderButton from "@selldone/components-vue/storefront/order/share-order/SShopShareOrderButton.vue";
import { ProductType } from "@selldone/core-js/enums/product/ProductType";
import SBasketVendorOrders from "@selldone/components-vue/storefront/order/vendor-order/SBasketVendorOrders.vue";
import NotificationService from "@selldone/components-vue/plugins/notification/NotificationService.ts";
import { Basket } from "@selldone/core-js";
import { productImage } from "../../../../../components/kalio/kalio-catalog";
import { t } from "../../../../../components/kalio/i18n/kalio-i18n";
import { loadDm, wayTitle } from "../../../../../components/ly/ly";
import { money } from "../../../../../components/region-switcher/region";
import { isPickupWay, shopWay, wayIcon, wayWindowLine } from "../../../../../components/ly/buy/ly-cart";
import { orderStep, orderSteps, orderTone } from "../../../../../components/ly/order/od";

/* The size of a variant in words: its volume, weight, pack, colour or style. */
function sizeOf(variant) {
  if (!variant) return null;
  return variant.volume || variant.weight || variant.pack || variant.type || variant.style || null;
}

export default {
  name: "StorefrontPageBasketOrderPhysicalDashboard",
  components: {
    SBasketVendorOrders: SBasketVendorOrders,
    SShopShareOrderButton,
    SShopRowCustomerPendingPayment,
    SShopCustomerOrderWithdraw,
    SOrderBasketReturn,
    LyOrderReceiver,
    LyOrderChat,
    LyOrderPay,
    LyIcon,
    LyEmpty,
  },

  emits: ["request:refresh"],

  props: {
    basket: {
      type: Object,
      require: true,
    },
  },

  data: function () {
    return {
      ProductType: ProductType,

      orderType: ProductType.PHYSICAL,
      busy_invoice: false,
    };
  },
  computed: {
    shop() {
      return this.getShop();
    },

    // ▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅ the Layout ▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅
    steps() {
      return orderSteps(isPickupWay(this.basket?.delivery_info));
    },
    stepAt() {
      return orderStep(this.basket);
    },
    tone() {
      return orderTone(this.basket);
    },
    currency() {
      return this.basket?.currency;
    },
    /* Selldone's sums: the items at full price, their savings, any other
       discount (offers, codes, coupons, the club, the wallet) as what is
       left between them and the order's price. */
    sums() {
      const items = this.basket?.items || [];
      const full = items.reduce((s, it) => s + (it.price + (it.dis || 0)) * it.count, 0);
      const save = items.reduce((s, it) => s + (it.dis || 0) * it.count, 0);
      const delivery = this.basket?.delivery_price > 0 ? this.basket.delivery_price : 0;
      const other = full - save + delivery + (this.basket?.tax_included ? 0 : this.basket?.tax || 0) - (this.basket?.price || 0);
      return { full, save, other: other > 0 ? other : 0 };
    },
    wayLine() {
      return this.basket?.delivery_info?.type ? wayWindowLine(this.shop, this.basket.delivery_info) : "";
    },
    wayName() {
      const type = this.basket?.delivery_info?.type;
      return type ? wayTitle(shopWay(this.shop, { type }), this.shop) : "";
    },
    /** Bank transfers still waiting: their details and the receipt upload. */
    transfers() {
      return (this.basket?.transactions_pending || []).filter((t) => t.dir && t.status !== "Succeeded");
    },
  },
  created() {
    loadDm();
  },
  methods: {
    t,
    wayIcon,
    /* done · cur · next; the last step reached is done. */
    stateOf(i) {
      const at = this.stepAt;
      if (i < at || (i === at && at === this.steps.length - 1)) return "done";
      return i === at ? "cur" : "next";
    },
    amount(n) {
      return money(Number(n) || 0, this.currency);
    },
    image(item) {
      if (item.variant?.image) return window.CDN.GET_SHOP_IMAGE_PATH(item.variant.image, 128);
      return productImage(item.product, true);
    },
    size(item) {
      return sizeOf(item.variant);
    },
    productRoute(id) {
      return { name: window.$storefront.routes.PRODUCT_PAGE, params: { product_id: id } };
    },

    downloadInvoice() {
      this.busy_invoice = true;

      axios
        .get(
          window.XAPI.GET_ORDER_BASKET_RECEIPT(
            this.shop.name,
            this.basket.id,
          ),
          {
            params: {
              code: this.basket.code || undefined,
              signature: this.$route.query.signature,
              timestamp: this.$route.query.timestamp,
            },
            responseType: "blob",
          },
        )
        .then(({ data }) => {
          const download_url = window.URL.createObjectURL(
            new Blob([data], { type: "application/pdf" }),
          );
          const link = document.createElement("a");
          link.href = download_url;
          link.download = `${this.getBasketOrderCode(this.basket)}.pdf`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.setTimeout(
            () => window.URL.revokeObjectURL(download_url),
            0,
          );
        })
        .catch((error) => {
          NotificationService.showLaravelError(error);
        })
        .finally(() => {
          this.busy_invoice = false;
        });
    },
  },
};
</script>

<style lang="scss" scoped></style>
