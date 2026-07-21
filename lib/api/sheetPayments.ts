import { fetchWithAuthHandling } from './fetch-with-auth';
import { getBackendUrl } from './env';

export interface SheetRow {
  rowIndex: number;
  timestamp: string;
  description: string;
  amount: string | number;
  accountNumber: string;
  pickupChecked: boolean;
  deliveryChecked: boolean;
  refunded: boolean;
  phone: string;
}

export interface SheetRowsResponse {
  status: string;
  rows: SheetRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function headers(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function getSheetRows(
  { q = '', page = 1, limit = 50 }: { q?: string; page?: number; limit?: number },
  token: string
): Promise<SheetRowsResponse> {
  const params = new URLSearchParams({ q, page: String(page), limit: String(limit) });
  const res = await fetchWithAuthHandling(
    `${getBackendUrl()}/api/v1/sheet-payments/rows?${params}`,
    { headers: headers(token) },
    'sheetPayments.getRows'
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function refreshSheet(token: string): Promise<{ message: string }> {
  const res = await fetchWithAuthHandling(
    `${getBackendUrl()}/api/v1/sheet-payments/refresh`,
    { method: 'POST', headers: headers(token) },
    'sheetPayments.refresh'
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateSheetPhone(
  rowIndex: number,
  phone: string,
  token: string
): Promise<{ phone: string }> {
  const res = await fetchWithAuthHandling(
    `${getBackendUrl()}/api/v1/sheet-payments/rows/${rowIndex}/phone`,
    { method: 'PATCH', headers: headers(token), body: JSON.stringify({ phone }) },
    'sheetPayments.updatePhone'
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Утас хадгалахад алдаа гарлаа');
  }
  return res.json();
}

export async function sendSheetPin(
  rowIndex: number,
  phone: string,
  token: string
): Promise<{ phone: string }> {
  const res = await fetchWithAuthHandling(
    `${getBackendUrl()}/api/v1/sheet-payments/rows/${rowIndex}/send-pin`,
    { method: 'POST', headers: headers(token), body: JSON.stringify({ phone }) },
    'sheetPayments.sendPin'
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'PIN илгээхэд алдаа гарлаа');
  }
  return res.json();
}

export async function verifySheetPin(
  rowIndex: number,
  pin: string,
  token: string
): Promise<void> {
  const res = await fetchWithAuthHandling(
    `${getBackendUrl()}/api/v1/sheet-payments/rows/${rowIndex}/verify-pin`,
    { method: 'POST', headers: headers(token), body: JSON.stringify({ pin }) },
    'sheetPayments.verifyPin'
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Буруу код');
  }
}

export interface SheetLogEntry {
  id: number;
  userEmail: string | null;
  userDisplay: string | null;
  userRole: string | null;
  action: string;
  rowIndex: number | null;
  phone: string | null;
  success: boolean;
  errorMsg: string | null;
  ip: string | null;
  createdAt: string;
}

export interface SheetLogsResponse {
  status: string;
  rows: SheetLogEntry[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Multi-tab API ────────────────────────────────────────────────────────────

export interface TabConfig {
  tabId: string;
  displayName: string;
  type: 'transaction' | 'order';
}

export interface TabListResponse {
  status: string;
  tabs: TabConfig[];
}

export interface OrderRow {
  rowIndex: number;
  orderId: string | number;
  email: string;
  phone: string;
  status: string;
  total: string | number;
  items: string | number;
  products: string;
  paymentProvider: string;
  deliveryType: string;
  address: string;
  district: string;
  date: string;
  verified: boolean;
}

export interface TabRowsResponse {
  status: string;
  rows: SheetRow[] | OrderRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getTabList(token: string): Promise<TabListResponse> {
  const res = await fetchWithAuthHandling(
    `${getBackendUrl()}/api/v1/sheet-payments/tabs`,
    { headers: headers(token) },
    'sheetPayments.getTabList'
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getTabRows(
  tabId: string,
  { q = '', page = 1, limit = 50 }: { q?: string; page?: number; limit?: number },
  token: string
): Promise<TabRowsResponse> {
  const params = new URLSearchParams({ q, page: String(page), limit: String(limit) });
  const res = await fetchWithAuthHandling(
    `${getBackendUrl()}/api/v1/sheet-payments/tabs/${tabId}/rows?${params}`,
    { headers: headers(token) },
    'sheetPayments.getTabRows'
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function refreshTab(tabId: string, token: string): Promise<{ message: string }> {
  const res = await fetchWithAuthHandling(
    `${getBackendUrl()}/api/v1/sheet-payments/tabs/${tabId}/refresh`,
    { method: 'POST', headers: headers(token) },
    'sheetPayments.refreshTab'
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateTabPhone(
  tabId: string,
  rowIndex: number,
  phone: string,
  token: string
): Promise<{ phone: string }> {
  const res = await fetchWithAuthHandling(
    `${getBackendUrl()}/api/v1/sheet-payments/tabs/${tabId}/rows/${rowIndex}/phone`,
    { method: 'PATCH', headers: headers(token), body: JSON.stringify({ phone }) },
    'sheetPayments.updateTabPhone'
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message || 'Утас хадгалахад алдаа гарлаа');
  }
  return res.json();
}

export async function sendTabPin(
  tabId: string,
  rowIndex: number,
  phone: string,
  token: string
): Promise<{ phone: string }> {
  const res = await fetchWithAuthHandling(
    `${getBackendUrl()}/api/v1/sheet-payments/tabs/${tabId}/rows/${rowIndex}/send-pin`,
    { method: 'POST', headers: headers(token), body: JSON.stringify({ phone }) },
    'sheetPayments.sendTabPin'
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message || 'PIN илгээхэд алдаа гарлаа');
  }
  return res.json();
}

export async function verifyTabPin(
  tabId: string,
  rowIndex: number,
  pin: string,
  token: string
): Promise<void> {
  const res = await fetchWithAuthHandling(
    `${getBackendUrl()}/api/v1/sheet-payments/tabs/${tabId}/rows/${rowIndex}/verify-pin`,
    { method: 'POST', headers: headers(token), body: JSON.stringify({ pin }) },
    'sheetPayments.verifyTabPin'
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message || 'Буруу код');
  }
}

export async function confirmTabDelivery(
  tabId: string,
  rowIndex: number,
  token: string
): Promise<{ message: string }> {
  const res = await fetchWithAuthHandling(
    `${getBackendUrl()}/api/v1/sheet-payments/tabs/${tabId}/rows/${rowIndex}/confirm-delivery`,
    { method: 'POST', headers: headers(token) },
    'sheetPayments.confirmTabDelivery'
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message || 'Хүргэлт баталгаажуулахад алдаа гарлаа');
  }
  return res.json();
}

export async function confirmTabRefund(
  tabId: string,
  rowIndex: number,
  token: string
): Promise<{ message: string }> {
  const res = await fetchWithAuthHandling(
    `${getBackendUrl()}/api/v1/sheet-payments/tabs/${tabId}/rows/${rowIndex}/confirm-refund`,
    { method: 'POST', headers: headers(token) },
    'sheetPayments.confirmTabRefund'
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message || 'Буцаалт баталгаажуулахад алдаа гарлаа');
  }
  return res.json();
}

export async function getSheetLogs(
  { page = 1, limit = 50, action = '' }: { page?: number; limit?: number; action?: string },
  token: string
): Promise<SheetLogsResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), action });
  const res = await fetchWithAuthHandling(
    `${getBackendUrl()}/api/v1/sheet-payments/logs?${params}`,
    { headers: headers(token) },
    'sheetPayments.getLogs'
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
