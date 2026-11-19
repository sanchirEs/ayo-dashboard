/**
 * "Хүргэлтийн хүсэлт" API (/api/v1/transfer-forms): the requests customers send from
 * ayo.mn/form after a bank transfer, and turning one into an order.
 *
 * Client-only, like stock.ts and pos.ts: every caller is a page effect or a click, so the
 * token comes from useSession(). Never route these through tokenService; it calls
 * auth() -> headers(), which is server-only and returns null in the browser, producing a 401
 * and an auto-logout. Plain fetch on purpose too: a 403 (a role that may read but not write)
 * must show as a message, not log the person out.
 */

"use client";

import { getBackendUrl } from "./env";
import { logApiError } from "./error-handler";

const BASE = "/api/v1/transfer-forms";

async function request<T>(name: string, path: string, token: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${getBackendUrl()}${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  let body: { data?: T; message?: string } | null = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok) {
    // The backend's message is the one staff can act on ("Энэ шилжүүлгийг аль хэдийн ашигласан (#5012)").
    const message =
      (typeof body?.message === "string" && body.message) ||
      (response.status === 403 ? "Танд энэ үйлдлийг хийх эрх алга" : "Хүсэлт амжилтгүй боллоо");
    logApiError(name, { type: "server", message, statusCode: response.status, retryable: response.status >= 500 });
    throw new Error(message);
  }
  return body?.data as T;
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

export type FormStatus = "NEW" | "ORDERED" | "CANCELLED";

export interface TransferForm {
  id: number;
  status: FormStatus;
  orderId: number | null;
  userId: number;
  recipientName: string;
  phone: string;
  district: string;
  address: string;
  productsText: string;
  paymentNote: string;
  chatPages: string[];
  senderAccount: string;
  staffNote: string | null;
  handledAt: string | null;
  createdAt: string;
}

export interface FormList {
  forms: TransferForm[];
  total: number;
  counts: Record<FormStatus, number>;
  page: number;
  limit: number;
}

/** One row of the bank statement sheet. */
export interface TransferRow {
  tabId: string;
  tabName: string;
  rowIndex: number;
  fingerprint: string;
  timeText: string;
  amount: number;
  description: string;
  accountNumber: string;
  phone: string;
  pickupChecked: boolean;
  deliveryChecked: boolean;
  refunded: boolean;
  /** Set when this transfer already paid for an order or a till sale. */
  usedBy: { orderId: number | null; posSaleId: string | null } | null;
}

export interface FormDetail {
  form: TransferForm;
  customer: { id: number; firstName: string | null; lastName: string | null; telephone: string | null; orderCount: number } | null;
  shipping: { zoneCost: number; freeShippingThreshold: number };
  suggestions: TransferRow[];
  sheetError: string | null;
  transfers: { tabId: string; amount: number; description: string; accountNumber: string | null; paidAtText: string }[];
}

export interface VariantHit {
  variantId: number;
  productId: number;
  name: string;
  variantLabel: string;
  sku: string;
  barcode: string | null;
  price: number;
  isActive: boolean;
  isImported: boolean;
  cargoOnTop: number;
  available: number | null;
  imageUrl: string | null;
}

export interface CreatedOrder {
  orderId: number;
  total: number;
  paid: number;
  difference: number;
  /** Rows whose ID / tick could not be written to the sheet. The order exists either way. */
  sheet: { failed: number };
}

export interface OrderRequest {
  lines: { variantId: number; quantity: number; unitPrice: number }[];
  shippingCost: number;
  picks: { tabId: string; rowIndex: number; fingerprint: string }[];
  note?: string;
}

// ── calls ───────────────────────────────────────────────────────────────────

export const listForms = (token: string, params: { status?: FormStatus; q?: string; page?: number } = {}) =>
  request<FormList>("transferForms.list", query(params), token);

export const getForm = (token: string, id: number, fresh = false) =>
  request<FormDetail>("transferForms.get", `/${id}${fresh ? "?fresh=1" : ""}`, token);

export const searchTransfers = (token: string, q: string) =>
  request<{ rows: TransferRow[] }>("transferForms.searchTransfers", `/transfers${query({ q })}`, token).then((d) => d.rows);

export const searchFormVariants = (token: string, q: string) =>
  request<{ variants: VariantHit[] }>("transferForms.searchVariants", `/variants${query({ q })}`, token).then((d) => d.variants);

export const createOrderFromForm = (token: string, id: number, body: OrderRequest) =>
  request<CreatedOrder>("transferForms.createOrder", `/${id}/order`, token, send("POST", body));

export const cancelForm = (token: string, id: number, note: string) =>
  request<{ id: number; status: FormStatus }>("transferForms.cancel", `/${id}/cancel`, token, send("POST", { note }));

export const reopenForm = (token: string, id: number) =>
  request<{ id: number; status: FormStatus }>("transferForms.reopen", `/${id}/reopen`, token, send("POST"));
