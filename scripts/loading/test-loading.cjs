// test-loading.cjs: renders a loading config with other brands to prove the animation never depends on the
// logo or the name: the shop's own name, a very long name, an Arabic name, a wide logo and a tall logo, at
// 1440 and 390, as a still (reduced motion) and mid-animation. Fails (exit 1) when the brand block overflows the
// viewport, overlaps the ring, or a logo is cut. Writes <out>/sheet.png.
// Usage: node test-loading.cjs <config.json> <outDir>
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const PW = process.env.PW || path.join(__dirname, "..", "..", "kalio-marketplace", "node_modules", "playwright");
const SHARP = process.env.SHARP || path.join(__dirname, "..", "..", "kalio-marketplace", "node_modules", "sharp");
const { chromium } = require(PW);
const sharp = require(SHARP);

const [cfgPath, out] = process.argv.slice(2);
const base = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
fs.mkdirSync(out, { recursive: true });
const svg = (w, h, fill) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" rx="8" fill="${fill}"/><circle cx="${h / 2}" cy="${h / 2}" r="${h / 3}" fill="#fff"/></svg>`;
fs.writeFileSync(path.join(out, "wide.svg"), svg(640, 120, "#a0522d"));
fs.writeFileSync(path.join(out, "tall.svg"), svg(120, 320, "#2f6f4f"));

const variants = [
  ["own", {}],
  ["long", { name: "Maison Pâtisserie du Marais Saint-Germain", sub: base.sub ? "Rue des Francs-Bourgeois, Paris" : undefined }],
  ["arabic", { name: "حلويات الشام الدمشقية", sub: base.sub ? "دمشق" : undefined }],
  ["wide-logo", { logo: "https://example.invalid/wide.png" }],
  ["tall-logo", { logo: "https://example.invalid/tall.png" }],
];
const pages = [];
for (const [key, over] of variants) {
  const cfg = { ...base, ...over };
  const cp = path.join(out, `cfg-${key}.json`);
  fs.writeFileSync(cp, JSON.stringify(cfg));
  const dir = path.join(out, key);
  execFileSync(process.execPath, [path.join(__dirname, "make-loading.cjs"), cp, dir], { stdio: "ignore" });
  let html = fs.readFileSync(path.join(dir, "loading-preview.html"), "utf8");
  html = html.replace("https://example.invalid/wide.png", "../wide.svg").replace("https://example.invalid/tall.png", "../tall.svg");
  fs.writeFileSync(path.join(dir, "loading-preview.html"), html);
  pages.push([key, path.join(dir, "loading-preview.html")]);
}

(async () => {
  const b = await chromium.launch();
  let fails = 0;
  const shots = [];
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    for (const motion of ["reduce", "no-preference"]) {
      for (const [key, file] of pages) {
        const p = await b.newPage({ viewport: { width: w, height: h }, reducedMotion: motion });
        await p.goto("file:///" + file.replace(/\\/g, "/").replace(/ /g, "%20"));
        await p.waitForTimeout(motion === "reduce" ? 900 : 1300);
        const r = await p.evaluate(() => {
          const box = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
          const img = document.querySelector(".ld-logo");
          return { mark: box(".ld-mark"), brand: box(".ld-brand"), vw: innerWidth, vh: innerHeight,
            logoOk: !img || (img.complete && img.naturalWidth > 0), lines: (() => { const n = document.querySelector(".ld-name"); if (!n) return 0; return Math.round(n.getBoundingClientRect().height / parseFloat(getComputedStyle(n).lineHeight || 1)); })() };
        });
        const errs = [];
        if (r.brand.l < 0 || r.brand.r > r.vw || r.brand.b > r.vh) errs.push("brand outside viewport");
        if (r.brand.t < r.mark.b + 8) errs.push("brand touches ring");
        if (!r.logoOk) errs.push("logo not drawn");
        if (r.lines > 3) errs.push(`name on ${r.lines} lines`);
        if (errs.length) { fails += errs.length; console.log(`${w} ${motion} ${key}: ${errs.join("; ")}`); }
        if (motion === "reduce" || key === "own") {
          const f = path.join(out, `${key}-${w}-${motion}.png`);
          await p.screenshot({ path: f });
          shots.push([f, w]);
        }
        await p.close();
      }
    }
  }
  await b.close();
  // sheet: every shot scaled to 260 px tall
  const tiles = await Promise.all(shots.map(async ([f]) => sharp(f).resize({ height: 260 }).toBuffer({ resolveWithObject: true })));
  const W = tiles.reduce((s, t) => s + t.info.width + 6, 0);
  let x = 0;
  const comp = tiles.map((t) => { const c = { input: t.data, left: x, top: 0 }; x += t.info.width + 6; return c; });
  await sharp({ create: { width: W, height: 260, channels: 3, background: "#999" } }).composite(comp).png().toFile(path.join(out, "sheet.png"));
  console.log(`TOTAL ${fails}`);
  process.exit(fails ? 1 : 0);
})();
