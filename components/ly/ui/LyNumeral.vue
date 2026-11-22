<!-- The outlined serif numeral ("01") of the mockup's cards and steps. -->
<template>
  <svg aria-hidden="true" class="numeral" focusable="false" viewBox="0 0 132 84"><text x="2" y="74">{{ (n < 10 ? "0" : "") + n }}</text></svg>
</template>

<script>
export default { name: "LyNumeral", props: { n: { type: Number, required: true } } };
</script>
