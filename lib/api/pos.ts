/**
 * Till setup API (/api/v1/backoffice/pos): registers, staff, settings. Owner only.
 *
 * Client-only, like partners.ts: every caller is a page effect or a click, so the
 * token comes from useSession(). Never route these through tokenService; it calls
 * auth() -> headers(), which is server-only and returns null in the browser,
 * producing a 401 and an auto-logout.
 */

"use client";

import { getBackendUrl } from "./env";
import { logApiError } from "./error-handler";
import type { PosRole } from "@/lib/pos/validation";

export interface PosLocation {
  id: number;
  name: string;
  code: string | null;
  kind: "BRANCH" | "TEST";
  stockMode: "DAYANSOFT" | "AYO";
}

export interface PosRegister {
  id: string;
  number: number;
  name: string;
  locationId: number;
  locationName: string | null;
  locationCode: string | null;
  active: boolean;
  pairedAt: string | null;
  lastSeenAt: string | null;
  appVersion: string | null;
  pairingPending: boolean;
  pairingExpiresAt: string | null;
}

export interface PairingCode {
  pairingCode: string;
  expiresAt: string;
}

export interface PosStaffMember {
  id: string;
  name: string;
  phone: string | null;
  role: PosRole;
  active: boolean;
  userId: number | null;
  locations: number[];
}

export interface StaffInput {
  name: string;
  phone?: string;
  role: PosRole;
  locationIds: number[];
}

export interface DiscountLimits {
  CASHIER: number;
  MANAGER: number;
  OWNER: number;
}

export interface ReceiptSettings {
  header: string;
  footer: string;
  widthMm: 80 | 58;
}

/** Everything a branch can override. A missing key means "not set at this level". */
export interface PosSettingsValues {
  discountLimitPct?: DiscountLimits;
  idleLockMinutes?: number;
  refundWindowDays?: number;
  receipt?: ReceiptSettings;
  favourites?: number[];
  /** A count worth more than this (₮) needs the owner to approve it. */
  countApproveLimitMnt?: number;
  /** When tills are expected to be awake (Ulaanbaatar time). */
  openingHours?: { from: string; to: string };
}

export interface SettingsLayers {
  global: PosSettingsValues;
  location: PosSettingsValues;
  merged: PosSettingsValues;
}

export interface VariantHit {
  id: number;
  productId: number;
  name: string;
  variantLabel: string;
  sku: string;
  barcode: string | null;
  listPrice: number;
}

const BASE = "/api/v1/backoffice/pos";

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
    // The backend's message is the actionable one ("Энэ PIN өөр ажилтанд олгогдсон").
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

// ── registers ───────────────────────────────────────────────────────────────

export const listLocations = async (token: string) =>
  (await request<{ locations: PosLocation[] }>("listLocations", "/locations", token)).locations;

export const listRegisters = async (token: string) =>
  (await request<{ registers: PosRegister[] }>("listRegisters", "/registers", token)).registers;

export const createRegister = (data: { locationId: number; name: string }, token: string) =>
  request<{ register: { id: string; number: number; name: string } } & PairingCode>("createRegister", "/registers", token, send("POST", data));

export const newPairingCode = (id: string, token: string) =>
  request<PairingCode>("newPairingCode", `/registers/${id}/pairing-code`, token, send("POST"));

export const revokeRegister = (id: string, token: string) =>
  request<{ success: boolean }>("revokeRegister", `/registers/${id}/revoke`, token, send("POST"));

// ── staff ───────────────────────────────────────────────────────────────────

export const listStaff = async (token: string) =>
  (await request<{ staff: PosStaffMember[] }>("listStaff", "/staff", token)).staff;

export const createStaff = async (data: StaffInput & { pin: string }, token: string) =>
  (await request<{ staff: PosStaffMember }>("createStaff", "/staff", token, send("POST", data))).staff;

/** `pin` is required by the server when this adds a branch or switches the person back on. */
export const updateStaff = async (
  id: string,
  data: Partial<StaffInput> & { active?: boolean; pin?: string },
  token: string
) => (await request<{ staff: PosStaffMember }>("updateStaff", `/staff/${id}`, token, send("PATCH", data))).staff;

export const resetStaffPin = (id: string, pin: string, token: string) =>
  request<{ success: boolean }>("resetStaffPin", `/staff/${id}/pin`, token, send("POST", { pin }));

// ── settings ────────────────────────────────────────────────────────────────

/** `locationId` null reads the default that every branch starts from. */
export const getSettings = (locationId: number | null, token: string) =>
  request<SettingsLayers>("getSettings", locationId === null ? "/settings" : `/settings?locationId=${locationId}`, token);

export const saveSettings = (locationId: number | null, values: PosSettingsValues, token: string) =>
  request<{ success: boolean }>("saveSettings", "/settings", token, send("PUT", { locationId, values }));

/** Drops a branch's override so it follows the default again. */
export const clearSetting = (locationId: number, key: keyof PosSettingsValues, token: string) =>
  request<{ success: boolean }>("clearSetting", `/settings/${key}?locationId=${locationId}`, token, send("DELETE"));

// ── variants (favourites picker) ────────────────────────────────────────────

export const searchVariants = async (q: string, token: string) =>
  (await request<{ variants: VariantHit[] }>("searchVariants", `/variants?q=${encodeURIComponent(q)}`, token)).variants;

export const variantsByIds = async (ids: number[], token: string) =>
  ids.length === 0
    ? []
    : (await request<{ variants: VariantHit[] }>("variantsByIds", `/variants?ids=${ids.join(",")}`, token)).variants;

// ── barcode links (what cashiers linked at the till) ────────────────────────

export type BarcodeLinkStatus = "APPLIED" | "PENDING_REVIEW" | "REJECTED" | "REVERTED";

export interface BarcodeLinkItem {
  id: string;
  status: BarcodeLinkStatus;
  barcode: string;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: number | null;
  variant: { id: number; sku: string | null; productName: string | null; variantLabel: string; barcode: string | null };
  staff: { id: string; name: string | null };
  register: { id: string; name: string | null; locationName: string | null };
}

export const listBarcodeLinks = (params: { status?: BarcodeLinkStatus; reviewed?: boolean; limit?: number; offset?: number }, token: string) => {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.reviewed !== undefined) query.set("reviewed", String(params.reviewed));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.offset) query.set("offset", String(params.offset));
  const qs = query.toString();
  return request<{ total: number; items: BarcodeLinkItem[] }>("listBarcodeLinks", `/barcode-links${qs ? `?${qs}` : ""}`, token);
};

export const reviewBarcodeLink = (id: string, token: string) =>
  request<{ success: boolean }>("reviewBarcodeLink", `/barcode-links/${id}/review`, token, send("POST"));

export const revertBarcodeLink = (id: string, token: string) =>
  request<{ success: boolean }>("revertBarcodeLink", `/barcode-links/${id}/revert`, token, send("POST"));

// ── sync issues and the unsent-sales file ───────────────────────────────────

export interface SyncIssue {
  kind: "REJECTED" | "FLAGGED";
  at: string;
  eventType: string;
  eventId: string;
  code: string | null;
  flags: string[];
  saleNumber: string | null;
  saleId: string | null;
  total: number | null;
  registerId: string;
  registerName: string | null;
  locationName: string | null;
}

export const listSyncIssues = (days: number, token: string) =>
  request<{ days: number; issues: SyncIssue[] }>("listSyncIssues", `/sync-issues?days=${days}`, token);

export interface SyncImportResult {
  results: { id: string; status: "ACCEPTED" | "DUPLICATE" | "REJECTED" | "RETRY"; code?: string }[];
  counts: { ACCEPTED: number; DUPLICATE: number; REJECTED: number; RETRY: number };
}

/** Multipart, so no JSON Content-Type: the browser sets the boundary. */
export async function importUnsentFile(file: File, token: string): Promise<SyncImportResult> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(`${getBackendUrl()}${BASE}/sync-import`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
    cache: "no-store",
  });
  let body: (SyncImportResult & { message?: string }) | null = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok) {
    const message = body?.message || "Файл оруулж чадсангүй";
    logApiError("importUnsentFile", { type: "server", message, statusCode: response.status, retryable: response.status >= 500 });
    throw new Error(message);
  }
  return body as SyncImportResult;
}
