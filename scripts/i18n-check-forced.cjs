// i18n-check-forced.cjs (the Layout, from Galio): the kit's i18n-check.cjs for a shop that sells in English only. Bakio offers
// no other language, so the region switcher shows no language chips; this copy forces the language the way
// a shop's saved choice does (localStorage "local-shop-<SHOP>", SHOP default "bakio") and reloads, instead of
// picking it in the switcher. Run with LANGUAGES=ar. Everything else is the kit's check, unchanged.
//
// i18n-check.cjs: picks each of the shop's languages through the region switcher (the header pill at desktop
// width, the phone menu's row and sheet at phone width), walks the pages and reports every visible text that is
// still the Layout's English source (a value of en.ts whose translation differs), plus <html dir>/<html lang>
// and the page's direction for a right-to-left language. The owner's rule (10 November 2026): after a language
// pick, every visible word the Layout itself writes is in that language.
//
// Usage (Node, from any folder):
//   I18N=<the Layout's i18n folder> MENU="<phone menu button>" CART="<header cart button>" \
//   SIGNIN="<desktop sign-in button>" SIGNIN_PHONE="<phone sign-in button>" CATEGORY="@<first category link>" \
//     node i18n-check.cjs <base-url> [wait-selector] [shots-folder]
// - I18N: a folder; every file named en.ts or *.en.ts in it (any depth) is the English, and <code>.ts or
//   *.<code>.ts the language (Molino: components/kalio/i18n, i.e. base/en.ts + molino.en.ts).
// - LANGUAGES: optional "ar,da,…" (default: every language the shop offers, read from the pill, but English).
// - WIDTHS: default "1440,390". PAGES: optional extra "name=/path" pairs. IGNORE: optional "|"-separated texts
//   that are the merchant's data and equal an English string (e.g. a menu item "Home"); "/re/" is a regex
//   (e.g. "/ each$/" for a product unit "each" after the translated "per").
// - Pages: home (and its footer), a category (CATEGORY "@selector" = the first such link on the home), its first
//   product, the cart drawer empty and with one line, the phone menu (phone width), sign-in, FAQ (/faq) and a 404.
// It prints each hit as "<width> <lang> <page>: "<text>" = <key>" and "TOTAL n". Deliver at 0.
const fs = require("fs");
const path = require("path");
const PW = process.env.PW || (() => { try { return require.resolve("playwright"); } catch { return require("path").resolve(__dirname, "../../kalio-marketplace/node_modules/playwright"); } })();
const { chromium } = require(PW);
const [base0, WAIT = "footer", SHOTS = ""] = process.argv.slice(2);
if (!base0 || !process.env.I18N) {
  console.error("usage: I18N=<folder> node i18n-check.cjs <base-url> [wait-selector] [shots-folder]");
  process.exit(2);
}
const base = base0.replace(/\/$/, "");
const WIDTHS = (process.env.WIDTHS || "1440,390").split(",").map(Number);
const MENU = process.env.MENU || "";
const CART = process.env.CART || "";
const SIGNIN = process.env.SIGNIN || "";
const SIGNIN_PHONE = process.env.SIGNIN_PHONE || SIGNIN;
const CATEGORY = process.env.CATEGORY || "";
/* Git Bash (MSYS) rewrites a path-like value in an env var: "/faq" arrives as "C:/Program Files/Git/faq",
   and "/ each$/" as "C:/Program Files/Git/ each$/". The page would then be the 404 and pass. Undo it, and
   say so (better: set MSYS_NO_PATHCONV=1). */
function unmsys(p) {
  const m = String(p).match(/^[A-Za-z]:[\/](?:.*?[\/])?Git[\/](.*)$/);
  if (!m) return p;
  const fixed = "/" + m[1].split("\\").join("/");
  console.warn(`note: "${p}" was rewritten by Git Bash; using "${fixed}" (set MSYS_NO_PATHCONV=1 to avoid this)`);
  return fixed;
}
const IGNORE = new Set((process.env.IGNORE || "").split("|").map((s) => unmsys(s.trim())).filter(Boolean));
const EXTRA = (process.env.PAGES || "").split(",").filter(Boolean).map((p) => p.split("=")).map(([n, ...r]) => [n, unmsys(r.join("="))]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── dictionaries ── */
const files = [];
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : files.push(path.join(d, e.name))));
walk(process.env.I18N);
const load = (f) => {
  const o = {};
  for (const m of fs.readFileSync(f, "utf8").matchAll(/^\s+("(?:[^"\\]|\\.)*")\s*:\s*("(?:[^"\\]|\\.)*")\s*,?\s*$/gm)) o[JSON.parse(m[1])] = JSON.parse(m[2]);
  return o;
};
const dictOf = (code) => Object.assign({}, ...files.filter((f) => new RegExp(`(^|[\\\\/.])${code}\\.ts$`).test(f)).map(load));
const EN = dictOf("en");
if (!Object.keys(EN).length) {
  console.error("no en.ts found under", process.env.I18N);
  process.exit(2);
}

/* The English texts that must not show in <code>: each English value whose translation differs, as a
   pattern ({x} matches any text). Short or symbol-only values are skipped. */
function needles(code) {
  const L = dictOf(code);
  const out = [];
  for (const [k, en] of Object.entries(EN)) {
    const own = L[k] ?? L[k.replace(/\.(one|other)$/, ".other")];
    if (own !== undefined && own.trim() === en.trim()) continue;
    const letters = en.replace(/\{\w+\}/g, "").replace(/[^A-Za-z]+/g, "");
    if (letters.length < 4) continue; // "{a} and {b}", "{n}%": too little of our own to tell
    // {n} is a number in any script; another placeholder is a short value without sentence punctuation
    const NUM = "[\\d.,\\s\\u0660-\\u0669\\u06F0-\\u06F9\\u0966-\\u096F\\u0A66-\\u0A6F]+";
    const esc = en
      .trim()
      .replace(/[.*+?^$()|[\]\\]/g, "\\$&")
      .replace(/\\?\{(\w+)\\?\}/g, (_m, name) => (name === "n" ? NUM : "[^.!?]{1,40}?"));
    out.push({ key: k, en: en.trim(), re: `^${esc}$` });
  }
  return out;
}

/* In the page: visible texts (one per text node, joined per element line) that equal an English needle. */
const scan = ({ list, ignore }) => {
  const res = list.map((n) => ({ ...n, rx: new RegExp(n.re, "s") }));
  const hits = [];
  const seen = new Set();
  const visible = (el) => {
    for (let e = el; e && e !== document.body; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity === 0) return false;
    }
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  };
  const texts = new Set();
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = tw.nextNode(); n; n = tw.nextNode()) {
    const s = n.nodeValue.replace(/\s+/g, " ").trim();
    if (!s || !/[A-Za-z]{2}/.test(s)) continue;
    const el = n.parentElement;
    if (!el || ["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA"].includes(el.tagName) || el.closest("[contenteditable], .rs-chips, i, .v-icon, .material-icons")) continue;
    if (!visible(el)) continue;
    texts.add(s);
    const whole = el.innerText ? el.innerText.replace(/\s+/g, " ").trim() : "";
    if (whole && whole.length < 160) texts.add(whole);
  }
  for (const el of document.querySelectorAll("[aria-label], [placeholder], [title]")) {
    if (!visible(el)) continue;
    for (const a of ["aria-label", "placeholder", "title"]) {
      const v = (el.getAttribute(a) || "").trim();
      if (v && /[A-Za-z]{2}/.test(v)) texts.add(v);
    }
  }
  for (const s of texts) {
    if (ignore.some((x) => (x.startsWith("/") && x.endsWith("/") ? new RegExp(x.slice(1, -1)).test(s) : x === s))) continue;
    const m = res.find((n) => n.rx.test(s));
    if (m && !seen.has(s)) {
      seen.add(s);
      hits.push(`"${s.slice(0, 90)}" = ${m.key}`);
    }
  }
  return hits;
};

async function push(pg, p) {
  // The router's promise is not awaited (the app may redraw under it after a language pick).
  for (let i = 0; i < 3; i++) {
    try {
      await pg.evaluate((p) => {
        [...document.querySelectorAll("*")].find((e) => e.__vue_app__).__vue_app__.config.globalProperties.$router.push(p);
        return 1;
      }, p);
      return;
    } catch (e) {
      await pg.waitForTimeout(1500);
    }
  }
}
async function settle(pg, ms = 3500) {
  await pg.waitForTimeout(ms);
  for (let y = 0; y < 6; y++) {
    await pg.evaluate((k) => window.scrollTo(0, k * innerHeight), y);
    await pg.waitForTimeout(250);
  }
  await pg.evaluate(() => window.scrollTo(0, 0));
  await pg.waitForTimeout(300);
}
async function closeOverlays(pg) {
  await pg.keyboard.press("Escape").catch(() => {});
  await pg.evaluate(() => document.querySelectorAll(".v-overlay--active .v-overlay__scrim, .v-navigation-drawer__scrim").forEach((s) => s.click()));
  await pg.waitForTimeout(500);
}
async function pickLanguage(pg, code, phone) {
  const shop = process.env.SHOP || require("./lib/skin.cjs").readSkin().skin.shop.xapi;
  await pg.evaluate(([k, v, d]) => { localStorage.setItem(k, v); localStorage.setItem(d, v); }, ["local-shop-" + shop, code, process.env.DEV_LANG_KEY || require("./lib/skin.cjs").storageKey("dev-languages")]);
  await pg.reload({ waitUntil: "domcontentloaded" });
  await pg.waitForSelector(WAIT, { timeout: 90000 }).catch(() => {});
  await pg.waitForFunction((c) => document.documentElement.lang === c, code, { timeout: 30000 }).catch(() => {});
  await pg.waitForTimeout(4000);
  await closeOverlays(pg);
}

(async () => {
  const b = await chromium.launch();
  let total = 0;
  for (const w of WIDTHS) {
    const phone = w < 768;
    const ctx = await b.newContext({ viewport: { width: w, height: phone ? 844 : 900 }, isMobile: phone, hasTouch: phone });
    const pg = await ctx.newPage();
    for (let i = 0; i < 4; i++) {
      try {
        await pg.goto(base + "/", { waitUntil: "domcontentloaded", timeout: 90000 });
        await pg.waitForSelector(WAIT, { timeout: 60000 });
        break;
      } catch (e) {
        console.log("retry", i + 1);
        await sleep(6000 * (i + 1));
      }
    }
    await pg.waitForTimeout(3000);
    let langs = (process.env.LANGUAGES || "").split(",").filter(Boolean);
    if (!langs.length) {
      if (phone && MENU) await pg.click(MENU), await pg.click(".rs-row").catch(() => {});
      else await pg.click(".rs-pick__btn").catch(() => {});
      await pg.waitForTimeout(800);
      langs = await pg.evaluate(() => [...document.querySelectorAll(".rs-chip[lang]")].map((c) => c.getAttribute("lang")).filter((c) => c !== "en"));
      await closeOverlays(pg);
      if (phone) await closeOverlays(pg);
    }
    /* Besti, 11 Nov 2026: while Selldone answers 429 the shop's language list never
       arrives, the pill shows no language chips, and this loop used to run zero times
       and print TOTAL 0 having tested nothing. An empty list is a failure, not a pass. */
    if (!langs.length) {
      console.log(`${w}: NO LANGUAGES FOUND (the pill showed no language chips; Selldone may be answering 429). Re-run later or set LANGUAGES=ar,…`);
      total += 1;
    }
    for (const code of langs) {
      await pickLanguage(pg, code, phone);
      const list = needles(code);
      const ignore = [...IGNORE];
      const report = async (name) => {
        const hits = await pg.evaluate(scan, { list, ignore });
        const rtlWanted = ["ar", "fa", "he", "ur"].includes(code);
        const dir = await pg.evaluate(() => ({ dir: document.documentElement.dir, lang: document.documentElement.lang, body: getComputedStyle(document.body).direction }));
        if (dir.lang !== code) hits.push(`<html lang="${dir.lang}"> (want ${code})`);
        if (rtlWanted && (dir.dir !== "rtl" || dir.body !== "rtl")) hits.push(`direction ${dir.dir}/${dir.body} (want rtl)`);
        if (!rtlWanted && dir.dir === "rtl") hits.push(`direction rtl (want ltr)`);
        total += hits.length;
        console.log(`${w} ${code} ${name}: ${hits.length ? "\n    " + hits.join("\n    ") : "ok"}`);
        if (SHOTS) await pg.screenshot({ path: path.join(SHOTS, `${code}-${w}-${name}.png`) }).catch(() => {});
      };
      await push(pg, "/");
      await settle(pg);
      await report("home");
      await pg.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await pg.waitForTimeout(1200);
      await report("footer");
      if (CATEGORY) {
        await push(pg, "/");
        await pg.waitForTimeout(2500);
        let href = CATEGORY;
        if (CATEGORY.startsWith("@")) href = await pg.evaluate((s) => document.querySelector(s)?.getAttribute("href"), CATEGORY.slice(1));
        if (href) {
          await push(pg, href.replace(/^https?:\/\/[^/]+/, ""));
          await settle(pg, 4500);
          await report("category");
          const prod = await pg.evaluate(() => document.querySelector('a[href*="/product/"]')?.getAttribute("href"));
          if (prod) {
            await push(pg, prod.replace(/^https?:\/\/[^/]+/, ""));
            await settle(pg, 4500);
            await report("product");
          }
        }
      }
      if (CART) {
        await pg.evaluate(() => window.scrollTo(0, 0));
        await pg.click(CART).catch(() => {});
        await pg.waitForTimeout(2000);
        await report("cart-empty");
        await closeOverlays(pg);
        await pg.evaluate(() => {
          const app = [...document.querySelectorAll("*")].find((e) => e.__vue_app__).__vue_app__.config.globalProperties;
          const p = app.$store.getters.getCurrentProduct || { id: 1, price: 5, currency: "USD", title: "Test item" };
          const items = [{ id: 901, product_id: p.id, variant_id: null, count: 1, price: p.price || 5, dis: 0, currency: p.currency || "USD", product: { id: p.id, title: p.title, icon: p.icon, type: "PHYSICAL", quantity: 9, category_id: p.category_id } }];
          app.$store.commit("setBasketPhysical", { id: 1, type: "PHYSICAL", items, price: p.price || 5, currency: p.currency || "USD", status: "Open", receiver_info: null, bill: null });
        });
        await pg.waitForTimeout(600);
        await pg.click(CART).catch(() => {});
        await pg.waitForTimeout(2000);
        await report("cart-filled");
        await closeOverlays(pg);
        await pg.evaluate(() => {
          const app = [...document.querySelectorAll("*")].find((e) => e.__vue_app__).__vue_app__.config.globalProperties;
          app.$store.commit("setBasketPhysical", { id: 1, type: "PHYSICAL", items: [], price: 0, currency: "USD", status: "Open", receiver_info: null, bill: null });
        });
      }
      if (phone && MENU) {
        await pg.evaluate(() => window.scrollTo(0, 0));
        await pg.click(MENU).catch(() => {});
        await pg.waitForTimeout(1500);
        await report("phone-menu");
        await closeOverlays(pg);
      }
      const signin = phone ? SIGNIN_PHONE : SIGNIN;
      if (signin) {
        await pg.evaluate(() => window.scrollTo(0, 0));
        await pg.click(signin).catch(() => {});
        await pg.waitForTimeout(2500);
        await report("sign-in");
        await closeOverlays(pg);
      }
      for (const [name, p] of [["faq", "/faq"], ["404", "/kalio-i18n-check-no-such-page"], ...EXTRA]) {
        await push(pg, p).catch(() => {});
        await settle(pg, 3500);
        await report(name);
      }
    }
    await ctx.close();
  }
  console.log("TOTAL", total);
  await b.close();
  process.exit(total ? 1 : 0);
})();
