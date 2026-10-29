/**
 * Which price fields of an open product form are stale against a freshly loaded
 * copy of the product, as [form field path, new value] pairs.
 *
 * Weighing an import product reprices it on the server while the edit form is
 * still open. Updating only these fields keeps everything else the user has
 * typed, and keeps a later Save from writing the old price back.
 *
 * Variants are matched by id (never by position) and a variant with no id or no
 * counterpart is left alone. A missing field means "nothing to update".
 */

interface PriceValues {
  price?: string | number | null;
  variants?: Array<{ id?: number; price?: string | number | null }> | null;
}

const num = (value: unknown): number => Number(value);

export function priceUpdates(current: PriceValues, fresh: PriceValues): Array<[string, string | number]> {
  const updates: Array<[string, string | number]> = [];

  if (fresh.price !== undefined && fresh.price !== null && num(fresh.price) !== num(current.price)) {
    updates.push(['price', fresh.price]);
  }

  (current.variants ?? []).forEach((variant, index) => {
    if (variant?.id === undefined || variant.id === null) return;
    const match = (fresh.variants ?? []).find((v) => v?.id === variant.id);
    if (!match || match.price === undefined || match.price === null) return;
    if (num(match.price) !== num(variant.price)) updates.push([`variants.${index}.price`, match.price]);
  });

  return updates;
}
