import { getBackendUrl } from './env';
import { fetchWithAuthHandling } from './fetch-with-auth';

export type PickupStatus = 'PENDING' | 'PIN_SENT' | 'VERIFIED' | 'CANCELLED';

export interface PickupRecord {
  id: number;
  importId: number;
  transactionDate: string;
  amount: string;
  description: string;
  counterpartyRef: string | null;
  customerPhone: string | null;
  phoneEnteredManually: boolean;
  isDelivery: boolean;
  pickupPin: string | null;
  pinSentAt: string | null;
  pinExpiresAt: string | null;
  status: PickupStatus;
  verifiedAt: string | null;
  pinSentBy: number | null;
  verifiedBy: number | null;
  dedupKey: string;
}

export interface PickupImport {
  id: number;
  filename: string;
  importedAt: string;
  rowCount: number;
  pickupCount: number;
  importer: { firstName: string | null; lastName: string | null; email: string };
}

export interface ImportResult {
  importId: number;
  created: number;
  skipped: number;
  pickupCount: number;
}

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export async function uploadStatement(file: File, token: string): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetchWithAuthHandling(
    `${getBackendUrl()}/api/v1/pickup-pins/imports`,
    { method: 'POST', headers: authHeaders(token), body: formData },
    'uploadStatement'
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Upload failed');
  return json.data as ImportResult;
}

export async function getImports(token: string): Promise<{ imports: PickupImport[]; total: number }> {
  const res = await fetchWithAuthHandling(
    `${getBackendUrl()}/api/v1/pickup-pins/imports`,
    { headers: authHeaders(token) },
    'getImports'
  );
  const json = await res.json();
  return { imports: json.imports ?? [], total: json.total ?? 0 };
}

export async function getRecords(importId: number, token: string): Promise<{ records: PickupRecord[]; total: number }> {
  const res = await fetchWithAuthHandling(
    `${getBackendUrl()}/api/v1/pickup-pins/imports/${importId}/records?limit=200`,
    { headers: authHeaders(token) },
    'getRecords'
  );
  const json = await res.json();
  return { records: json.records ?? [], total: json.total ?? 0 };
}

export async function sendPin(recordId: number, token: string): Promise<PickupRecord> {
  const res = await fetchWithAuthHandling(
    `${getBackendUrl()}/api/v1/pickup-pins/records/${recordId}/send-pin`,
    { method: 'POST', headers: { ...authHeaders(token), 'Content-Type': 'application/json' } },
    'sendPin'
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Send PIN failed');
  return json.data as PickupRecord;
}

export async function verifyPin(recordId: number, pin: string, token: string): Promise<PickupRecord> {
  const res = await fetchWithAuthHandling(
    `${getBackendUrl()}/api/v1/pickup-pins/records/${recordId}/verify`,
    {
      method: 'POST',
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    },
    'verifyPin'
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Буруу код');
  return json.data as PickupRecord;
}

export async function updateRecordPhone(recordId: number, phone: string, token: string): Promise<PickupRecord> {
  const res = await fetchWithAuthHandling(
    `${getBackendUrl()}/api/v1/pickup-pins/records/${recordId}/phone`,
    {
      method: 'PATCH',
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    },
    'updatePhone'
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Update failed');
  return json.data as PickupRecord;
}

export async function cancelRecord(recordId: number, token: string): Promise<PickupRecord> {
  const res = await fetchWithAuthHandling(
    `${getBackendUrl()}/api/v1/pickup-pins/records/${recordId}/cancel`,
    { method: 'POST', headers: { ...authHeaders(token), 'Content-Type': 'application/json' } },
    'cancelRecord'
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Cancel failed');
  return json.data as PickupRecord;
}
