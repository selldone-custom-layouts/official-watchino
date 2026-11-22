// text-column-check.cjs — no text squeezed into a sliver, no word broken in the middle. (The owner, 15 November
// 2026: zoomed out to 2880 CSS px, "How ordering works", the journal and the hero collapsed into a column a few
// pixels wide and every word broke letter by letter; a padding sized from the window, not the page.)
//
// For every visible element with its own words, at each width:
//   NARROW  a paragraph (140+ characters of its own) narrower than MIN px (default 240), or any running text
//           (60+ characters) narrower than 160 px — on a window of 1024 px or more (on a phone a card's lines are
//           narrow on purpose; a two-column list of short lines is about 210 px at 1440 by design);
//   BROKEN  a word of 3+ letters split across two lines (its pieces sit on different lines), at every width;
//   SQUEEZE a grid or flex track holding words that is 0–44 px wide while its box is wider than 120 px;
//   OVER    words drawn over other words (two text lines of different elements cross by more than 4 px each way).
//
// Usage: node scripts/text-column-check.cjs <base> [wait-selector]
//   PAGES="home=/,category=/x-category,…" (pages are opened in the app, as a visitor clicks; a headless browser on
//   a cold /product/ link gets Selldone's SEO page)   WIDTHS=1440,1920,2560,2880,3840,390   MIN=240   STORAGE='{…}'
//   PW=<playwright> (default: the "playwright" package, else the workspace's)
// Prints each finding and "TOTAL n". Deliver at 0.
"use strict";
let PWMOD;
try { PWMOD = require(process.env.PW || "playwright"); } catch (e) { PWMOD = require(require("path").resolve(__dirname, "../../kalio-marketplace/node_modules/playwright")); }
const { chromium } = PWMOD;
const base = (process.argv[2] || "http://localhost:9150").replace(/\/$/, "");
const WAIT = process.argv[3] || ".ly .ftr";
const PAGES = (process.env.PAGES || "home=/,category=/croissants-category,product=/product/720375,blog=/blog,article=/blog/pickup-or-delivery-36222,about=/about-us,contact=/contact-us,faq=/faq,terms=/terms,cart=/basket/PHYSICAL,account=/user,404=/no-such-page")
  .split(",").map((s) => { const i = s.indexOf("="); return [s.slice(0, i), s.slice(i + 1)]; });
const WIDTHS = (process.env.WIDTHS || "1440,1920,2560,2880,3840,390").split(",").map(Number);
const MIN = Number(process.env.MIN || 240);
const push = (pg, to) => pg.evaluate((to) => { const el = [...document.querySelectorAll("*")].find((e) => e.__vue_app__); el.__vue_app__.config.globalProperties.$router.push(to).catch(() => {}); }, to);

function audit([MIN, wide]) {
  const out = [];
  const shown = (el) => { if (el.closest("details:not([open])") && !el.closest("summary")) return false; /* a closed <details> keeps its content laid out but unseen */ for (let p = el; p && p !== document.documentElement; p = p.parentElement) { const s = getComputedStyle(p); if (s.display === "none" || s.visibility === "hidden" || Number(s.opacity) < 0.05) return false; } return true; };
  const name = (el) => (el.className && typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : el.tagName.toLowerCase());
  const path = (el) => { const o = []; for (let p = el; p && o.length < 3 && p !== document.body; p = p.parentElement) o.unshift(name(p)); return o.join(" > "); };
  /* the part of a box an ancestor that clips (overflow hidden/clip/auto) lets through: a collapsed accordion's
     text is laid out but not seen */
  const clipped = (el, q) => {
    let L = q.left, R = q.right, T = q.top, B = q.bottom;
    /* from the element itself: its own overflow and a screen-reader-only clip (`.sr`: 1 px, clip: rect(0 0 0 0)) hide
       its words too (Pralino 1.0.12: "(differs)" inside a sticky label was read as drawn over the label) */
    for (let p = el; p && p !== document.body; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (cs.position === "absolute" && /rect(0(px)?,? 0(px)?,? 0(px)?,? 0(px)?)/.test(cs.clip)) return null;
      if (/(hidden|clip|auto|scroll)/.test(cs.overflowX + cs.overflowY)) {
        const b = p.getBoundingClientRect();
        L = Math.max(L, b.left); R = Math.min(R, b.right); T = Math.max(T, b.top); B = Math.min(B, b.bottom);
        if (R - L <= 0 || B - T <= 0) return null;
      }
    }
    return { left: L, right: R, top: T, bottom: B };
  };
  const own = (el) => [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join("").replace(/\s+/g, " ").trim();
  const seen = new Set();
  for (const el of document.querySelectorAll("body *")) {
    if (["SCRIPT", "STYLE", "SVG", "svg", "NOSCRIPT", "TEXTAREA", "INPUT", "OPTION"].includes(el.tagName)) continue;
    if (el.closest("svg, .mapboxgl-map, .marq, [aria-hidden='true']")) continue;
    const txt = own(el);
    if (!txt) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1 || r.bottom < -5000) continue;
    if (!shown(el)) continue;
    const s = getComputedStyle(el);
    /* NARROW: running text in a sliver (wide windows only) */
    if (wide && s.display !== "inline" && ((txt.length >= 140 && r.width < MIN) || (txt.length >= 60 && r.width < 160))) out.push(`NARROW ${Math.round(r.width)}px  ${path(el)}: "${txt.slice(0, 40)}"`);
    /* BROKEN: a word whose pieces land on two lines */
    for (const node of el.childNodes) {
      if (node.nodeType !== 3) continue;
      const text = node.textContent;
      const re = /[\p{L}\p{N}][\p{L}\p{N}'’-]{2,}/gu;
      let m;
      let n = 0;
      while ((m = re.exec(text)) && n < 200) {
        n++;
        const range = document.createRange();
        range.setStart(node, m.index);
        range.setEnd(node, m.index + m[0].length);
        const rects = [...range.getClientRects()].filter((q) => q.width > 0.5);
        if (rects.length > 1) {
          const tops = new Set(rects.map((q) => Math.round(q.top)));
          /* a hyphenated compound may wrap after its hyphen */
          const hy = /[-]/.test(m[0]);
          if (tops.size > 1 && !hy) {
            const key = path(el) + m[0];
            if (!seen.has(key)) { seen.add(key); out.push(`BROKEN "${m[0]}" over ${tops.size} lines  ${path(el)} (${Math.round(r.width)}px wide)`); }
          }
        }
      }
    }
  }
  /* OVER: words on words (line boxes of the text itself, not the elements' boxes) */
  const lines = [];
  for (const el of document.querySelectorAll("body *")) {
    if (el.closest("svg, .marq, [aria-hidden='true'], .v-overlay")) continue;
    for (const node of el.childNodes) {
      if (node.nodeType !== 3 || !node.textContent.trim()) continue;
      if (!shown(el)) break;
      const range = document.createRange();
      range.selectNodeContents(node);
      /* the glyphs' middle band only (a line box is taller than its letters: tight headings touch, they don't overlap) */
      for (const r of range.getClientRects()) {
        if (r.width <= 3 || r.height <= 3) continue;
        const v = clipped(el, { left: r.left, right: r.right, top: r.top + r.height * 0.25, bottom: r.bottom - r.height * 0.25 });
        if (v && v.right - v.left > 3 && v.bottom - v.top > 2) lines.push({ el, q: v });
      }
    }
  }
  lines.sort((x, y) => x.q.top - y.q.top);
  const pairs = new Set();
  for (let i = 0; i < lines.length; i++) {
    const A = lines[i];
    for (let j = i + 1; j < lines.length && lines[j].q.top < A.q.bottom; j++) {
      const B = lines[j];
      if (A.el === B.el || A.el.contains(B.el) || B.el.contains(A.el)) continue;
      const w = Math.min(A.q.right, B.q.right) - Math.max(A.q.left, B.q.left);
      const h = Math.min(A.q.bottom, B.q.bottom) - Math.max(A.q.top, B.q.top);
      if (w > 4 && h > 4) {
        const key = path(A.el) + "|" + path(B.el);
        if (!pairs.has(key)) { pairs.add(key); out.push(`OVER ${Math.round(w)}x${Math.round(h)}  "${A.el.textContent.trim().slice(0, 24)}" (${path(A.el)}) on "${B.el.textContent.trim().slice(0, 24)}" (${path(B.el)})`); }
      }
    }
  }
  /* SQUEEZE: a track that holds words but is nearly nothing */
  for (const el of document.querySelectorAll("body *")) {
    const s = getComputedStyle(el);
    if (s.display !== "grid" && s.display !== "flex") continue;
    const r = el.getBoundingClientRect();
    if (r.width < 120 || r.height < 1 || !shown(el)) continue;
    for (const c of el.children) {
      const cr = c.getBoundingClientRect();
      const words = (c.textContent || "").replace(/\s+/g, " ").trim();
      if (words.length >= 12 && cr.height > 0 && cr.width < 44 && getComputedStyle(c).position !== "absolute" && shown(c)) out.push(`SQUEEZE ${Math.round(cr.width)}px  ${path(c)} in ${Math.round(r.width)}px: "${words.slice(0, 30)}"`);
    }
  }
  return out;
}

(async () => {
  const b = await chromium.launch();
  let total = 0;
  for (const w of WIDTHS) {
    const mob = w < 600;
    const ctx = await b.newContext({ viewport: { width: w, height: mob ? 844 : 1000 }, deviceScaleFactor: 1, isMobile: mob, hasTouch: mob });
    if (process.env.STORAGE) await ctx.addInitScript((st) => { for (const [k, v] of Object.entries(JSON.parse(st))) localStorage.setItem(k, v); }, process.env.STORAGE);
    await ctx.route(/^https:\/\/[^/]*selldone\.com\/.*\/buy\//, (r) => r.abort());
    const pg = await ctx.newPage();
    await pg.goto(base + "/", { waitUntil: "domcontentloaded", timeout: 120000 });
    await pg.waitForSelector(WAIT, { timeout: 120000 });
    for (const [label, to] of PAGES) {
      if (label !== "home") await push(pg, to);
      else await push(pg, "/");
      await pg.waitForTimeout(4500);
      await pg.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 800) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } window.scrollTo(0, 0); });
      await pg.waitForTimeout(800);
      const list = await pg.evaluate(audit, [MIN, w >= 1024]);
      for (const l of list) console.log(`${w} ${label}  ${l}`);
      if (!list.length) console.log(`${w} ${label}: ok`);
      total += list.length;
    }
    await ctx.close();
  }
  await b.close();
  console.log(`TOTAL ${total}`);
})().catch((e) => { console.error("FAIL", e.message); process.exit(1); });
