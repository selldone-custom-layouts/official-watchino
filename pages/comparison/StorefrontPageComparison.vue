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
  The compare page is the Layout's (LyCompare: design/compare-b.html),
  built on Kalio's compare logic. The address keeps Selldone's ?list=
  format, so its old links still open here.
-->
<template>
  <ly-compare />
</template>

<script lang="ts">
import LyCompare from "../../components/ly/compare/LyCompare.vue";

export default {
  name: "StorefrontPageComparison",
  components: { LyCompare },
};
</script>
