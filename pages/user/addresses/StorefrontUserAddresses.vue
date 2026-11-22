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
  The address book (design/addresses-b.html): "Address
  book" with "Add an address", then each saved address as the mockup's row
  (the pin, its name — or who receives it — the address on one line, the
  phone; Edit and Remove, Remove asks once in the row). No address yet: the
  mockup's empty card. Add and Edit open the address sheet (KalioAddressSheet,
  `titled`): the same fields as the checkout's, the map with its pin when
  the shop uses maps ("Find on the map"), typed in when it does not; saved
  in one step. Selldone keeps no "default" address, so none is marked.
-->
<template>
  <div class="acc-p ly-abook">
    <div class="ab-hd">
      <h2 class="h3x">{{ t("ly.acc.book", "Address book") }}</h2>
      <button class="btn sm soft" type="button" @click="showAdd"><ly-icon name="plus" />{{ t("ly.acc.addAddress", "Add an address") }}</button>
    </div>
    <div v-if="busy && !loaded" :aria-label="t('ly.acc.loadingBook', 'Loading your addresses')" class="ly-od-load" role="status"><span class="ly-od-sk -row"></span></div>
    <ul v-else class="abl">
      <li v-for="address in addresses" :key="address.id" class="ab">
        <span class="mc-ic"><ly-icon :name="iconOf(address)" /></span>
        <div class="ab-tx">
          <b>{{ address.title || address.name || t("ly.acc.address", "Address") }}</b>
          <p v-if="address.title && address.name">{{ address.name }}</p>
          <p>{{ linesOf(address).join(", ") }}</p>
          <p v-if="address.phone">{{ address.phone }}</p>
          <p v-if="address.message" class="ly-od-note">“{{ address.message }}”</p>
        </div>
        <div class="ab-a">
          <template v-if="confirming === address.id">
            <span class="ly-ab-ask">{{ t("ly.acc.deleteAsk", "Remove this address?") }}</span>
            <button :aria-disabled="busy_delete ? 'true' : undefined" class="qlink ly-danger" type="button" @click="busy_delete || remove(address)">{{ t("ly.acc.remove", "Remove") }}</button>
            <button class="qlink" type="button" @click="confirming = null">{{ t("ly.acc.keep", "Keep") }}</button>
          </template>
          <template v-else>
            <button class="qlink" type="button" @click="showEdit(address)"><ly-icon name="edit" />{{ t("ly.acc.edit", "Edit") }}</button>
            <button
              :aria-label="address.title ? t('ly.acc.removeNamed', 'Remove {name}', { name: address.title }) : t('ly.acc.removeThis', 'Remove this address')"
              class="qlink"
              type="button"
              @click="confirming = address.id"
            >
              <ly-icon name="trash" />{{ t("ly.acc.remove", "Remove") }}
            </button>
          </template>
        </div>
      </li>
      <li v-if="!addresses.length" class="ab-empty">
        <ly-empty :text="t('ly.acc.noAddressP', 'Add an address once and choose it at checkout next time.')" :title="t('ly.acc.noAddressT', 'No saved addresses')" icon="pin">
          <template #acts
            ><button class="btn" type="button" @click="showAdd"><ly-icon name="plus" />{{ t("ly.acc.addAddress", "Add an address") }}</button></template
          >
        </ly-empty>
      </li>
    </ul>

    <kalio-address-sheet
      v-model="sheet"
      :busy="busy_save"
      :center="center"
      :countries="$shop?.countries?.length ? $shop.countries : null"
      :heading="editing ? t('ly.acc.editAddress', 'Edit the address') : t('ly.acc.addAddress', 'Add an address')"
      :lede="noMap ? t('ly.acc.sameFieldsTyped', 'The same fields as checkout.') : t('ly.acc.sameFields', 'Find it on the map or type it in, as at checkout.')"
      :no-map="noMap"
      :phone-required="false"
      :receiver-info="editing"
      :saved-list="false"
      :title="editing?.title || ''"
      titled
      @save="onSave"
    />
  </div>
</template>

<script lang="ts">
import NotificationService from "@selldone/components-vue/plugins/notification/NotificationService.ts";

import { MapHelper } from "@selldone/core-js/helper";
import { ShopOptionsHelper } from "@selldone/core-js/helper/shop/ShopOptionsHelper";
import KalioAddressSheet from "@app-storefront/components/kalio/checkout/KalioAddressSheet.vue";
import { t } from "../../../components/kalio/i18n/kalio-i18n";
import LyIcon from "../../../components/ly/LyIcon.vue";
import LyEmpty from "../../../components/ly/ui/LyEmpty.vue";

/* The fields an address keeps (Selldone's address book). */
const FIELDS = ["country", "state", "state_code", "city", "address", "location", "no", "unit", "name", "phone", "message", "postal"];

export default {
  name: "StorefrontUserAddresses",
  components: { KalioAddressSheet, LyIcon, LyEmpty },
  inject: ["$shop"],

  data() {
    return {
      addresses: [],
      busy: false,
      loaded: false,

      sheet: false,
      editing: null,
      busy_save: false,

      confirming: null,
      busy_delete: false,
    };
  },

  computed: {
    noMap() {
      return !ShopOptionsHelper.HasMap(this.$shop);
    },
    /* Edit starts at the address; a new one at the last address saved. */
    center() {
      const at = (this.editing || this.addresses[0])?.location;
      return at?.lat ? { lat: at.lat, lng: at.lng } : null;
    },
  },

  created() {
    this.setPageTitle(t("account.pageTitle.addresses", "My address book")); // Set Page Title!
    this.fetchAddressBook();
  },

  methods: {
    t,
    /* The row's icon from the address's own name. */
    iconOf(address) {
      const title = (address.title || "").toLowerCase();
      if (/work|office|shop|store|studio/.test(title)) return "store";
      if (/home|house|flat|apartment/.test(title) || !title) return "home";
      return "pin";
    },
    /* The address in the mockup's lines: street and unit; city, state and
       postcode; the country. */
    linesOf(a) {
      const street = [[a.address, a.no].filter(Boolean).join(" "), a.unit].filter(Boolean).join(", ");
      const place = [a.city, [a.state_code || a.state, a.postal].filter(Boolean).join(" ")].filter(Boolean).join(", ");
      let country = a.country;
      try {
        country = a.country ? new Intl.DisplayNames([document.documentElement.lang || "en"], { type: "region" }).of(a.country) : "";
      } catch (e) {}
      return [street, place, country].filter(Boolean);
    },
    getFullAddress(address) {
      return MapHelper.GenerateFullAddressFromMapInfo(address);
    },

    /* The spot on a small map, with Kalio's green pin (Mapbox's static
       image, the token Selldone's page used). */
    mapOf(address) {
      const { lng, lat } = address.location;
      const pin = (getComputedStyle(document.documentElement).getPropertyValue("--bk-blue").trim() || "#a0522d").replace("#", ""); /* the theme's colour */
      return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+${pin}(${lng},${lat})/${lng},${lat},14,0,0/160x160@2x?access_token=pk.eyJ1IjoicGFqdWhhYW4iLCJhIjoiY2sxaHNtbnU3MDFjcjNta2V0OTZ0d2ExYiJ9.YKRh0EP7NnhbmuSil7AvSw`;
    },

    fetchAddressBook() {
      this.busy = true;
      window.axios
        .get(window.ADDRESS_API.GET_MY_ADDRESSES())
        .then(({ data }) => {
          if (data.error) return NotificationService.showErrorAlert(null, data.error_msg);
          this.addresses = data.addresses || [];
        })
        .catch((error) => NotificationService.showLaravelError(error))
        .finally(() => {
          this.busy = false;
          this.loaded = true;
        });
    },

    showAdd() {
      this.editing = null;
      this.confirming = null;
      this.sheet = true;
    },

    showEdit(address) {
      this.editing = address;
      this.confirming = null;
      this.sheet = true;
    },

    onSave(pack) {
      const body = { title: pack.title };
      for (const key of FIELDS) body[key] = pack[key] ?? null;
      const editing = this.editing;
      this.busy_save = true;
      (editing
        ? window.axios.put(window.ADDRESS_API.PUT_ADDRESS(editing.id), body)
        : window.axios.post(window.ADDRESS_API.POST_ADDRESS(), body)
      )
        .then(({ data }) => {
          if (data.error) return NotificationService.showErrorAlert(null, data.error_msg);
          NotificationService.showSuccessAlert(
            null,
            editing
              ? this.$t("global.map_view.notifications.edit_success", { title: data.address?.title || body.title })
              : this.$t("global.map_view.notifications.save_in_list"),
          );
          this.sheet = false;
          this.fetchAddressBook();
        })
        .catch((error) => NotificationService.showLaravelError(error))
        .finally(() => (this.busy_save = false));
    },

    remove(address) {
      this.busy_delete = true;
      window.axios
        .delete(window.ADDRESS_API.DELETE_MY_ADDRESSES(address.id))
        .then(({ data }) => {
          if (data.error) return NotificationService.showErrorAlert(null, data.error_msg);
          this.addresses = this.addresses.filter((it) => it.id !== address.id);
          this.confirming = null;
        })
        .catch((error) => NotificationService.showLaravelError(error))
        .finally(() => (this.busy_delete = false));
    },
  },
};
</script>
