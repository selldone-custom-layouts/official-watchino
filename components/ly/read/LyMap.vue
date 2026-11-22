<!--
  The counter on a map (Contact; the mockup's map.js draws one
  city's streets as an illustration). The Layout shows the shop's real place
  instead, so any bakery gets its own: a static map of the shop's location
  (Selldone's map service: the dark style in dark mode, the street style in
  light), the mockup's pin (the shop's letter) in its centre. Without a
  location or a map key: the map's calm water colour and the pin, nothing
  invented.
-->
<template>
  <div :class="['ly-map', { '-none': !src }]">
    <img v-if="src" :alt="t('ly.map.alt', 'Map of the streets around {place}', { place: line || title })" :src="src" class="ly-map__img" loading="lazy" />
    <svg aria-hidden="true" class="ly-map__pin" viewBox="-30 -56 60 64">
      <circle class="ly-map__halo" r="26" />
      <path class="ly-map__body" d="M0 0c-9-10-15-17-15-25a15 15 0 0 1 30 0c0 8-6 15-15 25z" />
      <text class="ly-map__b" y="-19">{{ letter }}</text>
    </svg>
  </div>
</template>

<script>
import { SetupService } from "@selldone/core-js/server";
import { themeState } from "../../theme-switcher/theme-switcher";
import { t } from "../../kalio/i18n/kalio-i18n";

export default {
  name: "LyMap",
  props: {
    location: { type: Object, default: null },
    title: { type: String, default: "" },
    line: { type: String, default: "" },
    zoom: { type: Number, default: 15 },
  },
  data: () => ({ theme: themeState }),
  computed: {
    letter() {
      return (Array.from(String(this.title || "").trim())[0] || "·").toUpperCase();
    },
    dark() {
      void this.theme.mode;
      return document.documentElement.classList.contains("ly-dark");
    },
    src() {
      const l = this.location;
      if (!l || !Number(l.lat) || !Number(l.lng)) return null;
      const token = SetupService.MapToken();
      if (!token) return null;
      const style = this.dark ? "dark-v11" : "streets-v12";
      return `https://api.mapbox.com/styles/v1/mapbox/${style}/static/${l.lng},${l.lat},${this.zoom},0,0/1000x720@2x?access_token=${token}`;
    },
  },
  methods: { t },
};
</script>
