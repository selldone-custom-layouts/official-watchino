<!--
  A modal sheet (shell.js modal()): a centred card on a wide screen,
  a sheet from the bottom on a phone (pages.css); the head with its title and
  ✕, a body that scrolls, an optional foot (slot "foot") that stays in view.
  One layer at a time (ly.ts): it opens with openLayer(id), closes on ✕,
  Esc, the scrim or a page change, and gives the focus back to its opener.
  Teleported to <body> so no page's stacking context can hold it under the
  header.
-->
<template>
  <teleport to="body">
    <div :dir="rtl ? 'rtl' : 'ltr'" class="ly ly-layers">
      <div :id="id" ref="root" :aria-labelledby="id + '-t'" :class="['modal', cls, { open }]" aria-modal="true" role="dialog" v-bind="$attrs">
        <div class="md-card">
          <div class="md-hd">
            <slot name="head" />
            <h2 :id="id + '-t'" class="md-t">{{ title }}</h2>
            <button :aria-label="t('ly.modal.close', 'Close')" class="ibtn x" type="button" @click="close"><ly-icon name="close" /></button>
          </div>
          <div ref="body" class="md-body"><slot /></div>
          <div v-if="$slots.foot" class="md-ft"><slot name="foot" /></div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script>
import LyIcon from "../LyIcon.vue";
import { closeLayer, layer } from "../ly";
import { isRtl, regionState } from "../../region-switcher/region";
import { t } from "../../kalio/i18n/kalio-i18n";

export default {
  name: "LyModal",
  components: { LyIcon },
  inheritAttrs: false,
  props: {
    id: { type: String, required: true },
    title: { type: String, default: "" },
    cls: { type: String, default: "" },
  },
  emits: ["open", "close"],
  data: () => ({ layer, region: regionState }),
  computed: {
    open() {
      return this.layer.open === this.id;
    },
    rtl() {
      void this.region.language;
      return isRtl();
    },
  },
  watch: {
    open(on) {
      if (on) {
        this.$emit("open");
        this.$nextTick(() =>
          setTimeout(() => {
            if (this.$refs.body) this.$refs.body.scrollTop = 0;
            const f = this.$refs.root?.querySelector("[data-autofocus]") || this.$refs.root?.querySelector(".md-hd .x");
            try {
              f?.focus({ preventScroll: true });
            } catch {
              /* gone */
            }
          }, 40),
        );
      } else this.$emit("close");
    },
  },
  methods: {
    t,
    close() {
      closeLayer();
    },
  },
};
</script>
