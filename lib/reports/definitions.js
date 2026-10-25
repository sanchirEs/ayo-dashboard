/**
 * The six POS reports as data: what to ask for, which columns to show and export.
 * A column's `text` is how it reads on screen; the Excel file gets the raw value, so
 * money stays a number. Pure, so it is tested without a browser.
 */

import { formatMnt } from "@/lib/partners/format";

const GROUPS = {
  day: "Өдрөөр",
  branch: "Салбараар",
  cashier: "Кассчингаар",
  product: "Бараагаар",
  brand: "Брэндээр",
  category: "Ангилалаар",
  reason: "Шалтгаанаар",
};
const CHANNELS = { ALL: "Бүгд", STORE: "Дэлгүүр", ONLINE: "Онлайн" };
const CHANNEL_WORD = { STORE: "Дэлгүүр", ONLINE: "Онлайн" };
const METHOD_WORD = {
  CASH: "Бэлэн",
  CARD: "Карт",
  BANK_TRANSFER: "Шилжүүлэг",
  QPAY: "QPay",
  STOREPAY: "StorePay",
  STOREPAY_MANUAL: "StorePay (гараар)",
  PREPAID: "Урьдчилсан",
};
const ADJUSTMENT_WORD = {
  DAMAGED: "Эвдэрсэн",
  EXPIRED: "Хугацаа дууссан",
  TESTER: "Тестер",
  LOST: "Алдсан",
  FOUND: "Олдсон",
  GIFT: "Бэлэг",
  OTHER: "Бусад",
  COUNT_CORRECTION: "Тооллогын залруулга",
};

const money = (key, header) => ({ key, header, align: "right", text: (v) => formatMnt(v) });
const whole = (key, header) => ({ key, header, align: "right" });

export const REPORTS = {
  sales: {
    title: "Борлуулалт",
    description: "Дэлгүүрийн касс (буцаалт хассан) болон онлайн захиалгын борлуулалт.",
    endpoint: "sales",
    dated: true,
    groups: ["day", "branch", "cashier", "product", "brand", "category"],
    defaultGroup: "day",
    channel: true,
    columns: [
      { key: "label", header: "Нэр" },
      { key: "channel", header: "Суваг", text: (v) => CHANNEL_WORD[v] ?? v },
      whole("count", "Борлуулалт"),
      money("gross", "Нийт дүн"),
      money("discounts", "Хөнгөлөлт"),
      money("returns", "Буцаалт"),
      money("net", "Цэвэр борлуулалт"),
      money("vat", "НӨАТ"),
    ],
  },
  margin: {
    title: "Ашиг",
    description: "Цэвэр борлуулалт ба барааны өртгийн зөрүү. Өртөггүй мөрүүдийг тусад нь тоолно.",
    endpoint: "margin",
    dated: true,
    groups: ["day", "branch", "cashier", "product", "brand", "category"],
    defaultGroup: "day",
    channel: true,
    columns: [
      { key: "label", header: "Нэр" },
      money("net", "Цэвэр борлуулалт"),
      money("cost", "Өртөг"),
      money("margin", "Ашиг"),
      { key: "marginPct", header: "Ашиг %", align: "right", text: (v) => (v == null ? "—" : `${v}%`) },
      whole("linesMissingCost", "Өртөггүй мөр"),
    ],
  },
  "stock-value": {
    title: "Нөөцийн үнэлгээ",
    description: "Салбар бүрийн одоогийн нөөц × дундаж өртөг. Хасах үлдэгдэл орохгүй.",
    endpoint: "stock-value",
    dated: false,
    groups: [],
    columns: [
      { key: "label", header: "Салбар" },
      whole("units", "Нийт ширхэг"),
      money("value", "Үнэлгээ"),
      whole("variantsMissingCost", "Өртөггүй бараа"),
    ],
  },
  payments: {
    title: "Төлбөр",
    description: "Төлбөрийн хэлбэрээр: бэлэн, карт, QPay… Буцаалтын төлбөр хасах тэмдэгтэй.",
    endpoint: "payments",
    dated: true,
    groups: ["day", "branch"],
    defaultGroup: "day",
    columns: [
      { key: "label", header: "Нэр" },
      { key: "method", header: "Хэлбэр", text: (v) => METHOD_WORD[v] ?? v },
      money("amount", "Дүн"),
    ],
  },
  shifts: {
    title: "Ээлжийн зөрүү",
    description: "Тоолсон бэлэн мөнгө системийн тооцооноос зөрсөн хаасан ээлжүүд.",
    endpoint: "shifts",
    dated: true,
    groups: [],
    columns: [
      { key: "zNumber", header: "Z дугаар" },
      { key: "location", header: "Салбар" },
      { key: "register", header: "Касс" },
      { key: "cashier", header: "Кассчин" },
      { key: "closedAt", header: "Хаасан", text: (v) => (v ? new Date(v).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }) : "—") },
      money("expected", "Системд"),
      money("counted", "Тоолсон"),
      money("variance", "Зөрүү"),
    ],
  },
  adjustments: {
    title: "Залруулга",
    description: "Хассан, олдсон, тооллогоор засагдсан нөөц (шалтгаанаар), өртгөөр.",
    endpoint: "adjustments",
    dated: true,
    groups: ["reason", "branch"],
    defaultGroup: "reason",
    columns: [
      { key: "label", header: "Нэр", text: (v) => ADJUSTMENT_WORD[v] ?? v },
      whole("units", "Ширхэг"),
      money("value", "Өртөг"),
    ],
  },
};

export const GROUP_LABELS = GROUPS;
export const CHANNEL_CHOICES = CHANNELS;

/** The totals row in the report's own column order; a column with no total stays blank. */
export function totalsRow(report, totals) {
  return Object.fromEntries(report.columns.map((c, i) => [c.key, i === 0 ? "Нийт" : totals?.[c.key] ?? ""]));
}

/** A row as the screen shows it: each column's `text`, or the raw value. */
export function displayRow(report, row) {
  return Object.fromEntries(report.columns.map((c) => [c.key, c.text ? c.text(row[c.key], row) : row[c.key] ?? "—"]));
}

/** What goes into Excel: raw values (numbers stay numbers), words for coded columns. */
export function exportRows(report, rows) {
  return rows.map((row) =>
    Object.fromEntries(report.columns.map((c) => [c.key, c.key === "label" || c.key === "channel" || c.key === "method" ? (c.text ? c.text(row[c.key], row) : row[c.key]) : row[c.key]])),
  );
}
