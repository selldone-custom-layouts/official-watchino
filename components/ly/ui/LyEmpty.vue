<!--
  An empty state (shell.js empty()): the icon in a 56px soft
  circle, 14px to the title, 8px to the words (max 520px), 20px to the
  buttons (slot "acts"), then anything else (slot "extra"). cls "boxed": on a
  card of its own.
-->
<template>
  <div :class="['empty', cls]">
    <span class="em-ic"><ly-icon :name="icon" /></span>
    <component :is="tag" class="em-t">{{ title }}</component>
    <p v-if="text" class="em-p">{{ text }}</p>
    <div v-if="$slots.acts" class="em-a"><slot name="acts" /></div>
    <slot name="extra" />
  </div>
</template>

<script>
import LyIcon from "../LyIcon.vue";

export default {
  name: "LyEmpty",
  components: { LyIcon },
  props: {
    icon: { type: String, default: "info" },
    title: { type: String, required: true },
    text: { type: String, default: "" },
    cls: { type: String, default: "" },
    tag: { type: String, default: "h3" },
  },
};
</script>
