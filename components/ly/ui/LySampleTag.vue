<!-- The "Sample text" label on a page the shop has not written yet. -->
<template>
  <p class="sample-tag"><ly-icon name="info" />{{ text || t("ly.sample.default", "Sample text — the shop has not written this page yet") }}</p>
</template>

<script>
import LyIcon from "../LyIcon.vue";
import { t } from "../../kalio/i18n/kalio-i18n";

export default {
  name: "LySampleTag",
  components: { LyIcon },
  props: { text: { type: String, default: "" } },
  methods: { t },
};
</script>
