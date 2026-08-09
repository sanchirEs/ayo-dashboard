import { describe, it, expect } from 'vitest';
import {
  normalizeVariantAttributes,
  normalizeLoadedVariants,
} from './variantNormalization';

// Shape captured verbatim from GET /api/v1/products/822?include=variants&fields=detailed
// (product "Clio Waterproof pencil eyeliner"). The backend returns raw
// ProductVariantAttribute join rows, which carry no attributeId of their own.
const PRODUCT_822_VARIANTS = [
  {
    id: 780,
    sku: '7844445-НҮД-BLACK',
    price: '25000',
    isDefault: true,
    attributes: [
      {
        variantId: 780,
        optionId: 48,
        option: {
          id: 48,
          attributeId: 3,
          value: 'black',
          attribute: { id: 3, name: 'Нүд', type: 'text' },
        },
      },
    ],
  },
  {
    id: 781,
    sku: '7844445-НҮД-BROWN',
    price: '25000',
    isDefault: false,
    attributes: [
      {
        variantId: 781,
        optionId: 49,
        option: {
          id: 49,
          attributeId: 3,
          value: 'brown',
          attribute: { id: 3, name: 'Нүд', type: 'text' },
        },
      },
    ],
  },
  {
    id: 779,
    sku: '7844445-DEFAULT',
    price: '25000',
    isDefault: true,
    attributes: [],
  },
];

describe('normalizeVariantAttributes', () => {
  it('lifts attributeId out of the nested option for API join rows', () => {
    expect(normalizeVariantAttributes(PRODUCT_822_VARIANTS[0].attributes)).toEqual([
      { attributeId: 3, optionId: 48 },
    ]);
  });

  it('leaves attributes that are already flat untouched', () => {
    expect(normalizeVariantAttributes([{ attributeId: 3, optionId: 48 }])).toEqual([
      { attributeId: 3, optionId: 48 },
    ]);
  });

  it('coerces string ids to numbers', () => {
    expect(normalizeVariantAttributes([{ attributeId: '3', optionId: '48' }])).toEqual([
      { attributeId: 3, optionId: 48 },
    ]);
  });

  it('drops rows that cannot be resolved to a full attribute/option pair', () => {
    expect(normalizeVariantAttributes([{ optionId: 48 }, null, { attributeId: 3 }])).toEqual([]);
  });

  it('returns an empty array for missing input', () => {
    expect(normalizeVariantAttributes(undefined)).toEqual([]);
    expect(normalizeVariantAttributes(null)).toEqual([]);
  });
});

describe('normalizeLoadedVariants', () => {
  it('collapses multiple default variants down to exactly one', () => {
    const normalized = normalizeLoadedVariants(PRODUCT_822_VARIANTS);
    expect(normalized.filter((v) => v.isDefault)).toHaveLength(1);
  });

  it('keeps the first variant that was already marked default', () => {
    const normalized = normalizeLoadedVariants(PRODUCT_822_VARIANTS);
    expect(normalized.find((v) => v.isDefault)?.id).toBe(780);
  });

  it('promotes the first variant when none is marked default', () => {
    const normalized = normalizeLoadedVariants(
      PRODUCT_822_VARIANTS.map((v) => ({ ...v, isDefault: false }))
    );
    expect(normalized.filter((v) => v.isDefault)).toHaveLength(1);
    expect(normalized[0].isDefault).toBe(true);
  });

  it('gives every variant a real boolean isDefault', () => {
    const normalized = normalizeLoadedVariants([
      { id: 1, sku: 'A', attributes: [] },
      { id: 2, sku: 'B', attributes: [] },
    ]);
    normalized.forEach((v) => expect(typeof v.isDefault).toBe('boolean'));
  });

  it('normalizes each variant’s attributes so they can be saved back', () => {
    const normalized = normalizeLoadedVariants(PRODUCT_822_VARIANTS);
    expect(normalized[0].attributes).toEqual([{ attributeId: 3, optionId: 48 }]);
    expect(normalized[1].attributes).toEqual([{ attributeId: 3, optionId: 49 }]);
    expect(normalized[2].attributes).toEqual([]);
  });

  it('preserves the other variant fields', () => {
    const normalized = normalizeLoadedVariants(PRODUCT_822_VARIANTS);
    expect(normalized[0].id).toBe(780);
    expect(normalized[0].sku).toBe('7844445-НҮД-BLACK');
  });

  it('handles an empty variant list', () => {
    expect(normalizeLoadedVariants([])).toEqual([]);
    expect(normalizeLoadedVariants(undefined)).toEqual([]);
  });
});
