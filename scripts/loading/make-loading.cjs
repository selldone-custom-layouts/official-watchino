// make-loading.cjs: a Layout's own loading screen for one Selldone domain (custom domain loading, mode "custom").
//
// Built so that a merchant who copies the Layout can drop in ANY brand and the animation still works:
// - the motion lives only in the frame (a fine ring that turns) and the line art inside it (drawing itself);
//   the brand block never moves, so nothing is timed or sized to one logo or one name;
// - brand = a logo image (any https URL, any aspect: it is fitted inside a fixed box with object-fit: contain)
//   or, without a logo, the shop's name as text: the font size shrinks with the name's length, long names wrap
//   to two lines, right-to-left names (Arabic, Persian, Hebrew) set dir="auto";
// - the line art is optional (any of ART below, or none for an empty ring);
// - fast: Selldone removes this frame as soon as the app starts (+150 ms; often ~0.5 s with a warm cache) and the
//   frame cannot extend that, so the line art starts 60% drawn, completes once in 0.55 s and stays; the ring turns every 1.2 s;
//   the Layout continues the same picture in-app (see IN-APP-SPLASH.md) until its real content is ready;
// - no fake percentage; reduced motion gives a still frame; a short fade on Selldone's "selldone-app-loaded".
//
// Usage: node make-loading.cjs <config.json> [outDir]
// config: { name, sub?, logo?, art?, bg, ink, muted, accent, line, serif, sans, serifCss, sansCss, nameWeight?,
//           nameTracking?, subTracking?, nameItalic?, nameLower?, dot? (a small colour dot after the name, as a wordmark) }
//   serif/sans: Google Fonts family specs (e.g. "Cormorant+Garamond:wght@500"), serifCss/sansCss: CSS stacks.
// Writes <outDir>/loading.json ({head, body, head_bytes, body_bytes}) and <outDir>/loading-preview.html.
// Limits checked: head ≤ 15,360 B, body ≤ 3,072 B, no data: or base64 (Selldone refuses them).
const fs = require("fs");
const path = require("path");

const ART = {
  croissant:
    '<path d="M10 80c2-14 13-24 25-27 6-12 16-19 25-19s19 7 25 19c12 3 23 13 25 27-6 4-14 4-20-2-2 8-8 12-14 12-4 6-10 9-16 9s-12-3-16-9c-6 0-12-4-14-12-6 6-14 6-20 2z"/>' +
    '<path d="M35 53c5 8 7 18 5 28M60 34c2 12 2 31 0 47M85 53c-5 8-7 18-5 28"/><path d="M24 66c3 2 6 3 9 3M96 66c-3 2-6 3-9 3"/>',
  cupcake:
    '<path d="M32 66h56l-7 36H39z"/><path d="M46 66l2 36M60 66v36M74 66l-2 36"/>' +
    '<path d="M28 66c-7-2-8-12-1-15-3-9 6-16 14-13 1-10 13-14 20-8 7-7 20-2 20 8 9-3 17 5 13 14 7 4 5 13-2 14z"/>',
  tart:
    '<path d="M14 62c0-9 21-16 46-16s46 7 46 16-21 16-46 16-46-7-46-16z"/><path d="M14 62v9c0 9 21 16 46 16s46-7 46-16v-9"/>' +
    '<circle cx="44" cy="60" r="6"/><circle cx="60" cy="56" r="6"/><circle cx="76" cy="60" r="6"/>',
  whisk:
    '<path d="M60 16v40"/><path d="M60 56c-14 0-22 16-22 30s10 22 22 22 22-8 22-22-8-30-22-30z"/><path d="M60 56c-6 0-10 16-10 30s4 22 10 22 10-8 10-22-4-30-10-30z"/>',
};

const [cfgPath, outArg] = process.argv.slice(2);
if (!cfgPath) { console.error("usage: node make-loading.cjs <config.json> [outDir]"); process.exit(2); }
const c = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
const outDir = outArg || path.dirname(cfgPath);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
if (c.logo && !/^https:\/\//.test(c.logo)) throw new Error("logo must be an https URL (no data URIs)");
const art = c.art === "none" ? "" : ART[c.art || "croissant"];
if (c.art && c.art !== "none" && !art) throw new Error(`unknown art "${c.art}" (${Object.keys(ART).join(", ")}, none)`);

// Name size: 42 px for short names, shrinking with length; long names wrap (max two lines in practice).
const len = [...(c.name || "")].length;
const nameSize = Math.max(22, Math.min(42, Math.round(420 / Math.max(len, 1) + 8)));

const fonts = [c.serif, c.sans].filter(Boolean).map((f) => "family=" + f).join("&");
const head =
  (fonts ? `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?${fonts}&display=swap" rel="stylesheet">` : "") +
  "<style>" +
  `html,body{margin:0;height:100%;background:${c.bg}}` +
  `body{display:grid;place-items:center;font-family:${c.sansCss};-webkit-font-smoothing:antialiased}` +
  ".ld{display:flex;flex-direction:column;align-items:center;gap:24px;padding:24px;max-width:min(88vw,560px);box-sizing:border-box;text-align:center;transition:opacity .14s ease}" +
  ".ld-mark{width:120px;height:120px;display:block;flex:none}" +
  `.ld-base{fill:none;stroke:${c.line};stroke-width:1.2}` +
  `.ld-arc{fill:none;stroke:${c.accent};stroke-width:1.6;stroke-linecap:round;stroke-dasharray:62 290;transform-origin:60px 60px;animation:ld-turn 1.2s linear infinite}` +
  `.ld-art{fill:none;stroke:${c.ink};stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}` +
  ".ld-art>*{stroke-dasharray:1;stroke-dashoffset:0;animation:ld-draw .55s cubic-bezier(.2,.7,.3,1) both}" +
  ".ld-art>:nth-child(2){animation-delay:.08s}.ld-art>:nth-child(3){animation-delay:.16s}.ld-art>:nth-child(4){animation-delay:.24s}" +
  ".ld-brand{display:flex;flex-direction:column;align-items:center;max-width:100%}" +
  ".ld-logo{display:block;max-width:min(220px,70vw);max-height:72px;width:auto;height:auto;object-fit:contain}" +
  `.ld-name{font:${c.nameItalic ? "italic " : ""}${c.nameWeight || 500} ${nameSize}px/1.05 ${c.serifCss};${c.nameLower ? "text-transform:lowercase;" : ""}letter-spacing:${c.nameTracking || ".04em"};color:${c.ink};max-width:100%;overflow-wrap:anywhere}` +
  `.ld-sub{font:700 9px/1.4 ${c.sansCss};letter-spacing:${c.subTracking || ".38em"};padding-left:${c.subTracking || ".38em"};text-transform:uppercase;color:${c.muted};margin-top:9px;max-width:100%}` +
  (c.dot ? `.ld-dot{display:inline-block;width:.16em;height:.16em;border-radius:50%;background:${c.dot};margin-left:.06em;vertical-align:baseline}` : "") +
  ".ld-name:dir(rtl),.ld-sub:dir(rtl){letter-spacing:0;padding-left:0}.ld-sub:dir(rtl){font-size:12px;text-transform:none}" +
  ".ld-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}" +
  "@keyframes ld-turn{to{transform:rotate(360deg)}}" +
  "@keyframes ld-draw{from{stroke-dashoffset:.4}to{stroke-dashoffset:0}}" +
  `@media (max-width:420px){.ld-mark{width:92px;height:92px}.ld-name{font-size:${Math.max(20, Math.round(nameSize * 0.86))}px}.ld-logo{max-height:56px}}` +
  "@media (prefers-reduced-motion:reduce){.ld-arc{animation:none}.ld-art>*{animation:none;stroke-dashoffset:0}}" +
  ".selldone-ready .ld{opacity:0}" +
  "</style>" +
  '<script>window.addEventListener("message",function(e){if(e.source!==parent||!e.data||e.data.type!=="selldone-app-loaded")return;document.documentElement.classList.add("selldone-ready")});</script>';

const brand = c.logo
  ? `<img class="ld-logo" src="${esc(c.logo)}" alt="">`
  : `<span class="ld-name" dir="auto">${esc(c.name)}${c.dot ? '<i class="ld-dot"></i>' : ""}</span>`;
const body =
  '<div class="ld" role="status">' +
  `<span class="ld-sr">Loading ${esc(c.name)}</span>` +
  '<svg class="ld-mark" aria-hidden="true" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">' +
  '<circle class="ld-base" cx="60" cy="60" r="56"/><circle class="ld-arc" cx="60" cy="60" r="56"/>' +
  (art ? `<g class="ld-art" transform="translate(18 14) scale(.7)">${art.replace(/<(path|circle) /g, '<$1 pathLength="1" ')}</g>` : "") +
  "</svg>" +
  `<div class="ld-brand" aria-hidden="true">${brand}${c.sub ? `<span class="ld-sub" dir="auto">${esc(c.sub)}</span>` : ""}</div>` +
  "</div>";

const hb = Buffer.byteLength(head, "utf8");
const bb = Buffer.byteLength(body, "utf8");
if (hb > 15360 || bb > 3072) throw new Error(`too big: head ${hb}, body ${bb}`);
if (/data:|base64/i.test(head + body)) throw new Error("embedded data");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "loading.json"), JSON.stringify({ head, body, head_bytes: hb, body_bytes: bb }, null, 1));
fs.writeFileSync(
  path.join(outDir, "loading-preview.html"),
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(c.name)} — loading</title>${head}</head><body>${body}</body></html>`
);
console.log(`head ${hb} B, body ${bb} B -> ${path.join(outDir, "loading.json")}`);
