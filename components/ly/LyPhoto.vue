<!--
  A photo slot (skins/<name>/photos/<name>.webp, ly-photos.ts). With the photo in the build it shows it (cover);
  without it, the designed fallback: the tinted surface (light or deep) with the slot's line art (the skin's
  photos.<slot>.art, else the art prop), or whatever the "fallback" slot draws (live cut-outs of the shop's own
  products). Never a caption, a file name or a size. The default slot is the slot's own words and links (they sit
  over the photo).
-->
<template>
  <div :class="['ph', { deep, 'has-photo': !!src }]" :data-photo="name">
    <img v-if="src" :alt="alt" :loading="eager ? 'eager' : 'lazy'" :src="src" :style="pos ? { objectPosition: pos } : undefined" class="ph-img" decoding="async" draggable="false" />
    <template v-else>
      <slot name="fallback">
        <span aria-hidden="true" class="ph-art"><ly-art :name="artName" /></span>
      </slot>
    </template>
    <slot />
  </div>
</template>

<script>
import LyArt from "./LyArt.vue";
import { slotPhoto } from "./ly-photos";
import { SKIN } from "./skin.gen";

export default {
  name: "LyPhoto",
  components: { LyArt },
  props: {
    /** The slot's name: skins/<name>/photos/<slot>.webp. */
    name: { type: String, required: true },
    /** The deep (cocoa) surface: a slot with light words over it. */
    deep: { type: Boolean, default: false },
    /** The fallback's line art (ly-icons.ts ART). */
    art: { type: String, default: "croissant" },
    alt: { type: String, default: "" },
    eager: { type: Boolean, default: false },
    /** object-position of the photo (keeps its calm part under words). */
    pos: { type: String, default: "" },
  },
  computed: {
    artName() {
      return SKIN.photoArt[this.name] || this.art;
    },
    src() {
      return slotPhoto(this.name);
    },
  },
};
</script>
