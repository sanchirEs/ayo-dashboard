import { describe, it, expect } from 'vitest';
import { buildVariantRows } from './variantRows';
import { pickSimpleVariant } from './variantNormalization';

const ATTRIBUTES = [
  { id: 3, name: 'Маск', options: [{ id: 55, value: '2 хайрцаг' }, { id: 56, value: '3 хайрцаг' }] },
  { id: 4, name: 'Өнгө', options: [{ id: 60, value: 'Black' }] },
];
const opts = { baseSku: '8809750465464', basePrice: 28000, attributes: ATTRIBUTES };

const existing2Box = {
  id: 804,
  sku: 'OLD-SKU-2BOX',
  barcode: '8809750465471',
  price: 39900,
  isDefault: true,
  attributes: [{ attributeId: 3, optionId: 55 }],
  inventory: { quantity: 7 },
  images: [{ imageUrl: 'https://x/a.jpg', altText: '', isPrimary: true }],
};

describe('buildVariantRows', () => {
  it('keeps the row of a combination the product already has', () => {
    const rows = buildVariantRows([[{ attributeId: 3, optionId: 55 }]], [existing2Box], opts);
    expect(rows).toEqual([existing2Box]);
  });

  it('adds a fresh row for a new combination next to the kept one', () => {
    const rows = buildVariantRows(
      [[{ attributeId: 3, optionId: 55 }], [{ attributeId: 3, optionId: 56 }]],
      [existing2Box],
      opts
    );
    expect(rows[0]).toBe(existing2Box);
    expect(rows[1]).toEqual({
      sku: '8809750465464-МАСК-3-ХАЙРЦАГ',
      barcode: '',
      price: 28000,
      isDefault: false,
      attributes: [{ attributeId: 3, optionId: 56 }],
      inventory: { quantity: 0 },
      images: [],
    });
  });

  it('drops a row whose option is no longer selected', () => {
    const rows = buildVariantRows([[{ attributeId: 3, optionId: 56 }]], [existing2Box], opts);
    expect(rows).toHaveLength(1);
    expect(rows[0]).not.toHaveProperty('id');
    expect(rows[0].isDefault).toBe(true);
  });

  it('matches a combination whatever order its options come in', () => {
    const both = { ...existing2Box, attributes: [{ attributeId: 4, optionId: 60 }, { attributeId: 3, optionId: 55 }] };
    const rows = buildVariantRows([[{ attributeId: 3, optionId: 55 }, { attributeId: 4, optionId: 60 }]], [both], opts);
    expect(rows[0].id).toBe(804);
  });

  it('keeps one default: the kept default, else the first row', () => {
    const rows = buildVariantRows(
      [[{ attributeId: 3, optionId: 56 }], [{ attributeId: 3, optionId: 55 }]],
      [existing2Box],
      opts
    );
    expect(rows.map((r) => r.isDefault)).toEqual([false, true]);

    const fresh = buildVariantRows([[{ attributeId: 3, optionId: 56 }], [{ attributeId: 4, optionId: 60 }]], [], opts);
    expect(fresh.map((r) => r.isDefault)).toEqual([true, false]);
  });
});

describe('pickSimpleVariant', () => {
  // Product 840 as it was on 2026-11-06, before the repair
  const v804 = { id: 804, isDefault: true, attributes: [{ optionId: 55 }] };
  const v803 = { id: 803, isDefault: false, attributes: [] };
  const v1206 = { id: 1206, isDefault: true, attributes: [] };

  it('takes the only variant without attributes', () => {
    expect(pickSimpleVariant([v804, v803])?.id).toBe(803);
  });

  it('takes the default when no single plain variant exists', () => {
    expect(pickSimpleVariant([v804, v803, v1206])?.id).toBe(804);
    expect(pickSimpleVariant([{ id: 1, attributes: [{}] }, { id: 2, isDefault: true, attributes: [{}] }])?.id).toBe(2);
  });

  it('falls back to the first, and to nothing for no variants', () => {
    expect(pickSimpleVariant([{ id: 1, attributes: [{}] }, { id: 2, attributes: [{}] }])?.id).toBe(1);
    expect(pickSimpleVariant([])).toBeUndefined();
    expect(pickSimpleVariant(undefined)).toBeUndefined();
  });
});
