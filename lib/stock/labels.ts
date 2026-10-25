/** Words and small calculations for the stock pages (POS Plan 5). */

import type { AdjustmentReason, CountLine, TransferLine } from "@/lib/api/stock";

// Same list as STOCK_REASONS in ayo-back src/services/stock/constants.js.
export const STOCK_REASONS = [
  "OPENING_BALANCE", "SALE", "SALE_RETURN", "ONLINE_ORDER", "ONLINE_ORDER_RETURN", "ONLINE_ORDER_CANCEL",
  "GOODS_RECEIPT", "TRANSFER_OUT", "TRANSFER_IN", "TRANSFER_LOSS", "PARTNER_DELIVERY", "PARTNER_SHORTFALL_RETURN",
  "SET_ASSEMBLY", "SET_DISASSEMBLY", "COUNT_CORRECTION", "ADJUSTMENT", "CORRECTION",
] as const;

const REASON: Record<(typeof STOCK_REASONS)[number], string> = {
  OPENING_BALANCE: "Эхний үлдэгдэл",
  SALE: "Борлуулалт",
  SALE_RETURN: "Буцаалт",
  ONLINE_ORDER: "Онлайн захиалга",
  ONLINE_ORDER_RETURN: "Онлайн буцаалт",
  ONLINE_ORDER_CANCEL: "Онлайн захиалга цуцлагдсан",
  GOODS_RECEIPT: "Бараа орлого",
  TRANSFER_OUT: "Шилжүүлэг (гарсан)",
  TRANSFER_IN: "Шилжүүлэг (орсон)",
  TRANSFER_LOSS: "Шилжүүлгийн алдагдал",
  PARTNER_DELIVERY: "Харилцагчид өгсөн",
  PARTNER_SHORTFALL_RETURN: "Харилцагчийн дутуу буцаалт",
  SET_ASSEMBLY: "Сет хийсэн",
  SET_DISASSEMBLY: "Сет задалсан",
  COUNT_CORRECTION: "Тооллогын залруулга",
  ADJUSTMENT: "Залруулга",
  CORRECTION: "Засвар",
};

export const ADJUSTMENT_REASONS: AdjustmentReason[] = ["DAMAGED", "EXPIRED", "TESTER", "LOST", "FOUND", "GIFT", "OTHER"];

export const ADJUSTMENT_LABEL: Record<AdjustmentReason, string> = {
  DAMAGED: "Эвдэрсэн",
  EXPIRED: "Хугацаа дууссан",
  TESTER: "Тестер",
  LOST: "Алдсан",
  FOUND: "Олдсон",
  GIFT: "Бэлэг",
  OTHER: "Бусад",
};

/** The word for a movement; an adjustment also says why. Unknown codes show as themselves. */
export function movementReasonLabel(reason: string, subReason?: string | null): string {
  const base = REASON[reason as keyof typeof REASON];
  if (!base) return reason;
  if (reason === "ADJUSTMENT" && subReason) return `${base}: ${ADJUSTMENT_LABEL[subReason as AdjustmentReason] ?? subReason}`;
  return base;
}

/** "+5" / "-3" / "0": movements read at a glance. */
export const signed = (n: number): string => (n > 0 ? `+${n}` : String(n));

/** FOUND adds stock; every other adjustment reason takes it out (matches the backend's rule). */
export const adjustmentSign = (reason: AdjustmentReason): 1 | -1 => (reason === "FOUND" ? 1 : -1);

export type TransferTone = "gray" | "blue" | "green" | "red";

export const TRANSFER_STATUS: Record<string, [TransferTone, string]> = {
  DRAFT: ["gray", "Ноорог"],
  SENT: ["blue", "Замд"],
  RECEIVED: ["green", "Хүлээн авсан"],
  CANCELLED: ["red", "Цуцалсан"],
};

export const COUNT_STATUS: Record<string, ["gray" | "amber" | "green" | "red", string]> = {
  OPEN: ["gray", "Нээлттэй"],
  SUBMITTED: ["amber", "Батлах хүлээгдэж буй"],
  APPROVED: ["green", "Баталсан"],
  REJECTED: ["red", "Татгалзсан"],
};

const DISCREPANCY: Record<string, string> = {
  LOST: "Алдагдсан",
  AT_SOURCE: "Илгээгч салбарт үлдсэн",
  SURPLUS_FOUND: "Илүү олдсон",
};

export const discrepancyLabel = (code: string | null | undefined): string => (code ? DISCREPANCY[code] ?? code : "");

/**
 * The body of a transfer receipt. Every line must be present; one the person did not
 * touch defaults to what was sent. A reason goes along only when the line came up short.
 */
export function receiveLinesFor(
  lines: Pick<TransferLine, "id" | "qtySent">[],
  entered: Record<string, { qty?: number; discrepancy?: string } | undefined>,
): { lineId: string; qtyReceived: number; discrepancy?: string }[] {
  return lines.map((line) => {
    const entry = entered[line.id];
    const qtyReceived = entry?.qty ?? line.qtySent;
    const out: { lineId: string; qtyReceived: number; discrepancy?: string } = { lineId: line.id, qtyReceived };
    if (qtyReceived < line.qtySent && entry?.discrepancy) out.discrepancy = entry.discrepancy;
    return out;
  });
}

/** The lines of a count where what was counted is not what the system expected. */
export function countDiffRows(lines: CountLine[]): (CountLine & { diff: number })[] {
  return lines.map((l) => ({ ...l, diff: l.counted - l.expectedAtCount })).filter((l) => l.diff !== 0);
}

const two = (n: number) => String(n).padStart(2, "0");

/** "2026-10-25 18:05" in the viewer's zone. Written out by hand: browsers without the mn locale fall back to US-style dates. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())} ${two(d.getHours())}:${two(d.getMinutes())}`;
}
