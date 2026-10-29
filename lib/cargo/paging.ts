/**
 * Paging arithmetic for the Карго to-weigh list.
 *
 * The server pages over the *current* result set. In "Жинлээгүй" a saved row
 * leaves that set (and in "Жинлэсэн" a cleared one does), yet the page keeps it
 * on screen so the owner sees the new price. A plain `skip = page * 50` would
 * then ask for the next page of a set that has shrunk, jumping over unseen
 * products — the most urgent ones, since the list is sorted pending-units
 * first. So the offset is tracked directly and corrected for what left.
 */

export type WeighFilter = 'all' | 'unmeasured' | 'measured';

/** Does a product with this measured weight belong to the filter's result set? */
export function inWeighFilter(
  filter: WeighFilter,
  cargoWeightG: number | null | undefined
): boolean {
  if (filter === 'unmeasured') return !cargoWeightG;
  if (filter === 'measured') return !!cargoWeightG;
  return true;
}

/** Rows still on screen that were saved out of the filter's set. */
export function rowsLeftFilter(
  filter: WeighFilter,
  rows: ReadonlyArray<{ cargoWeightG?: number | null }>
): number {
  let left = 0;
  for (const row of rows) if (!inWeighFilter(filter, row.cargoWeightG)) left += 1;
  return left;
}

/**
 * Offset of the next page: the page began at `skip` and showed `fetched` rows,
 * `left` of which have since left the set, so the first unseen row now sits at
 * `skip + fetched - left`.
 */
export function nextSkip(skip: number, fetched: number, left: number): number {
  return Math.max(0, skip + fetched - left);
}

/** Offset of the previous page. Rows before `skip` are untouched by saves on this page. */
export function prevSkip(skip: number, pageSize: number): number {
  return Math.max(0, skip - pageSize);
}
