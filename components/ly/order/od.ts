/*
 * What the order page (order-b.html, pages-buy.js order) reads
 * from Selldone's basket: its tone (paid or paying on delivery, waiting,
 * cancelled), the mockup's four steps over Selldone's delivery states
 * (Placed · Baking · On the way · Delivered), the words of the title band
 * and when it was placed. Shared by the page's band and its body.
 */
import { t } from "../../kalio/i18n/kalio-i18n";
import { money } from "../../region-switcher/region";
import { wayWindowLine } from "../buy/ly-cart";

export type OrderTone = "ok" | "wait" | "off";

/** ok: paid or paying on delivery · wait: not paid yet · off: cancelled */
export function orderTone(basket: any): OrderTone {
  const status = basket?.status;
  if (status === "Canceled") return "off";
  if (status === "Payed" || status === "COD") return "ok";
  return "wait";
}

export function orderSteps(pickup = false) {
  return [
    { key: "placed", label: t("ly.od.stPlaced", "Placed"), icon: "check", codes: ["CheckQueue", "OrderConfirm"] },
    { key: "baking", label: t("ly.od.stBaking", "Baking"), icon: "gift", codes: ["PreparingOrder"] },
    pickup
      ? { key: "ready", label: t("ly.od.stReady", "Ready to collect"), icon: "store", codes: ["SentOrder"] }
      : { key: "way", label: t("ly.od.stWay", "On the way"), icon: "bike", codes: ["SentOrder"] },
    pickup
      ? { key: "done", label: t("ly.od.stCollected", "Collected"), icon: "home", codes: ["ToCustomer"] }
      : { key: "done", label: t("ly.od.stDone", "Delivered"), icon: "home", codes: ["ToCustomer"] },
  ];
}

export function orderStep(basket: any): number {
  const at = orderSteps().findIndex((s) => s.codes.includes(basket?.delivery_state));
  return at < 0 ? 0 : at;
}

/** The band's lead: "Thank you — it's in the oven." and the date. */
export function orderLead(basket: any): string {
  const tone = orderTone(basket);
  let first: string;
  if (tone === "off") first = t("ly.od.leadOff", "This order was cancelled.");
  else if (tone === "wait") first = t("ly.od.leadWait", "Waiting for payment.");
  else
    first = [
      t("ly.od.leadPlaced", "Thank you — we have it."),
      t("ly.od.leadBaking", "Thank you — it’s in the oven."),
      basket?.delivery_info?.type === "Pickup" ? t("ly.od.leadReady", "Thank you — it’s ready at the counter.") : t("ly.od.leadWay", "Thank you — it’s on the way."),
      t("ly.od.leadDone", "Thank you — enjoy."),
    ][orderStep(basket)];
  const at = placedAt(basket);
  return at ? `${first} ${t("ly.od.placed", "Placed {date}.", { date: at })}` : first;
}

export function placedAt(basket: any): string {
  const at = basket?.reserved_at || basket?.created_at;
  if (!at) return "";
  return new Date(at).toLocaleDateString(document.documentElement.lang || "en", { day: "numeric", month: "long", year: "numeric" });
}

/** "Bakio courier · Morning · $14.89 on delivery", from what is known
    (an order in the account's list, and its full record when read). */
export function orderLine(shop: any, order: any, full: any): string {
  const parts: string[] = [];
  const way = wayWindowLine(shop, full?.delivery_info || order?.delivery_info);
  if (way) parts.push(way);
  const amount = money(Number(order?.price) || 0, order?.currency);
  if (order?.status === "COD") parts.push(t("ly.acc.onDelivery", "{amount} on delivery", { amount }));
  else if (order?.status === "Payed") parts.push(t("ly.acc.paid", "{amount} paid", { amount }));
  else if (order?.status === "Reserved") parts.push(t("ly.acc.toPay", "{amount} to pay", { amount }));
  else if (order?.status === "Canceled") parts.push(t("ly.acc.cancelled", "Cancelled"));
  else parts.push(amount);
  return parts.join(" · ");
}

/** "12 November 2026", in the page's language. */
export function longDate(at: string): string {
  if (!at) return "";
  return new Date(at).toLocaleDateString(document.documentElement.lang || "en", { day: "numeric", month: "long", year: "numeric" });
}
