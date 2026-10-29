/**
 * Owner stock API (/api/v1/backoffice/stock): branch stock, goods in, transfers,
 * counts, adjustments, low-stock levels and set recipes (POS Plan 5).
 *
 * Client-only, like pos.ts: every caller is a page effect or a click, so the token
 * comes from useSession(). Never route these through tokenService; it calls
 * auth() -> headers(), which is server-only and returns null in the browser,
 * producing a 401 and an auto-logout.
 */

"use client";

import { getBackendUrl } from "./env";
import { logApiError } from "./error-handler";

const BASE = "/api/v1/backoffice/stock";

async function request<T>(name: string, path: string, token: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${getBackendUrl()}${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  let body: (T & { message?: string }) | null = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok) {
    // The backend's message is the actionable one ("Нөөц хүрэлцэхгүй байна").
    const message = body?.message || "Хүсэлт амжилтгүй боллоо";
    logApiError(name, { type: "server", message, statusCode: response.status, retryable: response.status >= 500 });
    throw new Error(message);
  }
  return body as T;
}

const send = (method: string, body?: unknown): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
});

const query = (params: Record<string, string | number | undefined | null>) => {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== null && value !== "") qs.set(key, String(value));
  const text = qs.toString();
  return text ? `?${text}` : "";
};

// ── types ───────────────────────────────────────────────────────────────────

export interface StockRow {
  variantId: number;
  productId: number;
  name: string;
  variantLabel: string;
  sku: string;
  barcode: string | null;
  isSet: boolean;
  price: number;
  onHand: number;
  reserved: number;
  available: number;
  avgCost: number | null;
  value: number | null;
}

export interface MovementRow {
  id: string;
  at: string;
  occurredAt: string | null;
  reason: string;
  subReason: string | null;
  qty: number;
  balanceAfter: number;
  refType: string | null;
  refId: string | null;
  note: string | null;
  unitCost: number | null;
  by: string | null;
  byType: "staff" | "user" | null;
}

export interface NegativeRow {
  variantId: number;
  locationId: number;
  locationName: string;
  sku: string;
  name: string;
  onHand: number;
  reserved: number;
}

export interface LowRow {
  variantId: number;
  sku: string;
  name: string;
  minQty: number;
  onHand: number;
  reserved: number;
  available: number;
}

export interface SuggestionLine {
  variantId: number;
  sku: string;
  name: string;
  available: number;
  minQty: number;
  sourceAvailable: number;
  suggest: number;
}

export interface Suggestion {
  toLocationId: number;
  lines: SuggestionLine[];
}

export interface Supplier {
  id: number;
  name: string;
  phone: string | null;
  country: string | null;
  note: string | null;
  active: boolean;
}

export interface SupplierInput {
  name: string;
  phone?: string;
  country?: string;
  note?: string;
}

export interface ReceiptLine {
  id?: string;
  variantId: number;
  qty: number;
  unitCost: number;
  /** This line's per-unit share of the receipt's cargo cost: a decimal string (cents), null when none. */
  cargoUnitCost?: string | number | null;
}

export interface GoodsReceipt {
  id: string;
  number: string;
  supplierId: number | null;
  supplier: Supplier | null;
  locationId: number;
  note: string | null;
  receivedAt: string;
  stockApplied: boolean;
  /** Total cargo paid for the whole receipt, spread over its lines; null when none. */
  cargoCostMnt?: number | null;
  lines: ReceiptLine[];
}

export type TransferStatus = "DRAFT" | "SENT" | "RECEIVED" | "CANCELLED";

export interface TransferLine {
  id: string;
  variantId: number;
  qtySent: number;
  qtyReceived: number | null;
  discrepancy: string | null;
}

export interface Transfer {
  id: string;
  number: string;
  fromLocationId: number;
  toLocationId: number;
  status: TransferStatus;
  note: string | null;
  createdAt: string;
  sentAt: string | null;
  receivedAt: string | null;
  lines: TransferLine[];
}

export interface TransferRequest {
  id: string;
  locationId: number;
  status: "OPEN" | "CONVERTED" | "DECLINED";
  lines: { variantId: number; qty: number }[];
  note: string | null;
  createdAt: string;
}

export type CountStatus = "OPEN" | "SUBMITTED" | "APPROVED" | "REJECTED";

export interface CountLine {
  id: string;
  variantId: number;
  counted: number;
  expectedAtCount: number;
}

export interface StockCount {
  id: string;
  number: string;
  locationId: number;
  scope: string;
  status: CountStatus;
  startedAt: string;
  submittedAt: string | null;
  decidedAt: string | null;
  valueImpact: number | null;
  lines?: CountLine[];
}

export type AdjustmentReason = "DAMAGED" | "EXPIRED" | "TESTER" | "LOST" | "FOUND" | "GIFT" | "OTHER";

export interface Adjustment {
  id: string;
  locationId: number;
  reason: AdjustmentReason;
  note: string | null;
  createdAt: string;
  lines: { variantId: number; qty: number }[];
}

export interface RecipeComponent {
  componentVariantId: number;
  qty: number;
}

/** A variant that carries a recipe (same shape as a variant search hit, plus its price and line count). */
export interface SetSummary {
  id: number;
  productId: number;
  name: string;
  variantLabel: string;
  sku: string;
  barcode: string | null;
  price: number;
  componentCount: number;
}

export interface CreatedSet {
  productId: number;
  variantId: number;
  sku: string;
  name: string;
  price: number;
  recipe: RecipeComponent[];
}

// ── stock reads ─────────────────────────────────────────────────────────────

export const searchStock = async (locationId: number, q: string, token: string) =>
  (await request<{ rows: StockRow[] }>("searchStock", `/search${query({ locationId, q, limit: 100 })}`, token)).rows;

export const itemHistory = async (variantId: number, locationId: number, token: string) =>
  (await request<{ rows: MovementRow[] }>("itemHistory", `/item-history${query({ variantId, locationId, limit: 100 })}`, token)).rows;

export const negativeBalances = async (token: string) => (await request<{ rows: NegativeRow[] }>("negativeBalances", "/negative", token)).rows;

// ── levels ──────────────────────────────────────────────────────────────────

export const lowStock = async (locationId: number, token: string) =>
  (await request<{ rows: LowRow[] }>("lowStock", `/levels/low${query({ locationId })}`, token)).rows;

export const suggestTransfers = async (fromLocationId: number, token: string) =>
  (await request<{ suggestions: Suggestion[] }>("suggestTransfers", `/levels/suggest${query({ fromLocationId })}`, token)).suggestions;

export const setLevel = (data: { variantId: number; locationId: number; minQty: number }, token: string) =>
  request<{ level: unknown }>("setLevel", "/levels", token, send("PUT", data));

// ── suppliers and goods in ──────────────────────────────────────────────────

export const listSuppliers = async (token: string, includeInactive = false) =>
  (await request<{ suppliers: Supplier[] }>("listSuppliers", `/suppliers${query({ includeInactive: includeInactive ? "true" : undefined })}`, token)).suppliers;

export const createSupplier = async (data: SupplierInput, token: string) =>
  (await request<{ supplier: Supplier }>("createSupplier", "/suppliers", token, send("POST", data))).supplier;

export const updateSupplier = async (id: number, data: Partial<SupplierInput> & { active?: boolean }, token: string) =>
  (await request<{ supplier: Supplier }>("updateSupplier", `/suppliers/${id}`, token, send("PUT", data))).supplier;

export const listGoodsReceipts = async (token: string, locationId?: number) =>
  (await request<{ receipts: GoodsReceipt[] }>("listGoodsReceipts", `/goods-receipts${query({ locationId, take: 100 })}`, token)).receipts;

export const receiveGoods = async (
  data: {
    locationId: number;
    supplierId: number | null;
    note?: string;
    /** Whole ₮ for the whole receipt; omit when there is no cargo cost. */
    cargoCostMnt?: number;
    lines: { variantId: number; qty: number; unitCost: number }[];
  },
  token: string,
) => (await request<{ receipt: GoodsReceipt }>("receiveGoods", "/goods-receipts", token, send("POST", data))).receipt;

// ── transfers ───────────────────────────────────────────────────────────────

export const listTransfers = async (token: string, status?: TransferStatus) =>
  (await request<{ transfers: Transfer[] }>("listTransfers", `/transfers${query({ status, take: 100 })}`, token)).transfers;

export const createTransfer = async (
  data: { fromLocationId: number; toLocationId: number; note?: string; lines: { variantId: number; qty: number }[] },
  token: string,
) => (await request<{ transfer: Transfer }>("createTransfer", "/transfers", token, send("POST", data))).transfer;

export const sendTransfer = async (id: string, token: string) =>
  (await request<{ transfer: Transfer }>("sendTransfer", `/transfers/${id}/send`, token, send("POST"))).transfer;

export const receiveTransfer = async (id: string, lines: { lineId: string; qtyReceived: number; discrepancy?: string }[], token: string) =>
  (await request<{ transfer: Transfer }>("receiveTransfer", `/transfers/${id}/receive`, token, send("POST", { lines }))).transfer;

export const cancelTransfer = async (id: string, token: string) =>
  (await request<{ transfer: Transfer }>("cancelTransfer", `/transfers/${id}/cancel`, token, send("POST"))).transfer;

export const listTransferRequests = async (token: string) =>
  (await request<{ requests: TransferRequest[] }>("listTransferRequests", "/transfer-requests", token)).requests;

export const convertTransferRequest = async (id: string, fromLocationId: number, token: string) =>
  (await request<{ transfer: Transfer }>("convertTransferRequest", `/transfer-requests/${id}/convert`, token, send("POST", { fromLocationId }))).transfer;

// ── counts and adjustments ──────────────────────────────────────────────────

export const listCounts = async (token: string, status?: CountStatus) =>
  (await request<{ counts: StockCount[] }>("listCounts", `/counts${query({ status, take: 100 })}`, token)).counts;

export const getCount = async (id: string, token: string) => (await request<{ count: StockCount }>("getCount", `/counts/${id}`, token)).count;

export const approveCount = (id: string, token: string) => request<{ count?: StockCount }>("approveCount", `/counts/${id}/approve`, token, send("POST"));

export const rejectCount = async (id: string, token: string) =>
  (await request<{ count: StockCount }>("rejectCount", `/counts/${id}/reject`, token, send("POST"))).count;

export const listAdjustments = async (token: string, locationId?: number) =>
  (await request<{ adjustments: Adjustment[] }>("listAdjustments", `/adjustments${query({ locationId, take: 100 })}`, token)).adjustments;

export const createAdjustment = async (
  data: { locationId: number; reason: AdjustmentReason; note?: string; lines: { variantId: number; qty: number }[] },
  token: string,
) => (await request<{ adjustment: Adjustment }>("createAdjustment", "/adjustments", token, send("POST", data))).adjustment;

// ── set recipes ─────────────────────────────────────────────────────────────

export const listSets = async (token: string) => (await request<{ sets: SetSummary[] }>("listSets", "/sets", token)).sets;

export const createSet = async (data: { name: string; price: number; components: RecipeComponent[] }, token: string) =>
  (await request<{ set: CreatedSet }>("createSet", "/sets", token, send("POST", data))).set;

export const getRecipe = async (variantId: number, token: string) =>
  (await request<{ recipe: RecipeComponent[] }>("getRecipe", `/sets/${variantId}/recipe`, token)).recipe;

export const saveRecipe = async (variantId: number, components: RecipeComponent[], token: string) =>
  (await request<{ recipe: RecipeComponent[] }>("saveRecipe", `/sets/${variantId}/recipe`, token, send("PUT", { components }))).recipe;
