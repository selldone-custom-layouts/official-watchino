<!--
  One of the mockup's hand-drawn pastry drawings (ly-icons.ts ART,
  120 × 120, strokes only). cls "draw" (default), "feat-ic" (a feature's
  roundel) or "dw-art" (the empty bag). With `wrap`, the drawing sits in the
  mockup's faint absolutely placed span (.art <wrap>) behind a section.
-->
<template>
  <span v-if="wrap" :class="['art', wrap]" aria-hidden="true"
    ><svg aria-hidden="true" class="draw" focusable="false" viewBox="0 0 120 120" v-html="paths"></svg
  ></span>
  <svg v-else :class="cls" aria-hidden="true" focusable="false" viewBox="0 0 120 120" v-html="paths"></svg>
</template>

<script>
import { ART } from "./ly-icons";

export default {
  name: "LyArt",
  props: {
    name: { type: String, required: true },
    cls: { type: String, default: "draw" },
    wrap: { type: String, default: "" },
  },
  computed: {
    paths() {
      return ART[this.name] || "";
    },
  },
};
</script>
