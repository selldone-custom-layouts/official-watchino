/*
 * Export the Layout's English words (base/en.ts, bakini.en.ts, ly.en.ts and the Watchino wt.en.ts when present),
 * with the skin's words.en on top, as JSON for translators: <out>/en-<part>.json.
 *   node scripts/wt-i18n-export.cjs <out-dir>
 */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const I18N = path.join(ROOT, "components/kalio/i18n");
const out = process.argv[2];
if (!out) throw new Error("usage: node scripts/wt-i18n-export.cjs <out-dir>");
fs.mkdirSync(out, { recursive: true });
const skin = JSON.parse(fs.readFileSync(path.join(ROOT, "skins/watchino/skin.json"), "utf8"));
const over = skin.words?.en || {};

/* a TS dictionary file: `const x: Record<string, string> = { ... };` -> object */
function readDict(file) {
  const src = fs.readFileSync(file, "utf8");
  const start = src.indexOf("{", src.indexOf("="));
  const end = src.lastIndexOf("}");
  // eslint-disable-next-line no-new-func
  return Function(`return (${src.slice(start, end + 1)});`)();
}
const parts = { base: "base/en.ts", bakini: "bakini.en.ts", ly: "ly.en.ts", wt: "wt.en.ts" };
for (const [name, rel] of Object.entries(parts)) {
  const f = path.join(I18N, rel);
  if (!fs.existsSync(f)) continue;
  const d = readDict(f);
  for (const k of Object.keys(d)) if (over[k] !== undefined) d[k] = over[k];
  /* plural keys the skin overrides as .one/.other */
  for (const [k, v] of Object.entries(over)) if (/\.(one|other)$/.test(k) && d[k] === undefined && d[k.replace(/\.(one|other)$/, "") + ".other"] !== undefined) d[k] = v;
  fs.writeFileSync(path.join(out, `en-${name}.json`), JSON.stringify(d, null, 2) + "\n");
  console.log(name, Object.keys(d).length);
}
