// the Layout (from Galio) — a Playwright wrapper for the Arabic checks on a LIVE shop that sells in one language.
//
// Bakio sells in English only, so on the live domain no visitor can pick Arabic, and the kit's Arabic
// checks (i18n-check-forced.cjs, contrast-audit.cjs with STORAGE="…ar…") stay in English there. On the dev
// server mixin/StorefrontMixin.ts adds the languages for that browser (development only). This wrapper does
// the same for a live run, at the network level and in the test browser only: every browser context it
// opens answers Selldone's shop-info call (/shops/@<shop>/info) with the shop's own JSON plus a "languages"
// option listing the shop's language and EXTRA_LANGUAGES (default "ar"). Nothing is written to the shop;
// the built Layout, its Arabic words and its right-to-left layout are exactly what a shop that enables
// Arabic would get.
//
// usage: PW=scripts/pw-shop-languages.cjs EXTRA_LANGUAGES=ar node scripts/i18n-check-forced.cjs <live base> …
//        (PW_REAL: the Playwright install to wrap; default kalio-marketplace's)
"use strict";
const real = require(process.env.PW_REAL || (() => { try { return require.resolve("playwright"); } catch { return require("path").resolve(__dirname, "../../kalio-marketplace/node_modules/playwright"); } })());
const EXTRA = (process.env.EXTRA_LANGUAGES || "ar").split(",").filter(Boolean);
let patched = 0;

async function addLanguages(route) {
  if (process.env.PW_DEBUG) console.log("pw-shop-languages: route", route.request().method(), route.request().url());
  try {
    const res = await route.fetch();
    const body = await res.json();
    const shop = body && body.shop;
    if (shop) {
      shop.options = (shop.options || []).filter((o) => o.code !== "languages");
      shop.options.push({ code: "languages", value: [shop.language || "en", ...EXTRA] });
      patched++;
    }
    await route.fulfill({ response: res, json: body });
  } catch (e) {
    if (process.env.PW_DEBUG) console.log("pw-shop-languages:", String(e.message || e).split(String.fromCharCode(10))[0]);
    await route.continue().catch(() => {});
  }
}

function wrapBrowser(browser) {
  const newContext = browser.newContext.bind(browser);
  browser.newContext = async (...args) => {
    const ctx = await newContext(...args);
    await ctx.route(/\/shops\/@[^/]+\/info(\?|$)/, addLanguages);
    return ctx;
  };
  const newPage = browser.newPage.bind(browser);
  browser.newPage = async (...args) => {
    const ctx = await browser.newContext(...args);
    return ctx.newPage();
  };
  return browser;
}

const chromium = Object.create(real.chromium);
chromium.launch = async (...args) => wrapBrowser(await real.chromium.launch(...args));
process.on("exit", () => {
  if (!patched) console.log("pw-shop-languages: the shop-info call was never seen (nothing added)");
});
module.exports = { ...real, chromium };
