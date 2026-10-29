import { describe, expect, it } from 'vitest';
import { recomputeMessage, regateMessage } from './messages';

describe('recomputeMessage', () => {
  it('reads the { products, variants } the backend answers with', () => {
    expect(recomputeMessage({ products: 120, variants: 340 })).toBe(
      'Үнэ дахин бодлоо: 120 бараа, 340 хувилбарын үнэ шинэчлэгдсэн.'
    );
  });

  it('never prints "undefined" for a missing field', () => {
    expect(recomputeMessage({})).toBe('Үнэ дахин бодлоо: 0 бараа, 0 хувилбарын үнэ шинэчлэгдсэн.');
    expect(recomputeMessage(null)).toBe('Үнэ дахин бодлоо: 0 бараа, 0 хувилбарын үнэ шинэчлэгдсэн.');
    expect(recomputeMessage(undefined)).toBe('Үнэ дахин бодлоо: 0 бараа, 0 хувилбарын үнэ шинэчлэгдсэн.');
  });
});

describe('regateMessage', () => {
  it('reads changed / examined', () => {
    expect(regateMessage({ examined: 500, changed: 12, byStatus: {} })).toBe(
      'Дахин шалгалаа: 12/500 мөр төлөв өөрчлөгдсөн.'
    );
  });

  it('falls back to total when examined is absent', () => {
    expect(regateMessage({ total: 500, changed: 3 })).toBe(
      'Дахин шалгалаа: 3/500 мөр төлөв өөрчлөгдсөн.'
    );
  });

  it('never prints "undefined" for a missing field', () => {
    expect(regateMessage({})).toBe('Дахин шалгалаа: 0/0 мөр төлөв өөрчлөгдсөн.');
    expect(regateMessage(null)).toBe('Дахин шалгалаа: 0/0 мөр төлөв өөрчлөгдсөн.');
  });
});
