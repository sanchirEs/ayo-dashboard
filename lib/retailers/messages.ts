/**
 * Result lines for the retailer card's "Үнэ дахин бодох" / "Төлөв дахин шалгах"
 * buttons. Both read what ayo-back/retailerSyncService answers:
 *   recompute -> { products, variants }
 *   regate    -> { examined, changed, byStatus }
 * A missing field counts as 0 so a mismatch shows "0" rather than "undefined".
 */

const count = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

export function recomputeMessage(
  data: { products?: number; variants?: number } | null | undefined
): string {
  return `Үнэ дахин бодлоо: ${count(data?.products)} бараа, ${count(data?.variants)} хувилбарын үнэ шинэчлэгдсэн.`;
}

export function regateMessage(
  data: { examined?: number; total?: number; changed?: number; byStatus?: Record<string, number> } | null | undefined
): string {
  const examined = data?.examined ?? data?.total;
  return `Дахин шалгалаа: ${count(data?.changed)}/${count(examined)} мөр төлөв өөрчлөгдсөн.`;
}
