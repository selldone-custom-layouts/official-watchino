/* Prints the active skin's names as shell assignments: eval "$(node scripts/lib/skin-env.cjs)" */
const { readSkin } = require("./skin.cjs");
const { skin } = readSkin();
const q = (s) => "'" + String(s ?? "").replace(/'/g, "'\''") + "'";
const gh = { org: "selldone-custom-layouts", repo: `official-${skin.name}`, topics: [], ...(skin.github || {}) };
const vars = {
  SKIN_NAME: skin.name,
  TITLE: skin.title,
  PACKAGE: skin.package,
  DESC: String(skin.tagline || skin.description).slice(0, 340),
  DOMAIN: skin.shop.domain,
  SHOP_NAME: skin.shop.name || skin.shop.xapi,
  GH_REPO: `${gh.org}/${gh.repo}`,
  TOPICS: (gh.topics || []).join(" "),
};
for (const [k, v] of Object.entries(vars)) console.log(`${k}=${q(v)}`);
