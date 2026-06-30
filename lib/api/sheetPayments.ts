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
