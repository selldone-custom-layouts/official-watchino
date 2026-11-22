<!--
  The order's messages (pages-buy.js order, aside.chat): the shop's
  mark, its name and opening hours; "Order placed · <date>", the Layout's
  own invitation in the shop's voice, then Selldone's messages (the shop's
  with its mark, the shopper's on the right, a day line when the day
  changes; the shopper can take back their own: "Delete?" twice); a few
  starters while the thread is empty; one line to write and Send.
  KalioOrderChat's script: it posts to Selldone's order chat.
-->
<template>
  <aside :aria-label="t('ly.od.chatAria', 'Messages with {shop}', { shop: shopName })" class="chat">
    <div class="chat-hd">
      <ly-mark />
      <div>
        <b>{{ shopName }}</b><small v-if="hours">{{ hours }}</small>
      </div>
    </div>
    <ol ref="thread" aria-live="polite" class="msgs" role="log">
      <li class="msg sys">
        <span>{{ placedWord }}</span>
      </li>
      <li class="msg them">
        <ly-mark sm />
        <p>{{ t("ly.od.chatHello", "Questions about this order? Write here and the bakery answers in this chat.") }}</p>
      </li>
      <template v-for="group in days" :key="group.key">
        <li class="msg sys">
          <span>{{ group.label }}</span>
        </li>
        <li v-for="m in group.items" :key="m.index" :class="['msg', m.mine ? 'me' : 'them', { 'ly-busy': deleting === m.index }]">
          <ly-mark v-if="!m.mine" sm />
          <p>
            {{ m.message.body }}<time :datetime="m.message.date" :title="full(m.message.date)" class="ly-msg-t">{{ time(m.message.date) }}</time>
          </p>
          <button
            v-if="m.mine"
            :aria-label="confirming === m.index ? t('ly.od.chatDeleteThis', 'Delete this message') : t('ly.od.chatDelete', 'Delete')"
            :class="['ly-msg-x', { '-ask': confirming === m.index }]"
            :disabled="deleting !== null"
            type="button"
            @blur="confirming = null"
            @click="askDelete(m)"
          >
            <template v-if="confirming === m.index">{{ t("ly.od.chatDeleteAsk", "Delete?") }}</template><ly-icon v-else name="trash" />
          </button>
        </li>
      </template>
    </ol>
    <div v-if="!messages.length" class="ly-chat-st chips-r">
      <button v-for="s in starters" :key="s" class="chip" type="button" @click="useStarter(s)">{{ s }}</button>
    </div>
    <form class="chat-f" @submit.prevent="send">
      <label :for="'chat-in-' + basket.id" class="sr">{{ t("ly.od.chatLabel", "Message to {shop}", { shop: shopName }) }}</label>
      <input
        :id="'chat-in-' + basket.id"
        ref="input"
        v-model="draft"
        :placeholder="t('ly.od.chatPh', 'Write to {shop}…', { shop: shopName })"
        autocomplete="off"
        class="inp"
        maxlength="1000"
      />
      <button :aria-disabled="!ready ? 'true' : undefined" :aria-label="t('ly.od.chatSend', 'Send')" class="ibtn send" type="submit"><ly-icon name="send" /></button>
    </form>
  </aside>
</template>

<script>
import KalioOrderChat from "../../kalio/order/KalioOrderChat.vue";
import LyIcon from "../LyIcon.vue";
import LyMark from "../ui/LyMark.vue";
import { openLine, shopFacts } from "../ly";
import { placedAt } from "./od";
import { t } from "../../kalio/i18n/kalio-i18n";

export default {
  name: "LyOrderChat",
  extends: KalioOrderChat,
  components: { LyIcon, LyMark },
  computed: {
    shopName() {
      const raw = String(this.$shop?.title || "");
      return raw.charAt(0).toUpperCase() + raw.slice(1);
    },
    hours() {
      return openLine(shopFacts(this.$shop));
    },
    placedWord() {
      const at = placedAt(this.basket);
      return at ? t("ly.od.chatPlaced", "Order placed · {date}", { date: at }) : t("ly.od.chatPlacedNoDate", "Order placed");
    },
  },
  methods: {
    t,
    grow() {},
    useStarter(text) {
      this.draft = text;
      this.$nextTick(() => this.$refs.input?.focus());
    },
  },
};
</script>
