// dev-shots.cjs: full-page screenshots of a page of the Layout on the dev server (or any address),
// at the given widths, light and dark, for comparing with the mockup's shots.
//
//   node --use-system-ca scripts/dev-shots.cjs [url] [outDir] [widths] [modes]
//   node --use-system-ca scripts/dev-shots.cjs http://localhost:9150/ docs/dev-shots 1440,390 light,dark
//
// One browser, one page at a time (Selldone answers parallel jobs with 429). The theme is set
// the way the footer's Theme row stores it (localStorage "ly-theme"). Lazy images are made
// eager and the page is scrolled through once, so every photo is in the shot. Selldone's
// checkout API (/buy/) is blocked, so nothing is ordered.
const path = require("path");
const fs = require("fs");
const { chromium } = require(process.env.PW || process.env.PLAYWRIGHT || (() => { try { return require.resolve("playwright"); } catch { return require("path").resolve(__dirname, "../../kalio-marketplace/node_modules/playwright"); } })());

const url = process.argv[2] || "http://localhost:9150/";
const out = path.resolve(process.argv[3] || "docs/dev-shots");
const widths = (process.argv[4] || "1440,390").split(",").map(Number);
const modes = (process.argv[5] || "light,dark").split(",");
const name = process.env.NAME || "home";
/* LS_FILE: a JSON file of extra localStorage entries (a guest order's key, copied from the live
   origin, opens that order on the dev server). EVAL_FILE: a script run once the page is ready
   (to preview a state the live data does not have; local only). */
const extraLs = process.env.LS_FILE ? JSON.parse(fs.readFileSync(process.env.LS_FILE, "utf8")) : {};
const evalJs = process.env.EVAL_FILE ? fs.readFileSync(process.env.EVAL_FILE, "utf8") : "";

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  for (const mode of modes) {
    for (const w of widths) {
      const ctx = await browser.newContext({ viewport: { width: w, height: w < 600 ? 844 : 900 }, deviceScaleFactor: 1, isMobile: w < 600, hasTouch: w < 600 });
      await ctx.addInitScript(([m, ls]) => {
        try {
          localStorage.setItem("ly-theme", JSON.stringify({ palette: "tan", mode: m }));
          for (const k of Object.keys(ls)) localStorage.setItem(k, ls[k]);
        } catch (e) {}
      }, [mode, extraLs]);
      await ctx.route(/\/buy\//, (r) => (r.request().resourceType() === "fetch" || r.request().resourceType() === "xhr" ? r.abort() : r.continue()));
      const page = await ctx.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 180000 });
      await page.waitForSelector(process.env.WAIT || ".ly .ftr", { timeout: 180000 });
      await page.waitForTimeout(2500);
      if (evalJs) {
        await page.evaluate(evalJs);
        await page.waitForTimeout(800);
      }
      await page.evaluate(async () => {
        document.querySelectorAll('img[loading="lazy"]').forEach((i) => (i.loading = "eager"));
        for (let y = 0; y < document.body.scrollHeight; y += 600) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 60));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(1500);
      await page.evaluate(() => Promise.all([...document.images].filter((i) => !i.complete).map((i) => new Promise((r) => { i.onload = i.onerror = r; setTimeout(r, 4000); }))));
      const file = path.join(out, `${name}-${w}-${mode}.png`);
      if (!process.env.NO_FULL) await page.screenshot({ path: file, fullPage: true });
      const info = await page.evaluate(() => ({ h: document.documentElement.scrollHeight, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
      console.log(file, JSON.stringify(info), errors.length ? "ERRORS: " + errors.slice(0, 3).join(" | ") : "");
      /* OVERLAYS="menu,drawer,dd-shop,srch,rgp": open each layer by its button, shoot the window. */
      for (const id of (process.env.OVERLAYS || "").split(",").filter(Boolean)) {
        const btn = page.locator(`[aria-controls="${id}"]:visible`).first();
        if (!(await btn.count())) {
          console.log("  no visible button for", id);
          continue;
        }
        await btn.click();
        await page.waitForTimeout(700);
        const shot = path.join(out, `${name}-${w}-${mode}-${id}.png`);
        await page.screenshot({ path: shot });
        console.log("  ", shot);
        await page.keyboard.press("Escape");
        await page.waitForTimeout(400);
      }
      await ctx.close();
    }
  }
  await browser.close();
})();
