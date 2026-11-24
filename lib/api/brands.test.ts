import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mergeBrands } from './brands';

// brands.ts imports the server-only token helper, which pulls in next-auth and
// cannot load under vitest. mergeBrands takes its token as an argument, so the
// helper is never called.
vi.mock('@/lib/GetTokenServer', () => ({ default: vi.fn() }));

/**
 * mergeBrands folds one brand (the loser) into another (the survivor) on the
 * backend. The dashboard sends only the loser's id; everything else (products,
 * campaign brands, retailer brands) is moved server-side.
 */

const originalFetch = globalThis.fetch;

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

describe('mergeBrands', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env.BACKEND_URL = 'http://backend.test';
    fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        success: true,
        data: {
          movedProducts: 12,
          movedCampaignBrands: 1,
          droppedDuplicateCampaignBrands: 0,
          movedRetailerBrands: 3,
        },
      })
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('POSTs the loser id to the survivor merge route with the bearer token', async () => {
    await mergeBrands(2, 427, 't');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://backend.test/api/v1/brands/2/merge');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ loserId: 427 });

    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer t');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('returns the move counts from the response data', async () => {
    const result = await mergeBrands(2, 427, 't');

    expect(result).toEqual({
      movedProducts: 12,
      movedCampaignBrands: 1,
      droppedDuplicateCampaignBrands: 0,
      movedRetailerBrands: 3,
    });
  });

  it('throws the backend message when the merge is refused', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: false, message: 'Брэнд олдсонгүй' }, 404));

    await expect(mergeBrands(2, 999, 't')).rejects.toThrow('Брэнд олдсонгүй');
  });

  it('refuses to merge a brand into itself without calling the backend', async () => {
    await expect(mergeBrands(5, 5, 't')).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
