// The shape-language and focus audit (new-shop-kits/single-vendor-shop/shape-check.cjs, Galio 1.0.5,
// adapted): pages are opened in the app (the router, as a visitor clicks; a headless browser on a cold /product/
// gets Selldone's SEO page), and the overlays are the Layout's own (Shop menu, search, the language & currency
// panel, the phone menu, the bag drawer, the filter sheet, quick view, the sign-in sheet).
//
// For every visible box with a visible edge (a fill that differs from what is behind it, a ring or a border on
// two sides) each corner must be on the Layout's scale: circle/pill (radius ≥ half the short side), panel 8 px,
// inner 4 px, or square only where the box runs to the window edge (full-bleed, or a fixed sheet at the
// screen's edge). A focused control keeps its own shape; every field, clicked and reached from the keyboard,
// has one inset ring and no outline; nothing sticks out past the window. Rules: design-rules-checklist.md §4, §20.
//
// usage: node scripts/shape-check.cjs <base-url> [wait-selector]
//   PAGES="home=/,category=/croissants-category" WIDTHS=1440,1100,390 STORAGE='{"ly-theme":"…"}'
//   STATES=0 (pages only) · V=1 (every finding)
// Prints one line per page/state and "TOTAL n".
"use strict";
const PW = process.env.PW || (() => { try { return require.resolve("playwright"); } catch { return require("path").resolve(__dirname, "../../kalio-marketplace/node_modules/playwright"); } })();
const { chromium } = require(PW);
const [base0, WAIT = ".ly .ftr"] = process.argv.slice(2);
const BASE = (base0 || "http://localhost:9145").replace(/\/$/, "");
const PAGES = (process.env.PAGES || "home=/,category=/croissants-category,product=/product/720375,blog=/blog,about=/about-us,404=/no-such-page")
  .split(",")
  .map((s) => {
    const i = s.indexOf("=");
    return [s.slice(0, i), s.slice(i + 1)];
  });
const WIDTHS = (process.env.WIDTHS || "1440,1100,390").split(",").map(Number);
const VERBOSE = !!process.env.V;
const SCALE = [8, 4];

/* runs in the page: every edge on the scale; nothing past the window */
function audit(SCALE) {
  const out = { radius: [], overflow: [] };
  const vis = (el) => {
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.display === "none" || s.visibility === "hidden" || +s.opacity === 0) return false;
    }
    return true;
  };
  const name = (el) => (el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : el.tagName.toLowerCase()) + (el.id ? "#" + el.id : "");
  const rgb = (c) => {
    const m = c && c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const v = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return [v[0], v[1], v[2], v[3] == null ? 1 : v[3]];
  };
  const behind = (el) => {
    for (let e = el.parentElement; e; e = e.parentElement) {
      const c = rgb(getComputedStyle(e).backgroundColor);
      if (c && c[3] > 0.5) return c;
    }
    return [255, 255, 255, 1];
  };
  const same = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) < 6;
  const W = document.documentElement.clientWidth;
  const rail = null; /* the Layout has no side rail */
  const rr = rail && innerWidth >= 1100 ? rail.getBoundingClientRect() : null;
  const pageL = rr && rr.width ? (rr.left < W / 2 ? rr.right : 0) : 0;
  const pageR = rr && rr.width ? (rr.left < W / 2 ? W : rr.left) : W;
  document.querySelectorAll("body *").forEach((el) => {
    if (el.closest("svg, .mapboxgl-map, .k-addr__canvas, iframe")) return;
    if (/^(IMG|SVG|PATH|BR|S|B|I|EM|STRONG|SPAN|SMALL|TIME|OUTPUT|OPTION|SCRIPT|STYLE|SOURCE|PICTURE|CANVAS|VIDEO)$/.test(el.tagName) && !el.className) return;
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return;
    if (r.bottom < 0 || r.top > document.documentElement.scrollHeight) return;
    const s = getComputedStyle(el);
    if (s.display === "inline" || !vis(el)) return;
    const ring =
      s.boxShadow.split(/,(?![^(]*\))/).some((sh) => {
        if (!/inset/.test(sh)) return false;
        const n = sh.replace(/rgba?\([^)]*\)/, "").match(/-?[\d.]+px/g) || [];
        return n.length >= 4 && +parseFloat(n[0]) === 0 && +parseFloat(n[1]) === 0 && parseFloat(n[3]) > 0;
      }) ||
      (parseFloat(s.borderTopWidth) > 0 && parseFloat(s.borderLeftWidth) > 0 && s.borderTopStyle !== "none" && s.borderLeftStyle !== "none");
    const bg = rgb(s.backgroundColor);
    const img = s.backgroundImage !== "none" && !/^radial-gradient\(circle, /.test(s.backgroundImage) && !/^url\(/.test(s.backgroundImage);
    const fill = bg && bg[3] > 0.05 && !same(bg, behind(el));
    if (!fill && !ring && !img) return;
    const short = Math.min(r.width, r.height);
    const fullBleed = r.left <= pageL + 1 && r.right >= pageR - 1;
    const clipAt = (x, y) => {
      for (let p = el.parentElement, i = 0; p && i < 3; p = p.parentElement, i++) {
        const ps = getComputedStyle(p);
        if (ps.overflowX === "visible" && ps.overflowY === "visible") continue;
        const q = p.getBoundingClientRect();
        if (Math.abs(q.left - x) <= 1.5 || Math.abs(q.right - x) <= 1.5) if (Math.abs(q.top - y) <= 1.5 || Math.abs(q.bottom - y) <= 1.5) return true;
      }
      return false;
    };
    const corners = [
      ["top-left", r.left, r.top],
      ["top-right", r.right, r.top],
      ["bottom-right", r.right, r.bottom],
      ["bottom-left", r.left, r.bottom],
    ];
    corners.forEach(([c, x, y]) => {
      if (clipAt(x, y)) return;
      const raw = s.getPropertyValue("border-" + c + "-radius").split(" ")[0];
      let v = parseFloat(raw) || 0;
      if (/%$/.test(raw)) v = (v / 100) * short;
      const eff = Math.min(v, short / 2);
      if (eff >= short / 2 - 1) return; /* circle or pill */
      if (SCALE.some((k) => Math.abs(eff - k) <= 0.6)) return; /* panel / inner */
      if (eff < 0.5) {
        const fixed = s.position === "fixed" || s.position === "sticky";
        const onEdge = x <= 1 || x >= W - 1 || Math.abs(x - pageL) <= 1 || Math.abs(x - pageR) <= 1 || (fixed && (y <= 1 || y >= innerHeight - 1));
        if (fullBleed || onEdge) return;
        out.radius.push(name(el) + " square " + c);
        return;
      }
      out.radius.push(name(el) + " " + eff.toFixed(1) + "px " + c);
    });
  });
  for (const k in out) out[k] = [...new Set(out[k])];
  if (document.documentElement.scrollWidth > innerWidth) {
    document.querySelectorAll("body *").forEach((el) => {
      if (!vis(el)) return;
      const r = el.getBoundingClientRect();
      if (r.right > innerWidth + 0.5 && r.width) {
        let p = el.parentElement;
        let clipped = false;
        for (; p && p !== document.body; p = p.parentElement) {
          const ps = getComputedStyle(p);
          if (ps.overflowX !== "visible" && p.getBoundingClientRect().right <= innerWidth + 0.5) {
            clipped = true;
            break;
          }
        }
        if (!clipped) out.overflow.push(name(el) + " right " + r.right.toFixed(0));
      }
    });
    out.overflow = out.overflow.slice(0, 8);
  }
  return out;
}

/* runs in the page: a focused control keeps its own shape */
function focusShapes(SCALE) {
  const out = [];
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || r.bottom < 0 || r.top > innerHeight * 3) return false;
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.display === "none" || s.visibility === "hidden" || +s.opacity === 0) return false;
    }
    return true;
  };
  const name = (el) => (el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : el.tagName.toLowerCase()) + (el.textContent ? " «" + el.textContent.trim().slice(0, 18) + "»" : "");
  const R = (el) => ["top-left", "top-right", "bottom-right", "bottom-left"].map((c) => getComputedStyle(el).getPropertyValue("border-" + c + "-radius")).join(" ");
  const eff = (el, v) => {
    const r = el.getBoundingClientRect();
    const short = Math.min(r.width, r.height);
    return v
      .split(" ")
      .map((x) => Math.min(/%$/.test(x) ? (parseFloat(x) / 100) * short : parseFloat(x) || 0, short / 2).toFixed(1))
      .join(" ");
  };
  const onScale = (el, v) => {
    const r = el.getBoundingClientRect();
    const short = Math.min(r.width, r.height);
    return v.split(" ").every((x) => +x >= short / 2 - 1 || SCALE.some((k) => Math.abs(+x - k) <= 0.6));
  };
  const els = [...document.querySelectorAll(".ly a[href], .ly button, .ly summary, .ly [tabindex='0']")].filter((e) => vis(e) && !e.disabled).slice(0, 160);
  for (const el of els) {
    const before = eff(el, R(el));
    el.focus({ preventScroll: true });
    if (document.activeElement !== el || !el.matches(":focus-visible")) continue;
    const after = eff(el, R(el));
    const plain = before.split(" ").every((x) => +x === 0);
    if (plain ? !onScale(el, after) : before !== after) out.push(name(el) + " " + before.split(" ")[0] + "→" + after.split(" ")[0]);
    el.blur();
  }
  return [...new Set(out)];
}

/* runs in the page: number the visible fields (text-like inputs, selects, text areas, checkboxes, switches) */
function markFields(scope) {
  const root = (scope && document.querySelector(scope)) || document;
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.display === "none" || s.visibility === "hidden" || +s.opacity === 0) return false;
    }
    return true;
  };
  document.querySelectorAll("[data-fc]").forEach((e) => e.removeAttribute("data-fc"));
  const els = [...root.querySelectorAll("input:not([type=hidden]):not([type=range]):not([type=file]), select, textarea")].filter((e) => vis(e) && !e.disabled && !e.readOnly);
  return els.slice(0, 30).map((e, i) => {
    e.setAttribute("data-fc", String(i));
    return { i, type: (e.type || e.tagName).toLowerCase(), click: !/^(checkbox|radio)$/.test(e.type || "") };
  });
}
/* runs in the page: the focus look of a field, its five ancestors and (Vuetify) its field outline */
function focusLook(i) {
  const el = document.querySelector('[data-fc="' + i + '"]');
  if (!el) return null;
  const chain = [];
  for (let e = el, k = 0; e && e !== document.body && k < 6; e = e.parentElement, k++) chain.push(e);
  const vf = el.closest(".v-field");
  if (vf) vf.querySelectorAll(".v-field__outline, .v-field__outline *").forEach((x) => chain.push(x));
  const name = (e) => (e.className && typeof e.className === "string" ? "." + e.className.trim().split(/\s+/).slice(0, 2).join(".") : e.tagName.toLowerCase());
  return chain.map((e) => {
    const c = getComputedStyle(e);
    const ring = c.boxShadow.split(/,(?![^(]*\))/).some((sh) => {
      if (!/inset/.test(sh)) return false;
      if (/rgba\([^)]*,\s*0\)/.test(sh)) return false;
      const n = sh.replace(/rgba?\([^)]*\)/, "").match(/-?[\d.]+px/g) || [];
      return n.length >= 4 && +parseFloat(n[0]) === 0 && +parseFloat(n[1]) === 0 && parseFloat(n[3]) > 0;
    });
    return {
      name: name(e),
      outline: c.outlineStyle !== "none" && parseFloat(c.outlineWidth) > 0 ? c.outlineStyle + " " + c.outlineWidth : "",
      shadow: c.boxShadow,
      ring,
      look: [c.boxShadow, c.borderTopColor, c.borderBottomColor, c.backgroundColor, c.outlineStyle, c.outlineColor].join("|"),
    };
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch();
  let total = 0;
  for (const w of WIDTHS) {
    const mob = w < 768;
    const ctx = await browser.newContext({ viewport: { width: w, height: mob ? 844 : 900 }, deviceScaleFactor: 1, isMobile: mob, hasTouch: mob, reducedMotion: "reduce" });
    if (process.env.STORAGE)
      await ctx.addInitScript((st) => {
        for (const [k, v] of Object.entries(JSON.parse(st))) localStorage.setItem(k, v);
      }, process.env.STORAGE);
    await ctx.route((u) => !/^(localhost|127\.0\.0\.1)$/.test(u.hostname) && /\/buy\//.test(u.pathname), (r) => r.abort());
    const pg = await ctx.newPage();
    pg.setDefaultTimeout(30000);
    const push = (to) => pg.evaluate((p) => { window.$global_router.push(p).catch(() => {}); }, to);
    const report = async (tag, withFocus) => {
      const R = await pg.evaluate(audit, SCALE);
      if (withFocus) {
        await pg.keyboard.press("Tab");
        R.focus = await pg.evaluate(focusShapes, SCALE);
      }
      const n = Object.values(R).reduce((a, v) => a + v.length, 0);
      total += n;
      console.log(tag, n ? "ISSUES " + n : "ok");
      if (n) for (const k in R) if (R[k].length) console.log("    " + k + ": " + R[k].slice(0, VERBOSE ? 99 : 10).join(" | ") + (!VERBOSE && R[k].length > 10 ? " …+" + (R[k].length - 10) : ""));
    };
    /* every field, clicked and reached from the keyboard: no outline on it or its ancestors, at most
       one ring that appears on focus, and some visible change (no field may lose its focus look) */
    const fieldsTest = async (tag, scope) => {
      const fields = await pg.evaluate(markFields, scope || null);
      if (process.env.DEBUG_FIELDS) console.log("    (fields: " + fields.map((x) => x.type + "#" + x.i).join(" ") + " at " + (await pg.evaluate(() => location.pathname)) + ")");
      const out = [];
      for (const fd of fields) {
        for (const how of fd.click ? ["click", "key"] : ["key"]) {
          try {
            await pg.evaluate(() => document.activeElement && document.activeElement !== document.body && document.activeElement.blur());
            const before = await pg.evaluate(focusLook, fd.i);
            if (!before) continue;
            if (how === "click") await pg.click('[data-fc="' + fd.i + '"]', { timeout: 4000, force: true });
            else {
              await pg.keyboard.press("Shift");
              await pg.evaluate((i) => document.querySelector('[data-fc="' + i + '"]')?.focus(), fd.i);
            }
            await sleep(160);
            const after = await pg.evaluate(focusLook, fd.i);
            const focused = await pg.evaluate((i) => document.activeElement === document.querySelector('[data-fc="' + i + '"]'), fd.i);
            if (!after || !focused) continue;
            const label = fd.type + "#" + fd.i + " (" + how + ")";
            const outlines = after.filter((x) => x.outline).map((x) => x.name + " " + x.outline);
            if (outlines.length) out.push(label + " outline on " + outlines.join(", "));
            const rings = after.filter((x, k) => x.ring && before[k] && x.shadow !== before[k].shadow).map((x) => x.name);
            if (rings.length > 1) out.push(label + " " + rings.length + " rings: " + rings.join(" + "));
            if (!after.some((x, k) => before[k] && x.look !== before[k].look)) out.push(label + " no focus look");
          } catch (e) {
            out.push(fd.type + "#" + fd.i + " (" + how + ") " + String(e.message || e).split(String.fromCharCode(10))[0].slice(0, 80));
          }
        }
      }
      await pg.evaluate(() => document.activeElement && document.activeElement !== document.body && document.activeElement.blur());
      const uniq = [...new Set(out)];
      total += uniq.length;
      console.log(tag, uniq.length ? "FIELDS " + uniq.length : "fields ok (" + fields.length + ")");
      if (uniq.length) console.log("    fields: " + uniq.slice(0, VERBOSE ? 99 : 10).join(" | "));
    };
    const clickVis = async (sel) => {
      const ok = await pg.evaluate((s) => {
        const el = [...document.querySelectorAll(s)].find((e) => {
          const r = e.getBoundingClientRect();
          return r.width && r.height && getComputedStyle(e).visibility !== "hidden";
        });
        if (!el) return false;
        el.click();
        return true;
      }, sel);
      if (!ok) throw new Error("nothing visible for " + sel);
    };
    const close = async () => {
      await pg.keyboard.press("Escape").catch(() => {});
      await sleep(400);
      await pg.evaluate(() => document.querySelector(".scrim")?.click()).catch(() => {});
      await sleep(400);
    };
    await pg.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 120000 });
    await pg.waitForSelector(WAIT, { timeout: 120000 });
    await sleep(3000);
    for (const [label, to] of PAGES) {
      try {
        if (to !== "/" || label !== PAGES[0][0]) await push(to);
        await pg.waitForSelector(WAIT, { timeout: 60000 }).catch(() => {});
        await sleep(3500);
        await pg.evaluate(() => window.scrollTo(0, 0));
        const tag = (s) => `${label.padEnd(10)} ${String(w).padEnd(5)} ${s.padEnd(13)}`;
        await report(tag("page"), true);
        await fieldsTest(tag("page fields"));
        if (process.env.STATES === "0") continue;
        const states = [];
        if (w < 980) states.push(["menu", ".menu-btn"]);
        else {
          states.push(["shop-menu", "[aria-controls=dd-shop]"]);
          states.push(["region", ".rg-pill"]);
        }
        states.push(["search", "[aria-controls=srch]"]);
        if (label === "home" || label === "category") states.push(["bag", ".bag-btn"]);
        if (label === "category") {
          if (w < 1200) states.push(["filter-sheet", ".fbtn"]);
          states.push(["quick", ".pc-qv"]);
        }
        if (label === "account") states.push(["signin", "@signin"]);
        for (const [st, sel] of states) {
          try {
            await pg.evaluate(() => window.scrollTo(0, 0));
            if (sel === "@signin") {
              const ok = await pg.evaluate(() => { const b = [...document.querySelectorAll(".acc-nav button, .ly button")].find((x) => /sign in/i.test(x.textContent)); if (!b) return false; b.click(); return true; });
              if (!ok) throw new Error("no sign-in button");
            } else await clickVis(sel);
            await sleep(900);
            await report(tag(st), false);
            const scope = { menu: "#menu", "shop-menu": "#dd-shop", region: "#rgp", search: "#srch", bag: "#drawer", "filter-sheet": ".fp.panel", quick: "#qv", signin: "#loginm" }[st];
            await fieldsTest(tag(st + " fields"), scope);
          } catch (e) {
            total++;
            console.log(tag(st), "FAILED", String(e.message || e).split("\n")[0].slice(0, 140));
          }
          await close();
        }
      } catch (e) {
        total++;
        console.log(`${label} ${w} FAILED`, String(e.message || e).split("\n")[0].slice(0, 160));
      }
    }
    await ctx.close();
  }
  await browser.close();
  console.log("TOTAL", total);
  process.exit(total ? 1 : 0);
})();
