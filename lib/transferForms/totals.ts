/**
 * Money maths for the "Хүргэлтийн хүсэлт" page (requests from ayo.mn/form).
 *
 * The backend adds the order up again from the same inputs; this copy is so staff see the
 * numbers while they type. Keep it in step with ayo-back/src/services/transferOrderService.js.
 */

export interface OrderLine {
  variantId: number;
  name: string;
  variantLabel: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  /** An order-on-demand import. It cannot share an order with shelf goods. */
  isImported: boolean;
  /** Cargo per unit charged on top of the price (our own weighed imports), else 0. */
  cargoOnTop: number;
  /** Free units at Төв; null for an import, which has no shelf stock. */
  available: number | null;
  imageUrl: string | null;
}

export interface Totals {
  subtotal: number;
  cargo: number;
  shipping: number;
  total: number;
  paid: number;
  /** paid - total: negative = the customer sent less than the order comes to. */
  difference: number;
}

const whole = (n: unknown) => (typeof n === "number" && Number.isFinite(n) ? Math.round(n) : 0);

export function totals(lines: OrderLine[], shippingCost: number, paid: number): Totals {
  const subtotal = lines.reduce((sum, l) => sum + whole(l.unitPrice) * whole(l.quantity), 0);
  const cargo = lines.reduce((sum, l) => sum + whole(l.cargoOnTop) * whole(l.quantity), 0);
  const shipping = whole(shippingCost);
  const total = subtotal + cargo + shipping;
  return { subtotal, cargo, shipping, total, paid: whole(paid), difference: whole(paid) - total };
}

/**
 * The delivery fee to start from: the district's rate, or nothing once the goods reach the
 * free-delivery threshold (0 = that rule is off). Staff can always type another number.
 */
export function suggestedShipping(subtotal: number, zoneCost: number, freeShippingThreshold: number): number {
  if (freeShippingThreshold > 0 && subtotal >= freeShippingThreshold) return 0;
  return whole(zoneCost);
}

export type DifferenceTone = "even" | "short" | "over";

/** What the gap between the transfer and the order is called. It never stops the order. */
export function differenceLabel(difference: number): { tone: DifferenceTone; text: string } {
  if (difference === 0) return { tone: "even", text: "Зөрүүгүй" };
  if (difference < 0) return { tone: "short", text: `${money(-difference)} дутуу` };
  return { tone: "over", text: `${money(difference)} илүү` };
}

/** Why these lines cannot be one order, or null when they can. */
export function basketProblem(lines: OrderLine[]): string | null {
  const imported = lines.some((l) => l.isImported);
  const shelf = lines.some((l) => !l.isImported);
  if (imported && shelf) {
    return "Захиалгын бараа болон бэлэн барааг нэг захиалгад хийх боломжгүй. Аль нэгийг нь хасна уу.";
  }
  return null;
}

/** Lines asking for more than Төв has free. A warning only: staff may know better than the count. */
export function shortLines(lines: OrderLine[]): OrderLine[] {
  const asked = new Map<number, number>();
  for (const l of lines) asked.set(l.variantId, (asked.get(l.variantId) || 0) + whole(l.quantity));
  const seen = new Set<number>();
  return lines.filter((l) => {
    if (l.available === null || seen.has(l.variantId)) return false;
    seen.add(l.variantId);
    return (asked.get(l.variantId) || 0) > l.available;
  });
}

/** 52500 -> "52,500₮" */
export function money(n: number): string {
  return `${whole(n).toLocaleString("en-US")}₮`;
}

/** "52,500", "52 500₮", "52500" -> 52500. Empty or not a number -> null. */
export function parseMoney(text: string): number | null {
  const digits = String(text ?? "").replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return Number.isSafeInteger(n) ? n : null;
}

/** The key that names one row of the bank statement while it is on screen. */
export function transferKey(row: { tabId: string; rowIndex: number; fingerprint: string }): string {
  return `${row.tabId}:${row.rowIndex}:${row.fingerprint}`;
}
