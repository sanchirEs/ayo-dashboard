/**
 * "Салбарын захиалга" API: GET /api/v1/backoffice/reports/pickups. One branch's website
 * pickups still waiting, the orders handed over there, and its prepaid (Урьдчилсан) pickups.
 * Client-only: the token comes from useSession(), never from tokenService (see pos.ts).
 */

"use client";

import { getBackendUrl } from "./env";
import { logApiError } from "./error-handler";

export interface PickupItem {
  name: string;
  qty: number;
}

export interface WaitingPickup {
  orderId: number;
  stage: "READY" | "WAITING";
  ownBranch: boolean;
  noBranch: boolean;
  customerName: string | null;
  phone: string | null;
  items: PickupItem[];
  orderTotal: number;
  paidAt: string | null;
  createdAt: string | null;
  pinSentAt: string | null;
  daysWaiting: number | null;
}

export interface HandedOverPickup {
  orderId: number;
  orderTotal: number;
  handedAt: string;
  via: "TILL" | "DASHBOARD";
  handedBy: string | null;
  registerName: string | null;
  orderLocationName: string | null;
  otherBranch: boolean;
  customerName: string | null;
  phone: string | null;
  paymentProvider: string | null;
  items: PickupItem[];
}

export interface PrepaidPickup {
  saleId: string;
  saleNumber: string;
  occurredAt: string;
  status: string;
  total: number;
  prepaidAmount: number;
  otherAmount: number;
  customerPhone: string | null;
  cashierName: string | null;
  registerName: string | null;
  transferCount: number;
  transferAmount: number | null;
  transferDescription: string | null;
  transferPhone: string | null;
  transferPaidAt: string | null;
  items: PickupItem[];
}

export interface PickupReport {
  location: { id: number; name: string; code: string | null; kind: string };
  waiting: WaitingPickup[];
  handedOver: HandedOverPickup[];
  prepaid: PrepaidPickup[];
  totals: {
    readyCount: number;
    readyOwnCount: number;
    readyTotal: number;
    waitingImportCount: number;
    overdueCount: number;
    handedOverCount: number;
    handedOverTotal: number;
    handedOverItems: number;
    prepaidCount: number;
    prepaidTotal: number;
  };
  notes: string[];
}

export async function fetchPickupReport(params: { locationId: number; from: string; to: string }, token: string): Promise<PickupReport> {
  const qs = new URLSearchParams({ locationId: String(params.locationId), from: params.from, to: params.to });
  const response = await fetch(`${getBackendUrl()}/api/v1/backoffice/reports/pickups?${qs}`, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  let body: (PickupReport & { message?: string }) | null = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok || !body) {
    const message = body?.message || "Тайлан татаж чадсангүй";
    logApiError("fetchPickupReport", { type: "server", message, statusCode: response.status, retryable: response.status >= 500 });
    throw new Error(message);
  }
  return body;
}
