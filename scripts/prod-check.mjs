/*
 * Proves the production build mounts before it is uploaded (Galio's galio-prod-check.mjs, the kit's
 * single-vendor-shop/prod-bundle-check.mjs, adapted: SHOP_URL, the root .ly and the Layout's page walk).
 *
 * Dev checks never see chunking bugs: the dev server does not bundle. Galio 1.0.0 passed every dev check
 * and was blank live, because a Prism language file had been put in the core chunk and ran before Prism.
 * So before every upload this script loads the built `dist/app` exactly the way Selldone does:
 *
 *  1. A local server (port 9146) answers every page address with the shop's real storefront HTML,
 *     fetched from SHOP_URL (default: the skin's live domain, skins/<name>/skin.json shop.domain), with one change: Selldone's layout
 *     loader (window.sdShopLayout) is pointed at this folder's `dist/app/shop.js` and `shop.css`, served
 *     from http://localhost:9151/__ly/app/ (the loader's `local` switch allows http for that). The
 *     metas, the shop, the loader itself and every API call are Selldone's own. Every page address gets
 *     the home's HTML (the app routes in the browser), so no bot SEO page is ever involved.
 *  2. Headless Chromium opens the home, then moves in the app (the router, as a visitor clicks) to a
 *     collection, a product of it, the journal, a post, the bag with one piece and the checkout. On each
 *     page the Layout's root (.ly) must be drawn and no page error may happen.
 *
 * Usage: node --use-system-ca scripts/prod-check.mjs [dist/app]     (after `npx vite build`)
 * Prints one line per page and "PROD-CHECK OK" or "PROD-CHECK FAILED n"; exits 1 on failure.
 * Nothing is ordered: the bag holds one piece in Selldone's guest basket, and Selldone's /buy/ calls are
 * blocked.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const { shopUrl } = createRequire(import.meta.url)("./lib/skin.cjs");

const APP = path.resolve(process.argv[2] || "dist/app");
const SHOP = (shopUrl()).replace(/\/$/, "");
const PORT = Number(process.env.PORT || 9151);
/* SHOTS=<dir>: a screenshot of every page walked (the home full length), to look at the built bundle */
const SHOTS = process.env.SHOTS ? path.resolve(process.env.SHOTS) : "";
const WIDTH = Number(process.env.WIDTH || 1440);
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const BASE = `http://localhost:${PORT}`;
/* Playwright: PW (a path to its index.js), else the installed package, else the workspace's copy beside this repo */
const PW = process.env.PW || (() => {
  try {
    return createRequire(import.meta.url).resolve("playwright");
  } catch {
    return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../kalio-marketplace/node_modules/playwright/index.js");
  }
})();
const MIME = { ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2", ".json": "application/json", ".m4v": "video/mp4" };

if (!fs.existsSync(path.join(APP, "shop.js"))) {
  console.error(`no ${path.join(APP, "shop.js")}: build first (npx vite build)`);
  process.exit(2);
}

/* The shop's storefront HTML, once, with the loader pointed at the local build. */
let html = "";
for (let attempt = 1; !html; attempt++) {
  try {
    html = await (await fetch(`${SHOP}/?prod-check=${Date.now()}`, { headers: { Accept: "text/html" } })).text();
  } catch (e) {
    if (attempt === 4) throw e;
    console.log(`(the storefront HTML did not come: ${e.cause?.code || e.message}; again in ${attempt * 5}s)`);
    await new Promise((r) => setTimeout(r, attempt * 5000));
  }
}
const before = html;
html = html
  .replace(/https?:\\\/\\\/[^"]*?\\\/layouts\\\/\d+\\\/releases\\\/[0-9A-Za-z]{26}\\\/app\\\/shop\.(js|css)/g, (_m, ext) => `http:\\/\\/localhost:${PORT}\\/__ly\\/app\\/shop.${ext}`)
  .replace(/"assetBases":\[/, `"assetBases":["http:\\/\\/localhost:${PORT}\\/__ly\\/",`)
  .replace(/"local":false/, '"local":true');
if (html === before || !html.includes(`localhost:${PORT}\\/__ly\\/app\\/shop.js`)) {
  console.error(`${SHOP} has no private Layout release in its loader to point at the local build; use a SHOP_URL whose domain has a Layout pinned`);
  process.exit(2);
}

const server = http
  .createServer((req, res) => {
    const url = new URL(req.url, BASE);
    if (url.pathname.startsWith("/__ly/app/")) {
      const file = path.join(APP, decodeURIComponent(url.pathname.slice("/__ly/app/".length)));
      if (!file.startsWith(APP) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404);
        return res.end();
      }
      res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream", "access-control-allow-origin": "*", "cache-control": "no-store" });
      return fs.createReadStream(file).pipe(res);
    }
    if (/\.[a-z0-9]{2,5}$/i.test(url.pathname)) {
      res.writeHead(404);
      return res.end();
    }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    res.end(html);
  })
  .listen(PORT);

/* PW may name the package's folder or its index.js */
const PW_FILE = fs.existsSync(PW) && fs.statSync(PW).isDirectory() ? path.join(PW, "index.js") : PW;
const pw = await import("file:///" + PW_FILE.replace(/\\/g, "/"));
const chromium = pw.chromium || pw.default?.chromium;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: WIDTH, height: WIDTH < 600 ? 844 : 900 } });
const page = await ctx.newPage();
await page.route((u) => !/localhost/.test(u.host) && /\/buy\//.test(u.pathname), (r) => r.abort());
let errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 300)));
const fromLocal = new Set();
page.on("response", (r) => {
  if (r.url().startsWith(`${BASE}/__ly/app/`)) fromLocal.add(r.url().split("/__ly/app/")[1]);
});

let failed = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const push = (to) => page.evaluate((p) => window.$global_router.push(p).catch(() => {}), to);
async function check(name) {
  await page.waitForSelector(".ly .ftr", { timeout: 60000 }).catch(() => {});
  await sleep(3500);
  const st = await page.evaluate(() => ({ ly: document.querySelectorAll(".ly").length, text: (document.querySelector("#app")?.innerText || "").trim().length, path: location.pathname + location.search }));
  const bad = !st.ly || st.text < 50 || errors.length;
  if (bad) failed++;
  if (SHOTS) {
    /* the page as a visitor sees it: every section's data in, every lazy photo loaded */
    await page.evaluate(async () => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      await sleep(4000);
      for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.8) {
        scrollTo(0, y);
        await sleep(150);
      }
      scrollTo(0, 0);
      await sleep(1500);
    });
    await page.screenshot({ path: path.join(SHOTS, `${name}-${WIDTH}.png`), fullPage: name === "home" }).catch(() => {});
  }
  console.log(`${bad ? "FAIL" : "ok  "} ${name.padEnd(9)} ${st.path}  .ly=${st.ly} text=${st.text}${errors.length ? "  errors: " + errors.join(" | ") : ""}`);
  errors = [];
}

try {
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await check("home");
  /* a blank home means the bundle does not start: nothing else to walk */
  if (failed) throw new Error("the home did not draw; the bundle does not start");
  if (process.env.DEBUG) console.log(await page.evaluate(() => [...document.querySelectorAll("a[href]")].slice(0, 30).map((a) => a.getAttribute("href")).join(" ")));
  await page.waitForSelector('a[href$="-category"]', { timeout: 60000 }).catch(() => {});
  const cat = await page.evaluate(() => document.querySelector('a[href$="-category"]')?.getAttribute("href"));
  if (cat) {
    await push(cat);
    await check("category");
  } else {
    failed++;
    console.log("FAIL category: no collection link on the home");
  }
  await page.waitForSelector('.ly a[href*="/product/"]', { timeout: 60000 }).catch(() => {});
  const prod = await page.evaluate(() => document.querySelector('a[href*="/product/"]')?.getAttribute("href"));
  if (prod) {
    await push(prod);
    await check("product");
  } else {
    failed++;
    console.log("FAIL product: no product link on the collection");
  }
  await push("/blog");
  await check("journal");
  await page.waitForSelector('.ly a[href*="/blog/"]', { timeout: 60000 }).catch(() => {});
  const post = await page.evaluate(() => [...document.querySelectorAll('.ly a[href*="/blog/"]')].map((a) => a.getAttribute("href")).find((h) => /\/blog\/[^/?#]+/.test(h)));
  if (post) {
    await push(post);
    await check("post");
  } else {
    failed++;
    console.log("FAIL post: no post on the journal");
  }
  /* one piece in the guest bag, then the bag and the checkout */
  await push("/");
  await page.waitForSelector(".ly .srow .add", { timeout: 60000 }).catch(() => {});
  const fromHome = await page.evaluate(() => {
    const b = document.querySelector(".ly .srow .add");
    if (b) b.click();
    return !!b;
  });
  /* a skin without "Today's selection": the product page's own Add button */
  if (!fromHome && prod) {
    await push(prod);
    await sleep(3500);
    await page.evaluate(() => [...document.querySelectorAll(".ly button")].find((x) => /add to/i.test(x.textContent || "") && x.offsetParent)?.click());
  }
  await sleep(3000);
  await push("/basket/PHYSICAL");
  await check("bag");
  await push("/basket/PHYSICAL?step=checkout");
  await check("checkout");
  const pieces = await page.evaluate(() => document.querySelectorAll(".ly-cartpage .rc-l li").length);
  console.log(`     checkout shows ${pieces} line(s) in "Your order"`);
  /* leave the guest bag empty again */
  await push("/basket/PHYSICAL");
  await sleep(3000);
  for (let i = 0; i < 6; i++) {
    const x = await page.$(".ly-cartpage .cr-rm");
    if (!x) break;
    await x.click();
    await sleep(2000);
  }
} catch (e) {
  failed++;
  console.log("FAIL run:", e.message);
}
console.log(`files served from the local build: ${fromLocal.size} (shop.js ${fromLocal.has("shop.js") ? "yes" : "NO"}, shop.css ${fromLocal.has("shop.css") ? "yes" : "NO"})`);
if (!fromLocal.has("shop.js")) failed++;
await browser.close();
server.close();
console.log(failed ? `PROD-CHECK FAILED ${failed}` : "PROD-CHECK OK");
process.exit(failed ? 1 : 0);
