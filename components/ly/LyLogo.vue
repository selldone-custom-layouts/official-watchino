<!--
  The wordmark (style/ly/look.css .wm-name / .wm-sub): the shop's own live title in the skin's display face, with
  the sub line under it (the shop's city by default). Nothing is written in: the word is BRAND.name when the Layout
  sets one (kalio-brand.ts), else the shop's title; the city comes from the shop's own address. Case, italic, the
  dot and the sub line are the skin's (ly-wordmark.ts). A long title steps the size down so it never leaves the
  header.
-->
<template>
  <component :is="to ? 'router-link' : 'span'" :aria-label="label" :class="['wm', 'ly-wm', size]" :to="to">
    <span aria-hidden="true" class="wm-name">{{ word }}<i v-if="dot" class="wm-dot"></i></span><span v-if="sub" aria-hidden="true" class="wm-sub">{{ sub }}</span>
  </component>
</template>

<script>
import { BRAND } from "../kalio/kalio-brand";
import { t } from "../kalio/i18n/kalio-i18n";
import { shopFacts } from "./ly";
import { wordmarkDot, wordmarkSub, wordmarkWord } from "./ly-wordmark";

export default {
  name: "LyLogo",
  inject: { $shop: { default: null } },
  props: {
    to: { type: [Object, String, null], default: () => ({ path: "/" }) },
  },
  computed: {
    word() {
      return wordmarkWord(BRAND.name || this.$shop?.title || "");
    },
    dot() {
      return wordmarkDot && !!this.word;
    },
    sub() {
      return wordmarkSub(this.city);
    },
    city() {
      try {
        return shopFacts(this.$shop).city || "";
      } catch {
        return "";
      }
    },
    size() {
      const n = Array.from(this.word).length;
      return n > 16 ? "-xl" : n > 10 ? "-long" : "";
    },
    label() {
      return this.to ? t("ly.logo.homeOf", "{name}, home", { name: this.word }) : this.word;
    },
  },
};
</script>
