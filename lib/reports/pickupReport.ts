/**
 * "Салбарын захиалга": the pure parts of the branch pickup report page. Days are
 * Ulaanbaatar dates (UTC+8), like every other report.
 */

const UB_MS = 8 * 3600 * 1000;
const DAY_MS = 24 * 3600 * 1000;

export const ubDate = (iso: string | null | undefined): string | null =>
  iso ? new Date(Date.parse(iso) + UB_MS).toISOString().slice(0, 10) : null;

/** Every date from `from` to `to`, inclusive; empty when the range is longer than `max` days. */
export function daysBetween(from: string, to: string, max = 62): string[] {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return [];
  const count = Math.round((end - start) / DAY_MS) + 1;
  if (count > max) return [];
  return Array.from({ length: count }, (_, i) => new Date(start + i * DAY_MS).toISOString().slice(0, 10));
}

export interface DayBar {
  date: string;
  handedOver: number;
  prepaid: number;
}

/** Handovers and completed prepaid pickups per UB day of the range. */
export function perDay(
  from: string,
  to: string,
  handedOver: { handedAt: string | null }[],
  prepaid: { occurredAt: string | null; status: string }[],
): DayBar[] {
  const days = daysBetween(from, to);
  const bars = new Map(days.map((d) => [d, { date: d, handedOver: 0, prepaid: 0 }]));
  for (const r of handedOver) {
    const bar = bars.get(ubDate(r.handedAt) ?? "");
    if (bar) bar.handedOver += 1;
  }
  for (const r of prepaid) {
    if (r.status !== "COMPLETED") continue;
    const bar = bars.get(ubDate(r.occurredAt) ?? "");
    if (bar) bar.prepaid += 1;
  }
  return [...bars.values()];
}

/** How worried to be about an order this many days after it was paid. */
export function ageTone(days: number | null | undefined): "fresh" | "aging" | "overdue" {
  if (days == null || days < 3) return "fresh";
  return days < 7 ? "aging" : "overdue";
}

export function ageText(days: number | null | undefined): string {
  if (days == null) return "";
  if (days === 0) return "Өнөөдөр";
  return `${days} хоног`;
}

/** Order number, phone or name contains what was typed (digits match digits only). */
export function matches(row: Record<string, unknown>, q: string, keys: string[]): boolean {
  const text = q.trim().toLowerCase();
  if (!text) return true;
  return keys.some((k) => String(row[k] ?? "").toLowerCase().includes(text));
}

export const itemsText = (items: { name: string; qty: number }[] | null | undefined): string =>
  (items ?? []).map((i) => (i.qty > 1 ? `${i.name} ×${i.qty}` : i.name)).join(", ");
