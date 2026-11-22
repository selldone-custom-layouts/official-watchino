/*
 * The in-app splash's checks (new-shop-kits/loading/IN-APP-SPLASH.md, "Checks").
 *
 *   node --use-system-ca scripts/splash-check.mjs dev   [base=http://localhost:9150]
 *     brands (the shop's own name, a very long name, an Arabic name; the shop-info answer is changed in the test
 *     browser only) at 1440 and 390, held on screen (localStorage "ly-splash-hold", dev build only): nothing
 *     leaves the window, nothing touches the ring, the name takes two lines at most; the name and the city at
 *     4.5:1 or better on the ground in every palette, light and dark, and the custom colours.
 *   node --use-system-ca scripts/splash-check.mjs build [dist/app]
 *     the BUILT bundle through the live shop's own HTML (its domain loading frame included, as release step 5b
 *     does): 10 shots 100 ms apart around the frame's hand-over at 1440 and 390 (written to OUT, default
 *     .shots/splash), the splash gone by 4 s also on a "Slow 3G" network, no splash on a second load in the
 *     same session, no page errors.
 * PW=<playwright's index.js> (default: the "playwright" package). Prints findings and "TOTAL n".
 */
import { createRequire as __cr } from "node:module";
const { shopUrl: __shopUrl } = __cr(import.meta.url)("./lib/skin.cjs");
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";

const MODE = process.argv[2] || "dev";
/* PW may name the package's folder or its index.js */
const pwFile = (p) => (fs.existsSync(p) && fs.statSync(p).isDirectory() ? path.join(p, "index.js") : p);
const pw = process.env.PW ? await import(pathToFileURL(pwFile(process.env.PW)).href) : await import("playwright");
const chromium = pw.chromium || pw.default?.chromium;
const OUT = path.resolve(process.env.OUT || ".shots/splash");
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let total = 0;
const bad = (m) => {
  total++;
  console.log("  PROBLEM " + m);
};

function lum(rgb) {
  const [r, g, b] = rgb.map((v) => ((v /= 255) <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const rgbOf = (s) => (String(s).match(/[\d.]+/g) || []).slice(0, 3).map(Number);
const ratio = (a, b) => {
  const x = lum(rgbOf(a));
  const y = lum(rgbOf(b));
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

if (MODE === "dev") {
  const BASE = (process.argv[3] || "http://localhost:9150").replace(/\/$/, "");
  const browser = await chromium.launch();
  const open = async (w, { title, theme } = {}) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: w < 600 ? 844 : 900 }, isMobile: w < 600, hasTouch: w < 600 });
    await ctx.addInitScript((theme) => {
      try {
        localStorage.setItem("ly-splash-hold", "1");
        if (theme) localStorage.setItem("ly-theme", JSON.stringify(theme));
      } catch {}
    }, theme || null);
    if (title)
      await ctx.route(/\/shops\/@[^/]+\/info(\?|$)/, async (route) => {
        const res = await route.fetch();
        const body = await res.json();
        if (body?.shop) body.shop.title = title;
        await route.fulfill({ response: res, json: body });
      });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
    await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 180000 });
    await page.waitForSelector(".ly-splash .ly-splash__name", { timeout: 180000 });
    await page.waitForSelector(".ly .ftr", { timeout: 180000 });
    await sleep(1500);
    return { ctx, page, errors };
  };
  const geometry = (page) =>
    page.evaluate(() => {
      const q = (s) => document.querySelector(s)?.getBoundingClientRect();
      const mark = q(".ly-splash__mark");
      const brand = q(".ly-splash__brand");
      const name = document.querySelector(".ly-splash__name");
      const lh = parseFloat(getComputedStyle(name).lineHeight) || parseFloat(getComputedStyle(name).fontSize) * 1.05;
      const lines = Math.round(name.getBoundingClientRect().height / lh);
      return { mark, brand, lines, vw: innerWidth, vh: innerHeight, text: name.textContent, sub: document.querySelector(".ly-splash__sub")?.textContent || "" };
    });
  for (const [label, title] of [["own", null], ["long", "Maison Pâtisserie du Marais Saint-Germain"], ["arabic", "حلويات الشام الدمشقية"]]) {
    for (const w of [1440, 390]) {
      const { ctx, page, errors } = await open(w, { title });
      const g = await geometry(page);
      const out = g.brand.left < 0 || g.brand.right > g.vw || g.brand.bottom > g.vh || g.brand.top < 0;
      const touch = g.brand.top < g.mark.bottom + 8;
      console.log(`${label} ${w}: "${g.text}" / "${g.sub}" lines=${g.lines} brand=[${Math.round(g.brand.left)},${Math.round(g.brand.top)},${Math.round(g.brand.width)}x${Math.round(g.brand.height)}]`);
      if (out) bad(`${label} ${w}: the brand leaves the window`);
      if (touch) bad(`${label} ${w}: the brand touches the ring`);
      if (g.lines > 2) bad(`${label} ${w}: the name takes ${g.lines} lines`);
      if (errors.length) bad(`${label} ${w}: page errors ${errors.join(" | ")}`);
      await page.screenshot({ path: path.join(OUT, `splash-${label}-${w}.png`) });
      await ctx.close();
    }
  }
  const themes = [];
  for (const p of ["tan", "rose", "sage", "slate", "ink"]) for (const m of ["light", "dark"]) themes.push({ palette: p, mode: m });
  for (const c of ["#ffff00", "#00ffff", "#111111"]) for (const m of ["light", "dark"]) themes.push({ palette: "custom", custom: c, mode: m });
  for (const th of themes) {
    const { ctx, page } = await open(1440, { theme: th });
    const col = await page.evaluate(() => {
      const cs = (s) => getComputedStyle(document.querySelector(s));
      return { bg: cs(".ly-splash").backgroundColor, name: cs(".ly-splash__name").color, sub: cs(".ly-splash__sub").color, arc: cs(".ly-splash__arc").stroke };
    });
    const rn = ratio(col.name, col.bg);
    const rs = ratio(col.sub, col.bg);
    const tag = th.palette === "custom" ? th.custom : th.palette;
    console.log(`contrast ${tag} ${th.mode}: name ${rn.toFixed(2)} sub ${rs.toFixed(2)} (bg ${col.bg})`);
    if (rn < 4.5) bad(`contrast ${tag} ${th.mode}: the name ${rn.toFixed(2)}:1`);
    if (rs < 4.5) bad(`contrast ${tag} ${th.mode}: the city ${rs.toFixed(2)}:1`);
    await ctx.close();
  }
  await browser.close();
} else {
  /* the built bundle through the live shop's HTML (the loader pointed at dist/app, as prod-check.mjs) */
  const APP = path.resolve(process.argv[3] || "dist/app");
  const SHOP = (__shopUrl()).replace(/\/$/, "");
  const PORT = Number(process.env.PORT || 9152);
  const BASE = `http://localhost:${PORT}`;
  const MIME = { ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2", ".json": "application/json" };
  let html = "";
  for (let attempt = 1; !html; attempt++) {
    try {
      html = await (await fetch(`${SHOP}/?ly-splash-check=${Date.now()}`, { headers: { Accept: "text/html" } })).text();
    } catch (e) {
      if (attempt === 4) throw e;
      console.log(`(the storefront HTML did not come: ${e.cause?.code || e.message}; again in ${attempt * 5}s)`);
      await sleep(attempt * 5000);
    }
  }
  const before = html;
  html = html
    .replace(/https?:\\\/\\\/[^"]*?\\\/layouts\\\/\d+\\\/releases\\\/[0-9A-Za-z]{26}\\\/app\\\/shop\.(js|css)/g, (_m, ext) => `http:\\/\\/localhost:${PORT}\\/__ly\\/app\\/shop.${ext}`)
    .replace(/"assetBases":\[/, `"assetBases":["http:\\/\\/localhost:${PORT}\\/__ly\\/",`)
    .replace(/"local":false/, '"local":true');
  if (html === before) {
    console.error("the shop's loader has no release to point at the build");
    process.exit(2);
  }
  console.log(`domain loading frame in the page: ${/selldone-app-loaded|ld-mark|pl-mark/.test(html) ? "yes" : "NO"}`);
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
  const browser = await chromium.launch();
  for (const w of [1440, 390]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w < 600 ? 844 : 900 }, isMobile: w < 600, hasTouch: w < 600 });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
    await page.route((u) => !/localhost/.test(u.host) && /\/buy\//.test(u.pathname), (r) => r.abort());
    /* when the splash appears and goes, against navigation start */
    await page.addInitScript(() => {
      window.__sp = { shown: null, gone: null };
      const t = () => {
        const on = !!document.querySelector(".ly-splash");
        if (on && window.__sp.shown === null) window.__sp.shown = Math.round(performance.now());
        if (!on && window.__sp.shown !== null && window.__sp.gone === null) window.__sp.gone = Math.round(performance.now());
        if (performance.now() < 9000) setTimeout(t, 20);
      };
      t();
    });
    await page.goto(BASE + "/", { waitUntil: "commit", timeout: 120000 });
    /* 10 shots around the hand-over (the frame goes about 150 ms after the app starts) */
    await page.waitForFunction(() => window.__sp && (window.__sp.shown !== null || performance.now() > 6000), null, { timeout: 30000 }).catch(() => {});
    for (let i = 0; i < 10; i++) {
      await page.screenshot({ path: path.join(OUT, `handover-${w}-${String(i).padStart(2, "0")}.png`) });
      await sleep(100);
    }
    await sleep(4500);
    const sp = await page.evaluate(() => window.__sp);
    console.log(`${w}: splash shown at ${sp.shown} ms, gone at ${sp.gone} ms (navigation start = 0)`);
    if (sp.shown === null) bad(`${w}: the splash never showed on the first load`);
    if (sp.gone === null || sp.gone > 4400) bad(`${w}: the splash was still up after 4 s (${sp.gone})`);
    /* a second load in the same session: no splash */
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector(".ly .ftr", { timeout: 60000 }).catch(() => {});
    const again = await page.evaluate(() => window.__sp.shown);
    console.log(`${w}: second load in the session: ${again === null ? "no splash" : "splash at " + again + " ms"}`);
    if (again !== null) bad(`${w}: the splash showed again on a second load`);
    if (errors.length) bad(`${w}: page errors ${errors.join(" | ")}`);
    await ctx.close();
  }
  /* Slow 3G: still gone by 4 s */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 400, downloadThroughput: (500 * 1024) / 8, uploadThroughput: (500 * 1024) / 8 });
    await page.addInitScript(() => {
      window.__sp = { shown: null, gone: null };
      const t = () => {
        const on = !!document.querySelector(".ly-splash");
        if (on && window.__sp.shown === null) window.__sp.shown = Math.round(performance.now());
        if (!on && window.__sp.shown !== null && window.__sp.gone === null) window.__sp.gone = Math.round(performance.now());
        if (performance.now() < 60000) setTimeout(t, 20);
      };
      t();
    });
    await page.goto(BASE + "/", { waitUntil: "commit", timeout: 180000 });
    await page.waitForFunction(() => window.__sp && window.__sp.shown !== null && (window.__sp.gone !== null || performance.now() - window.__sp.shown > 8000), null, { timeout: 120000 }).catch(() => {});
    const sp = await page.evaluate(() => window.__sp);
    console.log(`slow 3G: splash shown at ${sp.shown} ms, gone at ${sp.gone} ms`);
    if (sp.shown !== null && (sp.gone === null || sp.gone > Math.max(4400, sp.shown + 400))) bad(`slow 3G: the splash stayed past 4 s (${sp.gone})`);
    await ctx.close();
  }
  await browser.close();
  server.close();
}
console.log(`TOTAL ${total}`);
process.exit(total ? 1 : 0);
