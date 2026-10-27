/**
 * Builds the request body for POST /api/v1/products/createproduct.
 *
 * Extracted verbatim from the old AddProductComponent so the UI rewrite cannot
 * change the wire format. Its quirks are deliberate and covered by tests:
 *  - simple mode emits no `variants` at all unless BOTH price and quantity are set
 *  - simple mode's generated variant SKU is `<sku>-DEFAULT`
 *  - variant mode takes the product-level price from the default variant
 *  - barcode is per variant (simple mode: the one DEFAULT variant). An empty box is sent
 *    as null, never omitted: on edit, null is how the backend is told to clear it
 */

export type ProductMode = 'simple' | 'variants';

export interface UploadedImage {
  /** Written by MediaSection; must come first so schema-valid images resolve. */
  imageUrl?: string;
  url?: string;
  secure_url?: string;
  optimized_url?: string;
  name?: string;
  alt?: string;
  isPrimary?: boolean;
}

export interface PayloadImage {
  imageUrl: string;
  altText: string;
  isPrimary: boolean;
}

export interface PayloadVariant {
  sku: string;
  barcode?: string | null;
  price: number;
  isDefault: boolean;
  attributes: { attributeId: number; optionId: number }[];
  inventory?: { quantity: number };
  images: PayloadImage[];
}

export interface BuildPayloadContext {
  mode: ProductMode;
  variants: PayloadVariant[];
  specs: { type: string; value: string }[];
  categoryIds: number[];
  tags: string[];
  uploadedImages: UploadedImage[];
  advancedEnabled: boolean;
  vendorId: number;
}

/**
 * `imageUrl` is checked first because MediaSection stores images in the shape
 * `schemas/productSchema.ts` validates (`{ imageUrl, altText, isPrimary }`).
 * `url` / `secure_url` remain supported for raw Cloudinary responses.
 */
const imageUrlOf = (img: UploadedImage): string =>
  (img.imageUrl || img.url || img.secure_url || (img as unknown as string)) as string;

const barcodeOf = (raw: unknown): string | null => {
  const code = typeof raw === 'string' ? raw.trim() : '';
  return code || null;
};

export function buildProductPayload(
  values: Record<string, any>,
  ctx: BuildPayloadContext
): Record<string, any> {
  const payload: Record<string, any> = {
    sku: values.sku,
    name: values.name,
    description: values.description,
    howToUse: values.howToUse || '',
    ingredients: values.ingredients || '',
    // null (not '') so editing can clear a previously saved date
    expiryDate: values.expiryDate || null,
    specs: ctx.specs.filter((s) => s.type.trim() && s.value.trim()),
    categoryIds:
      ctx.categoryIds.length > 0
        ? ctx.categoryIds
        : values.categoryId
          ? [Number(values.categoryId)]
          : [],
    vendorId: Number(values.vendorId || ctx.vendorId),
    ...(values.brandId && { brandId: Number(values.brandId) }),
    tags: ctx.tags,
  };

  if (ctx.mode === 'simple') {
    payload.price = values.price ? Number(values.price) : 0;
  } else {
    const def = ctx.variants.find((v) => v.isDefault);
    payload.price = def
      ? Number(def.price)
      : Number(ctx.variants[0]?.price || 0);
  }

  if (ctx.advancedEnabled) {
    if (values.flashSale) {
      payload.flashSale = true;
      if (values.flashSaleEndDate) payload.flashSaleEndDate = values.flashSaleEndDate;
    }
    if (values.discountId && values.discountId !== '') {
      payload.discountId = Number(values.discountId);
    }
    if (values.promotionId && values.promotionId !== '') {
      payload.promotionId = Number(values.promotionId);
    }
  }

  const variantImages = (variant: PayloadVariant, index: number): PayloadImage[] => {
    const own = (variant.images || []).filter(
      (img: any) =>
        img.imageUrl &&
        (img.imageUrl.startsWith('http://') || img.imageUrl.startsWith('https://')) &&
        !img._isPreview
    );
    if (own.length > 0) return own;

    if (ctx.uploadedImages.length > 0) {
      return ctx.uploadedImages.map((img) => ({
        imageUrl: imageUrlOf(img),
        altText: `${values.name} - Variant ${index + 1}`,
        isPrimary: index === 0,
      }));
    }
    return [];
  };

  if (ctx.mode === 'variants' && ctx.variants.length > 0) {
    payload.variants = ctx.variants.map((variant, index) => ({
      sku: variant.sku,
      barcode: barcodeOf(variant.barcode),
      price: Number(variant.price),
      isDefault: variant.isDefault,
      attributes: variant.attributes,
      inventory: variant.inventory,
      images: variantImages(variant, index),
    }));
  } else if (ctx.mode === 'simple') {
    const images: PayloadImage[] = ctx.uploadedImages.map((img, index) => ({
      imageUrl: imageUrlOf(img),
      altText: `${values.name}`,
      isPrimary: index === 0,
    }));

    if (values.price && values.quantity) {
      payload.variants = [
        {
          sku: `${values.sku}-DEFAULT`,
          barcode: barcodeOf(values.barcode),
          price: Number(values.price),
          isDefault: true,
          attributes: [],
          inventory: { quantity: Number(values.quantity) },
          images,
        },
      ];
    }
  }

  return payload;
}
