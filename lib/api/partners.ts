/**
 * Partner ledger API (/api/v1/backoffice/partners): падаан, payments,
 * statements. Owner only.
 *
 * Client-only: every caller is a page effect or a click, so the token comes
 * from useSession(). Never route these through tokenService — it calls
 * auth() → headers(), which is server-only and returns null in the browser,
 * producing a 401 and an auto-logout.
 */

"use client";

import { getBackendUrl } from "./env";
import { logApiError } from "./error-handler";
import type { AgingKey, DeliveryStatus, PaymentMethod, ShortfallKind } from "@/lib/partners/format";

export type Aging = Record<AgingKey, number> & { total: number };

export interface PartnerSummary {
  id: number;
  name: string;
  active: boolean;
  balance: number;
  aging: Aging;
  lastPaymentAt: string | null;
}

export interface PartnerDeliverySummary {
  id: string;
  number: string | null;
  status: DeliveryStatus;
  isHistorical: boolean;
  total: number;
  sentAt: string | null;
  confirmedAt: string | null;
  signedByName: string | null;
  createdAt: string;
  _count: { lines: number };
}

export interface PartnerPayment {
  id: string;
  paidAt: string;
  amount: number;
  method: PaymentMethod;
  note: string | null;
}

export interface PartnerDetail extends PartnerSummary {
  taxId: string | null;
  phone: string | null;
  contactName: string | null;
  deliveries: PartnerDeliverySummary[];
  payments: PartnerPayment[];
}

export interface StatementRow {
  date: string;
  type: "DELIVERY" | "PAYMENT" | "CREDIT";
  ref: string;
  id: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface Statement {
  opening: number;
  rows: StatementRow[];
  closing: number;
}

export interface DeliveryLine {
  id: string;
  lineNo: number;
  variantId: number;
  nameSnapshot: string;
  boxes: number | null;
  qty: number;
  unitPrice: number | null;
  lineTotal: number;
}

export interface Adjustment {
  id: string;
  deliveryLineId: string | null;
  kind: ShortfallKind | "CREDIT";
  qty: number | null;
  amount: number;
  stockApplied: boolean;
  note: string | null;
  createdAt: string;
}

export interface Delivery {
  id: string;
  number: string | null;
  status: DeliveryStatus;
  isHistorical: boolean;
  stockApplied: boolean;
  total: number;
  note: string | null;
  sentAt: string | null;
  confirmedAt: string | null;
  signedByName: string | null;
  createdAt: string;
  lines: DeliveryLine[];
  adjustments: Adjustment[];
  partner: { id: number; name: string };
  fromLocation: { id: number; name: string; stockMode: "DAYANSOFT" | "AYO" };
}

export interface VariantHit {
  variantId: number;
  name: string;
  sku: string;
  barcode: string | null;
  unitsPerBox: number | null;
  wholesalePrice: number | null;
  partnerPrice: number | null;
  /** What this partner would be charged: their own price, else wholesale, else null. */
  unitPrice: number | null;
}

export interface LineInput {
  variantId: number;
  qty: number;
  boxes?: number | null;
  unitPrice?: number | null;
  /** Also store this line's typed price as the variant's wholesale price. */
  setWholesale?: boolean;
}

const BASE = "/api/v1/backoffice/partners";

async function request<T>(name: string, path: string, token: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${getBackendUrl()}${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  let body: { success?: boolean; data?: T; message?: string } | null = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok) {
    // The backend's message is the actionable one ("Үнэгүй мөр байна: …").
    const message = body?.message || "Хүсэлт амжилтгүй боллоо";
    logApiError(name, { type: "server", message, statusCode: response.status, retryable: response.status >= 500 });
    throw new Error(message);
  }
  return body?.data as T;
}

const post = (body?: unknown): RequestInit => ({ method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

export const listPartners = (token: string) => request<PartnerSummary[]>("listPartners", "/", token);

export const createPartner = (data: { name: string; phone?: string; contactName?: string; taxId?: string }, token: string) =>
  request<PartnerSummary>("createPartner", "/", token, post(data));

export const getPartner = (id: number | string, token: string) => request<PartnerDetail>("getPartner", `/${id}`, token);

export function getStatement(id: number | string, range: { from?: string; to?: string }, token: string) {
  const q = new URLSearchParams();
  if (range.from) q.set("from", range.from);
  if (range.to) q.set("to", range.to);
  const qs = q.toString();
  return request<Statement>("getStatement", `/${id}/statement${qs ? `?${qs}` : ""}`, token);
}

export const searchVariants = (partnerId: number | string, q: string, token: string) =>
  request<VariantHit[]>("searchVariants", `/${partnerId}/variants?q=${encodeURIComponent(q)}`, token);

export const createDraft = (partnerId: number | string, token: string) =>
  request<Delivery>("createDraft", `/${partnerId}/deliveries`, token, post());

export const getDelivery = (deliveryId: string, token: string) =>
  request<Delivery>("getDelivery", `/deliveries/${deliveryId}`, token);

export const saveDraftLines = (deliveryId: string, lines: LineInput[], token: string) =>
  request<Delivery>("saveDraftLines", `/deliveries/${deliveryId}/lines`, token, { method: "PUT", body: JSON.stringify({ lines }) });

export const sendDelivery = (deliveryId: string, token: string) =>
  request<Delivery>("sendDelivery", `/deliveries/${deliveryId}/send`, token, post());

export const confirmDelivery = (deliveryId: string, signedByName: string, token: string) =>
  request<Delivery>("confirmDelivery", `/deliveries/${deliveryId}/confirm`, token, post({ signedByName }));

export const recordShortfall = (
  deliveryId: string,
  data: { deliveryLineId: string; qty: number; kind: ShortfallKind; note?: string },
  token: string
) => request<Adjustment>("recordShortfall", `/deliveries/${deliveryId}/shortfalls`, token, post(data));

export const recordPayment = (
  partnerId: number | string,
  data: { paidAt: string; amount: number; method: PaymentMethod; note?: string },
  token: string
) => request<PartnerPayment>("recordPayment", `/${partnerId}/payments`, token, post(data));
