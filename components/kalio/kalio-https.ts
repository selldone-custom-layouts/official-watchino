/*
 * HTTPS guard (15 Nov 2026).
 *
 * Selldone's "Secure CDN" custom domains (ssl_proxy) answer plain http:// with the page itself instead of a
 * redirect, even when the domain's "Force HTTPS" setting is on. Only browsers that already saw the https
 * address (HSTS) upgrade on their own, so a first-time visitor who types http:// stays there and the browser
 * shows "Not secure". This module is the FIRST import of storefront.ts, so it runs before anything else and
 * moves the visitor to the same address on https://. Local development hosts are left alone.
 */
const here = typeof window !== "undefined" ? window.location : null;
const LOCAL = /^(localhost|127\.|0\.0\.0\.0|\[::1\]|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)|\.(localhost|local|test)$/i;
if (here && here.protocol === "http:" && !LOCAL.test(here.hostname)) {
  here.replace("https://" + here.host + here.pathname + here.search + here.hash);
}
export {};
