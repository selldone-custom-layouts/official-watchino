// The fast runner's config (new-shop-kits/fast-checks/fast-checks.mjs), generated from the skin: the names and the
// test inputs come from checks/fast-checks.json and checks/checks.env (scripts/skin-apply.mjs, from
// skins/<name>/skin.json), the runs mirror scripts/run-checks.sh run for run (same names, pages, widths, themes,
// languages and tool settings). Keep both in step when a check is added.
//
//   bash <workspace>/new-shop-kits/pw-lock.sh run <who> -- \
//     node <workspace>/new-shop-kits/fast-checks/fast-checks.mjs <this Layout>/scripts/fast-checks.config.mjs
// BASE=<url> picks the dev server or another domain (default: the skin's live domain).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
/* the kit: KIT, else the first new-shop-kits/ above this repo (a Layout lives at <workspace>/<name>-layout) */
function findKit() {
  if (process.env.KIT) return path.resolve(process.env.KIT);
  for (let d = path.dirname(ROOT); d !== path.dirname(d); d = path.dirname(d)) if (fs.existsSync(path.join(d, "new-shop-kits", "fast-checks"))) return path.join(d, "new-shop-kits");
  return path.resolve(ROOT, "../new-shop-kits");
}
const KIT = findKit();
const { pages, theme, widths } = await import(pathToFileURL(path.join(KIT, "fast-checks/lib/config-helpers.mjs")).href);

const FC = JSON.parse(fs.readFileSync(path.join(ROOT, "checks/fast-checks.json"), "utf8"));
const ENV = Object.fromEntries(
  fs
    .readFileSync(path.join(ROOT, "checks/checks.env"), "utf8")
    .split("\n")
    .filter((l) => /^[A-Z_0-9]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^'|'$/g, "")]),
);
const BASE = (process.env.BASE || FC.live).replace(/\/$/, "");
const SK = FC.storage.theme;
const SHOP = FC.shop;
const BRAND = FC.brand;
const W3 = widths("1440,1024,390");
const WIDE = widths("1920,2560,2880,3840");
const DARK = theme(BRAND, "dark");
const LIGHT = theme(BRAND, "light");
const CUR = "USD,AED,DKK,SAR".split(",");

const P1 = `/product/${ENV.T_PRODUCT}`;
const P2 = `/product/${ENV.T_PRODUCT2}`;
const CAT = ENV.T_CATEGORY;
const CMP = `/comparison?list=${ENV.T_COMPARE}`;
const ART = ENV.T_ARTICLE;
const Q = ENV.T_SEARCH;
const DEALS = '/?filter={"only_has_discount":true}';
const PAGES_ALL = `home=/,category=${CAT},deals=${DEALS},search=/?search=${Q},product=${P1},product2=${P2},compare=${CMP},blog=/blog,article=${ART},about=/about-us,terms=/terms,privacy=/privacy,contact=/contact-us,faq=/faq,404=/no-such-page,cart=/basket/PHYSICAL,checkout=/basket/PHYSICAL?step=checkout,account=/user`;
const PAGES_MAIN = `home=/,category=${CAT},deals=${DEALS},search=/?search=${Q},product=${P1},compare=${CMP},blog=/blog,about=/about-us,404=/no-such-page`;
const BOX_PAGES = `home=/,category=${CAT},deals=/?filter=%7B%22only_has_discount%22%3Atrue%7D,search=/?search=${Q},product=${P1},product2=${P2},compare=${CMP},blog=/blog,article=${ART},404=/no-such-page,faq=/faq,contact=/contact-us,about=/about-us,terms=/terms,privacy=/privacy,account=/user`;
const UL_PAGES = `home=/,category=${CAT},deals=${DEALS},product=${P1},compare=${CMP},blog=/blog,article=${ART},about=/about-us,contact=/contact-us,faq=/faq,terms=/terms,privacy=/privacy,404=/no-such-page,account=/user`;
const SHAPE_PAGES = `home=/,category=${CAT},deals=${DEALS},search=/?search=${Q},product=${P1},compare=${CMP},blog=/blog,article=${ART},about=/about-us,contact=/contact-us,terms=/terms,privacy=/privacy,faq=/faq,404=/no-such-page,cart=/basket/PHYSICAL,account=/user`;
const CIRCLE_PAGES = `home=/,deals=${DEALS},category=${CAT}`;
const OPEN_STATES = '(async () => { const b = [...document.querySelectorAll(innerWidth < 980 ? ".menu-btn" : ".bag-btn")].find((x) => x.offsetParent); if (!b) return "FAIL no button"; b.click(); return true; })()';
const OPEN_SIGNIN = '(async () => { const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); window.$global_router.push("/user"); await sleep(3500); const s = [...document.querySelectorAll(".acc-nav button, .ly button")].find((x) => /Sign in/i.test(x.textContent)); if (!s) return "FAIL no sign-in button"; s.click(); await sleep(1500); return true; })()';
const CARD_URLS_DARK = ["/", "/#cat", `/?search=${Q}`, "/?filter=%7B%22only_has_discount%22%3Atrue%7D", "/blog", "/about-us", "/faq", "/contact-us", "/terms", "/privacy", "/user", CMP];
const OTHER = FC.palettes.filter((p) => p !== BRAND);

const runs = [
  { name: "ring-dark", check: "ring", theme: DARK, pages: pages(PAGES_ALL) },
  { name: "ring-light", check: "ring", theme: LIGHT, pages: pages(PAGES_ALL) },
  { name: "ring-ar", check: "ring", lang: "ar", pages: pages(PAGES_MAIN) },
  { name: "card-edge", check: "card-edge", tool: "cardEdgeKit", widths: [...W3, ...WIDE], urls: ["/", "/#cat", `/?search=${Q}`, "/?filter=%7B%22only_has_discount%22%3Atrue%7D"] },
  { name: "card-edge-ly-dark", check: "card-edge", theme: DARK, widths: [...W3, ...WIDE], urls: CARD_URLS_DARK },
  { name: "card-edge-ly-light", check: "card-edge", theme: LIGHT, widths: [...W3, ...WIDE], urls: ["/", "/#cat", `/?search=${Q}`, "/blog", "/about-us", "/contact-us"] },
  { name: "card-edge-ly-ar", check: "card-edge", lang: "ar", widths: widths("1440,390"), urls: ["/", "/#cat", "/blog", "/about-us"] },
  { name: "corner", check: "corner", theme: DARK, pages: pages(PAGES_MAIN), widths: widths("3840,2880,2560,1920,1440,1366,1280,1024,900,768,390") },
  { name: "corner-ar", check: "corner", lang: "ar", pages: pages(PAGES_MAIN), widths: widths("1920,1366,1024,390") },
  { name: "circle", check: "circle", pages: pages(CIRCLE_PAGES), long: true, currencies: CUR },
  { name: "circle-ar", check: "circle", lang: "ar", pages: pages(CIRCLE_PAGES), long: true, currencies: CUR },
  { name: "circle-dark", check: "circle", theme: DARK, pages: pages(CIRCLE_PAGES), long: true },
  { name: "circle-pd", check: "circle", pages: pages(`product=${P1},product2=${P2}`), currencies: CUR },
  { name: "circle-pd-ar", check: "circle", lang: "ar", pages: pages(`product=${P1}`), currencies: CUR },
  { name: "contrast-dark", check: "contrast", theme: DARK, widths: W3, pages: pages(PAGES_ALL) },
  { name: "contrast-light", check: "contrast", theme: LIGHT, widths: W3, pages: pages(PAGES_ALL) },
  /* one colour family: each palette light and dark, and the owner's custom colours in both modes */
  ...OTHER.flatMap((p) => ["light", "dark"].map((m) => ({ name: `contrast-${p}-${m}`, check: "contrast", theme: theme(p, m), widths: W3, pages: pages(PAGES_MAIN) }))),
  ...["ffff00", "00ffff", "111111"].flatMap((c) => ["light", "dark"].map((m) => ({ name: `contrast-${c}-${m}`, check: "contrast", theme: theme("custom", m, "#" + c), pages: pages(PAGES_MAIN) }))),
  { name: "contrast-states-dark", check: "contrast", theme: DARK, widths: W3, pages: pages("home=/"), open: OPEN_STATES },
  { name: "contrast-states-light", check: "contrast", theme: LIGHT, widths: W3, pages: pages("home=/"), open: OPEN_STATES },
  { name: "contrast-signin-dark", check: "contrast", theme: DARK, pages: pages("home=/"), open: OPEN_SIGNIN },
  { name: "contrast-signin-light", check: "contrast", theme: LIGHT, pages: pages("home=/"), open: OPEN_SIGNIN },
  { name: "contrast-ar", check: "contrast", lang: "ar", pages: pages(PAGES_MAIN) },
  { name: "contrast-ar-dark", check: "contrast", lang: "ar", theme: DARK, pages: pages(PAGES_MAIN) },
  { name: "cart-dark", check: "cart", theme: DARK, env: { SHOP, WAIT: ".ly .ftr", CART: ".bag-btn", STORAGE_KEY: SK }, argv: [BASE, BRAND, "dark"] },
  { name: "cart-light", check: "cart", theme: LIGHT, env: { SHOP, WAIT: ".ly .ftr", CART: ".bag-btn", STORAGE_KEY: SK }, argv: [BASE, BRAND, "light"] },
  { name: "currency", check: "currency", widths: W3, env: { WIDTHS: "1440,1024,390", SHOP, MENU: ".menu-btn", MEGA: "[aria-controls=dd-shop]", CART: ".bag-btn >> visible=true", CATEGORY: CAT, DEALS } },
  { name: "box-dark", check: "box", theme: DARK, widths: [...W3, ...WIDE], pages: pages(BOX_PAGES, "first"), states: true },
  { name: "box-light", check: "box", theme: LIGHT, widths: [...W3, ...WIDE], pages: pages(BOX_PAGES, "first"), states: true },
  { name: "box-ar", check: "box", lang: "ar", widths: widths("1440,390"), pages: pages(BOX_PAGES, "first"), states: false },
  {
    name: "i18n-ar",
    check: "i18n",
    widths: widths("1440,390"),
    forceLanguages: ["ar"],
    env: { IGNORE: ENV.I18N_IGNORE || "", I18N: path.join(ROOT, "components/kalio/i18n"), LANGUAGES: "ar", SHOP, MENU: ".menu-btn", CART: ".bag-btn >> visible=true", CATEGORY: '@a[href$="-category"]', PAGES: `about=/about-us,contact=/contact-us,blog=/blog,terms=/terms,privacy=/privacy,account=/user,cart=/basket/PHYSICAL,compare=${CMP}` },
  },
  { name: "text-col", check: "text-col", theme: LIGHT, widths: [...W3, ...WIDE], pages: pages(SHAPE_PAGES) },
  { name: "text-col-ar", check: "text-col", lang: "ar", widths: widths("1440,2880,390"), pages: pages(PAGES_MAIN) },
  { name: "shape-light", check: "shape", theme: LIGHT, widths: W3, pages: pages(SHAPE_PAGES) },
  { name: "shape-dark", check: "shape", theme: DARK, widths: W3, pages: pages(SHAPE_PAGES) },
  { name: "shape-teal", check: "shape", theme: theme("custom", "light", "#0f7b7b"), widths: widths("1440,390"), pages: pages(PAGES_MAIN), states: false },
  { name: "shape-ar", check: "shape", lang: "ar", widths: widths("1440,390"), pages: pages(PAGES_MAIN), states: false },
  { name: "underline-dark", check: "underline", theme: DARK, widths: widths("1440,390"), pages: pages(UL_PAGES) },
  { name: "underline-light", check: "underline", theme: LIGHT, widths: widths("1440"), pages: pages(UL_PAGES) },
];

export default {
  name: FC.title,
  base: BASE,
  /* something every page shows once the Layout has drawn */
  wait: FC.wait,
  /* the Layout's root (the focus audit's controls live under it: shape-check.cjs) */
  root: FC.root,
  themeKey: SK,
  /* a language means a reload with the language stored; "force": the shop-info answer offers it in the test browser */
  languages: { ar: { storage: { [`local-shop-${SHOP}`]: "ar", [FC.storage.devLanguages]: "ar" }, force: ["ar"] } },
  tools: {
    ring: path.join(KIT, "single-vendor-shop/ring-sweep.cjs"),
    cardEdgeKit: path.join(KIT, "single-vendor-shop/card-edge-check.cjs"),
    cardEdge: path.join(ROOT, "scripts/card-edge-ly.cjs"),
    corner: path.join(KIT, "single-vendor-shop/corner-clear-check.cjs"),
    circle: path.join(KIT, "single-vendor-shop/circle-fit-check.cjs"),
    contrast: path.join(ROOT, "components/theme-switcher/tools/contrast-audit.cjs"),
    cart: path.join(ROOT, "components/theme-switcher/tools/cart-audit.cjs"),
    currency: path.join(ROOT, "components/region-switcher/tools/currency-check.cjs"),
    box: path.join(ROOT, "scripts/box-check.cjs"),
    i18n: path.join(ROOT, "scripts/i18n-check-forced.cjs"),
    textCol: path.join(ROOT, "scripts/text-column-check.cjs"),
    shape: path.join(ROOT, "scripts/shape-check.cjs"),
    underline: path.join(ROOT, "scripts/underline-check.cjs"),
  },
  box: { mega: "[aria-controls=dd-shop]", quick: ".pc-qv", category: CAT },
  shape: {
    states(label, w) {
      const s = [];
      if (w < 980) s.push(["menu", ".menu-btn"]);
      else {
        s.push(["shop-menu", "[aria-controls=dd-shop]"]);
        s.push(["region", ".rg-pill"]);
      }
      s.push(["search", "[aria-controls=srch]"]);
      if (label === "home" || label === "category") s.push(["bag", ".bag-btn"]);
      if (label === "category") {
        if (w < 1200) s.push(["filter-sheet", ".fbtn"]);
        s.push(["quick", ".pc-qv"]);
      }
      if (label === "account") s.push(["signin", "@signin"]);
      return s;
    },
    scopes: { menu: "#menu", "shop-menu": "#dd-shop", region: "#rgp", search: "#srch", bag: "#drawer", "filter-sheet": ".fp.panel", quick: "#qv", signin: "#loginm" },
    signin: () => {
      const b = [...document.querySelectorAll(".acc-nav button, .ly button")].find((x) => /sign in/i.test(x.textContent));
      if (!b) return false;
      b.click();
      return true;
    },
  },
  verifyOtherPalette: OTHER[0] || BRAND,
  runs,
};
