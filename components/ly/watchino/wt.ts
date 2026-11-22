/*
 * Watchino: the shop's live data as the static Watchino site used it (collections with their cut-outs and price
 * range, three price registers, the most precious reference, the newest arrivals), and the data face (Azeret Mono,
 * tabular figures on every price). Nothing here names a product, price or collection: another watch shop that
 * imports the Layout gets its own.
 */
import { bySells, catTitle, inCat, ly, priceView, productImage } from "../ly";

/* the data face for prices and references, one request (the skin's two faces load in kalio-fonts.ts) */
(function addMono() {
  const href = "https://fonts.googleapis.com/css2?family=Azeret+Mono:wght@400;500&display=swap";
  if (typeof document === "undefined" || document.head.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = href;
  document.head.appendChild(l);
})();

export interface WtCol {
  c: any;
  ps: any[];
  min: number;
  max: number;
  median: number;
  img: string | null;
}

const median = (a: number[]) => {
  const s = [...a].sort((x, y) => x - y);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
};

/** The collections that have watches, in the shop's order, with their price range now (visitor's currency). */
export function wtCols(shop: any): WtCol[] {
  return ly.cats
    .map((c) => {
      const ps = inCat(c.id);
      const now = ps.map((p) => priceView(shop, p).now).filter((n) => n > 0);
      const top = bySells(ps)[0];
      return { c, ps, min: now.length ? Math.min(...now) : 0, max: now.length ? Math.max(...now) : 0, median: median(now), img: top ? productImage(top) : null };
    })
    .filter((x) => x.ps.length);
}

/** Three registers by price: the rest, the second most precious collection, the most precious one. */
export function wtRegisters(shop: any): { cols: WtCol[]; min: number; max: number; piece: any }[] {
  const cols = wtCols(shop).sort((a, b) => a.median - b.median);
  if (cols.length < 3) return [];
  const groups = [cols.slice(0, cols.length - 2), [cols[cols.length - 2]], [cols[cols.length - 1]]];
  return groups.map((g) => {
    const ps = g.flatMap((x) => x.ps);
    const piece = bySells(ps)[0];
    return { cols: g, min: Math.min(...g.map((x) => x.min)), max: Math.max(...g.map((x) => x.max)), piece };
  });
}

/** The most precious watch in stock (the spotlight). */
export function wtSpotlight(shop: any): any {
  const list = ly.products.filter((p) => p.quantity > 0 && p.icon);
  return list.sort((a, b) => priceView(shop, b).now - priceView(shop, a).now)[0] || null;
}

/** The newest watches first. */
export function wtNewest(n = 10): any[] {
  return [...ly.products].sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")) || b.id - a.id).slice(0, n);
}

/** A product's flat spec as [key, value] rows (groups dropped), at most n. */
export function wtSpecRows(p: any, n = 5): [string, string][] {
  const out: [string, string][] = [];
  for (const [k, v] of Object.entries(p?.spec || {})) {
    if (v === "group" || v == null) continue;
    const val = Array.isArray(v) ? v.join(", ") : String(v);
    if (val) out.push([k, val]);
    if (out.length >= n) break;
  }
  return out;
}

/** The distinct values of one spec key across watches ("Automatic", "Quartz"). */
export function wtSpecValues(ps: any[], key: string, n = 3): string[] {
  const seen = new Map<string, number>();
  for (const p of ps) {
    const v = p?.spec?.[key];
    for (const x of Array.isArray(v) ? v : v && v !== "group" ? [v] : []) seen.set(String(x), (seen.get(String(x)) || 0) + 1);
  }
  return [...seen.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);
}

export { catTitle };

import { t } from "../../kalio/i18n/kalio-i18n";

/** The ways to pay, in the visitor's language: cash on delivery named from its kind, the others by their brand name. */
export function wtPayNames(gateways: any[], n = 3): string[] {
  const out = (gateways || []).map((g: any) => (g?.cod || g?.type === "cod" || /^cod_/i.test(String(g?.code || "")) ? t("wt.hdr.cod", "Cash on delivery") : String(g?.name || "")));
  return [...new Set(out.filter(Boolean))].slice(0, n);
}
