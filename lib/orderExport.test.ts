import { describe, expect, it } from 'vitest';
import {
  buildOrderExportQuery,
  fetchAllOrderPages,
  orderExportFileName,
  orderToExportRow,
} from './orderExport';

const params = (q: string) => new URLSearchParams(q);

describe('buildOrderExportQuery', () => {
  it('carries the date range and every other filter, but not the table page', () => {
    const q = params(
      buildOrderExportQuery(
        params('dateFrom=2026-11-01&dateTo=2026-11-15&status=PROCESSING&deliveryType=PICKUP&page=7&limit=100'),
        2,
      ),
    );
    expect(q.get('dateFrom')).toBe('2026-11-01');
    expect(q.get('dateTo')).toBe('2026-11-15');
    expect(q.get('status')).toBe('PROCESSING');
    expect(q.get('deliveryType')).toBe('PICKUP');
    expect(q.get('page')).toBe('2');
    expect(q.get('limit')).toBe('500');
    expect(q.get('sortField')).toBe('createdAt');
    expect(q.get('sortOrder')).toBe('desc');
  });

  it('drops empty filters and unknown params', () => {
    const q = params(buildOrderExportQuery(params('status=&foo=bar'), 1));
    expect(q.has('status')).toBe(false);
    expect(q.has('foo')).toBe(false);
  });
});

describe('fetchAllOrderPages', () => {
  it('walks every page, not just the first', async () => {
    const pages: Record<number, number[]> = { 1: [1, 2], 2: [3, 4], 3: [5] };
    const seen: number[] = [];
    const rows = await fetchAllOrderPages(async (page) => {
      seen.push(page);
      return { data: pages[page], pagination: { totalPages: 3 } };
    });
    expect(rows).toEqual([1, 2, 3, 4, 5]);
    expect(seen).toEqual([1, 2, 3]);
  });

  it('stops on an empty page and at maxPages', async () => {
    const empty = await fetchAllOrderPages(async () => ({ data: [], pagination: { totalPages: 9 } }));
    expect(empty).toEqual([]);

    let calls = 0;
    await fetchAllOrderPages(async () => {
      calls += 1;
      return { data: [1], pagination: { totalPages: 1000 } };
    }, 4);
    expect(calls).toBe(4);
  });
});

describe('orderToExportRow', () => {
  it('maps a delivery order', () => {
    const row = orderToExportRow({
      id: 42,
      user: { firstName: 'Bat', lastName: 'Dorj', email: 'b@x.mn', telephone: '99112233' },
      shipping: { recipientPhone: '88112233', addressLine1: 'A', addressLine2: 'B', district: 'СБД' },
      status: 'PROCESSING',
      total: '125000',
      orderItems: [
        { quantity: 2, product: { name: 'Cream' } },
        { quantity: 1, product: { name: 'Serum' } },
      ],
      payment: { provider: 'QPAY', status: 'COMPLETED' },
      deliveryType: 'DELIVERY',
      createdAt: '2026-11-15T02:00:00.000Z',
    });
    expect(row).toMatchObject({
      'Order ID': 42,
      Customer: 'Bat Dorj',
      Phone: '88112233',
      Total: 125000,
      Items: 2,
      'Бүтээгдэхүүн': 'Cream x2, Serum',
      'Хүргэлтийн төрөл': 'Хүргэлт',
      'Хаяг': 'A, B',
      Date: '2026.11.15 10:00',
    });
  });

  it('maps a pickup order without a user', () => {
    const row = orderToExportRow({ id: 1, deliveryType: 'PICKUP', shipping: { pickupStoreName: 'Төв' } });
    expect(row.Customer).toBe('—');
    expect(row['Хаяг']).toBe('Төв');
    expect(row['Хүргэлтийн төрөл']).toBe('Ирж авах');
    expect(row.Date).toBe('');
  });

  it('dates the row in Ulaanbaatar time, not the PC clock', () => {
    expect(orderToExportRow({ id: 2, createdAt: '2026-11-14T23:30:00.000Z' }).Date).toBe('2026.11.15 07:30');
  });
});

describe('orderExportFileName', () => {
  it('names the file after the date filter', () => {
    expect(orderExportFileName(params('dateFrom=2026-11-01&dateTo=2026-11-15'))).toBe('orders_2026-11-01_2026-11-15');
    expect(orderExportFileName(params('dateFrom=2026-11-15&dateTo=2026-11-15'))).toBe('orders_2026-11-15');
    expect(orderExportFileName(params('dateFrom=2026-11-01'))).toBe('orders_from_2026-11-01');
    expect(orderExportFileName(params(''), new Date('2026-11-15T03:00:00Z'))).toBe('orders_all_2026-11-15');
  });
});
