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
  for (let i = 0; i < 8; i++) {
    const rm = pg.locator("button.cr-rm").filter({ visible: true }).first();
    if (!(await rm.count())) break;
    await rm.click();
    await pg.waitForTimeout(2000);
  }
  console.log("bag emptied:", (await pg.locator("button.cr-rm").count()) === 0);
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
      localStorage.setItem("ly-theme", JSON.stringify({ palette: "tan", mode: m }));
    } catch (e) {}
  }, mode);
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
        [k + "-home", async (pg) => { await push(pg, "/"); await settle(pg); }],
        [k + "-category", async (pg) => { await push(pg, "/croissants-category"); await settle(pg, 3500); }],
        [k + "-product", async (pg) => { await push(pg, "/product/720375"); await settle(pg, 4000); }],
        [
          k + "-cart",
          async (pg) => {
            for (const id of [720375, 720385, 720424]) {
              await push(pg, "/product/" + id);
              await pg.waitForTimeout(4000);
              const add = pg.locator(".pd-buy button.btn.add, button.btn.add").filter({ visible: true }).first();
              if (await add.count()) {
                await add.click();
                await pg.waitForTimeout(2000);
              }
            }
            await push(pg, "/basket/PHYSICAL");
            await settle(pg, 4500);
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
          const r = document.querySelector(".dts-row");
          if (r) window.scrollTo(0, r.getBoundingClientRect().top + scrollY - 520);
        });
        await pg.waitForTimeout(800);
      },
    ],
  ]);
  // the cover: the desktop home and the phone home on the Tan family's plate tint, side by side
  const desk = await sharp(path.join(OUT, "desktop-home.jpg")).resize(1760, 1100).toBuffer();
  const ph = await sharp(path.join(OUT, "phone-home.jpg")).resize(476, 1030).toBuffer();
  await sharp({ create: { width: 2400, height: 1260, channels: 3, background: "#fdf2e7" } })
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
