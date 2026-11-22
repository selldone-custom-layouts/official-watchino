<!--
  The in-app splash (new-shop-kits/loading/IN-APP-SPLASH.md). Selldone removes the domain's custom
  loading frame as soon as the app starts (about half a second with a warm cache), so the Layout draws the same
  picture itself and keeps it until the page is really ready:

  - the frame's picture (scripts/loading/config.json, make-loading.cjs, both from the skin): the ground, a faint ring
    with the action colour's arc turning once every 1.2 s, the croissant line art already drawn, and the brand under it — the
    shop's own title drawn like the header's wordmark (Cormorant Garamond, capitalised, shrinking with its length,
    two lines at most, right to left by itself) with its city under it, from the live shop record, never written
    in (or the Layout's logo image when BRAND sets one). Colours are the family tokens, so a palette, dark mode or a
    custom colour re-tints it; reduced motion keeps it still.
  - Only on the first page load of a browser session (sessionStorage "ly-splash").
  - It hides (a 300 ms fade) once the shop's details, the collections and the catalogue are in and the first route
    has drawn, the first photo in view has decoded (or 2.5 s have passed since it began), and 1.2 s have passed
    since navigation start (not with reduced motion); always by 4 s; at once on a route error. The pages render
    underneath, so nothing waits for the fade.
-->
<template>
  <teleport to="body">
    <div v-if="on" :class="['ly-splash', { out: fading }]" role="status">
      <span class="ly-splash__sr">{{ t("ly.splash.loading", "Loading {shop}", { shop: word || "" }) }}</span>
      <div class="ly-splash__ld">
        <svg :style="{ '--ly-splash-delay': delay }" aria-hidden="true" class="ly-splash__mark" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
          <circle class="ly-splash__base" cx="60" cy="60" r="56" />
          <circle class="ly-splash__arc" cx="60" cy="60" r="56" />
          <g v-if="art.length" class="ly-splash__art" transform="translate(18 14) scale(.7)">
            <path v-for="(d, i) in art" :key="i" :d="d" />
          </g>
        </svg>
        <div aria-hidden="true" class="ly-splash__brand">
          <img v-if="logo" :src="logo" alt="" class="ly-splash__logo" />
          <span v-else-if="word" :class="['ly-splash__name', { '-it': italic }]" :style="{ '--ly-splash-size': nameSize + 'px' }" dir="auto">{{ word }}<i v-if="dot" class="ly-splash__dot"></i></span>
          <span v-if="sub" class="ly-splash__sub" dir="auto">{{ sub }}</span>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script>
import { BRAND } from "../../kalio/kalio-brand";
import { t } from "../../kalio/i18n/kalio-i18n";
import { ly, shopFacts } from "../ly";

import { SKIN } from "../skin.gen";
import { wordmarkDot, wordmarkItalic, wordmarkSub, wordmarkWord } from "../ly-wordmark";

const KEY = SKIN.storage.splash;
/* the frame's line art (new-shop-kits/loading/make-loading.cjs ART, the same paths), by the skin's splash.art */
const ART = {
  croissant: ["M10 80c2-14 13-24 25-27 6-12 16-19 25-19s19 7 25 19c12 3 23 13 25 27-6 4-14 4-20-2-2 8-8 12-14 12-4 6-10 9-16 9s-12-3-16-9c-6 0-12-4-14-12-6 6-14 6-20 2z", "M35 53c5 8 7 18 5 28M60 34c2 12 2 31 0 47M85 53c-5 8-7 18-5 28", "M24 66c3 2 6 3 9 3M96 66c-3 2-6 3-9 3"],
  cupcake: ["M32 66h56l-7 36H39z", "M46 66l2 36M60 66v36M74 66l-2 36", "M28 66c-7-2-8-12-1-15-3-9 6-16 14-13 1-10 13-14 20-8 7-7 20-2 20 8 9-3 17 5 13 14 7 4 5 13-2 14z"],
  tart: ["M14 62c0-9 21-16 46-16s46 7 46 16-21 16-46 16-46-7-46-16z", "M14 62v9c0 9 21 16 46 16s46-7 46-16v-9", "M38 60a6 6 0 1 0 12 0a6 6 0 1 0-12 0M54 56a6 6 0 1 0 12 0a6 6 0 1 0-12 0M70 60a6 6 0 1 0 12 0a6 6 0 1 0-12 0"],
  whisk: ["M60 16v40", "M60 56c-14 0-22 16-22 30s10 22 22 22 22-8 22-22-8-30-22-30z", "M60 56c-6 0-10 16-10 30s4 22 10 22 10-8 10-22-4-30-10-30z"],
  none: [],
};
const MIN = 1200;
const CAP = 4000;
const PHOTO_WAIT = 2500;

export default {
  name: "LySplash",
  data: () => ({ on: false, fading: false, ly, delay: "0ms", art: ART[SKIN.splash.art] || ART.croissant, dot: wordmarkDot, italic: wordmarkItalic }),
  computed: {
    shop() {
      return this.$store.getters.getShop;
    },
    word() {
      return wordmarkWord(String(BRAND.name || this.shop?.title || ""));
    },
    sub() {
      return wordmarkSub(this.city);
    },
    /* the Layout's own logo image, only when BRAND sets one (the Layout draws a wordmark) */
    logo() {
      return BRAND.logo || "";
    },
    city() {
      try {
        return this.word ? shopFacts(this.shop).city || "" : "";
      } catch {
        return "";
      }
    },
    /* the frame's rule: 42 px for a short name, smaller as it grows (make-loading.cjs) */
    nameSize() {
      const n = Array.from(this.word).length;
      const size = Math.max(22, Math.min(42, Math.round(420 / Math.max(n, 1) + 8)));
      return typeof window !== "undefined" && window.innerWidth <= 420 ? Math.max(20, Math.round(size * 0.86)) : size;
    },
  },
  created() {
    /* dev build only: localStorage "<skin name>-splash-hold" = "1" keeps it up for the checks (scripts/splash-check.mjs) */
    this.hold = import.meta.env.DEV && (() => { try { return localStorage.getItem(SKIN.storage.splashHold) === "1"; } catch { return false; } })();
    let seen = false;
    try {
      seen = !!sessionStorage.getItem(KEY);
      sessionStorage.setItem(KEY, "1");
    } catch {
      seen = false;
    }
    /* past the 4 s cap already (a very slow start): no splash at all, never a flash of one */
    if (!this.hold && (seen || performance.now() >= CAP)) return;
    this.on = true;
    /* the arc picks up where the frame's left it (both started at navigation start) */
    this.delay = -Math.round(performance.now() % 1200) + "ms";
  },
  mounted() {
    if (!this.on) return;
    this.reduce = !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    this.offError = this.$router.onError(() => this.hide(true));
    if (!this.hold) this.capTimer = setTimeout(() => this.hide(), Math.max(0, CAP - performance.now()));
    this.poll = setInterval(() => this.check(), 100);
  },
  beforeUnmount() {
    this.stop();
  },
  methods: {
    t,
    stop() {
      clearInterval(this.poll);
      clearTimeout(this.capTimer);
      this.offError?.();
    },
    /* the first photo in view in the page (the hero's), decoded or given up on after 2.5 s */
    photoReady() {
      if (this.photoDone) return true;
      const img = [...document.querySelectorAll(".v-main img")].find((i) => {
        const r = i.getBoundingClientRect();
        return r.width > 40 && r.height > 40 && r.top < window.innerHeight && r.bottom > 0;
      });
      /* a page with no photo in view (the FAQ, a 404 with its search): nothing to wait for */
      if (!img) {
        if (!this.noPhotoSince) this.noPhotoSince = performance.now();
        return performance.now() - this.noPhotoSince > 300;
      }
      if (!this.photoSince) {
        this.photoSince = performance.now();
        const done = () => (this.photoDone = true);
        (img.decode ? img.decode() : Promise.resolve()).then(done, done);
      }
      if (performance.now() - this.photoSince > PHOTO_WAIT) this.photoDone = true;
      return !!this.photoDone;
    },
    check() {
      if (this.hold) return;
      const facts = shopFacts(this.shop);
      const data = facts.ready && this.ly.ready && this.ly.catsReady && !!document.querySelector(".v-main .ly");
      if (!data) return;
      if (!this.photoReady()) return;
      if (!this.reduce && performance.now() < MIN) return;
      this.hide();
    },
    hide(now = false) {
      if (!this.on || this.fading) return;
      this.stop();
      if (now || this.reduce) {
        this.on = false;
        return;
      }
      this.fading = true;
      setTimeout(() => (this.on = false), 300);
    },
  },
};
</script>

<style>
/* The frame's picture, in the family tokens (the skin's loading config is drawn from the same values). */
.ly-splash {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: grid;
  place-items: center;
  background: var(--ly-bg, #ffffff);
  color: var(--ly-ink, #2d2d2d);
  font-family: var(--ly-sans, "Mulish", system-ui, sans-serif);
  -webkit-font-smoothing: antialiased;
  opacity: 1;
  transition: opacity 0.3s ease;
}
.ly-splash.out {
  opacity: 0;
  pointer-events: none;
}
.ly-splash__ld {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 24px;
  max-width: min(88vw, 560px);
  box-sizing: border-box;
  text-align: center;
}
.ly-splash__mark {
  width: 120px;
  height: 120px;
  display: block;
  flex: none;
}
.ly-splash__base {
  fill: none;
  stroke: var(--ly-line, #e4dcd2);
  stroke-width: 1.2;
}
.ly-splash__arc {
  fill: none;
  stroke: var(--ly-act-text, #8c6844);
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-dasharray: 62 290;
  transform-origin: 60px 60px;
  animation: ly-splash-turn 1.2s linear infinite;
  animation-delay: var(--ly-splash-delay, 0ms);
}
.ly-splash__art {
  fill: none;
  stroke: var(--ly-ink, #2d2d2d);
  stroke-width: 2.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.ly-splash__brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 100%;
}
.ly-splash__logo {
  display: block;
  max-width: min(220px, 70vw);
  max-height: 72px;
  width: auto;
  height: auto;
  object-fit: contain;
}
.ly-splash__name {
  font: var(--ly-wm-weight, 500) var(--ly-splash-size, 42px) / 1.05 var(--ly-wm-font, var(--ly-serif, Georgia, serif));
  letter-spacing: var(--ly-wm-track, 0.04em);
  color: var(--ly-ink, #2d2d2d);
  max-width: 100%;
  overflow-wrap: anywhere;
}
.ly-splash__name.-it {
  font-style: italic;
}
.ly-splash__dot {
  display: inline-block;
  width: 0.16em;
  height: 0.16em;
  border-radius: 50%;
  background: var(--ly-act, currentColor);
  margin-inline-start: 0.06em;
}
.ly-splash__sub {
  font: 700 9px/1.4 var(--ly-sans, "Mulish", system-ui, sans-serif);
  letter-spacing: 0.38em;
  padding-inline-start: 0.38em;
  text-transform: uppercase;
  color: var(--ly-muted, #646464);
  margin-top: 9px;
  max-width: 100%;
}
.ly-splash__name:dir(rtl),
.ly-splash__sub:dir(rtl) {
  letter-spacing: 0;
  padding-inline-start: 0;
}
.ly-splash__sub:dir(rtl) {
  font-size: 12px;
  text-transform: none;
}
.ly-splash__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
@keyframes ly-splash-turn {
  to {
    transform: rotate(360deg);
  }
}
@media (max-width: 420px) {
  .ly-splash__mark {
    width: 92px;
    height: 92px;
  }
  .ly-splash__logo {
    max-height: 56px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .ly-splash,
  .ly-splash__arc {
    animation: none;
    transition: none;
  }
}
</style>
