<!--
  The shop's privacy page (LyLegal: the shop's own text when it has
  written one, else sample copy from its facts, labelled as sample).
-->
<template>
  <ly-legal kind="privacy" />
</template>

<script lang="ts">
import LyLegal from "@app-storefront/components/ly/read/LyLegal.vue";

export default {
  name: "StorefrontPageOfficialPrivacy",
  components: { LyLegal },
};
</script>
