import { getBackendUrl } from './env';

export interface FlashSaleProduct {
  id: number;
  name: string;
  price: number;
  imageUrl: string | null;
  category: { id: number; name: string } | null;
}

export interface FlashSalePayload {
  campaignId: number;
  name: string;
  discountPct: number;
  startDate: string;
  endDate: string;
  product: FlashSaleProduct | null;
}

export interface FlashSaleScheduleItem {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  active: boolean;
  flashSaleDiscountPct: string;
  products: Array<{ product: FlashSaleProduct }>;
}

export interface FlashSaleSchedule {
  items: FlashSaleScheduleItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface CreateFlashSaleInput {
  productId: number;
  startDate: string;
  endDate: string;
  discountPct: number;
  name?: string;
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${getBackendUrl()}${path}`;
  const res = await fetch(url, { ...options, cache: 'no-store' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as any).message || `HTTP ${res.status}`);
  return (json as any).data as T;
}

function authHeaders(token: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

export async function getFlashSaleSchedule(
  token: string,
  page = 1,
  status?: string
): Promise<FlashSaleSchedule> {
  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (status) params.set('status', status);
  return apiFetch<FlashSaleSchedule>(
    `/api/v1/flash-sale/schedule?${params}`,
    { headers: authHeaders(token) }
  );
}

export async function createFlashSale(
  data: CreateFlashSaleInput,
  token: string
): Promise<FlashSaleScheduleItem> {
  return apiFetch<FlashSaleScheduleItem>('/api/v1/flash-sale', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data)
  });
}

export async function updateFlashSale(
  id: number,
  data: Partial<CreateFlashSaleInput>,
  token: string
): Promise<FlashSaleScheduleItem> {
  return apiFetch<FlashSaleScheduleItem>(`/api/v1/flash-sale/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(data)
  });
}

export async function cancelFlashSale(id: number, token: string): Promise<void> {
  await apiFetch(`/api/v1/flash-sale/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token)
  });
}

export async function getActiveFlashSale(): Promise<FlashSalePayload | null> {
  return apiFetch<FlashSalePayload | null>('/api/v1/flash-sale/active');
}

export async function getUpcomingFlashSale(): Promise<FlashSalePayload | null> {
  return apiFetch<FlashSalePayload | null>('/api/v1/flash-sale/upcoming');
}
