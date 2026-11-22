<!--
  - Copyright (c) 2023. Selldone® Business OS™
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
  The bag and the checkout (design/cart-b.html,
  checkout-b.html, delivery-b.html, map-b.html, payment-b.html;
  src/pages-buy.js). One Selldone basket page in two stages (ly-cart.ts):

  - the bag: the title band; a row per line (the pastry on its plate, the
    collection, the name, the price per unit and the stock, − n +, the line
    total with the was-price, ✕); "How it reaches you" (the shop's ways as
    cards, chosen now or at checkout; "Compare the options" opens the
    delivery sheet); the receipt (items at full price, savings, delivery,
    total) with Checkout; "Often added". Empty: a calm card, "Continue
    shopping" and the collections.
  - the checkout (?step=checkout): the step pills in the title band (Bag,
    Details, Delivery, Payment, each its own pill), then numbered cards —
    Contact, Delivery (the ways and their windows), the delivery address or
    the pickup counter, Billing, a note — and the receipt beside them with
    "Place order · pay $X on delivery", what is still missing named in a
    banner above the cards.

  Everything that works is Selldone's and stays as it was in the script
  below: the bill, the basket config (receiver, delivery, billing, the
  shop's checkout questions, the guest's email), coupons and prizes, the
  shipping options, the address sheet (map on or off), the payment window
  and the service order.
-->
<template>
  <div class="ly ly-cartpage">
    <!-- ▆▆▆▆ Empty ▆▆▆▆ -->
    <template v-if="!(basket && basket.items && basket.items.length)">
      <ly-pt :crumbs="[{ label: t('ly.co.yourBag', 'Your bag') }]" :title="t('ly.co.yourBag', 'Your bag')" art="cupcake" art2="croissant" cls="compact" />
      <section :aria-label="t('ly.co.bagAria', 'Bag')" class="sec-s">
        <div class="wrap">
          <ly-empty :text="t('ly.co.emptyP', 'Pastries are sold one by one, so add exactly the pieces you want — a single piece is an order.')" :title="t('ly.co.emptyT', 'Your bag is empty')" cls="boxed" icon="bag">
            <template #acts>
              <router-link :to="shopTo" class="btn">{{ t("ly.co.continue", "Continue shopping") }}</router-link>
            </template>
            <template v-if="ly.cats.length" #extra>
              <p class="em-k">{{ t("ly.co.orStart", "Or start with a collection") }}</p>
              <ul class="cat-sc">
                <li v-for="c in ly.cats" :key="c.id">
                  <router-link :to="catTo(c)" class="chip th"
                    ><span class="cs-pl"><img v-if="catTop(c)" :src="catTop(c)" alt="" loading="lazy" /></span><bdi>{{ c.title || c.name }}</bdi></router-link
                  >
                </li>
              </ul>
            </template>
          </ly-empty>
        </div>
      </section>
    </template>

    <!-- ▆▆▆▆ Bag ▆▆▆▆ -->
    <template v-else-if="nx_stage === 'bag'">
      <ly-pt
        :crumbs="[{ label: t('ly.co.yourBag', 'Your bag') }]"
        :lead="t('ly.co.bagLead', 'Pastries are sold one by one. Change the pieces here, then choose how they reach you.')"
        :title="t('ly.co.yourBag', 'Your bag')"
        art="cupcake"
        art2="croissant"
        cls="compact"
      />
      <section :aria-label="t('ly.co.bagAria', 'Bag')" class="sec-s">
        <div class="wrap cart">
          <div class="cart-main">
            <ul class="crl">
              <li v-for="it in nx_lines" :key="it.id" class="cr">
                <router-link :to="productTo({ id: it.product_id })" aria-hidden="true" class="cr-pl" tabindex="-1"><img :src="nx_img(it)" alt="" /></router-link>
                <div class="cr-tx">
                  <span v-if="nx_cat(it)" class="pc-c"><bdi>{{ nx_cat(it) }}</bdi></span>
                  <router-link :to="productTo({ id: it.product_id })" class="cr-n">{{ it.product?.title }}</router-link>
                  <span class="cr-u"
                    >{{ t("ly.co.perUnit", "{price} per {unit}", { price: nx_money(it.price), unit: nx_unit(it) }) }} · <span :class="{ low: dmLow(it) }">{{ dmStock(it) }}</span></span
                  >
                </div>
                <div class="cr-q"><ly-line-qb :item="it" /></div>
                <p class="cr-lt">
                  <span class="now money">{{ nx_money(it.price * nx_shown(it)) }}</span><s v-if="it.dis > 0" class="was money">{{ nx_money((it.price + it.dis) * nx_shown(it)) }}</s>
                </p>
                <button :aria-label="t('ly.co.removeOf', 'Remove {name} from the bag', { name: it.product?.title || '' })" class="cr-rm" type="button" @click="nx_remove(it)"><ly-icon name="trash" /></button>
              </li>
            </ul>

            <div v-if="transportation_list.length && has_delivery && !isService" class="cdlv">
              <div class="cdlv-hd">
                <h2 class="h3x">{{ t("ly.co.reaches", "How it reaches you") }}</h2>
                <button :aria-expanded="delivery_sheet ? 'true' : 'false'" aria-controls="dlvm" class="qlink" type="button" @click="openLayer('dlvm', $event.currentTarget)">
                  {{ t("ly.co.compareWays", "Compare the options") }}<ly-icon name="arrow" />
                </button>
              </div>
              <div :aria-label="t('ly.co.method', 'Delivery method')" class="mcs" role="radiogroup">
                <label v-for="way in nx_ways_in_order" :key="way.type + (way.id || '')" :class="['mc', { on: delivery_info?.type === way.type }]">
                  <input :aria-label="wayTitleOf(way)" :checked="delivery_info?.type === way.type" class="rdo" name="ly-cdm" type="radio" :value="way.type" @change="nx_pick_way(way)" />
                  <span class="mc-ic"><ly-icon :name="wayIcon(way.type)" /></span>
                  <span class="mc-t">{{ wayTitleOf(way) }}</span>
                  <span class="mc-f">{{ nx_way_fee(way) }}</span>
                  <span v-if="dmWayNote(way)" class="mc-n">{{ dmWayNote(way) }}</span>
                </label>
              </div>
              <p class="cdlv-n"><ly-icon name="info" />{{ t("ly.co.windowLater", "The time window is chosen at checkout.") }}</p>
            </div>
          </div>

          <aside :aria-label="t('ly.co.receipt', 'Receipt')" class="cart-sum">
            <div :class="['rc', { '-busy': busy_bill || refreshing_price }]">
              <h2 class="rc-h">{{ t("ly.co.receipt", "Receipt") }}</h2>
              <dl v-if="bill" class="rc-s">
                <div>
                  <dt>{{ t("ly.co.full", "Items at full price") }}</dt>
                  <dd class="money">{{ nx_money(nx_rc.full) }}</dd>
                </div>
                <div v-if="nx_rc.save > 0" class="sv">
                  <dt>{{ nx_save_label }}</dt>
                  <dd class="money">−{{ nx_money(nx_rc.save) }}</dd>
                </div>
                <div v-if="nx_rc.offer > 0" class="sv">
                  <dt>{{ t("ly.co.offers", "Offers") }}</dt>
                  <dd class="money">−{{ nx_money(nx_rc.offer) }}</dd>
                </div>
                <div v-if="!isService">
                  <dt>
                    {{ t("ly.co.delivery", "Delivery") }}<small v-if="nx_way">{{ nx_delivery_label }}</small>
                  </dt>
                  <dd>{{ nx_rc.delivery < 0 && !nx_way_is_free ? t("ly.co.atCheckout", "Chosen at checkout") : nx_delivery_value }}</dd>
                </div>
                <div class="tot">
                  <dt>{{ t("ly.co.total", "Total") }}</dt>
                  <dd class="money">{{ nx_money(nx_rc.total) }}</dd>
                </div>
              </dl>
              <p v-else-if="!busy_bill" class="rc-note"><ly-icon name="info" />{{ t("ly.co.billError", "We could not work out the bill. Please reload the page.") }}</p>
              <button class="btn block" type="button" @click="nx_go_checkout">{{ t("ly.co.checkout", "Checkout") }}<ly-icon name="arrow" /></button>
              <p v-if="nx_cod_only" class="rc-note"><ly-icon name="cash" />{{ nx_is_pickup ? t("ly.co.codPickup", "Pay in cash when you collect it.") : t("ly.co.cod", "Pay in cash when the order arrives.") }}</p>
            </div>
          </aside>
        </div>
      </section>

      <section v-if="pr_often.length" aria-labelledby="oa-h" class="sec-s oa">
        <div class="wrap">
          <header class="sec-hd sm">
            <p class="eyebrow">{{ t("ly.co.oftenEyebrow", "From other collections") }}</p>
            <h2 id="oa-h" class="h2">{{ t("ly.co.often", "Often added") }}</h2>
          </header>
          <div class="grid six">
            <ly-card v-for="p in pr_often" :key="p.id" :product="p" />
          </div>
        </div>
      </section>
    </template>

    <!-- ▆▆▆▆ Checkout ▆▆▆▆ -->
    <template v-else>
      <ly-pt :crumbs="[{ to: { query: {} }, label: t('ly.co.yourBag', 'Your bag') }, { label: t('ly.co.checkout', 'Checkout') }]" :title="t('ly.co.checkout', 'Checkout')" art="tart" art2="macaron" cls="compact">
        <ol :aria-label="t('ly.co.steps', 'Checkout steps')" class="steps">
          <li v-for="s in pr_steps" :key="s.key" :aria-current="s.state === 'cur' ? 'step' : undefined" :class="['step', s.state]">
            <a v-if="s.key === 'bag'" href="#" @click.prevent="nx_go_bag"
              ><span class="st-ic"><ly-icon name="check" /></span><span>{{ s.label }}</span></a
            >
            <a v-else :href="'#' + s.anchor" @click.prevent="nx_scroll_to(s.anchor)"
              ><span class="st-ic"><ly-icon :name="s.state === 'done' ? 'check' : s.icon" /></span><span>{{ s.label }}</span></a
            >
          </li>
        </ol>
      </ly-pt>

      <section :aria-label="t('ly.co.checkout', 'Checkout')" class="sec-s">
        <div class="wrap co">
          <div class="co-main">
            <div v-if="nx_missing.length && nx_tried" class="co-alert" data-miss role="alert">
              <span class="em-ic sm"><ly-icon name="info" /></span>
              <div>
                <b>{{ t("ly.co.almost", "Almost there") }}</b>
                <p>
                  {{ t("ly.co.addTo", "Add {list} to place the order.", { list: dmList(nx_missing.map((x) => x.label)) }) }}
                </p>
              </div>
            </div>

            <!-- 1. Contact -->
            <section id="co-details" aria-labelledby="co1" class="co-c">
              <ly-numeral :n="1" />
              <div class="co-b">
                <h2 id="co1" class="co-h">{{ t("ly.co.contact", "Contact") }}</h2>
                <p v-if="user" class="co-p">{{ t("ly.co.signedAs", "Signed in as {name}.", { name: user.name || user.email || "" }) }}</p>
                <p v-else-if="busy_user" class="co-p">{{ t("ly.co.checking", "Checking your sign-in…") }}</p>
                <p v-else-if="has_guest_payment" class="co-p">{{ t("ly.co.forUpdates", "For the order updates. Checkout does not need an account.") }}</p>
                <p v-else class="co-p">{{ t("ly.co.signInToOrder", "Sign in to place the order.") }}</p>
                <div class="g2">
                  <div id="co-f-email" :class="['fld', 'f-email', { bad: nx_touched.email && !nx_email_ok }]">
                    <label class="fl" for="co-email">{{ t("ly.co.email", "Email") }}</label>
                    <input
                      id="co-email"
                      :disabled="!!user || (!user && !has_guest_payment)"
                      :value="nx_email"
                      autocomplete="email"
                      class="inp"
                      inputmode="email"
                      name="email"
                      type="email"
                      @blur="nx_save_contact"
                      @input="nx_email = $event.target.value"
                    />
                    <span class="err">{{ t("ly.co.emailHint", "Add an email address") }}</span>
                  </div>
                  <div v-if="has_delivery && !isService" id="co-f-phone" :class="['fld', 'f-phone', { bad: nx_touched.phone && !nx_phone_ok }]">
                    <label class="fl" for="co-phone">{{ t("ly.co.phone", "Phone") }}</label>
                    <input id="co-phone" :value="nx_phone" autocomplete="tel" class="inp" dir="ltr" name="phone" type="tel" @blur="nx_save_contact" @input="nx_phone = $event.target.value" />
                    <span class="err">{{ t("ly.co.phoneHint", "Add a phone number") }}</span>
                  </div>
                </div>
                <p v-if="!user" class="co-p sm">
                  {{ t("ly.co.haveAccount", "Have an account?") }}
                  <a class="qlink in" href="#" @click.prevent="NeedLogin">{{ t("ly.co.signIn", "Sign in") }}</a>
                </p>
              </div>
            </section>

            <!-- 2. Delivery: the ways and their windows (Selldone's shipping options, SCartShippingOptions) -->
            <section v-if="has_delivery && !isService && bill" id="co-delivery" aria-labelledby="co2" class="co-c">
              <ly-numeral :n="2" />
              <div class="co-b">
                <div class="co-hr">
                  <h2 id="co2" class="co-h">{{ t("ly.co.deliveryH", "Delivery") }}</h2>
                  <button :aria-expanded="delivery_sheet ? 'true' : 'false'" aria-controls="dlvm" class="qlink" type="button" @click="openLayer('dlvm', $event.currentTarget)">
                    {{ t("ly.co.compareWays", "Compare the options") }}<ly-icon name="arrow" />
                  </button>
                </div>
                <s-shop-connect-shipping-options
                  :basket="basket"
                  :start-package-index="0"
                  @change="
                    (connect_shippings) => {
                      delivery_info.connect_shippings = connect_shippings;
                      setBasketConfig();
                    }
                  "
                ></s-shop-connect-shipping-options>
                <s-order-shipping-vendors-options
                  :basket="basket"
                  :deliveryInfo="delivery_info"
                  :start-package-index="bill?.connect_shipping_options?.length"
                  @set-basket-config="setBasketConfig"
                ></s-order-shipping-vendors-options>
                <s-order-shipping-stores-options
                  v-if="!delivery_sheet"
                  :basket="basket"
                  :delivery-info="delivery_info"
                  :start-package-index="bill?.connect_shipping_options?.length + bill?.vendor_shipping_options?.length"
                  @set-basket-config="setBasketConfig"
                ></s-order-shipping-stores-options>
              </div>
            </section>

            <!-- 3. Delivery address, or the pickup counter -->
            <section v-if="has_delivery" id="co-address" aria-labelledby="co3" class="co-c">
              <ly-numeral :n="has_delivery && !isService && bill ? 3 : 2" />
              <div class="co-b">
                <h2 id="co3" class="co-h">{{ nx_is_pickup ? t("ly.co.pickup", "Pickup") : isService ? t("ly.co.serviceAddress", "Service address") : t("ly.co.address", "Delivery address") }}</h2>
                <div v-if="nx_is_pickup" class="pk-card">
                  <span class="mc-ic"><ly-icon name="store" /></span>
                  <div>
                    <b><bdi>{{ receiver_info?.name || receiver_info?.title || nx_pickup_point?.name }}</bdi></b>
                    <p><bdi>{{ [receiver_info?.address, receiver_info?.city, receiver_info?.postal].filter(Boolean).join(", ") }}</bdi></p>
                    <p v-if="nx_pickup_point?.message">{{ nx_pickup_point.message }}</p>
                  </div>
                </div>
                <div v-else-if="nx_has_address" class="addr-card">
                  <span class="mc-ic"><ly-icon name="pin" /></span>
                  <div class="ac-tx">
                    <b
                      ><bdi>{{ receiver_info.name }}</bdi
                      ><template v-if="receiver_info.phone">{{ " · " }}<span dir="ltr">{{ receiver_info.phone }}</span></template></b
                    >
                    <p>
                      <bdi>{{ address_line }}</bdi
                      ><template v-if="receiver_info.city">{{ ", " + [receiver_info.city, receiver_info.state, receiver_info.postal].filter(Boolean).join(" ") }}</template>
                    </p>
                  </div>
                  <button class="qlink" type="button" @click="openAddress()">{{ t("ly.co.change", "Change") }}</button>
                </div>
                <template v-else>
                  <button class="addr-add" type="button" @click="openAddress()">
                    <span class="em-ic sm"><ly-icon name="pin" /></span
                    ><span
                      ><b>{{ no_map ? t("ly.co.addAddress", "Add your address") : t("ly.co.addOnMap", "Add on the map") }}</b
                      ><small>{{ no_map ? t("ly.co.addAddressP", "The receiver, the street and the city") : t("ly.co.addOnMapP", "Search a street or drop the pin at your door") }}</small></span
                    ><ly-icon name="arrow" />
                  </button>
                  <p v-if="nx_touched.address" class="err-l"><ly-icon name="info" />{{ t("ly.co.needAddress", "Add a delivery address") }}</p>
                </template>
              </div>
            </section>

            <!-- 4. Billing -->
            <section id="co-billing" aria-labelledby="co4" class="co-c">
              <ly-numeral :n="(has_delivery && !isService && bill ? 3 : 2) + (has_delivery ? 1 : 0)" />
              <div class="co-b">
                <h2 id="co4" class="co-h">{{ t("ly.co.billing", "Billing") }}</h2>
                <div :aria-label="t('ly.co.billingAria', 'Billing address')" class="bills" role="radiogroup">
                  <label class="bill"
                    ><input :checked="!nx_billing_custom" class="rdo" name="ly-bill" type="radio" value="same" @change="nx_set_billing(false)" /><span
                      ><b>{{ t("ly.co.same", "Same as delivery") }}</b
                      ><small>{{ nx_is_pickup ? t("ly.co.sameReceiver", "Use the receiver details") : t("ly.co.sameAddress", "Use the delivery address on the receipt") }}</small></span
                    ></label
                  >
                  <label class="bill"
                    ><input :checked="nx_billing_custom" class="rdo" name="ly-bill" type="radio" value="diff" @change="nx_set_billing(true)" /><span
                      ><b>{{ t("ly.co.other", "Different billing address") }}</b><small>{{ t("ly.co.otherP", "Add another name and address") }}</small></span
                    ></label
                  >
                </div>
                <div v-if="nx_billing_custom" class="bill-f">
                  <s-shop-billing-address-form v-model="billing" :receiver-info="receiver_info" class="ly-billform" force-show-form @change="setBasketConfig"></s-shop-billing-address-form>
                </div>
              </div>
            </section>

            <!-- 5. A note for the bakery (the receiver's note) -->
            <section v-if="has_delivery && !isService" id="co-note" aria-labelledby="co5" class="co-c">
              <ly-numeral :n="(has_delivery && !isService && bill ? 4 : 3) + (has_delivery ? 1 : 0)" />
              <div class="co-b">
                <h2 id="co5" class="co-h">
                  {{ t("ly.co.noteFor", "A note for {shop}", { shop: dmShopName }) }} <span class="opt-k">{{ t("ly.co.optional", "(optional)") }}</span>
                </h2>
                <label class="sr" for="co-n">{{ t("ly.co.note", "Note") }}</label>
                <textarea
                  id="co-n"
                  :placeholder="t('ly.co.notePh', 'Ring twice, leave it with the concierge, a message for a gift…')"
                  :value="nx_note_value"
                  class="inp"
                  name="note"
                  @blur="setBasketConfig"
                  @input="nx_note_value = $event.target.value"
                ></textarea>
              </div>
            </section>

            <!-- The shop's own checkout questions (Selldone) -->
            <s-order-checkout-form
              :key="'socf-' + basket?.id"
              v-model="form"
              :country="receiver_info?.country ? receiver_info.country : billing?.country"
              class="ly-coform"
              @changed="setBasketConfig"
            ></s-order-checkout-form>

            <!-- Coupons and prizes, only when the shopper has some -->
            <s-storefront-coupons-list
              v-if="!isSubscription"
              v-model="basket.coupon"
              :basket="basket"
              class="ly-offers"
              return-object
              selectable
              @loading="(val) => (refreshing_price = val)"
              @update:model-value="selectCoupon"
            ></s-storefront-coupons-list>
            <s-storefront-lottery-prizes-list
              v-if="!isSubscription"
              v-model="basket.lottery"
              :basket="basket"
              class="ly-offers"
              return-object
              selectable
              @loading="(val) => (refreshing_price = val)"
              @update:model-value="selectLottery"
            ></s-storefront-lottery-prizes-list>
          </div>

          <!-- The receipt -->
          <aside id="co-pay" :aria-label="t('ly.co.yourOrder', 'Your order')" class="co-sum">
            <div :class="['rc', { '-busy': busy_bill || refreshing_price || busy_save }]">
              <h2 class="rc-h">{{ t("ly.co.yourOrder", "Your order") }}</h2>
              <ul class="rc-l">
                <li v-for="it in nx_lines" :key="it.id">
                  <span class="rc-th"><img :src="nx_img(it)" alt="" /></span>
                  <span class="rc-n"
                    ><b>{{ it.product?.title }}</b><small>{{ nx_shown(it) }} × {{ nx_money(it.price) }}</small></span
                  >
                  <span class="rc-v money">{{ nx_money(it.price * nx_shown(it)) }}</span>
                </li>
              </ul>
              <dl v-if="bill" class="rc-s">
                <div>
                  <dt>{{ t("ly.co.full", "Items at full price") }}</dt>
                  <dd class="money">{{ nx_money(nx_rc.full) }}</dd>
                </div>
                <div v-if="nx_rc.save > 0" class="sv">
                  <dt>{{ nx_save_label }}</dt>
                  <dd class="money">−{{ nx_money(nx_rc.save) }}</dd>
                </div>
                <div v-if="nx_rc.offer > 0" class="sv">
                  <dt>{{ t("ly.co.offers", "Offers") }}</dt>
                  <dd class="money">−{{ nx_money(nx_rc.offer) }}</dd>
                </div>
                <div v-if="discount_code_amount > 0" class="sv">
                  <dt>{{ discount_code?.code ? t("ly.co.codeNamed", "Code {code}", { code: discount_code.code }) : t("ly.co.code", "Code") }}</dt>
                  <dd class="money">−{{ nx_money(discount_code_amount) }}</dd>
                </div>
                <div v-if="coupon && coupon_discount > 0" class="sv">
                  <dt>{{ coupon.title || $t("global.commons.coupon") }}</dt>
                  <dd class="money">−{{ nx_money(coupon_discount) }}</dd>
                </div>
                <div v-if="customer_club_discount > 0" class="sv">
                  <dt>{{ t("ly.co.club", "Club") }}</dt>
                  <dd class="money">−{{ nx_money(customer_club_discount) }}</dd>
                </div>
                <div v-if="wallet" class="sv">
                  <dt>{{ $t("global.commons.my_wallet") }}</dt>
                  <dd class="money">−{{ nx_money(wallet) }}</dd>
                </div>
                <div v-if="!isService">
                  <dt>
                    {{ t("ly.co.delivery", "Delivery") }}<small v-if="nx_way_line">{{ nx_way_line }}</small>
                  </dt>
                  <dd>{{ nx_delivery_value }}</dd>
                </div>
                <div v-if="bill.tax">
                  <dt>{{ $t("global.commons.tax") }}</dt>
                  <dd class="money">{{ nx_money(bill.tax) }}</dd>
                </div>
                <div class="tot">
                  <dt>{{ t("ly.co.total", "Total") }}</dt>
                  <dd class="money">{{ nx_money(nx_rc.total) }}</dd>
                </div>
              </dl>
              <div v-if="!isSubscription" class="ly-code">
                <s-discount-code-input
                  v-model="basket.discount_code"
                  :basket="basket"
                  :currency="basket.currency"
                  @loading="(val) => (refreshing_price = val)"
                  @update:model-value="selectDiscountCode"
                />
              </div>
              <div v-if="nx_no_gateway" class="nogw-b ly-nogw">
                <span class="em-ic sm"><ly-icon name="lock" /></span>
                <div>
                  <b>{{ t("ly.co.noPayT", "This shop is not taking payment right now") }}</b>
                  <p>{{ t("ly.co.noPayP", "The order cannot be placed until the shop adds a payment method. Your bag is kept.") }}</p>
                  <router-link :to="dmContactTo" class="qlink">{{ t("ly.co.contactShop", "Contact the shop") }}</router-link>
                </div>
              </div>
              <p v-else-if="pay_blocker && !nx_missing.length" class="rc-note"><ly-icon name="info" />{{ pay_blocker }}</p>
              <button v-if="!nx_no_gateway" :disabled="busy_submit" class="btn block place" type="button" @click="nx_place">
                <span v-if="busy_save || busy_bill || busy_submit" aria-hidden="true" class="spin"></span>{{ pr_place_label }}
              </button>
              <p class="rc-note"><ly-icon name="lock" />{{ nx_cod_only ? t("ly.co.nothingOnline", "Nothing is charged online.") : t("ly.co.payNext", "You choose how to pay in the next step.") }}</p>
            </div>
          </aside>
        </div>
      </section>
    </template>

    <!-- ▆▆▆▆ The delivery sheet (delivery-b): every way, its windows, the counter ▆▆▆▆ -->
    <ly-modal id="dlvm" :title="t('ly.co.deliveryH', 'Delivery')">
      <template v-if="delivery_sheet && basket && bill">
        <p class="md-lead">{{ nx_cod_only ? t("ly.co.dlvLeadCod", "Every method is paid in cash on delivery. Pick one, then a time window.") : t("ly.co.dlvLead", "Pick a method, then a time window.") }}</p>
        <ly-ship-sheet>
          <s-order-shipping-stores-options
            :basket="basket"
            :delivery-info="delivery_info"
            :start-package-index="bill?.connect_shipping_options?.length + bill?.vendor_shipping_options?.length"
            class="ly-dlsheet"
            @set-basket-config="setBasketConfig"
          ></s-order-shipping-stores-options>
        </ly-ship-sheet>
      </template>
      <template #foot>
        <button class="btn" type="button" @click="delivery_sheet = false">{{ t("ly.co.done", "Done") }}</button>
      </template>
    </ly-modal>

    <!-- ▆▆▆▆ The address sheet (map-b; map on or off) ▆▆▆▆ -->
    <kalio-address-sheet
      v-if="has_delivery"
      v-model="address_sheet"
      :center="center"
      :countries="$shop.countries?.length ? $shop.countries : null"
      :heading="isService ? t('ly.co.whereService', 'Where should we come?') : t('ly.co.addressH', 'Delivery address')"
      :lede="no_map ? t('ly.co.addressLede0', 'The receiver and the street') : t('ly.co.addressLede', 'Search a street or drop the pin at your door')"
      :no-map="no_map"
      :receiver-info="nx_receiver_is_pickup ? {} : receiver_info"
      @save="onClickSetLocation"
    />

    <div v-if="busy_shop" class="busy-overlay">
      <div class="text-h4 font-weight-thin">{{ $t("global.commons.waiting") }}...</div>
    </div>
  </div>
</template>

<script lang="ts">
import NotificationService from "@selldone/components-vue/plugins/notification/NotificationService.ts";

import { ShopTransportations } from "@selldone/core-js/enums/logistic/ShopTransportations";
import SDiscountCodeInput from "@selldone/components-vue/storefront/discount-code/input/SDiscountCodeInput.vue";
import { GtagEcommerce } from "@selldone/components-vue/plugins/gtag/GtagEcommerce";
import SStorefrontCouponsList from "@selldone/components-vue/storefront/coupon/list/SStorefrontCouponsList.vue";
import { ProductType } from "@selldone/core-js/enums/product/ProductType";
import SStorefrontLotteryPrizesList from "@selldone/components-vue/storefront/lottery/prizes-list/SStorefrontLotteryPrizesList.vue";
import VariantItemMini from "@selldone/components-vue/storefront/product/variant/VariantItemMini.vue";
import { ShopOptionsHelper } from "@selldone/core-js/helper/shop/ShopOptionsHelper";
import UTextValueDashed from "@selldone/components-vue/ui/text/value-dashed/UTextValueDashed.vue";
import { StorefrontLocalStorages } from "@selldone/core-js/helper/local-storage/StorefrontLocalStorages";
import SShopShareOrderButton from "@selldone/components-vue/storefront/order/share-order/SShopShareOrderButton.vue";
import SShopBillingAddressForm from "@selldone/components-vue/storefront/order/billing/SShopBillingAddressForm.vue";
import BillingPeriod from "@selldone/core-js/enums/subscription/BillingPeriod";
import SShopConnectShippingOptions from "@selldone/components-vue/storefront/order/shipping/connect/SShopConnectShippingOptions.vue";
import { ETA } from "@selldone/core-js/enums/logistic/ETA";
import { ShadeColor } from "@selldone/core-js/helper/color/ColorGenerator";
import { throttle } from "lodash-es";
import UPaymentStripeSplit from "@selldone/components-vue/ui/payment/stripe/split/UPaymentStripeSplit.vue";
import { BasketHelper } from "@selldone/core-js/helper/shop/BasketHelper";
import SOrderShippingVendorsOptions from "@selldone/components-vue/storefront/order/shipping/vendor/SOrderShippingVendorsOptions.vue";
import SOrderShippingStoresOptions from "@selldone/components-vue/storefront/order/shipping/store/SOrderShippingStoresOptions.vue";
import ULoadingEllipsis from "@selldone/components-vue/ui/loading/ellipsis/ULoadingEllipsis.vue";
import { Basket } from "@selldone/core-js/models";
import TemplateMixin from "@selldone/components-vue/mixin/template/TemplateMixin.ts";
import CurrencyMixin from "@selldone/components-vue/mixin/currency/CurrencyMixin.ts";
import ProductMixin from "@selldone/components-vue/mixin/product/ProductMixin.ts";
import MapMixin from "@selldone/components-vue/mixin/map/MapMixin.ts";
import AuthMixin from "@selldone/components-vue/mixin/auth/AuthMixin.ts";
import ClubMixin from "@selldone/components-vue/mixin/club/ClubMixin.ts";
import DateMixin from "@selldone/components-vue/mixin/date/DateMixin.ts";
import SOrderCheckoutForm from "@selldone/components-vue/storefront/order/checkout/SOrderCheckoutForm.vue";
import { WeekDays } from "@selldone/core-js/enums/logistic/WeekDays";
import { TimeSpans } from "@selldone/core-js/enums/logistic/TimeSpans";
import KalioCartLines from "../../../components/kalio/checkout/KalioCartLines.vue";
import KalioOftenAdded from "../../../components/kalio/KalioOftenAdded.vue";
import KalioAddressSheet from "../../../components/kalio/checkout/KalioAddressSheet.vue";
import { formatDate, t } from "../../../components/kalio/i18n/kalio-i18n";
import LyCart from "../../../components/ly/buy/ly-cart";
import LyIcon from "../../../components/ly/LyIcon.vue";
import LyLineQb from "../../../components/ly/buy/LyLineQb.vue";
import LyPt from "../../../components/ly/ui/LyPt.vue";
import LyEmpty from "../../../components/ly/ui/LyEmpty.vue";
import LyCard from "../../../components/ly/ui/LyCard.vue";
import LyModal from "../../../components/ly/ui/LyModal.vue";
import LyShipSheet from "../../../components/ly/buy/LyShipSheet.vue";
import LyNumeral from "../../../components/ly/ui/LyNumeral.vue";

export default {
  name: "StorefrontPageBasketCart",
  mixins: [
    TemplateMixin,
    CurrencyMixin,
    ProductMixin,
    MapMixin,
    AuthMixin,
    ClubMixin,
    DateMixin,
    LyCart,
  ],

  components: {
    LyIcon,
    LyLineQb,
    LyPt,
    LyEmpty,
    LyCard,
    LyModal,
    LyShipSheet,
    LyNumeral,
    KalioCartLines,
    KalioOftenAdded,
    KalioAddressSheet,
    SOrderCheckoutForm,
    ULoadingEllipsis,
    SOrderShippingStoresOptions,
    SOrderShippingVendorsOptions,
    UPaymentStripeSplit,

    SShopConnectShippingOptions,
    SShopBillingAddressForm,
    SShopShareOrderButton,

    VariantItemMini,
    SStorefrontLotteryPrizesList,
    SStorefrontCouponsList,
    SDiscountCodeInput,
  },

  inject: ["$shop"],
  /**
   * ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
   *  🔷 Props
   * ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
   */
  props: {},
  /**
   * ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
   *  🔷 Data
   * ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
   */
  data: () => ({
    ETA: ETA,

    types: ProductType,
    type: ProductType.PHYSICAL.code,

    center: null, //{ lat: 40.943397271692135, lng: -73.83711692458752 },

    map_dialog: false,
    dialog_pre: false,

    delivery_info: {},

    startup_mode_map_dialog: "default",

    //-------------- Lottery Prize ---------------
    lottery_win_selected_variant: null,

    show_package_info: false,

    //-------------- Billing Info -------------
    busy_bill: false,

    same_billing: true,

    billing: null,

    busy_save: false,

    guest_email: null,

    form: null,
    //-------------- Billing Info -------------

    refreshing_price: false,

    //-------------- Service -------------
    busy_submit: false,

    //-------------- Dynamic buttons -------------
    intersect_location_btn: false,
    intersect_payment_btn: false,

    //-------------- Kalio -------------
    address_sheet: false,
    guest_email_touched: false,
  }),
  /**
   * ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
   *  🔷 Computed
   * ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
   */
  computed: {
    receiver_info() {
      return this.basket?.receiver_info || null; // Kalio: no basket yet (a guest with nothing in it)
    },
    theme() {
      return this.$shop.theme;
    },
    busy_shop() {
      return this.$store.getters.getBusyShop;
    },

    isSubscription() {
      return this.type === ProductType.SUBSCRIPTION.code;
    },

    checkout() {
      return ShopOptionsHelper.GetCheckout(this.$shop);
    },
    no_map() {
      return !ShopOptionsHelper.HasMap(this.$shop);
    },

    size_unit() {
      return ShopOptionsHelper.GetSizeUnit(this.$shop);
    },

    mass_unit() {
      return ShopOptionsHelper.GetMassUnit(this.$shop);
    },

    light_checkout() {
      return this.$shop.theme?.light_checkout;
    },
    //-------------- Lottery Prize ---------------
    prize() {
      if (!this.basket) return null;
      return this.basket?.lottery;
    },

    //-------------- Discount Code ---------------
    discount_code() {
      return this.basket?.discount_code;
    },

    basket() {
      return this.getBasket(this.type) as Basket;
    },

    bill() {
      return this.basket ? (this.basket.bill as Basket.ICalculatedBill) : null;
    },
    can_pay() {
      return this.bill?.can_pay; // IMPORTANT! If for any reason user can not pay this order then it should be false!
    },

    isPhysical() {
      return this.type === ProductType.PHYSICAL.code;
    },
    isVirtual() {
      return this.type === ProductType.VIRTUAL.code;
    },
    isFile() {
      return this.type === ProductType.FILE.code;
    },
    isService() {
      return this.type === ProductType.SERVICE.code;
    },
    is_service_need_pricing() {
      /**
       * It needs pricing by the seller after checkout.
       */
      return BasketHelper.IsServiceAndNeedPricing(this.basket);
    },

    wallet() {
      return this.bill.wallet;
    },

    net_price() {
      return this.bill.price - (this.bill.tax_included ? this.bill.tax : 0);
    },

    final_price() {
      return this.bill && this.bill.sum;
    },

    filtered_types() {
      return Object.values(ProductType).filter((type) => {
        return this.getCount(type.code);
      });
    },

    raw_items_price() {
      return this.bill ? this.bill.items_price : 0;
    },

    //-------------- Coupon ---------------
    coupon() {
      return this.basket?.coupon;
    },
    discount_code_amount() {
      return this.bill ? this.bill.discount_code : 0;
    },

    customer_club_discount() {
      return this.bill ? this.bill.club : 0;
    },

    coupon_discount() {
      return this.bill ? this.bill.coupon : 0;
    },

    prize_discount() {
      return this.bill ? this.bill.lottery : 0;
    },

    /**
     * It determines delivery and product type support COD or not!
     */
    deliverySupportCOD() {
      return this.bill?.can_cod; // Only for physical and service!
    },

    can_pay_cod() {
      return (
        this.deliverySupportCOD &&
        this.$shop.gateways?.some(
          (gateway) => gateway.currency === this.basket.currency && gateway.cod,
        )
      );
    },

    shipping_cost() {
      return this.bill ? this.bill.delivery_price : 0;
    },
    has_custom_delivery() {
      // True when at least one item deliver by this shop (Not selldone drop-shipping or connect)
      return this.bill && this.bill.has_custom_delivery;
    },
    extra_shipping_counts() {
      // Number of shops drop shop (Main sellers)
      return this.bill && this.bill.extra_shipping_counts;
    },

    items() {
      if (!this.basket || !this.basket.items) return [];
      return this.basket?.items || [];
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

    total_price() {
      return this.bill ? this.bill.items_price : 0;
    },

    total_price_after_offer() {
      return this.total_price - this.total_offers_amount;
    },

    total_price_with_delivery() {
      let total = this.total_price_after_offer;
      if (this.shipping_cost > 0) total += this.shipping_cost;
      return total;
    },
    total_price_with_delivery_and_discount() {
      return this.total_price_with_delivery - this.discount_code_amount;
    },

    total_items_discount() {
      return this.bill ? this.bill.items_discount : 0;
    },

    cross_selling_discount() {
      return this.bill ? this.bill.cross_selling_discount : 0;
    },

    total_offers_amount() {
      return this.bill ? this.bill.offer : 0;
    },

    basketTypeCanCOD() {
      return this.type === ProductType.PHYSICAL.code;
    },

    canPayAndComplete() {
      if (this.isPhysical || this.isService || this.isSubscription) {
        if (!this.has_delivery) return true; // Seller select do not ask for shipping address.

        return (
          this.receiver_info &&
          this.receiver_info.address &&
          this.receiver_info.phone &&
          this.is_valid_location
        );
      } else if (this.isVirtual) {
        return true;
      } else if (this.isFile) {
        return true;
      }

      return false;
    },

    hasErrorInReceiverInfo() {
      if (this.isPhysical && this.has_delivery) {
        return (
          this.receiver_info &&
          this.receiver_info.address &&
          (!this.receiver_info.phone || !this.is_valid_location)
        );
      }
      return false;
    },

    has_delivery() {
      return ShopOptionsHelper.AskShippingAddress(this.$shop, this.type);
    },

    showCustomDeliveryTimeButton() {
      return (
        this.has_delivery &&
        this.receiver_info &&
        this.receiver_info.address &&
        this.is_valid_location
      );
    },

    error_message_payment() {
      if (this.isPhysical && this.has_delivery) {
        if (this.receiver_info) {
          if (!this.receiver_info.address)
            return this.$t("basket_page.errors.no_address");
          if (!this.receiver_info.phone)
            return this.$t("basket_page.errors.no_phone");
        }
      }

      return null;
    },

    is_valid_location() {
      if (this.no_map) return !!this.receiver_info.address; // Only enter address!
      return (
        this.receiver_info.location &&
        !!this.receiver_info.location.lat &&
        !!this.receiver_info.location.lng
      );
    },

    // ---------- Lottery --------
    prize_available_variants() {
      if (!this.prize || !this.prize || !this.prize.product) return [];
      return this.prize.variant
        ? [this.prize.variant]
        : this.prize.product.product_variants;
    },

    club() {
      return this.getClub();
    },

    // ▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅ Address Button (SHipping or Billing) ▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅

    vendor_shipping_options() {
      return this.bill?.vendor_shipping_options;
    },
    store_shipping_options() {
      return this.bill?.store_shipping_options;
    },
    connect_shipping_options() {
      return this.bill?.connect_shipping_options;
    },
    /**
     * Check here all shipping methods are pickup!?
     */
    all_is_pickup() {
      if (
        !this.delivery_info ||
        this.connect_shipping_options
          ?.length /*In connect shipping mode always we ask shipping address*/
      )
        return false;

      if (this.vendor_shipping_options?.length) {
        return this.delivery_info.vendor_shippings.every(
          (vendor_shipping) =>
            vendor_shipping.type == ShopTransportations.Pickup.code,
        );
      }
      if (this.store_shipping_options?.length) {
        return (
          this.delivery_info.delivery_type == ShopTransportations.Pickup.code
        );
      }
      return false;
    },

    // ▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅ 🎗️ Subscription ▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅
    subscription_prices() {
      return this.items.map((item) => item.subscription_price);
    },
    subscription_period() {
      return (
        this.subscription_prices.length && this.subscription_prices[0].period
      );
    },
    subscription_period_obj() {
      return (
        this.subscription_period && BillingPeriod[this.subscription_period]
      );
    },

    // ▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅ Checkout Flow ▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅
    user() {
      return this.USER();
    },
    busy_user() {
      return this.$store.getters.getBusyUser;
    },
    has_guest_payment() {
      return ShopOptionsHelper.HasGuestPayment(this.$shop);
    },
    enter_guest_email_error(){
      return   !this.user &&  this.has_guest_payment && !this.guest_email // Guest email is required!
    },

    // ▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅ Kalio ▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅
    /** How many things are in the basket (2 breads are 2). */
    units() {
      return this.items.reduce((sum, item) => sum + (item.count || 0), 0);
    },
    seller_count() {
      return new Set(this.items.map((item) => item.vendor_id || 0)).size;
    },
    /** Everything the shopper saves, for the receipt's pill. */
    saved_total() {
      return (
        (this.total_items_discount || 0) +
        (this.total_offers_amount || 0) +
        (this.cross_selling_discount > 0 ? this.cross_selling_discount : 0) +
        (this.discount_code_amount > 0 ? this.discount_code_amount : 0) +
        (this.customer_club_discount > 0 ? this.customer_club_discount : 0) +
        (this.coupon ? this.coupon_discount || 0 : 0) +
        (this.prize ? this.prize_discount || 0 : 0)
      );
    },
    address_line() {
      const info = this.receiver_info;
      if (!info) return "";
      return [
        info.address,
        info.no && t("basket.where.no", "No. {no}", { no: String(info.no) }),
        info.unit && t("basket.where.unit", "Unit {unit}", { unit: String(info.unit) }),
      ]
        .filter(Boolean)
        .join(", ");
    },
    /** "You save {amount}": the words before and after the price the
     *  template draws, so a language can put the amount where it reads. */
    save_words() {
      const text = t("basket.receipt.youSaveAmount", "You save {amount}");
      const at = text.indexOf("{amount}");
      return at < 0 ? [text + " ", ""] : [text.slice(0, at), text.slice(at + "{amount}".length)];
    },
    /** Every way the shop has to send this basket (shipping methods, pickup
     *  points), from the bill. */
    transportation_list() {
      const out = [];
      for (const option of this.store_shipping_options || []) out.push(...(option.transportations || []));
      for (const option of this.vendor_shipping_options || []) out.push(...(option.transportations || []));
      return out;
    },
    /** The Delivery method card shows when there is something to choose: a shipping
     *  method, a pickup point, or a delivery service. */
    show_when() {
      if (!this.has_delivery || this.isService || !this.bill) return false;
      if (this.connect_shipping_options?.length) return true;
      return this.transportation_list.some(
        (t) => t.type !== ShopTransportations.Pickup.code || t.pickups?.length,
      );
    },
    transportation_now() {
      const type = this.delivery_info?.type;
      return type ? this.transportation_list.find((t) => t.type === type) : null;
    },
    when_chip() {
      const info = this.delivery_info || {};
      const parts = [];
      if (info.date) {
        parts.push(formatDate(info.date, { weekday: "short", month: "short", day: "numeric" }));
      } else if (info.custom && info.days?.length && info.days.length < 7) {
        parts.push(info.days.map((day) => (WeekDays[day] ? this.$t(WeekDays[day].name).slice(0, 3) : day)).join(", "));
      }
      if (info.custom && info.time_spans?.length && info.time_spans.length < (this.transportation_now?.time_spans?.length || 99)) {
        parts.push(info.time_spans.map((span) => (TimeSpans[span] ? this.$t(TimeSpans[span].name) : span)).join(", "));
      }
      if (!parts.length && this.transportation_now && this.transportation_now.type !== ShopTransportations.Pickup.code)
        parts.push(t("shipping.anyTime", "Any time"));
      return parts.join(" · ");
    },
    when_text() {
      const way = this.transportation_now;
      if (!way) return t("basket.delivery.chooseHow", "Choose how it reaches you.");
      const name = this.transportationName(way);
      if (way.type === ShopTransportations.Pickup.code) {
        const place = this.receiver_info?.title || this.receiver_info?.name || this.receiver_info?.address;
        return place ? t("basket.delivery.pickupFrom", "Pickup from {place}.", { place }) : t("basket.delivery.method", "{name}.", { name });
      }
      return this.shipping_cost === 0 ? t("basket.delivery.methodFree", "{name}, free.", { name }) : t("basket.delivery.method", "{name}.", { name });
    },
    /* Walio: the four steps over the checkout. */
    steps() {
      const delivery = !this.has_delivery || this.isService || (this.is_valid_location && !this.error_message_payment);
      const contact = !!this.user || (this.has_guest_payment && !!this.guest_email && this.guest_email_ok);
      const list = [
        { key: "cart", label: "Basket", done: true },
        { key: "delivery", label: "Delivery", done: delivery },
        { key: "contact", label: "Contact", done: contact },
        { key: "pay", label: "Review & pay", done: false },
      ];
      const now = list.findIndex((s) => !s.done);
      return list.map((s, i) => ({ ...s, state: s.done ? "-done" : i === now ? "-now" : "" }));
    },
    detail_cards() {
      return (this.show_when ? 1 : 0) + (this.has_delivery ? 1 : 0) + 1;
    },
    guest_email_ok() {
      return !this.guest_email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.guest_email);
    },
    /** The ways to pay this basket: the shop's gateways in its currency
     *  (cash on delivery only when the delivery allows it), as Selldone's
     *  payment window lists them. null when the shop did not say. */
    payment_ways() {
      const gateways = this.$shop?.gateways;
      if (!Array.isArray(gateways)) return null;
      const currency = this.basket?.currency;
      return gateways.filter(
        (g) => g.enable !== false && (!currency || g.currency === currency) && (this.deliverySupportCOD || !g.cod),
      );
    },
    /** What still stands between the shopper and paying, in a line. */
    pay_blocker() {
      if (!this.user && !this.has_guest_payment) return t("basket.who.signInToOrder", "Sign in to place the order.");
      if (this.has_delivery && !this.is_valid_location) return t("basket.pay.needAddress", "Add your address to pay.");
      if (this.error_message_payment) return this.error_message_payment;
      if (this.enter_guest_email_error) return t("basket.pay.needEmail", "Add your email to pay.");
      if (!this.guest_email_ok) return t("basket.pay.checkEmail", "Check your email address.");
      if (this.bill && !this.can_pay) return t("basket.pay.cannotPay", "This bag cannot be paid yet.");
      if (
        this.payment_ways &&
        !this.payment_ways.length &&
        this.final_price > 0 &&
        !this.is_service_need_pricing &&
        !this.isSubscription
      )
        return t("basket.pay.noGateways", "This shop is not taking payments yet. Please check back soon.");
      return null;
    },
    can_press_pay() {
      return !this.pay_blocker && this.canPayAndComplete;
    },
    pay_label() {
      if (this.is_service_need_pricing) return this.$t("basket_page.pre_confirm_service");
      if (!this.user && !this.has_guest_payment) return t("common.signIn", "Sign in");
      if (this.has_delivery && !this.is_valid_location) return t("basket.addAddress", "Add your address");
      return t("basket.pay.label", "Pay");
    },
    pay_label_short() {
      return this.is_service_need_pricing ? this.$t("basket_page.pre_confirm_service") : this.pay_label;
    },
  },

  /**
   * ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
   *  🔷 Watch
   * ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
   */

  watch: {
    /* The tab names the stage: "Your bag", then "Checkout" (not "Open bag"). */
    nx_stage: {
      handler(stage) {
        this.setPageTitle(stage === "checkout" ? t("bakini.n.co.pageTitle", "Checkout") : t("basket.pageTitle", "Your bag"));
      },
      immediate: true,
    },
    map_dialog(val) {
      this.$store.commit("setForceHideNavigation", val);
    },
    address_sheet(val) {
      this.$store.commit("setForceHideNavigation", val);
    },

    prize(prize) {
      this.lottery_win_selected_variant =
        prize &&
        this.prize_available_variants &&
        this.prize_available_variants.length
          ? this.prize_available_variants[0]
          : null;
    },

    type(type) {
      if (type !== this.$route.params.type)
        this.$router.replace({ params: { type: type } });
    },
    "$route.params"(params) {
      this.resetToDefault(); // 🞇 Reset to default
      this.type = params.type;
    },

    //------------- Customer previous auto save -----------

    basket(basket) {
      //  console.log("Debug basket",'Change basket!',basket)
      this.loadFromBasket();
    },
  },
  /**
   * ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
   *  🔷 Component Lifecycle Section
   * ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
   */
  created() {
    //  console.log("Debug basket",'Create basket page.')
    this.center = this.$store.getters.getInitialLocation;

    this.type = this.$route.params.type;


    GtagEcommerce.MeasuringCheckoutSteps(this.basket, 0, "");

    this.loadFromBasket();
  },
  beforeUnmount() {
    if (this.nx_dl_esc) document.removeEventListener("keydown", this.nx_dl_esc);
  },
  mounted() {
    if (
      ShopOptionsHelper.HasMap(this.$shop) &&
      (!this.basket ||
        !this.basket.receiver_info ||
        !this.basket.receiver_info.location)
    )
      try {
        navigator.geolocation.getCurrentPosition((position, error) => {
          if (error) {
            console.error("Get current location", error);
            return;
          }

          if (this.basket?.receiver_info?.location) return; // Prevent lagged update location bug!
          //const userCoordinates = [position.coords.longitude, position.coords.latitude];
          this.center = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
        });
      } catch (e) {
        console.error(e);
      }
  },

  /**
   * ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
   *  🔷 Methods Section
   * ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
   */
  methods: {
    ShadeColor,

    // ▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅ Kalio ▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅
    transportationName(transportation) {
      return transportation.title || this.$t(ShopTransportations[transportation.type]?.name || transportation.type);
    },
    openAddress() {
      this.address_sheet = true;
    },
    onGuestEmail() {
      this.guest_email_touched = true;
      if (this.guest_email_ok) this.setBasketConfig();
    },
    /* Pay, or take the shopper to what is still missing. */
    onPay() {
      if (!this.user && !this.has_guest_payment) return this.NeedLogin();
      if (this.has_delivery && !this.is_valid_location) return this.openAddress();
      if (this.error_message_payment) return this.openAddress();
      if (this.enter_guest_email_error || !this.guest_email_ok) {
        this.guest_email_touched = true;
        const input = this.$el?.querySelector?.(".k-cart__input");
        input?.scrollIntoView({ behavior: "smooth", block: "center" });
        input?.focus({ preventScroll: true });
        return;
      }
      if (!this.canPayAndComplete || this.pay_blocker) {
        // Nothing to fill in: show the receipt's reason (out of view on a phone).
        this.$el?.querySelector?.(".k-cart__pay")?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      if (this.is_service_need_pricing) return this.submitServiceOrder();
      this.goToPaymentBasket(null);
    },
    selectLottery(lottery) {
      // console.log("---selectLottery---", lottery);
      this.basket.lottery = lottery;
      this.$store.dispatch("setBasket", this.basket);
    },

    selectCoupon(coupon) {
      // console.log("---selectCoupon---", coupon);
      this.basket.coupon = coupon;
      this.$store.dispatch("setBasket", this.basket);
    },
    selectDiscountCode(discount_code) {
      // console.log("---selectDiscountCode---", discount_code);
      this.basket.discount_code = discount_code;
      this.$store.dispatch("setBasket", this.basket);
    },

    loadFromBasket() {
      if (!this.basket) return;

      //  console.log("watch ===> basket : Load saved values");

      // Prevent critical values be null:
      if (
        !this.basket.delivery_info ||
        Array.isArray(this.basket.delivery_info)
      )
        this.basket.delivery_info = {};
      if (
        !this.basket.receiver_info ||
        Array.isArray(this.basket.receiver_info)
      )
        this.basket.receiver_info = {};
      if (!this.basket.billing || Array.isArray(this.basket.billing))
        this.basket.billing = {};

      // this.receiver_info = Object.assign({}, this.basket.receiver_info); // Local Clone

      this.delivery_info = Object.assign({}, this.basket.delivery_info); // Local Clone

      this.billing = this.basket.billing;

      // Set map center:
      if (this.basket.delivery_info && this.basket.receiver_info.location) {
        //console.log("load-center-map", this.basket.receiver_info.location);
        this.center = {
          lat: this.basket.receiver_info.location.lat,
          lng: this.basket.receiver_info.location.lng,
        };
      }

      this.form = Object.assign({}, this.basket.form);

      this.guest_email=this.basket.guest_email;


      if (!this.bill) {
        // Fetch if not loaded!
        this.fetchBill();
      }
    },
    //---------------------------- Get Calculated Bill --------------------
    fetchBill() {
      // console.log("watch ===> basket : fetchBill");

      this.busy_bill = true;

      axios
        .get(window.XAPI.GET_BASKET_BILL(this.$shop.name, this.type))
        .then(({ data }) => {
          if (!data.error) {
            this.setBasketBill(this.basket, data.bill);
          } else {
            NotificationService.showErrorAlert(null, data.error_msg);
          }
        })
        .catch((error) => {
          NotificationService.showLaravelError(error);
        })
        .finally(() => {
          this.busy_bill = false;
        });
    },
    //---------------------------- Update customer info set --------------------

    setBasketConfig() {
      this.PENDING_UPDATE = true;
      /* (19 Nov 2026, as Galio 1.0.7) the bill is not settled while an update waits for the throttle or is on its
         way. The answer to an update is dropped when a newer one waits (below), so without this the receipt and
         Place order kept the old bill for up to ~4 s after a way change (shipping, then pickup: the shipping fee
         stayed on a pickup order). */
      this.busy_save = true;
      this.setBasketConfigThrottle();
    },
    setBasketConfigThrottle: throttle(
      function setBasketConfig() {
        this.PENDING_UPDATE = false;
        this.ly_inflight = (this.ly_inflight || 0) + 1;

        this.busy_save = true;
        //console.log("🧨 setBasketConfig");

        axios
          .put(
            window.XAPI.PUT_SET_BASKET_CONFIG(this.$shop.name, this.basket.id),
            {
              // currency:this.GetUserSelectedCurrency().code, // Not important! currency set in change currency api call! Guest + User
              receiver_info: this.receiver_info,
              delivery_info: this.delivery_info,
              billing: this.billing,
              form: this.form,
              guest_email: this.guest_email,
            },
          )
          .then(({ data }) => {
            if (!data.error) {
              if (this.PENDING_UPDATE) {
                console.log(
                  "⏳ Not update local basket because of pending update!",
                );
                return; // Update only on last function call to prevent jump back basket changes!
              }
              console.log("✅ Local cart updated.");

              // ➔ Update tax in basket (Only these items changed!)
              this.setBasketBill(this.basket, data.bill);

              // ➔ Update user delivery info:
              this.basket.receiver_info = data.receiver_info;
              this.basket.delivery_info = data.delivery_info;
              this.basket.billing = this.isObject(data.billing)
                ? data.billing
                : {}; // Solve return array!

              this.basket.form = data.form;

              this.basket.guest_email=data.guest_email
            } else {
              NotificationService.showErrorAlert(null, data.error_msg);
            }
          })
          .catch((error) => {
            NotificationService.showLaravelError(error);
          })
          .finally(() => {
            this.ly_inflight = Math.max(0, (this.ly_inflight || 0) - 1);
            /* settled only when no update waits and none is on its way */
            if (!this.PENDING_UPDATE && !this.ly_inflight) this.busy_save = false;
          });
      },
      3000,
      {
        leading: true, // Call immediately on the first call
        trailing: true, // Optional: Set to false if you don't want it called after the wait period
      },
    ),

    getCount(type) {
      let basket = this.getBasket(type);
      return basket && basket.items ? basket.items.length : 0;
    },

    getShopTransportationObject(type) {
      return ShopTransportations[type];
    },

    onClickSetLocation(info) {
      if (!info.phone) info.phone = this.USER() ? this.USER().phone : null; // Autofill phone!

      this.basket.receiver_info = info;
      this.map_dialog = false;
      this.address_sheet = false;

      this.setBasketConfig();

      GtagEcommerce.MeasuringCheckoutSteps(this.basket, 1, "");
    },

    showMap() {
      this.dialog_pre = false;
      this.$nextTick(() => {
        this.dialog_pre = true;
        this.$nextTick(() => {
          this.map_dialog = true;
        });
      });
    },

    //―――――――――――――――――――――― Final Step > Go to payment (Physical, Virtual, File) ――――――――――――――――――――

    goToPaymentBasket(gateway) {
      //―――――― 🎗️ Subscription ――――――
      // The payment process for subscription is different! We send permitted gateways from the backend.
      if (this.isSubscription) {
        if (!this.USER()) {
          // Force to log in for subscription.
          this.NeedLogin();
          return;
        }

        // Get list of gateways from subscription_price:
        const gateway_codes = this.items
          .map((item) => item.subscription_price?.gateway_code)
          .filter((g) => !!g)
          .unique();

        //  console.log('gateway_codes,',gateway_codes)

        this.ShowPaymentDialogSubscription(
          this.basket.currency,
          this.basket,
          this.bill,
          gateway_codes,
          /*Used for in site payment flow & free orders!*/
          (data) => {
            if (!this._isDestroyed)
              this.goToOrderInfo(this.type, data.target_id);
          },
        );
        return;
      }

      if (
        !this.USER() &&
        !ShopOptionsHelper.HasGuestPayment(this.getShop()) /*🥶 Guest*/
      ) {
        this.NeedLogin();
        return;
      }

      console.log(
        "🧨 goToPaymentBasket | Selected Gayteway: ",
        gateway,
        "Can COD: ",
        this.deliverySupportCOD,
      );
      /* Kalio (8 November 2026): a guest's order is bound to the device's
         guest code at the moment of buying, and Selldone's payment window
         saves that code for the order (so the order page opens it after the
         code rotates). It saves basket.code, which Selldone no longer sends
         with a guest's cart: nothing was saved, and a guest who had just
         ordered read "We can't open this order" (the owner's buyer test).
         Pass the device's guest code when the basket has none. */
      this.ShowPaymentDialogBasket(
        this.basket.code || (!this.USER() ? StorefrontLocalStorages.GetShopGuestCode() : undefined) /*🥶 Guest*/,
        this.basket,
        this.type,
        this.bill,
        this.lottery_win_selected_variant
          ? this.lottery_win_selected_variant.id
          : null,
        gateway,
        this.deliverySupportCOD,
        /*Used for in site payment flow & free orders!*/
        (data) => {
          if (!this._isDestroyed) this.goToOrderInfo(this.type, data.target_id);
        },
      );

      GtagEcommerce.MeasuringCheckoutSteps(this.basket, 2, gateway);
    },
    //―――――――――――――――――――――― Final Step > Submit service order (No payment here) (Service) ――――――――――――――――――――

    submitServiceOrder() {
      this.busy_submit = true;

      axios
        .post(
          window.XAPI.POST_SUBMIT_SERVICE_BASKET(this.$shop.name, this.type),
          {
            currency: this.GetUserSelectedCurrency().code,
            selected_variant_id: this.lottery_win_selected_variant
              ? this.lottery_win_selected_variant.id
              : null,

            code: this.basket.code /*🥶 Guest*/,
          },
        )
        .then(({ data }) => {
          if (!data.error) {
            // ▀▀▀▀▀▀▀▀▀ 🥶 Guest ▀▀▀▀▀▀▀▀▀
            if (!this.USER()) {
              // Save array of guest codes in local storage:
              StorefrontLocalStorages.AddCurrentGuestCodeToHistory(
                this.type,
                data.basket_id,
                data.code,
              );
            }

            this.fetchBasketAndShop();
            NotificationService.showSuccessAlert(
              t("basket.toast.submittedTitle", "Order submitted"),
              t("basket.toast.submittedText", "Your order has been submitted successfully. We will send bill to you."),
            );
            this.$router.push({
              name: "MyServiceOrderInfoPage",
              params: { basket_id: data.basket_id },
            });
          } else {
            NotificationService.showErrorAlert(null, data.error_msg);
          }
        })
        .catch((error) => {
          NotificationService.showLaravelError(error);
        })
        .finally(() => {
          this.busy_submit = false;
        });
    },
  },
};
</script>
