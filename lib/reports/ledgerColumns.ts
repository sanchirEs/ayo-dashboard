/**
 * "Бүх гүйлгээ" columns (spec ayo-back/docs/superpowers/specs/2026-11-15-pos-all-transactions-design.md §4).
 * One list per tab. Keys are the row keys the backend's ledgerReport.js returns. `explain`
 * lands in the Excel "Тайлбар" sheet, so it is written for an owner, not a developer.
 * Times are shown and exported in Ulaanbaatar time (UTC+8, no daylight saving).
 */

export type ColType = "text" | "int" | "money" | "vat" | "pct" | "datetime" | "enum" | "bool";
export type TabKey = "receipts" | "lines" | "payments" | "returns" | "shifts" | "cash" | "handovers";

export interface LedgerColumn {
  key: string;
  header: string;
  type: ColType;
  labels?: Record<string, string>;
  /** Hidden on screen until picked in the column picker. Excel always has every column. */
  hidden?: boolean;
  /** Used for the dropdown filter: few distinct values. */
  pick?: boolean;
  explain: string;
}

export interface LedgerTab {
  key: TabKey;
  title: string;
  sheet: string;
  columns: LedgerColumn[];
}

export const METHOD_LABELS: Record<string, string> = {
  CASH: "Бэлэн",
  CARD: "Карт",
  QPAY: "QPay",
  STOREPAY: "StorePay",
  BANK_TRANSFER: "Шилжүүлэг",
  STOREPAY_MANUAL: "StorePay (гараар)",
  PREPAID: "Урьдчилж төлсөн",
};
export const METHODS = Object.keys(METHOD_LABELS);

const SALE_STATUS = { COMPLETED: "Гүйцэтгэсэн", VOIDED: "Хүчингүй болсон" };
const RETURN_KIND = { REFUND: "Буцаалт", VOID: "Хүчингүй" };
const EBARIMT = { NOT_ISSUED: "Гараагүй", ISSUED: "Гарсан", PENDING: "Хүлээгдэж буй", FAILED: "Алдаатай" };

// --- shared column builders -------------------------------------------------------------
const c = (key: string, header: string, type: ColType, explain: string, more: Partial<LedgerColumn> = {}): LedgerColumn => ({ key, header, type, explain, ...more });
const money = (key: string, header: string, explain: string, more: Partial<LedgerColumn> = {}) => c(key, header, "money", explain, more);
const int = (key: string, header: string, explain: string, more: Partial<LedgerColumn> = {}) => c(key, header, "int", explain, more);
const text = (key: string, header: string, explain: string, more: Partial<LedgerColumn> = {}) => c(key, header, "text", explain, more);
const pick = (key: string, header: string, labels: Record<string, string>, explain: string, more: Partial<LedgerColumn> = {}) =>
  c(key, header, "enum", explain, { labels, pick: true, ...more });

const when = (header = "Огноо, цаг", explain = "Улаанбаатарын цагаар.") => c("occurredAt", header, "datetime", explain);
const branch = [
  text("locationName", "Салбар", "Борлуулалт хийсэн салбар.", { pick: true }),
  text("locationCode", "Салбарын код", "Салбарын товч код.", { hidden: true }),
];
const register = [
  int("registerNumber", "Касс №", "Салбар доторх кассын дугаар.", { hidden: true }),
  text("registerName", "Касс", "Кассын нэр.", { pick: true }),
];
const shift = text("shiftZ", "Ээлж", "Ээлжийн Z дугаар (хаагдаагүй бол ээлжийн богино дугаар).", { hidden: true });
const cashier = text("cashierName", "Кассчин", "Гүйлгээ хийсэн ажилтан.", { pick: true });
const saleNo = text("saleNumber", "Баримт №", "Кассын баримтын дугаар.");
const methodCols = (hidden = false) => METHODS.map((m) => money(`pay${m}`, METHOD_LABELS[m], `${METHOD_LABELS[m]}-аар төлсөн дүн.`, { hidden }));

// --- tabs ------------------------------------------------------------------------------
export const LEDGER_TABS: LedgerTab[] = [
  {
    key: "receipts",
    title: "Баримт",
    sheet: "Баримт",
    columns: [
      when(),
      c("receivedAt", "Серверт ирсэн", "datetime", "Касс офлайн байсан бол баримт серверт хожуу ирнэ. Улаанбаатарын цагаар.", { hidden: true }),
      ...branch,
      ...register,
      shift,
      cashier,
      saleNo,
      pick("status", "Төлөв", SALE_STATUS, "Хүчингүй болсон баримт нийт дүнд орохгүй."),
      text("customerPhone", "Худалдан авагчийн утас", "Кассчин оруулсан утас."),
      text("customerName", "Худалдан авагч", "Вэбсайтын бүртгэлтэй хэрэглэгч бол нэр.", { hidden: true }),
      int("customerUserId", "Хэрэглэгчийн ID", "Вэбсайтын хэрэглэгчийн дугаар.", { hidden: true }),
      pick("receiptType", "Баримтын төрөл", { INDIVIDUAL: "Хувь хүн", COMPANY: "Байгууллага" }, "Хувь хүн эсвэл байгууллагын баримт.", { hidden: true }),
      text("buyerTin", "Байгууллагын РД", "Байгууллагын баримт бол регистр.", { hidden: true }),
      text("buyerName", "Байгууллагын нэр", "Байгууллагын баримт бол нэр.", { hidden: true }),
      int("lineCount", "Мөр", "Баримтад хэдэн төрлийн бараа байгаа."),
      int("qtyTotal", "Ширхэг", "Нийт хэдэн ширхэг бараа."),
      money("listTotal", "Үндсэн үнээр", "Бүх хөнгөлөлтөөс өмнөх дүн (үндсэн үнэ × тоо)."),
      money("subtotal", "Хямдралын дараах", "Хямдралын дараах, гар хөнгөлөлтөөс өмнөх дүн.", { hidden: true }),
      money("campaignDiscount", "Хямдрал (урамшуулал)", "Хямдралын кампанит ажлын хөнгөлөлт.", { hidden: true }),
      money("manualDiscount", "Гар хөнгөлөлт", "Кассчин гараар өгсөн хөнгөлөлт.", { hidden: true }),
      money("allDiscount", "Хөнгөлөлт", "Бүх хөнгөлөлт: хямдрал, гар хөнгөлөлт, сагсны хөнгөлөлт. Үндсэн үнээр минус барааны төлсөн дүн."),
      money("cargo", "Карго", "Кассчин нэмсэн карго, Борлуулалтад багтсан."),
      money("total", "Борлуулалт", "Худалдан авагчийн төлсөн дүн: Үндсэн үнээр − Хөнгөлөлт + Карго."),
      money("cost", "Өртөг", "Бараануудын өртөг. Аль нэг барааны өртөг тодорхойгүй бол хоосон."),
      money("profit", "Ашиг", "Барааны дүн минус өртөг. Өртөг тодорхойгүй бол хоосон."),
      pick("paymentMethods", "Төлбөрийн хэлбэр", METHOD_LABELS, "Ямар хэлбэрээр төлсөн (хэд хэдэн байж болно)."),
      ...methodCols(true),
      money("tendered", "Өгсөн бэлэн", "Худалдан авагчийн өгсөн бэлэн мөнгө.", { hidden: true }),
      money("change", "Хариулт", "Буцааж өгсөн хариулт.", { hidden: true }),
      text("paymentRefs", "Төлбөрийн лавлах", "Карт, QPay, StorePay-н гүйлгээний дугаар.", { hidden: true }),
      money("refunded", "Буцаасан", "Энэ баримтаас сонгосон хугацааны төгсгөл хүртэл буцааж өгсөн мөнгө."),
      int("returnCount", "Буцаалтын тоо", "Хэдэн удаа буцаалт хийсэн.", { hidden: true }),
      money("netAfterReturns", "Цэвэр дүн", "Борлуулалт минус энэ баримтын буцаалт. Хүчингүй баримт 0."),
      pick("ebarimtStatus", "И-баримт", EBARIMT, "И-баримт гарсан эсэх."),
      text("flags", "Тэмдэглэгээ", "Системийн тэмдэглэгээ (офлайн, зөрүү г.м.).", { hidden: true }),
      text("note", "Тайлбар", "Кассчны нэмэлт тайлбар.", { hidden: true }),
      text("appVersion", "Апп хувилбар", "Кассын программын хувилбар.", { hidden: true }),
    ],
  },
  {
    key: "lines",
    title: "Бараа",
    sheet: "Бараа",
    columns: [
      when(),
      ...branch,
      ...register,
      shift,
      cashier,
      saleNo,
      text("customerPhone", "Худалдан авагчийн утас", "Кассчин оруулсан утас.", { hidden: true }),
      text("productName", "Бараа", "Барааны нэр (баримтад хэвлэгдсэн)."),
      text("sku", "SKU", "Барааны код."),
      text("barcode", "Баркод", "Уншуулсан баркод.", { hidden: true }),
      int("variantId", "Хувилбарын ID", "Системийн хувилбарын дугаар.", { hidden: true }),
      int("productId", "Барааны ID", "Системийн барааны дугаар.", { hidden: true }),
      text("brandName", "Брэнд", "Барааны брэнд.", { pick: true }),
      text("categoryName", "Ангилал", "Барааны ангилал.", { pick: true, hidden: true }),
      text("topCategoryName", "Үндсэн ангилал", "Дээд түвшний ангилал.", { pick: true, hidden: true }),
      int("qty", "Тоо", "Зарсан ширхэг."),
      money("listPrice", "Үндсэн үнэ", "Нэгжийн үнэ хөнгөлөлтөөс өмнө."),
      money("unitPrice", "Зарсан үнэ", "Бүх хөнгөлөлтийн дараах нэгжийн үнэ (дүн ÷ тоо)."),
      text("campaignName", "Хямдрал", "Хэрэглэсэн хямдралын нэр.", { hidden: true }),
      int("campaignId", "Хямдралын ID", "Хямдралын дугаар.", { hidden: true }),
      money("campaignDiscount", "Хямдралын хөнгөлөлт", "Хямдралаас хассан дүн (мөрийн нийт).", { hidden: true }),
      money("manualDiscount", "Гар хөнгөлөлт", "Энэ мөрөнд кассчин гараар өгсөн хөнгөлөлт."),
      text("discountApprovedByName", "Хөнгөлөлт зөвшөөрсөн", "Гар хөнгөлөлтийг зөвшөөрсөн менежер.", { hidden: true }),
      money("cartDiscountShare", "Сагсны хөнгөлөлт", "Баримт бүхэлд өгсөн хөнгөлөлтөөс энэ мөрөнд ногдох хэсэг.", { hidden: true }),
      money("lineTotal", "Дүн", "Энэ мөрийн төлсөн дүн."),
      money("unitCost", "Нэгжийн өртөг", "Зарах үеийн дундаж өртөг.", { hidden: true }),
      money("lineCost", "Өртөг", "Нэгжийн өртөг × тоо."),
      money("lineProfit", "Ашиг", "Дүн минус өртөг."),
      c("marginPct", "Ашгийн %", "pct", "Ашиг ÷ дүн × 100."),
      c("fulfilledFromComponents", "Багцаас", "bool", "Багцыг бүрдэл хэсгээс нь угсарч зарсан.", { hidden: true }),
      int("qtyReturned", "Буцаасан тоо", "Хугацааны төгсгөл хүртэл буцаасан ширхэг."),
      money("refunded", "Буцаасан дүн", "Хугацааны төгсгөл хүртэл буцааж өгсөн мөнгө.", { hidden: true }),
      int("netQty", "Цэвэр тоо", "Зарсан минус буцаасан. Хүчингүй баримт 0.", { hidden: true }),
      money("netAmount", "Цэвэр дүн", "Дүн минус буцаалт. Хүчингүй баримт 0."),
      pick("saleStatus", "Баримтын төлөв", SALE_STATUS, "Баримт хүчингүй болсон эсэх."),
      pick("ebarimtStatus", "И-баримт", EBARIMT, "И-баримт гарсан эсэх.", { hidden: true }),
    ],
  },
  {
    key: "payments",
    title: "Төлбөр",
    sheet: "Төлбөр",
    columns: [
      when("Огноо, цаг", "Борлуулалтын төлбөр бол баримтын цаг, буцаалт бол буцаалтын цаг."),
      ...branch,
      ...register,
      shift,
      cashier,
      saleNo,
      pick("kind", "Төрөл", { SALE: "Борлуулалт", REFUND: "Буцаалт", QPAY_UNMATCHED: "Баримтгүй QPay" },
        "Баримтгүй QPay: QPay төлөгдсөн ч касс баримтаа илгээгээгүй. Нийт дүнд орохгүй, шалгах хэрэгтэй."),
      pick("returnKind", "Буцаалтын төрөл", RETURN_KIND, "Буцаалт эсвэл хүчингүй болгосон.", { hidden: true }),
      pick("method", "Хэлбэр", METHOD_LABELS, "Төлбөрийн хэлбэр."),
      money("amount", "Дүн", "Төлбөрийн дүн. Буцааж өгсөн мөнгө хасах тэмдэгтэй."),
      money("tendered", "Өгсөн бэлэн", "Худалдан авагчийн өгсөн бэлэн мөнгө.", { hidden: true }),
      money("change", "Хариулт", "Буцааж өгсөн хариулт.", { hidden: true }),
      text("reference", "Лавлах", "Гүйлгээний дугаар (карт, QPay, StorePay)."),
      pick("status", "Төлбөрийн төлөв", { CONFIRMED: "Баталгаажсан" }, "Төлбөрийн төлөв.", { hidden: true }),
      pick("saleStatus", "Баримтын төлөв", SALE_STATUS, "Баримт хүчингүй болсон эсэх."),
      text("qpayInvoiceNo", "QPay нэхэмжлэх", "Манай QPay нэхэмжлэхийн дугаар.", { hidden: true }),
      text("qpayPaymentId", "QPay гүйлгээ", "QPay-н гүйлгээний дугаар.", { hidden: true }),
      pick("qpayStatus", "QPay төлөв", { PAID: "Төлөгдсөн", PENDING: "Хүлээгдэж буй", CANCELLED: "Цуцалсан", EXPIRED: "Хугацаа дууссан" }, "QPay нэхэмжлэхийн төлөв.", { hidden: true }),
      c("qpayPaidAt", "QPay төлөгдсөн", "datetime", "QPay төлөгдсөн цаг.", { hidden: true }),
    ],
  },
  {
    key: "returns",
    title: "Буцаалт",
    sheet: "Буцаалт",
    columns: [
      when("Огноо, цаг", "Буцаалт хийсэн цаг."),
      ...branch,
      ...register,
      shift,
      cashier,
      pick("kind", "Төрөл", RETURN_KIND, "Буцаалт: мөнгө буцааж өгсөн. Хүчингүй: баримтыг бүхэлд нь цуцалсан."),
      text("approvedByName", "Зөвшөөрсөн", "Зөвшөөрсөн менежер."),
      saleNo,
      c("saleOccurredAt", "Анхны баримтын цаг", "datetime", "Буцаасан барааг зарсан цаг."),
      text("customerPhone", "Худалдан авагчийн утас", "Анхны баримтад оруулсан утас.", { hidden: true }),
      text("productName", "Бараа", "Буцаасан бараа."),
      text("sku", "SKU", "Барааны код."),
      text("barcode", "Баркод", "Баркод.", { hidden: true }),
      int("qty", "Тоо", "Буцаасан ширхэг."),
      money("unitPrice", "Зарсан үнэ", "Анх зарсан нэгжийн үнэ.", { hidden: true }),
      c("restock", "Тавиурт буцсан", "bool", "Тийм: бараа нөөцөд буцсан. Үгүй: гэмтэлтэй гэж хассан."),
      text("reason", "Шалтгаан", "Кассчны бичсэн шалтгаан."),
      money("refundAmount", "Буцаасан дүн", "Энэ барааны төлөө буцааж өгсөн мөнгө."),
      money("returnTotal", "Буцаалтын нийт", "Нэг буцаалтын нийт дүн (олон мөртэй бол мөр бүрт давтагдана).", { hidden: true }),
      text("flags", "Тэмдэглэгээ", "Системийн тэмдэглэгээ.", { hidden: true }),
    ],
  },
  {
    key: "shifts",
    title: "Ээлж",
    sheet: "Ээлж",
    columns: [
      text("zNumber", "Z дугаар", "Ээлжийн хаалтын дугаар."),
      ...branch,
      ...register,
      text("openedByName", "Нээсэн", "Ээлж нээсэн ажилтан.", { pick: true }),
      c("openedAt", "Нээсэн цаг", "datetime", "Улаанбаатарын цагаар."),
      text("closedByName", "Хаасан", "Ээлж хаасан ажилтан.", { pick: true }),
      c("closedAt", "Хаасан цаг", "datetime", "Улаанбаатарын цагаар."),
      int("durationMin", "Үргэлжилсэн (мин)", "Ээлжийн урт минутаар.", { hidden: true }),
      pick("status", "Төлөв", { OPEN: "Нээлттэй", CLOSED: "Хаагдсан" }, "Ээлж хаагдсан эсэх."),
      money("openingFloat", "Эхний бэлэн", "Ээлж эхлэхэд кассанд байсан бэлэн мөнгө."),
      money("cashSales", "Бэлэн борлуулалт", "Бэлэн мөнгөөр авсан төлбөр."),
      money("cashRefunds", "Бэлэн буцаалт", "Бэлнээр буцааж өгсөн."),
      money("cashIn", "Кассанд нэмсэн", "Ээлжийн дунд кассанд нэмсэн бэлэн."),
      money("cashOut", "Кассаас гаргасан", "Ээлжийн дунд кассаас гаргасан бэлэн."),
      money("expectedCash", "Байх ёстой бэлэн", "Эхний бэлэн + бэлэн борлуулалт − бэлэн буцаалт + нэмсэн − гаргасан."),
      money("countedCash", "Тоолсон бэлэн", "Ээлж хаахад тоолсон бэлэн."),
      money("variance", "Зөрүү", "Тоолсон минус байх ёстой. Хасах: дутсан, нэмэх: илүүдсэн."),
      text("denominations", "Дэвсгэрт", "Тоолсон дэвсгэртүүд (дүн×тоо).", { hidden: true }),
      int("salesCount", "Баримтын тоо", "Гүйцэтгэсэн баримт."),
      money("salesTotal", "Борлуулалт", "Гүйцэтгэсэн баримтын нийт дүн."),
      money("discountTotal", "Гар хөнгөлөлт", "Ээлжийн гар хөнгөлөлт.", { hidden: true }),
      money("cargoTotal", "Карго", "Ээлжийн карго.", { hidden: true }),
      int("voidCount", "Хүчингүй баримт", "Хүчингүй болгосон баримтын тоо."),
      ...methodCols(true),
      int("refundCount", "Буцаалтын тоо", "Буцаалт хийсэн тоо.", { hidden: true }),
      money("refundTotal", "Буцаалтын дүн", "Буцааж өгсөн нийт мөнгө."),
      int("noSaleCount", "Касс нээсэн (борлуулалтгүй)", "Борлуулалтгүйгээр касс нээсэн тоо.", { hidden: true }),
      text("note", "Тайлбар", "Ээлж хаахад бичсэн тайлбар.", { hidden: true }),
    ],
  },
  {
    key: "cash",
    title: "Кассанд нэмсэн/гаргасан",
    sheet: "Кассанд нэмсэн-гаргасан",
    columns: [
      when(),
      ...branch,
      ...register,
      shift,
      pick("type", "Төрөл", { IN: "Кассанд нэмсэн", OUT: "Кассаас гаргасан", NO_SALE: "Касс нээсэн" }, "Кассанд мөнгө нэмсэн, гаргасан, эсвэл борлуулалтгүй нээсэн."),
      money("amount", "Дүн", "Хөдөлгөөний дүн."),
      money("signedAmount", "Дүн (±)", "Кассаас гаргасан нь хасах тэмдэгтэй, нийлбэр нь кассын өөрчлөлт.", { hidden: true }),
      text("reason", "Шалтгаан", "Ажилтны бичсэн шалтгаан."),
      text("staffName", "Ажилтан", "Хийсэн ажилтан.", { pick: true }),
      text("approvedByName", "Зөвшөөрсөн", "Зөвшөөрсөн менежер."),
    ],
  },
  {
    key: "handovers",
    title: "Онлайн захиалга олгосон",
    sheet: "Онлайн захиалга олгосон",
    columns: [
      when("Олгосон цаг", "Касс дээр захиалгыг хүлээлгэн өгсөн цаг."),
      ...branch,
      ...register,
      text("staffName", "Олгосон ажилтан", "Захиалгыг хүлээлгэн өгсөн ажилтан.", { pick: true }),
      int("orderId", "Захиалга №", "Вэбсайтын захиалгын дугаар."),
      c("orderCreatedAt", "Захиалсан цаг", "datetime", "Захиалга үүссэн цаг."),
      text("customerName", "Худалдан авагч", "Захиалагчийн нэр."),
      text("customerPhone", "Утас", "Захиалагчийн утас."),
      int("itemCount", "Ширхэг", "Захиалгын барааны тоо."),
      money("orderTotal", "Захиалгын дүн", "Хүргэлт орсон нийт дүн (вэбсайтаар төлсөн)."),
      money("shippingCost", "Хүргэлт", "Хүргэлтийн төлбөр.", { hidden: true }),
      text("paymentProvider", "Төлбөр", "Вэбсайт дээр ямар хэлбэрээр төлсөн."),
      text("paymentStatus", "Төлбөрийн төлөв", "Вэбсайтын төлбөрийн төлөв.", { hidden: true }),
      text("orderStatus", "Захиалгын төлөв", "Захиалгын одоогийн төлөв.", { hidden: true }),
      text("orderLocationName", "Захиалгын салбар", "Захиалга аль салбараас авахаар байсан.", { hidden: true }),
    ],
  },
];

export function tabOf(key: TabKey): LedgerTab {
  const tab = LEDGER_TABS.find((t) => t.key === key);
  if (!tab) throw new Error(`unknown ledger tab ${key}`);
  return tab;
}

export function columnOf(tab: TabKey, key: string): LedgerColumn {
  const col = tabOf(tab).columns.find((c) => c.key === key);
  if (!col) throw new Error(`unknown column ${tab}.${key}`);
  return col;
}

// --- formatting ----------------------------------------------------------------------
const UB_MS = 8 * 3600 * 1000;
const pad = (n: number) => String(n).padStart(2, "0");

/** The Ulaanbaatar calendar and clock of an instant. */
export function ubParts(isoOrDate: string | Date) {
  const t = new Date(new Date(isoOrDate).getTime() + UB_MS);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), hh: t.getUTCHours(), mi: t.getUTCMinutes(), ss: t.getUTCSeconds() };
}

const isEmpty = (v: unknown) => v === null || v === undefined || v === "";

function enumLabel(col: LedgerColumn, value: unknown): string {
  const raw = String(value);
  const labels = col.labels ?? {};
  // "CARD + CASH" (several payment methods) maps token by token.
  return raw.split(" + ").map((part) => labels[part] ?? part).join(" + ");
}

/** What the table shows. */
export function cellText(col: LedgerColumn, value: unknown): string {
  if (isEmpty(value)) return "";
  switch (col.type) {
    case "money":
    case "int":
      return Math.round(Number(value)).toLocaleString("en-US");
    case "vat":
      return Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    case "pct":
      return `${Number(value).toFixed(1)}%`;
    case "datetime": {
      const p = ubParts(value as string);
      return `${p.y}-${pad(p.m)}-${pad(p.d)} ${pad(p.hh)}:${pad(p.mi)}`;
    }
    case "enum":
      return enumLabel(col, value);
    case "bool":
      return value ? "Тийм" : "Үгүй";
    default:
      return String(value);
  }
}

/** What lands in an Excel cell: numbers stay numbers, times become dates on the UB clock. */
export function cellValue(col: LedgerColumn, value: unknown): string | number | Date {
  if (isEmpty(value)) return "";
  switch (col.type) {
    case "money":
    case "int":
    case "vat":
      return Number(value);
    case "pct":
      return Math.round(Number(value) * 10) / 10;
    case "datetime": {
      // A Date whose LOCAL clock reads the UB clock: SheetJS writes local components.
      const p = ubParts(value as string);
      return new Date(p.y, p.m - 1, p.d, p.hh, p.mi, p.ss);
    }
    case "enum":
    case "bool":
      return cellText(col, value);
    default:
      return String(value);
  }
}

/** The number a column sorts and filters by. */
export function sortKey(col: LedgerColumn, value: unknown): number | string | null {
  if (isEmpty(value)) return null;
  if (col.type === "datetime") return new Date(value as string).getTime();
  if (col.type === "money" || col.type === "int" || col.type === "vat" || col.type === "pct") return Number(value);
  if (col.type === "bool") return value ? 1 : 0;
  return cellText(col, value).toLocaleLowerCase();
}
