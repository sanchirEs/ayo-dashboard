import { describe, expect, it } from 'vitest';
import { priceUpdates } from './priceUpdates';

describe('priceUpdates', () => {
  it('returns nothing when no price moved', () => {
    const values = { price: '30000', variants: [{ id: 1, price: 30000 }] };
    expect(priceUpdates(values, { price: '30000', variants: [{ id: 1, price: 30000 }] })).toEqual([]);
  });

  it('updates the simple-product price', () => {
    expect(priceUpdates({ price: '30000', variants: [] }, { price: '30500', variants: [] })).toEqual([
      ['price', '30500'],
    ]);
  });

  it('updates a variant by id, not by position', () => {
    const current = {
      price: '30000',
      variants: [
        { id: 11, price: 30000 },
        { id: 12, price: 40000 },
      ],
    };
    const fresh = {
      price: '30500',
      variants: [
        { id: 12, price: 40500 },
        { id: 11, price: 30500 },
      ],
    };
    expect(priceUpdates(current, fresh)).toEqual([
      ['price', '30500'],
      ['variants.0.price', 30500],
      ['variants.1.price', 40500],
    ]);
  });

  it('leaves a variant alone when it is gone or has no id', () => {
    const current = { price: '1', variants: [{ id: 5, price: 1 }, { price: 2 }] };
    const fresh = { price: '1', variants: [{ id: 6, price: 9 }] };
    expect(priceUpdates(current, fresh)).toEqual([]);
  });

  it('treats a missing field as "nothing to update", never throws', () => {
    expect(priceUpdates({}, {})).toEqual([]);
    expect(priceUpdates({ price: '5' }, {})).toEqual([]);
    expect(priceUpdates({ variants: [{ id: 1, price: 1 }] }, { price: '7' })).toEqual([['price', '7']]);
  });

  it('compares numerically, so "30000" and 30000 are the same price', () => {
    expect(priceUpdates({ price: 30000, variants: [{ id: 1, price: '30000' }] }, { price: '30000', variants: [{ id: 1, price: 30000 }] })).toEqual([]);
  });
});
