import { describe, it, expect } from 'vitest';
import { buildProductPayload, type BuildPayloadContext } from './buildProductPayload';

const baseValues = {
  sku: 'SKU1',
  name: 'Тест бараа',
  description: 'Тайлбар',
  howToUse: '',
  ingredients: '',
  vendorId: '1',
  brandId: '',
  price: '',
  quantity: '',
  categoryId: '',
  flashSale: false,
  flashSaleEndDate: '',
  discountId: '',
  promotionId: '',
};

const baseCtx: BuildPayloadContext = {
  mode: 'simple',
  variants: [],
  specs: [],
  categoryIds: [],
  tags: [],
  uploadedImages: [],
  advancedEnabled: false,
  vendorId: 1,
};

describe('buildProductPayload — simple mode', () => {
  it('creates a single DEFAULT variant carrying price, quantity and images', () => {
    const payload = buildProductPayload(
      { ...baseValues, price: '1000', quantity: '5' },
      {
        ...baseCtx,
        uploadedImages: [{ url: 'https://cdn/a.jpg' }, { url: 'https://cdn/b.jpg' }],
      }
    );

    expect(payload.price).toBe(1000);
    expect(payload.variants).toHaveLength(1);
    expect(payload.variants[0]).toMatchObject({
      sku: 'SKU1-DEFAULT',
      price: 1000,
      isDefault: true,
      attributes: [],
      inventory: { quantity: 5 },
    });
    expect(payload.variants[0].images).toEqual([
      { imageUrl: 'https://cdn/a.jpg', altText: 'Тест бараа', isPrimary: true },
      { imageUrl: 'https://cdn/b.jpg', altText: 'Тест бараа', isPrimary: false },
    ]);
  });

  it('sets price to 0 and omits variants entirely when quantity is missing', () => {
    const payload = buildProductPayload({ ...baseValues, price: '1000' }, baseCtx);
    expect(payload.price).toBe(1000);
    expect(payload.variants).toBeUndefined();
  });

  it('defaults price to 0 when no price is entered', () => {
    const payload = buildProductPayload(baseValues, baseCtx);
    expect(payload.price).toBe(0);
  });
});

describe('buildProductPayload — variant mode', () => {
  const variants = [
    {
      sku: 'SKU1-RED',
      price: 1200,
      isDefault: false,
      attributes: [{ attributeId: 1, optionId: 10 }],
      inventory: { quantity: 2 },
      images: [],
    },
    {
      sku: 'SKU1-BLUE',
      price: 1500,
      isDefault: true,
      attributes: [{ attributeId: 1, optionId: 11 }],
      inventory: { quantity: 3 },
      images: [],
    },
  ];

  it("uses the default variant's price as the product price", () => {
    const payload = buildProductPayload(baseValues, { ...baseCtx, mode: 'variants', variants });
    expect(payload.price).toBe(1500);
    expect(payload.variants).toHaveLength(2);
  });

  it('falls back to the first variant price when none is marked default', () => {
    const noDefault = variants.map((v) => ({ ...v, isDefault: false }));
    const payload = buildProductPayload(baseValues, {
      ...baseCtx, mode: 'variants', variants: noDefault,
    });
    expect(payload.price).toBe(1200);
  });

  it('falls back to price 0 when there are no variants', () => {
    const payload = buildProductPayload(baseValues, { ...baseCtx, mode: 'variants' });
    expect(payload.price).toBe(0);
    expect(payload.variants).toBeUndefined();
  });

  it('prefers variant-specific images over main-form images', () => {
    const withOwnImage = [
      {
        ...variants[0],
        images: [{ imageUrl: 'https://cdn/own.jpg', altText: 'own', isPrimary: true }],
      },
      variants[1],
    ];
    const payload = buildProductPayload(baseValues, {
      ...baseCtx,
      mode: 'variants',
      variants: withOwnImage,
      uploadedImages: [{ url: 'https://cdn/main.jpg' }],
    });

    expect(payload.variants[0].images).toEqual([
      { imageUrl: 'https://cdn/own.jpg', altText: 'own', isPrimary: true },
    ]);
    expect(payload.variants[1].images).toEqual([
      { imageUrl: 'https://cdn/main.jpg', altText: 'Тест бараа - Variant 2', isPrimary: false },
    ]);
  });

  it('drops preview and non-http variant images before falling back', () => {
    const withPreview = [
      {
        ...variants[0],
        images: [{ imageUrl: 'blob:local', altText: 'x', isPrimary: true, _isPreview: true } as any],
      },
    ];
    const payload = buildProductPayload(baseValues, {
      ...baseCtx, mode: 'variants', variants: withPreview, uploadedImages: [],
    });
    expect(payload.variants[0].images).toEqual([]);
  });
});

describe('buildProductPayload — shared fields', () => {
  it('falls back to categoryId when categoryIds is empty', () => {
    const payload = buildProductPayload({ ...baseValues, categoryId: '62' }, baseCtx);
    expect(payload.categoryIds).toEqual([62]);
  });

  it('prefers categoryIds when present', () => {
    const payload = buildProductPayload(
      { ...baseValues, categoryId: '62' },
      { ...baseCtx, categoryIds: [1, 2] }
    );
    expect(payload.categoryIds).toEqual([1, 2]);
  });

  it('yields an empty array when neither is set', () => {
    expect(buildProductPayload(baseValues, baseCtx).categoryIds).toEqual([]);
  });

  it('omits brandId when blank and includes it as a number when set', () => {
    expect('brandId' in buildProductPayload(baseValues, baseCtx)).toBe(false);
    expect(buildProductPayload({ ...baseValues, brandId: '7' }, baseCtx).brandId).toBe(7);
  });

  it('drops specs whose type or value is blank', () => {
    const payload = buildProductPayload(baseValues, {
      ...baseCtx,
      specs: [
        { type: 'Багтаамж', value: '50ml' },
        { type: '  ', value: 'x' },
        { type: 'y', value: '   ' },
      ],
    });
    expect(payload.specs).toEqual([{ type: 'Багтаамж', value: '50ml' }]);
  });

  it('passes tags and vendorId through', () => {
    const payload = buildProductPayload(baseValues, { ...baseCtx, tags: ['шинэ', 'хямдрал'] });
    expect(payload.tags).toEqual(['шинэ', 'хямдрал']);
    expect(payload.vendorId).toBe(1);
  });

  it('resolves image URLs from imageUrl, url or secure_url', () => {
    const payload = buildProductPayload(
      { ...baseValues, price: '10', quantity: '1' },
      {
        ...baseCtx,
        uploadedImages: [
          { imageUrl: 'https://cdn/schema-shape.jpg', altText: 'a', isPrimary: true } as any,
          { url: 'https://cdn/raw.jpg' },
          { secure_url: 'https://cdn/secure.jpg' },
        ],
      }
    );
    expect(payload.variants[0].images.map((i: any) => i.imageUrl)).toEqual([
      'https://cdn/schema-shape.jpg',
      'https://cdn/raw.jpg',
      'https://cdn/secure.jpg',
    ]);
  });
});

describe('buildProductPayload — advanced fields', () => {
  const advancedValues = {
    ...baseValues,
    flashSale: true,
    flashSaleEndDate: '2026-09-01',
    discountId: '3',
    promotionId: '4',
  };

  it('omits every advanced field when the section is disabled', () => {
    const payload = buildProductPayload(advancedValues, baseCtx);
    expect('flashSale' in payload).toBe(false);
    expect('discountId' in payload).toBe(false);
    expect('promotionId' in payload).toBe(false);
  });

  it('includes them when the section is enabled', () => {
    const payload = buildProductPayload(advancedValues, { ...baseCtx, advancedEnabled: true });
    expect(payload.flashSale).toBe(true);
    expect(payload.flashSaleEndDate).toBe('2026-09-01');
    expect(payload.discountId).toBe(3);
    expect(payload.promotionId).toBe(4);
  });

  it('omits flashSale when enabled but not switched on', () => {
    const payload = buildProductPayload(
      { ...advancedValues, flashSale: false },
      { ...baseCtx, advancedEnabled: true }
    );
    expect('flashSale' in payload).toBe(false);
  });
});
