/**
 * Customer blocklist API.
 *
 * Every caller is a click, so the token comes from useSession(). Never route
 * these through tokenService — it calls auth() → headers(), which is server-only
 * and returns null in the browser, producing a 401 and an auto-logout.
 */

"use client";

import { getBackendUrl } from "./env";

export type BlockedContactType = "EMAIL" | "PHONE";

export interface BlockedContact {
  id: number;
  type: BlockedContactType;
  value: string;
  reason: string | null;
  createdAt: string;
  blockedBy: { id: number; username: string | null; telephone: string | null } | null;
}

export interface BlockedContactPage {
  rows: BlockedContact[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const BASE = "/api/v1/admin/blocklist";

function authHeaders(token: string | null) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

/**
 * The backend messages here are the specific ones ("Зөвхөн CUSTOMER эрхтэй
 * хэрэглэгчийг блоклоно", "Утасны дугаар буруу байна"), so they are what the
 * admin should see — not a generic failure string.
 */
async function messageFrom(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json();
    return body?.message || fallback;
  } catch {
    return fallback;
  }
}

export async function listBlockedContacts(
  params: { search?: string; type?: BlockedContactType | ""; page?: number; pageSize?: number },
  token: string | null
): Promise<BlockedContactPage> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.type) query.set("type", params.type);
  query.set("page", String(params.page || 1));
  query.set("pageSize", String(params.pageSize || 50));

  const response = await fetch(`${getBackendUrl()}${BASE}?${query}`, {
    headers: authHeaders(token),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await messageFrom(response, "Жагсаалт ачаалахад алдаа гарлаа"));
  }
  return response.json();
}

/**
 * Add one entry. `type` is optional — the backend infers EMAIL from an "@" and
 * PHONE otherwise, so the page can keep a single input box.
 */
export async function addBlockedContact(
  payload: { value: string; reason?: string; type?: BlockedContactType },
  token: string | null
): Promise<BlockedContact> {
  const response = await fetch(`${getBackendUrl()}${BASE}`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await messageFrom(response, "Блоклоход алдаа гарлаа"));
  }
  const body = await response.json();
  return body.data;
}

/** Block an existing customer — writes an entry for their phone and their email. */
export async function blockUserById(
  userId: number,
  reason: string | undefined,
  token: string | null
): Promise<BlockedContact[]> {
  const response = await fetch(`${getBackendUrl()}${BASE}/users/${userId}`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    throw new Error(await messageFrom(response, "Блоклоход алдаа гарлаа"));
  }
  const body = await response.json();
  return body.data;
}

export async function removeBlockedContact(
  id: number,
  token: string | null
): Promise<BlockedContact> {
  const response = await fetch(`${getBackendUrl()}${BASE}/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error(await messageFrom(response, "Блокоос гаргахад алдаа гарлаа"));
  }
  const body = await response.json();
  return body.data;
}
