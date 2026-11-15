// Order-list Excel export. The table only holds one page (100 rows), so the
// export re-queries the backend with the SAME filters the URL carries and walks
// every page — a date-filtered export must contain every order in that range,
// not just the rows on screen.

import { formatUB, ubToday } from './ubTime';

/** URL params that narrow the order list. Pagination is deliberately excluded. */
export const ORDER_EXPORT_FILTER_KEYS = [
  'status',
  'search',
  'dateFrom',
  'dateTo',
  'paymentStatus',
  'paymentProvider',
  'deliveryType',
] as const;

export const EXPORT_PAGE_SIZE = 500;
/** Hard stop so a runaway pagination response can't loop forever. */
export const EXPORT_MAX_PAGES = 200;

type ParamsLike = { get(key: string): string | null };

export function buildOrderExportQuery(
  filters: ParamsLike,
  page: number,
  limit: number = EXPORT_PAGE_SIZE,
): string {
  const params = new URLSearchParams();
  for (const key of ORDER_EXPORT_FILTER_KEYS) {
    const value = filters.get(key);
    if (value) params.set(key, value);
  }
  params.set('page', String(page));
  params.set('limit', String(limit));
  // Same order the table uses.
  params.set('sortField', 'createdAt');
  params.set('sortOrder', 'desc');
  return params.toString();
}

export interface OrdersPage<T> {
  data: T[];
  pagination?: { totalPages?: number; total?: number };
}

/** Fetch page 1..totalPages sequentially and concatenate the rows. */
export async function fetchAllOrderPages<T>(
  fetchPage: (page: number) => Promise<OrdersPage<T>>,
  maxPages: number = EXPORT_MAX_PAGES,
): Promise<T[]> {
  const all: T[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const result = await fetchPage(page);
    const rows = Array.isArray(result?.data) ? result.data : [];
    all.push(...rows);
    totalPages = Number(result?.pagination?.totalPages) || 1;
    // An empty page means we've run past the end, whatever totalPages says.
    if (rows.length === 0) break;
    page += 1;
  } while (page <= totalPages && page <= maxPages);
  return all;
}

export function orderToExportRow(order: any): Record<string, string | number> {
  const items: any[] = Array.isArray(order?.orderItems) ? order.orderItems : [];
  const isPickup = order?.deliveryType === 'PICKUP';
  return {
    'Order ID': order?.id ?? '',
    Customer: order?.user
      ? `${order.user.firstName ?? ''} ${order.user.lastName ?? ''}`.trim() || '—'
      : '—',
    Email: order?.user?.email || '',
    Phone: order?.shipping?.recipientPhone || order?.user?.telephone || '',
    Status: order?.status || '',
    Total: order?.total != null && order.total !== '' ? Number(order.total) : '',
    Items: items.length,
    'Бүтээгдэхүүн': items
      .map((item) => {
        const name = item?.product?.name || 'Бүтээгдэхүүн';
        return item?.quantity > 1 ? `${name} x${item.quantity}` : name;
      })
      .join(', '),
    'Payment Provider': order?.payment?.provider || '',
    'Payment Status': order?.payment?.status || '',
    'Хүргэлтийн төрөл': isPickup ? 'Ирж авах' : 'Хүргэлт',
    'Хаяг': isPickup
      ? order?.shipping?.pickupStoreName || ''
      : [order?.shipping?.addressLine1, order?.shipping?.addressLine2].filter(Boolean).join(', '),
    'Дүүрэг': order?.shipping?.district || '',
    Date: order?.createdAt ? formatUB(order.createdAt) : '',
  };
}

/** orders_2026-11-01_2026-11-15, orders_from_2026-11-01, orders_all_2026-11-15 … */
export function orderExportFileName(filters: ParamsLike, today: Date = new Date()): string {
  const from = filters.get('dateFrom') || '';
  const to = filters.get('dateTo') || '';
  if (from && to) return from === to ? `orders_${from}` : `orders_${from}_${to}`;
  if (from) return `orders_from_${from}`;
  if (to) return `orders_until_${to}`;
  return `orders_all_${ubToday(today)}`;
}
