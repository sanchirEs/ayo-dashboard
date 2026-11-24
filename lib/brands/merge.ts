/**
 * Pure helpers for the "Нэгтгэх" (merge brands) dialog on the brand list.
 */

export interface MergeCandidate {
  id: number;
  name: string;
}

export interface MergeCounts {
  movedProducts?: number;
  movedCampaignBrands?: number;
  droppedDuplicateCampaignBrands?: number;
  movedRetailerBrands?: number;
}

// Names are matched the way the backend treats duplicates: case and spaces ignored.
const squash = (value: string) => value.toLowerCase().replace(/\s+/g, '');

/**
 * The brands the loser can be merged into: everything except itself, filtered by
 * what was typed, alphabetical.
 */
export function mergeCandidates<T extends MergeCandidate>(
  brands: T[] | null | undefined,
  loserId: number,
  query: string
): T[] {
  const needle = squash(query || '');
  return (brands || [])
    .filter((brand) => brand.id !== loserId && squash(brand.name || '').includes(needle))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

/** The sentence the owner confirms. The loser goes first: it is the one that disappears. */
export function mergeConfirmText(loserName: string, survivorName: string): string {
  return `${loserName} → ${survivorName} руу нэгтгэнэ. Буцаах боломжгүй.`;
}

/** One line per kind of record that moved, for the "done" panel. */
export function describeMergeResult(result: MergeCounts | null | undefined): string[] {
  const lines = [`${result?.movedProducts ?? 0} бараа шилжлээ`];
  if (result?.movedCampaignBrands) {
    lines.push(`${result.movedCampaignBrands} хямдралын брэнд шилжлээ`);
  }
  if (result?.droppedDuplicateCampaignBrands) {
    lines.push(`${result.droppedDuplicateCampaignBrands} давхардсан хямдралын брэнд хасагдлаа`);
  }
  if (result?.movedRetailerBrands) {
    lines.push(`${result.movedRetailerBrands} гадаад дэлгүүрийн брэнд шилжлээ`);
  }
  return lines;
}
