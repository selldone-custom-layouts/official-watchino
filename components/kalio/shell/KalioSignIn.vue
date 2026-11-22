<!--
  The sign-in sheet (design/login-b.html, pages-buy.js
  loginSheet): a small modal ("Sign in", ✕), the wordmark (the shop's live
  title) and why; the shop's own social ways in (Google, Apple, GitHub,
  LinkedIn, as the shop has switched them on) as quiet pill buttons; "or
  with your email": the email field and "Send a one-time code", then the
  6-digit code in one field and "Verify and sign in" ("Use a different
  email" goes back); "Continue as guest" when the shop's checkout does not
  need an account. A centred card on a computer, a sheet from the bottom on
  a phone; ✕, Esc and a click outside close it. No "Login by Selldone" and
  no Selldone mark: Selldone's own account login appears as a way in only
  when it is the shop's single one.

  The sign-in itself is Selldone's: socials go through the storefront's
  LoginShop (its OAuth page), the email code through
  window.$storefront.auth.email (requestOtp / verifyOTP) and SetToken, as
  Selldone's SShopLogin does. A phone (SMS) login, when the shop uses it,
  is Selldone's own SShopLogin, placed under the ways in. The sheet opens on
  the app's "need-login" event, as Selldone's did.
-->
<template>
  <teleport to="body">
    <div :dir="rtl ? 'rtl' : 'ltr'" class="ly ly-layers ly-signin">
      <div :class="['scrim', { open: show }]" @click="close"></div>
      <div id="loginm" :class="['modal', 'small', 'loginm', { open: show }]" aria-labelledby="loginm-t" aria-modal="true" role="dialog" @keydown.esc.stop="close">
        <div ref="dlg" class="md-card" tabindex="-1">
          <div class="md-hd">
            <h2 id="loginm-t" class="md-t">{{ step === "done" ? t("ly.lg.doneT", "Signed in") : t("ly.lg.title", "Sign in") }}</h2>
            <button :aria-label="t('ly.modal.close', 'Close')" class="ibtn x" type="button" @click="close"><ly-icon name="close" /></button>
          </div>
          <div class="md-body">
            <div :data-step="step === 'code' ? 2 : 1" class="lg">
              <div aria-hidden="true" class="lg-wm ly-wm"><span class="wm-name">{{ shopWord }}</span><span v-if="shopCity" class="wm-sub">{{ shopCity }}</span></div>

              <template v-if="step !== 'done'">
                <p class="lg-p">{{ t("ly.lg.why", "Sign in to see your orders and saved addresses.") }}</p>

                <!-- 1. The ways in -->
                <div class="lg-1">
                  <ul v-if="socials.length" class="provs">
                    <li v-for="s in socials" :key="s.mode">
                      <button :aria-disabled="redirecting ? 'true' : undefined" class="prov" type="button" @click="redirecting || social(s.mode)">
                        <span class="prov-ic"><ly-icon :name="s.icon" /></span
                        ><span>{{ redirecting === s.mode ? t("ly.lg.opening", "Opening…") : t("ly.lg.continueWith", "Continue with {name}", { name: s.label }) }}</span>
                      </button>
                    </li>
                  </ul>
                  <template v-if="emailOn">
                    <p v-if="socials.length" class="or"><span>{{ t("ly.lg.or", "or with your email") }}</span></p>
                    <form class="lg-f" novalidate @submit.prevent="requestCode">
                      <div :class="['fld', { bad: !!emailErr }]">
                        <label class="fl" for="lg-m">{{ t("ly.lg.email", "Email") }}</label>
                        <input id="lg-m" ref="email" v-model.trim="email" autocomplete="email" class="inp" placeholder="you@example.com" type="email" />
                        <span class="err">{{ emailErr }}</span>
                      </div>
                      <button :aria-disabled="busy ? 'true' : undefined" class="btn block" type="submit">{{ busy ? t("ly.lg.sending", "Sending…") : t("ly.lg.send", "Send a one-time code") }}</button>
                    </form>
                  </template>
                  <s-shop-login v-if="smsOn" v-model:show="show" class="ly-lg-sms" />
                </div>

                <!-- 2. The code -->
                <div class="lg-2">
                  <p class="lg-sent">
                    {{ t("ly.lg.sent", "We sent a 6-digit code to") }} <b>{{ email }}</b>.
                  </p>
                  <form class="lg-f" novalidate @submit.prevent="verify">
                    <div :class="['fld', { bad: !!codeErr }]">
                      <label class="fl" for="lg-c">{{ t("ly.lg.code", "Code") }}</label>
                      <input
                        id="lg-c"
                        :ref="(el) => (boxes[0] = el)"
                        :value="digits.join('')"
                        autocomplete="one-time-code"
                        class="inp code"
                        dir="ltr"
                        inputmode="numeric"
                        maxlength="6"
                        placeholder="••••••"
                        @input="onCode"
                      />
                      <span class="err" role="alert">{{ codeErr }}</span>
                    </div>
                    <button :aria-disabled="busy ? 'true' : undefined" class="btn block" type="submit">{{ busy ? t("ly.lg.checking", "Checking…") : t("ly.lg.verify", "Verify and sign in") }}</button>
                  </form>
                  <div class="ly-il-acts">
                    <button class="qlink" type="button" @click="back"><ly-icon cls="flip-rtl" name="back" />{{ t("ly.lg.other", "Use a different email") }}</button>
                    <button :aria-disabled="busy ? 'true' : undefined" class="qlink" type="button" @click="busy || requestCode()">{{ t("ly.lg.resend", "Send a new code") }}</button>
                  </div>
                </div>

                <div v-if="guest" class="lg-guest">
                  <button class="btn quiet block" type="button" @click="close">{{ t("ly.lg.guest", "Continue as guest") }}</button>
                  <p>{{ t("ly.lg.guestNote", "Checkout does not need an account.") }}</p>
                </div>
                <p class="ly-lg-legal">
                  {{ t("ly.lg.legal", "By continuing you agree to the") }}
                  <router-link :to="{ name: routes.SHOP_PROFILE_PAGE_TERMS }" @click="close">{{ t("ly.lg.terms", "Terms") }}</router-link>
                  {{ t("ly.lg.and", "and") }}
                  <router-link :to="{ name: routes.SHOP_PROFILE_PAGE_PRIVACY }" @click="close">{{ t("ly.lg.privacy", "Privacy") }}</router-link>.
                </p>
              </template>

              <!-- 3. Signed in -->
              <div v-else class="ly-lg-done">
                <span class="em-ic"><ly-icon name="check" /></span>
                <p class="lg-p">{{ email ? t("ly.lg.as", "Signed in as {email}.", { email }) : t("ly.lg.in", "You’re signed in.") }}</p>
                <router-link :to="{ name: 'KalioAccountHome' }" class="btn block" @click="close">{{ t("ly.lg.account", "Go to your account") }}</router-link>
                <button class="btn quiet block" type="button" @click="close">{{ t("ly.lg.backShop", "Back to the shop") }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script>
import { throttle } from "lodash-es";
import SShopLogin from "@selldone/components-vue/storefront/login/SShopLogin.vue";
import { EventBus } from "@selldone/components-vue/utils/events/EventBus.ts";
import LyIcon from "../../ly/LyIcon.vue";
import { guestCheckout, shopFacts } from "../../ly/ly";
import { isRtl } from "../../region-switcher/region";
import { t } from "../i18n/kalio-i18n";

/* The social ways in this sheet draws, in the mockup's order. */
const SOCIAL = [
  { mode: "google", icon: "google", label: "Google" },
  { mode: "apple", icon: "apple", label: "Apple" },
  { mode: "github", icon: "github", label: "GitHub" },
  { mode: "linkedin", icon: "linkedin", label: "LinkedIn" },
  { mode: "facebook", icon: "user", label: "Facebook" },
];

export default {
  name: "KalioSignIn",
  components: { SShopLogin, LyIcon },
  inject: ["$shop"],

  data: () => ({
    show: false,
    step: "start",
    email: "",
    emailErr: "",
    digits: ["", "", "", "", "", ""],
    boxes: [],
    codeErr: "",
    busy: false,
    redirecting: "",
  }),

  computed: {
    shop() {
      return this.$store.getters.getShop || this.$shop;
    },
    routes() {
      return window.$storefront.routes;
    },
    rtl() {
      return isRtl();
    },
    shopWord() {
      const w = String(this.shop?.title || "").trim();
      return w.charAt(0).toUpperCase() + w.slice(1);
    },
    shopCity() {
      try {
        return shopFacts(this.shop).city || "";
      } catch {
        return "";
      }
    },
    modes() {
      return Array.isArray(this.shop?.login_modes) ? this.shop.login_modes : [];
    },
    socials() {
      const list = SOCIAL.filter((s) => this.modes.includes(s.mode));
      /* Selldone's own account login only when it is the shop's single way in. */
      if (!list.length && !this.emailOn && !this.smsOn && this.modes.includes("selldone")) return [{ mode: "selldone", icon: "user", label: t("ly.lg.account2", "your account") }];
      return list;
    },
    emailOn() {
      return this.modes.includes("email");
    },
    smsOn() {
      return this.modes.includes("sms");
    },
    guest() {
      return guestCheckout(this.shop) && !this.$store.getters.getUser;
    },
    user() {
      return this.$store.getters.getUser;
    },
  },

  watch: {
    show(value) {
      this.$store.commit("setForceHideNavigation", value);
      document.documentElement.style.overflow = value ? "hidden" : "";
      if (value) {
        this.step = "start";
        this.codeErr = "";
        this.emailErr = "";
        this.redirecting = "";
        /* Focus moves into the sheet (Tab and Esc work at once) and back to
           the button that opened it on close. */
        this.opener = document.activeElement;
        this.$nextTick(() => this.$refs.dlg?.focus({ preventScroll: true }));
      } else if (this.opener && document.contains(this.opener)) {
        this.opener.focus({ preventScroll: true });
        this.opener = null;
      }
    },
    /* Signed in (by the code or a redirect back): say so, then close. */
    user(u) {
      if (u && this.show) {
        this.step = "done";
        setTimeout(() => (this.show = false), 1400);
      }
    },
  },

  mounted() {
    /* Esc closes the sheet wherever the focus is (a click on the page behind
       can leave it outside the sheet). */
    this.onEsc = (e) => {
      if (e.key === "Escape" && this.show) this.close();
    };
    document.addEventListener("keydown", this.onEsc);
  },
  beforeUnmount() {
    document.removeEventListener("keydown", this.onEsc);
  },

  created() {
    EventBus.$on(
      "need-login",
      throttle((show) => {
        this.show = show;
      }, 800),
    );
  },

  methods: {
    t,
    close() {
      this.show = false;
    },
    back() {
      this.step = "start";
      this.$nextTick(() => this.$refs.email?.focus());
    },
    social(mode) {
      this.redirecting = mode;
      try {
        this.LoginShop(null, mode === "selldone" ? null : mode, false);
      } catch (e) {
        this.redirecting = "";
      }
    },
    requestCode() {
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(this.email || "");
      this.emailErr = ok ? "" : this.email ? t("ly.lg.errEmailBad", "Add a valid email address") : t("ly.lg.errEmail", "Add your email");
      if (!ok) return this.$refs.email?.focus();
      this.busy = true;
      this.codeErr = "";
      window.$storefront.auth.email
        .requestOtp(this.email)
        .then(() => {
          this.digits = ["", "", "", "", "", ""];
          this.step = "code";
          this.$nextTick(() => this.boxes[0]?.focus());
        })
        .catch((e) => {
          const msg = e?.error_msg || t("bakini.n.rd.lgFailed", "That did not go through. Please try again.");
          if (this.step === "code") this.codeErr = msg;
          else this.emailErr = msg;
        })
        .finally(() => (this.busy = false));
    },
    verify() {
      const code = this.digits.join("");
      if (code.length < 6) {
        this.codeErr = t("ly.lg.all6", "Enter the 6 digits");
        return;
      }
      this.busy = true;
      this.codeErr = "";
      window.$storefront.auth.email
        .verifyOTP(this.email, code, "customer")
        .then(({ token, expires_in }) => {
          const expire = new Date();
          expire.setUTCSeconds(expires_in);
          window.SetToken(token, expire, "access_token");
          this.step = "done";
        })
        .catch((e) => (this.codeErr = e?.error_msg || t("bakini.n.rd.lgWrong", "That code did not work. Check it, or send a new one.")))
        .finally(() => (this.busy = false));
    },
    /* The code in one field (the mockup's), digits only; six of them sign in. */
    onCode(e) {
      const v = String(e.target.value || "").replace(/\D/g, "").slice(0, 6);
      e.target.value = v;
      this.digits = Array.from({ length: 6 }, (_, k) => v[k] || "");
      this.codeErr = "";
      if (v.length === 6) this.verify();
    },
    onDigit(i, e) {
      const v = String(e.target.value || "").replace(/\D/g, "").slice(-1);
      this.digits[i] = v;
      e.target.value = v;
      if (v && this.boxes[i + 1]) this.boxes[i + 1].focus();
      if (v && i === 5 && this.digits.join("").length === 6) this.verify();
    },
    onKey(i, e) {
      if (e.key === "Backspace" && !this.digits[i] && this.boxes[i - 1]) this.boxes[i - 1].focus();
      if (e.key === "Enter") this.verify();
    },
    onPaste(e) {
      const text = (e.clipboardData?.getData("text") || "").replace(/\D/g, "").slice(0, 6);
      if (!text) return;
      e.preventDefault();
      text.split("").forEach((c, k) => (this.digits[k] = c));
      (this.boxes[text.length] || this.boxes[5])?.focus();
      if (text.length === 6) this.verify();
    },
  },
};
</script>
