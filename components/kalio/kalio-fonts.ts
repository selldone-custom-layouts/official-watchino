/*
 * The Layout's typefaces: the skin's display and text faces (skins/<name>/skin.json fonts, one Google Fonts
 * request written by scripts/skin-apply.mjs), and Material Symbols Rounded for the icons of the shared pieces.
 * They are requested from the app at start-up rather than from index.html: in production the Layout runs inside
 * the HTML Selldone renders for the shop, and index.html never reaches the visitor. Selldone's own components keep
 * their Material Icons (v-icon). An Arabic face is loaded by the i18n runtime only when Arabic is picked.
 */
import { SKIN } from "../ly/skin.gen";

const FONTS = [
  SKIN.fonts.css,
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..24,400..600,0..1,0&display=block",
];

function addLink(attrs: Record<string, string>) {
  if (document.head.querySelector(`link[href="${attrs.href}"]`)) return;
  const link = document.createElement("link");
  Object.entries(attrs).forEach(([key, value]) => link.setAttribute(key, value));
  document.head.appendChild(link);
}

addLink({ rel: "preconnect", href: "https://fonts.googleapis.com" });
addLink({ rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" });
for (const href of FONTS) addLink({ rel: "stylesheet", href });
