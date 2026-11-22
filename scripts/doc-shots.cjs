// docs/screenshots from the live shop: desktop 1440×900 and phone 390×844 (home, collection, product,
// a filled bag), the dark home on both, the Theme row, and a 2400×1260 cover.
//   node --use-system-ca scripts/doc-shots.cjs [base = the skin's live domain]
// One browser, one page at a time (the live shop rate-limits parallel browsers). The bag is filled
// through the Layout's own "Add to bag" (a guest bag; nothing is ordered) and emptied again at the end.
"use strict";
const path = require("path");
const fs = require("fs");
const { chromium } = require(process.env.PW || (() => { try { return require.resolve("playwright"); } catch { return require("path").resolve(__dirname, "../../kalio-marketplace/node_modules/playwright"); } })());
const sharp = require(process.env.SHARP || (() => { try { return require.resolve("sharp"); } catch { return require("path").resolve(__dirname, "../../kalio-marketplace/node_modules/sharp"); } })());
const base = (process.argv[2] || require("./lib/skin.cjs").shopUrl()).replace(/\/$/, "");
const OUT = path.resolve(__dirname, "../docs/screenshots");
/* the skin's own test inputs, theme key and brand palette (not the first Layout's) */
const SK = JSON.parse(fs.readFileSync(path.join(__dirname, "../skins", require("./lib/skin.cjs").activeName(path.resolve(__dirname, "..")), "skin.json"), "utf8"));
const P1 = String(SK.checks.product), P2 = String(SK.checks.product2);
const CAT = SK.checks.category;
const THEME_KEY = SK.name + "-theme";
const BRAND = SK.palettes.brand;
/* a slow phone: wait for the product's own Add button before the shot (WAIT_BUY) */
const waitBuy = (pg) /* WAIT_BUY */ => pg.locator("button.btn.add, .qb").filter({ visible: true }).first().waitFor({ timeout: 30000 }).catch(() => {});
let PLATE = "#f3f3f1";
fs.mkdirSync(OUT, { recursive: true });
const push = (pg, to) =>
  pg.evaluate((to) => {
    const el = [...document.querySelectorAll("*")].find((e) => e.__vue_app__);
    el.__vue_app__.config.globalProperties.$router.push(to).catch(() => {});
  }, to);
async function settle(pg, ms = 3000) {
  await pg.waitForTimeout(ms);
  await pg.evaluate(async () => {
    document.querySelectorAll('img[loading="lazy"]').forEach((i) => (i.loading = "eager"));
    for (let y = 0; y < Math.min(document.documentElement.scrollHeight, 6000); y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
    window.scrollTo(0, 0);
  });
  /* every photo in, then back at the top (the topbar shows only there) */
  await pg.evaluate(() => Promise.all([...document.images].filter((i) => !i.complete).map((i) => new Promise((r) => { i.onload = i.onerror = r; setTimeout(r, 6000); }))));
  await pg.waitForTimeout(1200);
  await pg.evaluate(() => window.scrollTo(0, 0));
  await pg.waitForTimeout(600);
}
async function emptyBag(pg) {
  await pg.goto(base + "/basket/PHYSICAL", { waitUntil: "domcontentloaded", timeout: 180000 });
  await pg.waitForSelector(".ly .ftr", { timeout: 180000 });
  await pg.waitForTimeout(4000);
  /* a line's "−" (the first button of its .qb) takes one out; at 1 it takes the line out */
  const minus = () => pg.locator(".qb > button:first-child").filter({ visible: true }).first();
  for (let i = 0; i < 16 && (await minus().count()); i++) {
    await minus().click();
    await pg.waitForTimeout(1800);
  }
  console.log("bag emptied:", (await pg.locator(".qb").filter({ visible: true }).count()) === 0);
}
async function shoot(phone, mode, jobs, after) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: phone ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    hasTouch: phone,
    isMobile: phone,
  });
  await ctx.addInitScript((m) => {
    try {
      localStorage.setItem(m.key, JSON.stringify({ palette: m.palette, mode: m.mode }));
    } catch (e) {}
  }, { key: THEME_KEY, palette: BRAND, mode });
  const pg = await ctx.newPage();
  await pg.goto(base + "/", { waitUntil: "domcontentloaded", timeout: 180000 });
  await pg.waitForSelector(".ly .ftr", { timeout: 180000 });
  for (const [name, fn] of jobs) {
    await fn(pg);
    const file = path.join(OUT, name + ".jpg");
    await pg.screenshot({ path: file, type: "jpeg", quality: 84 });
    console.log(name);
  }
  if (after) await after(pg);
  await browser.close();
}
(async () => {
  for (const phone of [false, true]) {
    const k = phone ? "phone" : "desktop";
    await shoot(
      phone,
      "light",
      [
        [k + "-home", async (pg) => { await push(pg, "/"); await settle(pg); if (!phone) PLATE = (await pg.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--ly-plate").trim())).replace(/^(?!#|rgb).*/, "") || PLATE; }],
        [k + "-category", async (pg) => { await push(pg, CAT); await settle(pg, 3500); }],
        [k + "-product", async (pg) => { await push(pg, "/product/" + P1); await waitBuy(pg); await settle(pg, 4000); }],
        [
          k + "-cart",
          async (pg) => {
            for (const id of [P1, P2]) {
              await push(pg, "/product/" + id);
              await waitBuy(pg);
              await pg.waitForTimeout(1500);
              /* a product with sizes: the first size in stock, then Add to bag */
              const size = pg.locator(".av-g:not(.g-color) .av-o:not(.-out)").filter({ visible: true }).first();
              if (await size.count()) { await size.click(); await pg.waitForTimeout(800); }
              const add = pg.locator(".pd-buy button.btn.add, button.btn.add").filter({ visible: true }).first();
              if (await add.count()) {
                await add.click();
                await pg.waitForTimeout(2000);
                /* a drawer the add opened (its scrim would catch the next click) */
                await pg.keyboard.press("Escape");
                await pg.waitForTimeout(700);
              }
              /* a shop without guest checkout asks the guest to sign in first: close the sheet, the bag stays as it is */
              if (await pg.locator("#lg-m").filter({ visible: true }).count()) {
                await pg.keyboard.press("Escape");
                await pg.waitForTimeout(800);
                break;
              }
            }
            /* a bag drawer or sheet left open would keep the router where it is */
            await pg.keyboard.press("Escape");
            await pg.waitForTimeout(600);
            await push(pg, "/basket/PHYSICAL");
            await pg.waitForFunction(() => location.pathname.includes("/basket/"), null, { timeout: 20000 }).catch(() => {});
            await settle(pg, 4500);
            console.log("  lines in the bag:", await pg.locator(".qb").filter({ visible: true }).count());
          },
        ],
      ],
      emptyBag,
    );
    await shoot(phone, "dark", [[k + "-dark", async (pg) => { await push(pg, "/"); await settle(pg); }]]);
  }
  await shoot(false, "light", [
    [
      "desktop-theme",
      async (pg) => {
        await push(pg, "/");
        await settle(pg);
        await pg.evaluate(() => {
          const r = document.querySelector(".ftr .ts-row, .dts-row");
          if (r) window.scrollTo(0, r.getBoundingClientRect().top + scrollY - 520);
        });
        await pg.waitForTimeout(800);
      },
    ],
  ]);
  // the cover: the desktop home and the phone home on the brand family's plate tint, side by side
  const desk = await sharp(path.join(OUT, "desktop-home.jpg")).resize(1760, 1100).toBuffer();
  const ph = await sharp(path.join(OUT, "phone-home.jpg")).resize(476, 1030).toBuffer();
  await sharp({ create: { width: 2400, height: 1260, channels: 3, background: PLATE } })
    .composite([{ input: desk, left: 70, top: 80 }, { input: ph, left: 1880, top: 115 }])
    .jpeg({ quality: 84 })
    .toFile(path.join(OUT, "cover.jpg"));
  for (const old of ["desktop-light.jpg", "phone-light.jpg"]) {
    try {
      fs.unlinkSync(path.join(OUT, old));
    } catch (e) {}
  }
  console.log("cover");
})();
