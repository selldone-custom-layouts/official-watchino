/*
 * The active skin for the Layout's tools (checks, release, docs): skins/<name>/skin.json.
 *
 * A Layout repo holds one skin folder; with several, skins/ACTIVE names the one in use (a single line).
 *   const { skin, dir } = require("./lib/skin.cjs").readSkin();
 *   skin.shop.domain, skin.name, storageKey("theme") -> "<name>-theme"
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");

function activeName(root = ROOT) {
  const skins = path.join(root, "skins");
  const marker = path.join(skins, "ACTIVE");
  if (fs.existsSync(marker)) return fs.readFileSync(marker, "utf8").trim();
  const names = fs.existsSync(skins) ? fs.readdirSync(skins).filter((n) => fs.existsSync(path.join(skins, n, "skin.json"))) : [];
  if (names.length === 1) return names[0];
  throw new Error(`skins/: ${names.length} skins and no skins/ACTIVE (${names.join(", ") || "none"})`);
}

function readSkin(root = ROOT) {
  const name = activeName(root);
  const dir = path.join(root, "skins", name);
  const skin = JSON.parse(fs.readFileSync(path.join(dir, "skin.json"), "utf8"));
  return { name, dir, skin };
}

const storageKey = (what, skin = readSkin().skin) => `${skin.name}-${what}`;
const shopUrl = (skin = readSkin().skin) => (process.env.SHOP_URL || `https://${skin.shop.domain}`).replace(/\/$/, "");

module.exports = { ROOT, activeName, readSkin, storageKey, shopUrl };
