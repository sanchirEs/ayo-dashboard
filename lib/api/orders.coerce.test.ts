import { describe, expect, it } from 'vitest';
import { coerceOrdersArray } from './orders-shape';

describe('coerceOrdersArray', () => {
  it('returns [] for non-object inputs', () => {
    expect(coerceOrdersArray(null)).toEqual([]);
    expect(coerceOrdersArray(undefined)).toEqual([]);
    expect(coerceOrdersArray('oops')).toEqual([]);
    expect(coerceOrdersArray(123)).toEqual([]);
  });

  it('returns result.data when it is an array', () => {
    expect(coerceOrdersArray({ data: [{ id: 1 }] })).toEqual([{ id: 1 }]);
  });

  it('supports { orders: [...] } shape', () => {
    expect(coerceOrdersArray({ orders: [{ id: 2 }] })).toEqual([{ id: 2 }]);
  });

  it('supports { data: { orders: [...] } } shape', () => {
    expect(coerceOrdersArray({ data: { orders: [{ id: 3 }] } })).toEqual([{ id: 3 }]);
  });

  it('returns [] for unexpected shapes', () => {
    expect(coerceOrdersArray({ data: { notOrders: [] } })).toEqual([]);
    expect(coerceOrdersArray({ data: { orders: 'nope' } })).toEqual([]);
  });
});

