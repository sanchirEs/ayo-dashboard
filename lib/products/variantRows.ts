/**
 * Rows for "Вариант үүсгэх": one per combination of the selected options.
 *
 * A combination the product already has keeps its row as it is (id, SKU, price,
 * barcode, stock, images). Rebuilt from scratch, every row lost its id and typed
 * price, and the save could only match it back to its variant by SKU, which a
 * product SKU change breaks. The save now deletes the variants the rows leave
 * out (ayo-back productServices.removeLeftOutVariants), so that match must hold.
 */

export interface RowAttribute {
  attributeId: number;
  optionId: number;
}

export interface VariantRow {
  id?: number;
  sku: string;
  barcode?: string | null;
  price: number;
  isDefault: boolean;
  attributes: RowAttribute[];
  inventory?: { quantity: number };
  images: unknown[];
}

interface AttributeDef {
  id: number;
  name: string;
  options: { id: number; value: string }[];
}

const comboKey = (attrs: RowAttribute[]) =>
  attrs
    .map((a) => Number(a.optionId))
    .sort((a, b) => a - b)
    .join(',');

export function buildVariantRows(
  combinations: RowAttribute[][],
  current: VariantRow[],
  { baseSku, basePrice, attributes }: { baseSku: string; basePrice: number | string; attributes: AttributeDef[] }
): VariantRow[] {
  const byCombo = new Map(current.map((row) => [comboKey(row.attributes || []), row]));

  const rows = combinations.map((attrs): VariantRow => {
    const kept = byCombo.get(comboKey(attrs));
    if (kept) return kept;

    const names = attrs.map(({ attributeId, optionId }) => {
      const attribute = attributes.find((a) => a.id === attributeId);
      const option = attribute?.options.find((o) => o.id === optionId);
      return `${attribute?.name}-${option?.value}`;
    });
    const suffix = names.join('-').toUpperCase().replace(/\s+/g, '-');

    return {
      sku: `${baseSku}-${suffix}`,
      barcode: '',
      price: Number(basePrice),
      isDefault: false,
      attributes: attrs,
      inventory: { quantity: 0 },
      images: [],
    };
  });

  const defaultIndex = Math.max(0, rows.findIndex((row) => row.isDefault));
  return rows.map((row, index) =>
    row.isDefault === (index === defaultIndex) ? row : { ...row, isDefault: index === defaultIndex }
  );
}
