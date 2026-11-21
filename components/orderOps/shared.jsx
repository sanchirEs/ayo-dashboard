"use client";

// Shared vocabulary for the order pages (order detail, payment problems,
// customer, returns): one label and colour per status everywhere.
import { getBackendUrl } from "@/lib/api/env";
import s from "./ops.module.css";

export const STATUS = {
  PENDING:          { label: "Хүлээгдэж байна",  dot: "#f59e0b", bg: "#fffbeb", text: "#92400e" },
  PROCESSING:       { label: "Баталгаажсан",     dot: "#3b82f6", bg: "#eff6ff", text: "#1e40af" },
  SHIPPED:          { label: "Илгээгдсэн",       dot: "#8b5cf6", bg: "#f5f3ff", text: "#5b21b6" },
  OUT_FOR_DELIVERY: { label: "Хүргэлтэд гарсан", dot: "#f97316", bg: "#fff7ed", text: "#9a3412" },
  DELIVERED:        { label: "Хүргэгдсэн",       dot: "#10b981", bg: "#ecfdf5", text: "#065f46" },
  CANCELLED:        { label: "Цуцлагдсан",       dot: "#ef4444", bg: "#fef2f2", text: "#991b1b" },
  RETURNED:         { label: "Буцаалт",          dot: "#8b5cf6", bg: "#f5f3ff", text: "#5b21b6" },
  PICKED_UP:        { label: "Ирж авсан",        dot: "#06b6d4", bg: "#ecfeff", text: "#0e7490" },
};
export const STATUS_ORDER = ["PENDING", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "PICKED_UP", "RETURNED", "CANCELLED"];

export const PAYMENT_STATUS = {
  COMPLETED:  { label: "Төлөгдсөн",       color: "#065f46", bg: "#ecfdf5" },
  PENDING:    { label: "Хүлээгдэж байна", color: "#92400e", bg: "#fffbeb" },
  PROCESSING: { label: "Шалгаж байна",    color: "#92400e", bg: "#fffbeb" },
  FAILED:     { label: "Амжилтгүй",       color: "#991b1b", bg: "#fef2f2" },
  EXPIRED:    { label: "Хугацаа дууссан", color: "#4b5563", bg: "#f3f4f6" },
  CANCELLED:  { label: "Цуцлагдсан",      color: "#991b1b", bg: "#fef2f2" },
  REFUNDED:   { label: "Буцаан олгосон",  color: "#5b21b6", bg: "#f5f3ff" },
};

export const PROVIDER = {
  BANK_TRANSFER: "Дансны шилжүүлэг",
  QPAY: "QPay",
  STOREPAY: "StorePay",
  POCKET: "Pocket",
  STRIPE: "Карт",
  CASH: "Бэлэн",
  OTHER: "Бусад",
};
export const providerLabel = (p) => (p ? PROVIDER[p] || p : "—");

export function fmtDate(value, withTime = true) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const date = d.toLocaleDateString("en-CA", { timeZone: "Asia/Ulaanbaatar" });
  if (!withTime) return date;
  const time = d.toLocaleTimeString("en-GB", { timeZone: "Asia/Ulaanbaatar", hour: "2-digit", minute: "2-digit" });
  return `${date} ${time}`;
}

export function money(n) {
  const v = Math.round(Number(n) || 0);
  return `₮${v.toLocaleString("en-US")}`;
}

export function StatusPill({ status }) {
  const cfg = STATUS[status] || { label: status, dot: "#6b7280", bg: "#f3f4f6", text: "#374151" };
  return (
    <span className={s.pill} style={{ background: cfg.bg, color: cfg.text }}>
      <span className={s.pillDot} style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

export function PaymentTag({ status }) {
  const cfg = PAYMENT_STATUS[status] || { label: status, color: "#374151", bg: "#f3f4f6" };
  return <span className={s.tag} style={{ color: cfg.color, background: cfg.bg }}>{cfg.label}</span>;
}

/** fetch against /api/v1 with the session token; throws with the backend's message. */
export async function opsFetch(path, token, init = {}) {
  if (!token) throw new Error("Нэвтрэлт дууссан байна. Дахин нэвтэрнэ үү.");
  const res = await fetch(`${getBackendUrl()}/api/v1${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers || {}) },
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    if (res.status === 403) throw new Error("Энэ хэсгийг харах эрх танд алга.");
    throw new Error(json.message || `Сервер алдаа буцаалаа (${res.status}).`);
  }
  return json.data;
}
