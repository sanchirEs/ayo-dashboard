/**
 * Normalization for product variants coming back from GET /api/v1/products/:id.
 *
 * The API returns variants straight out of Prisma, so their `attributes` are raw
 * ProductVariantAttribute join rows: `{ variantId, optionId, option: { attributeId, ... } }`.
 * There is no `attributeId` on the row itself — it lives one level down on the option.
 * The create/update endpoints, however, expect `{ attributeId, optionId }`, so sending
 * the loaded shape back unchanged fails with "Invalid attribute option: undefined-<id>".
 *
 * Variants can also arrive with more than one `isDefault: true` (e.g. a product created
 * as "simple" gets a `<sku>-DEFAULT` variant, then real variants are added later and the
 * two writes never reconcile). Two checked radios in one group desyncs React's controlled
 * input tracking, so clicking the default toggle stops firing onChange and the form gets
 * stuck on "Нэг үндсэн вариант сонгоно уу".
 */

type RawAttribute = {
  attributeId?: number | string | null;
  optionId?: number | string | null;
  attribute?: { id?: number | string | null } | null;
  option?: { id?: number | string | null; attributeId?: number | string | null } | null;
} | null | undefined;

export type NormalizedAttribute = {
  attributeId: number;
  optionId: number;
};

const toId = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : parseInt(String(value), 10);
  return Number.isFinite(n) ? n : null;
};

/**
 * Flatten variant attributes to the `{ attributeId, optionId }` pairs the backend expects.
 * Accepts both the nested API shape and the flat shape the form itself generates.
 * Rows that cannot be resolved to a complete pair are dropped rather than sent as
 * `undefined`, which the backend rejects with a 400.
 */
export function normalizeVariantAttributes(attributes: RawAttribute[] | null | undefined): NormalizedAttribute[] {
  if (!Array.isArray(attributes)) return [];

  return attributes.reduce<NormalizedAttribute[]>((acc, attr) => {
    if (!attr) return acc;

    const attributeId = toId(attr.attributeId ?? attr.option?.attributeId ?? attr.attribute?.id);
    const optionId = toId(attr.optionId ?? attr.option?.id);

    if (attributeId !== null && optionId !== null) {
      acc.push({ attributeId, optionId });
    }
    return acc;
  }, []);
}

/**
 * Prepare API-loaded variants for the edit form: flatten their attributes and guarantee
 * that exactly one variant is marked default. The first variant already flagged default
 * wins; if none is flagged, the first variant is promoted (matching the backend's own
 * tie-break in productServices.normalizeVariants).
 */
export function normalizeLoadedVariants<T extends { isDefault?: unknown; attributes?: RawAttribute[] }>(
  variants: T[] | null | undefined
): (Omit<T, 'isDefault' | 'attributes'> & { isDefault: boolean; attributes: NormalizedAttribute[] })[] {
  if (!Array.isArray(variants) || variants.length === 0) return [];

  let defaultIndex = variants.findIndex((v) => v?.isDefault === true);
  if (defaultIndex === -1) defaultIndex = 0;

  return variants.map((variant, index) => ({
    ...variant,
    isDefault: index === defaultIndex,
    attributes: normalizeVariantAttributes(variant?.attributes),
  }));
}
