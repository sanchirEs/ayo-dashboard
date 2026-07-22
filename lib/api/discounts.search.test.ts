import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { searchProducts } from './discounts';

/**
 * Regression: the product combobox used to load only the first page of
 * /api/v1/products (20 of 269 products) and filter it in the browser, so any
 * product outside the 20 newest was unfindable. Search must happen on the
 * server.
 */

const originalFetch = globalThis.fetch;

function mockResponse(products: unknown[]) {
  return {
    ok: true,
    json: async () => ({ success: true, data: { products, pagination: {} } }),
  } as unknown as Response;
}

function lastUrl(fetchMock: ReturnType<typeof vi.fn>): URL {
  return new URL(fetchMock.mock.calls[0][0] as string, 'http://backend.test');
}

describe('searchProducts', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env.BACKEND_URL = 'http://backend.test';
    fetchMock = vi.fn().mockResolvedValue(mockResponse([]));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('sends the query to the backend as a search param', async () => {
    await searchProducts('витамин', 'tok');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(lastUrl(fetchMock).searchParams.get('search')).toBe('витамин');
  });

  it('does not rely on the default 20-item page to find matches', async () => {
    await searchProducts('cream', 'tok');

    // A limit must be sent explicitly; the backend default of 20 is the bug.
    const limit = lastUrl(fetchMock).searchParams.get('limit');
    expect(limit).not.toBeNull();
    expect(Number(limit)).toBeGreaterThan(0);
  });

  it('asks for the relations the sale form needs (category, priceRange)', async () => {
    await searchProducts('cream', 'tok');

    const include = lastUrl(fetchMock).searchParams.get('include') ?? '';
    expect(include).toContain('categories');
    expect(include).toContain('variants');
  });

  it('includes inactive products so hidden items are still findable', async () => {
    await searchProducts('маск', 'tok');

    // The backend hides isActive=false rows by default, which put ~485 real
    // products out of reach of the sale form.
    expect(lastUrl(fetchMock).searchParams.get('isActive')).toBe('all');
  });

  it('preserves isActive so the combobox can flag hidden products', async () => {
    fetchMock.mockResolvedValue(
      mockResponse([
        { id: 1, name: 'Active', sku: 'A', price: 1, isActive: true },
        { id: 2, name: 'Hidden', sku: 'B', price: 2, isActive: false },
      ])
    );

    const found = await searchProducts('x', 'tok');

    expect(found.map((p) => p.isActive)).toEqual([true, false]);
  });

  it('sends the auth token', async () => {
    await searchProducts('cream', 'tok');

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok');
  });

  it('maps backend products into the shape the combobox renders', async () => {
    fetchMock.mockResolvedValue(
      mockResponse([
        {
          id: 7,
          name: 'Dr.Melaxin Gel Cream',
          sku: 'SKU-7',
          price: 64000,
          categoryId: 1,
          category: { name: 'Арьс арчилгаа' },
          images: [{ url: 'https://cdn/x.jpg' }],
          priceRange: { min: 1000, max: 2000 },
        },
      ])
    );

    const [product] = await searchProducts('cream', 'tok');

    expect(product).toMatchObject({
      id: 7,
      name: 'Dr.Melaxin Gel Cream',
      sku: 'SKU-7',
      price: 64000,
      category: { name: 'Арьс арчилгаа' },
      priceRange: { min: 1000, max: 2000 },
    });
  });

  it('skips the network for a blank query', async () => {
    expect(await searchProducts('   ', 'tok')).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns no results instead of throwing when the request is aborted', async () => {
    fetchMock.mockRejectedValue(
      Object.assign(new Error('aborted'), { name: 'AbortError' })
    );

    await expect(searchProducts('cream', 'tok')).resolves.toEqual([]);
  });
});
