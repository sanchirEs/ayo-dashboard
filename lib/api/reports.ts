/**
 * Owner reports API (/api/v1/backoffice/reports): sales, margin, stock value, payments,
 * shift variances, adjustments (POS Plan 6). Read-only; every answer is
 * { rows, totals, notes }. Client-only: the token comes from useSession(), never from
 * tokenService (see pos.ts).
 */

"use client";

import { getBackendUrl } from "./env";
import { logApiError } from "./error-handler";

export interface ReportResult {
  rows: Record<string, unknown>[];
  totals: Record<string, unknown>;
  notes: string[];
}

export interface ReportParams {
  from?: string;
  to?: string;
  locationIds?: number[];
  groupBy?: string;
  channel?: string;
}

export async function fetchReport(endpoint: string, params: ReportParams, token: string): Promise<ReportResult> {
  const qs = new URLSearchParams();
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  if (params.locationIds && params.locationIds.length > 0) qs.set("locationIds", params.locationIds.join(","));
  if (params.groupBy) qs.set("groupBy", params.groupBy);
  if (params.channel) qs.set("channel", params.channel);
  const text = qs.toString();

  const response = await fetch(`${getBackendUrl()}/api/v1/backoffice/reports/${endpoint}${text ? `?${text}` : ""}`, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  let body: (ReportResult & { message?: string }) | null = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok || !body) {
    const message = body?.message || "Тайлан татаж чадсангүй";
    logApiError("fetchReport", { type: "server", message, statusCode: response.status, retryable: response.status >= 500 });
    throw new Error(message);
  }
  return { rows: body.rows ?? [], totals: body.totals ?? {}, notes: body.notes ?? [] };
}

export interface PosOverview {
  date: string;
  today: { locationId: number; label: string; net: number; count: number; byMethod: Record<string, number> }[];
  openShifts: { register: string; cashier: string; openedAt: string }[];
  variances7d: { zNumber: string; variance: number }[];
  alerts: { code: string; count: number; link: string }[];
}

export async function getOverview(token: string): Promise<PosOverview> {
  const response = await fetch(`${getBackendUrl()}/api/v1/backoffice/pos/overview`, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body) {
    const message = body?.message || "Тойм татаж чадсангүй";
    logApiError("getOverview", { type: "server", message, statusCode: response.status, retryable: response.status >= 500 });
    throw new Error(message);
  }
  return body as PosOverview;
}
