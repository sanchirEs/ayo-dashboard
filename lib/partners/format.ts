/** Display helpers for the partner pages. Amounts are whole ₮ (integers). */

export type DeliveryStatus = "DRAFT" | "SENT" | "CONFIRMED" | "DISPUTED";
export type AgingKey = "current" | "d31_60" | "d61_90" | "d90plus";
export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "QPAY" | "OTHER";
export type ShortfallKind = "SHORTFALL_TO_STOCK" | "SHORTFALL_LOST" | "DISPUTED";

export function formatMnt(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const sign = n < 0 ? "-" : "";
  return `${sign}${Math.abs(Math.round(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}₮`;
}

const DELIVERY_STATUS: Record<DeliveryStatus, string> = {
  DRAFT: "Ноорог",
  SENT: "Илгээсэн",
  CONFIRMED: "Баталгаажсан",
  DISPUTED: "Маргаантай",
};

export const deliveryStatusLabel = (status: string): string =>
  DELIVERY_STATUS[status as DeliveryStatus] ?? status;

export const AGING_KEYS: AgingKey[] = ["current", "d31_60", "d61_90", "d90plus"];

const AGING: Record<AgingKey, string> = {
  current: "0–30 хоног",
  d31_60: "31–60 хоног",
  d61_90: "61–90 хоног",
  d90plus: "90+ хоног",
};

export const agingLabel = (key: string): string => AGING[key as AgingKey] ?? key;

export const PAYMENT_METHODS: PaymentMethod[] = ["CASH", "BANK_TRANSFER", "QPAY", "OTHER"];

const PAYMENT_METHOD: Record<PaymentMethod, string> = {
  CASH: "Бэлэн",
  BANK_TRANSFER: "Дансаар",
  QPAY: "QPay",
  OTHER: "Бусад",
};

export const paymentMethodLabel = (method: string): string =>
  PAYMENT_METHOD[method as PaymentMethod] ?? method;

const ADJUSTMENT_KIND: Record<string, string> = {
  SHORTFALL_TO_STOCK: "Төвийн алдаа",
  SHORTFALL_LOST: "Замдаа алга болсон",
  DISPUTED: "Маргаантай",
  CREDIT: "Хасалт",
};

export const adjustmentKindLabel = (kind: string): string => ADJUSTMENT_KIND[kind] ?? kind;

/** "2026-10-24" in Ulaanbaatar time (UTC+8, no DST). */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Date(d.getTime() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}
