/**
 * Barcode entry API.
 *
 * Client-only: every caller is a click or a scanner "Enter", so the token
 * comes from useSession(). Never route these through tokenService — it calls
 * auth() → headers(), which is server-only and returns null in the browser,
 * producing a 401 and an auto-logout.
 */

"use client";

import { getBackendUrl } from "./env";
import { handleApiError, logApiError } from "./error-handler";

export interface BarcodeVariant {
  id: number;
  sku: string;
  barcode: string | null;
  price: string | null;
  isDefault: boolean;
  productId: number;
  productName: string;
  isActive: boolean;
  categoryName: string | null;
  /** e.g. "Хэмжээ: 500ml, Өнгө: Улаан" — empty when the product has one variant. */
  variantLabel: string;
  imageUrl: string | null;
}

export interface BarcodeVariantPage {
  rows: BarcodeVariant[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface BarcodeStats {
  total: number;
  withBarcode: number;
  missing: number;
}

export type BarcodeStatus = "missing" | "filled" | "all";

function authHeaders(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

/**
 * Reads the error message the backend actually sent. The barcode endpoints
 * return specific, actionable text ("this code is on <product>"), and a
 * generic "request failed" would throw that away.
 */
async function messageFrom(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json();
    return body?.message || fallback;
  } catch {
    return fallback;
  }
}

export async function listBarcodeVariants(
  params: { search?: string; status?: BarcodeStatus; page?: number; pageSize?: number },
  token: string
): Promise<BarcodeVariantPage> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  query.set("status", params.status || "missing");
  query.set("page", String(params.page || 1));
  query.set("pageSize", String(params.pageSize || 50));

  const response = await fetch(`${getBackendUrl()}/api/v1/barcodes/variants?${query}`, {
    headers: authHeaders(token),
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await messageFrom(response, "Жагсаалт ачаалахад алдаа гарлаа");
    logApiError("listBarcodeVariants", {
      type: "server",
      message,
      statusCode: response.status,
      retryable: true,
    });
    throw new Error(message);
  }
  return response.json();
}

export async function getBarcodeStats(token: string): Promise<BarcodeStats> {
  const response = await fetch(`${getBackendUrl()}/api/v1/barcodes/stats`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(await messageFrom(response, "Статистик ачаалахад алдаа гарлаа"));
  const body = await response.json();
  return body.data;
}

export async function saveBarcode(
  variantId: number,
  barcode: string,
  token: string
): Promise<BarcodeVariant> {
  try {
    const response = await fetch(`${getBackendUrl()}/api/v1/barcodes/variants/${variantId}`, {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify({ barcode }),
    });

    if (!response.ok) {
      throw new Error(await messageFrom(response, "Штрих код хадгалахад алдаа гарлаа"));
    }
    const body = await response.json();
    return body.data;
  } catch (error) {
    const classified = handleApiError(error);
    logApiError("saveBarcode", classified, { variantId });
    // The backend message is the useful one ("this code is on <product>"),
    // so preserve it rather than replacing it with a generic classification.
    throw error instanceof Error ? error : new Error(classified.message);
  }
}

export async function clearBarcode(variantId: number, token: string): Promise<BarcodeVariant> {
  const response = await fetch(`${getBackendUrl()}/api/v1/barcodes/variants/${variantId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error(await messageFrom(response, "Устгахад алдаа гарлаа"));
  const body = await response.json();
  return body.data;
}
