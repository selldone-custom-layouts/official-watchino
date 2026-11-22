<!--
  The home's counters band (sections.json "counters", variant "band"; Domino's cocoa counters band in the base's
  one shape language: a flat family-dark band, no scallops): the shop in numbers from its own facts (collections,
  the saving, the counter's days and hours, the ways to receive an order; never a product count), four to a row
  with thin dividers, two on a phone. Pair it with About "story", which then leaves the numbers out.
-->
<template>
  <section v-if="nums.length" :aria-label="t('ly.home.numsAria', '{shop} in numbers', { shop: shopName })" class="nums-band">
    <div class="wrap">
      <dl :class="['nums', 'on-dark', 'n' + nums.length]">
        <div v-for="n in nums" :key="n.k" class="num">
          <dt>{{ n.label }}</dt>
          <dd>
            <span class="nv">{{ n.value }}</span><span v-if="n.unit" class="nu">{{ n.unit }}</span>
          </dd>
        </div>
      </dl>
    </div>
  </section>
</template>

<script>
import homeData from "../home-data";

export default {
  name: "CountersBand",
  mixins: [homeData],
};
</script>
