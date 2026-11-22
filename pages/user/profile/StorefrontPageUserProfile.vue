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
  The profile (design/account-b.html, the Profile panel):
  the mockup's form — name, email, phone (optional) — and "Save changes",
  writing Selldone's customer profile for this shop; then three quiet lines:
  the shop's news by email (subscribe or not), the members' club when the
  shop has one, and leaving the shop (Selldone asks first).
-->
<template>
  <div v-if="USER()" class="acc-p ly-prof">
    <h2 class="h3x">{{ t("ly.acc.profile", "Profile") }}</h2>
    <form class="prof" novalidate @submit.prevent="save">
      <div class="g2">
        <div :class="['fld', { bad: bad.name }]">
          <label class="fl" for="pf-n">{{ t("ly.acc.name", "Name") }}</label>
          <input id="pf-n" v-model="form.name" autocomplete="name" class="inp" />
          <span class="err">{{ t("ly.acc.nameErr", "Add your name") }}</span>
        </div>
        <div :class="['fld', { bad: bad.email }]">
          <label class="fl" for="pf-e">{{ t("ly.acc.email", "Email") }}</label>
          <input id="pf-e" v-model="form.email" autocomplete="email" class="inp" type="email" />
          <span class="err">{{ t("ly.acc.emailErr", "Add a valid email") }}</span>
        </div>
        <div class="fld">
          <label class="fl" for="pf-p"
            >{{ t("ly.acc.phone", "Phone") }} <span class="opt-k">{{ t("ly.acc.optional", "(optional)") }}</span></label
          >
          <input id="pf-p" v-model="form.phone" autocomplete="tel" class="inp" type="tel" />
        </div>
      </div>
      <button :aria-disabled="busy_save ? 'true' : undefined" class="btn" type="submit">{{ saved ? t("ly.acc.savedOk", "Saved") : t("ly.acc.save", "Save changes") }}</button>
    </form>
    <div class="prof ly-prof-more">
      <ul class="ils sm">
        <li class="il">
          <span class="il-ic"><ly-icon name="mail" /></span>
          <div class="il-tx">
            <b>{{ isSubscribed ? t("ly.acc.newsOn", "You get the shop’s news by email") : t("ly.acc.newsOff", "No news by email") }}</b>
            <span class="ly-il-acts"
              ><button :aria-disabled="busy_subscribe ? 'true' : undefined" class="qlink" type="button" @click="busy_subscribe || toggleSubscribe()">
                {{ isSubscribed ? t("ly.acc.newsStop", "Stop the emails") : t("ly.acc.newsStart", "Get the news by email") }}
              </button></span
            >
          </div>
        </li>
        <li v-if="club" class="il">
          <span class="il-ic"><ly-icon name="gift" /></span>
          <div class="il-tx">
            <b>{{ $t(getCustomerClubLevel(club.level).name) }}</b>
            <span>{{ t("ly.acc.clubOff", "{n}% off as a member", { n: club.percent }) }}<template v-if="club.free_shipping">{{ " · " + t("ly.acc.clubFree", "free delivery") }}</template></span>
          </div>
        </li>
        <li class="il">
          <span class="il-ic"><ly-icon name="out" /></span>
          <div class="il-tx">
            <b>{{ t("ly.acc.leave", "Leave this shop") }}</b>
            <span>{{ t("ly.acc.leaveP", "Your account here and its details are removed. Your orders stay with the shop.") }}</span>
            <span class="ly-il-acts"
              ><button class="qlink ly-danger" type="button" @click="LeaveShop">{{ t("ly.acc.leaveGo", "Leave the shop") }}</button></span
            >
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { t } from "../../../components/kalio/i18n/kalio-i18n";
import NotificationService from "@selldone/components-vue/plugins/notification/NotificationService.ts";

import { SetupService } from "@selldone/core-js/server/SetupService";
import { MapHelper } from "@selldone/core-js";
import LyIcon from "../../../components/ly/LyIcon.vue";
import DateMixin from "@selldone/components-vue/mixin/date/DateMixin.ts";
import MapMixin from "@selldone/components-vue/mixin/map/MapMixin.ts";
import ClubMixin from "@selldone/components-vue/mixin/club/ClubMixin.ts";

export default {
  name: "StorefrontPageUserProfile",
  mixins: [DateMixin, MapMixin,ClubMixin],

  components: { LyIcon },
  inject: ["$shop"],
  props: {
    shop: {
      require: true,
    },
  },
  data: () => {
    return {
      MapHelper: MapHelper,

      busy_subscribe: false,
      busy_logout: false,

      clone_customer: null,
      dialog_profile: false,
      busy_save: false,
      saved: false,
      form: { name: "", email: "", phone: "" },
      bad: { name: false, email: false },
    };
  },
  computed: {
    isSubscribed() {
      return this.USER()?.subscribed;
    },

    kyc_url() {
      return SetupService.MainServiceUrl() + "/shuttle/kyc";
    },

    customer() {
      return this.USER().customer;
    },

    club() {
      return this.getClub();
    },
  },
  watch: {
    customer: {
      handler() {
        this.fill();
      },
      immediate: true,
    },
  },
  methods: {
    t,
    /* The form from Selldone's customer record (else the account's own). */
    fill() {
      const c = this.customer || {};
      const u = this.USER() || {};
      this.form = { name: c.name || u.name || "", email: c.email || u.email || "", phone: c.phone || u.phone || "" };
    },
    save() {
      const name = this.form.name.trim();
      const email = this.form.email.trim();
      this.bad = { name: !name, email: !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) };
      if (this.bad.name || this.bad.email || this.busy_save) return;
      this.clone_customer = { ...JSON.parse(JSON.stringify(this.customer || {})), name, email, phone: this.form.phone.trim() || null };
      this.saveProfile();
    },
    showEditProfile() {
      this.dialog_profile = true;
      this.clone_customer = JSON.parse(JSON.stringify(this.customer));
    },

    LeaveShop() {
      NotificationService.openDangerAlert(
        this.$t("user_profile.leave_dialog.title"),
        this.$t("user_profile.leave_dialog.message"),
        this.$t("user_profile.leave_dialog.action"),
        () => {
          axios
            .post(window.XAPI.POST_LEAVE_SHOP(this.$shop.name))
            .then(({ data }) => {
              if (!data.error) {
                NotificationService.showSuccessAlert(
                  null,
                  this.$t("user_profile.notifications.leave_success"),
                );
                this.LogoutProcess();
              } else {
                NotificationService.showErrorAlert(null, data.error_msg);
              }
            })
            .catch((error) => {
              NotificationService.showLaravelError(error);
            });
        },
      );
    },

    toggleSubscribe() {
      this.busy_subscribe = true;
      let subscribe = !this.isSubscribed;
      axios
        .post(window.XAPI.POST_SUBSCRIBE(this.$shop.name), {
          subscribe: subscribe,
        })
        .then(({ data }) => {
          if (!data.error) {
            this.USER().subscribed = data.subscribed;

            NotificationService.showSuccessAlert(
              null,
              subscribe
                ? t("account.profile.subscribed", "Subscribe successfully.")
                : t("account.profile.unsubscribed", "Unsubscribe successfully."),
            );
          } else {
            NotificationService.showErrorAlert(null, data.error_msg);
          }
        })
        .catch((error) => {
          NotificationService.showLaravelError(error);
        })
        .finally(() => {
          this.busy_subscribe = false;
        });
    },

    saveProfile() {
      this.busy_save = true;

      axios
        .post(
          window.XAPI.POST_SAVE_MY_CUSTOMER_PROFILE(this.$shop.name),
          this.clone_customer,
        )
        .then(({ data }) => {
          if (!data.error) {
            this.USER().customer = data.customer;
            this.dialog_profile = false;
            this.saved = true;
            setTimeout(() => (this.saved = false), 2000);

            NotificationService.showSuccessAlert(null, t("account.profile.saved", "My profile updated successfully."));
          } else {
            NotificationService.showErrorAlert(null, data.error_msg);
          }
        })
        .catch((error) => {
          NotificationService.showLaravelError(error);
        })
        .finally(() => {
          this.busy_save = false;
        });
    },

    showSelectLocation() {
      let center = { lat: 0, lng: 0 };
      if (this.clone_customer?.address?.location)
        center = this.clone_customer.address.location;

      this.showMap(
        center,
        null,
        this.clone_customer.address,
        (info) => {
          Object.assign(this.clone_customer.address, info);
          this.closeMap();
        },
        false,
      );
    },
  },
  created() {
    this.setPageTitle(t("account.pageTitle.profile", "My profile")); // Set Page Title!
  },
};
</script>

<style lang="scss" scoped>
.widget {
  min-height: 150px;
}
</style>
