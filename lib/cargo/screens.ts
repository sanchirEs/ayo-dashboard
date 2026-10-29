/**
 * Cargo on the screens that already existed (import orders, product edit, order
 * quick view, goods-in): small pure helpers so the rules sit in one tested place.
 * The Карго page's own helpers are in ./format.
 */

import { MAX_WEIGHT_G, parseGrams } from './format';

// ==================== WEIGHT INPUT ====================

/** Shown under a weight box whose text did not parse. */
export const WEIGHT_INPUT_ERROR = `1–${MAX_WEIGHT_G.toLocaleString('en-US')} гр хооронд бүхэл тоо оруулна уу (0 боломжгүй)`;

export type WeightInput =
  | { ok: false }
  | { ok: true; changed: boolean; weightG: number | null };

/**
 * Read a weight box against the weight it was prefilled with.
 *  - invalid (0, a fraction of a gram, > 200 kg, junk) -> { ok: false }
 *  - otherwise `weightG` is what to save (null = clear) and `changed` says
 *    whether it differs from `initial`, so an untouched box sends nothing.
 */
export function resolveWeightInput(
  input: string,
  initial: number | null | undefined
): WeightInput {
  const parsed = parseGrams(input);
  if (Number.isNaN(parsed)) return { ok: false };
  return { ok: true, changed: parsed !== (initial ?? null), weightG: parsed };
}

// ==================== ORDER ====================

interface CargoLine {
  cargoMnt?: number | string | null;
  quantity?: number | string | null;
}

function positive(value: unknown): number {
  const n = typeof value === 'string' && value.trim() === '' ? NaN : Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * The cargo share inside an order's goods total: per-unit snapshot x quantity,
 * summed. A missing or malformed field counts as 0 (older orders have none).
 */
export function orderCargoTotal(items: Array<CargoLine | null> | null | undefined): number {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => sum + positive(item?.cargoMnt) * positive(item?.quantity), 0);
}

// ==================== GOODS IN ====================

/**
 * Parse the "Карго зардал (нийт ₮)" box.
 *  - blank or 0   -> null  (no cargo cost; nothing is sent)
 *  - "45000", "45,000", "1 200 000" -> the positive whole number
 *  - anything else (fraction, negative, junk) -> NaN
 */
export function parseCargoCostMnt(input: string): number | null {
  const text = (input ?? '').replace(/[\s,]/g, '');
  if (text === '') return null;
  if (!/^\d+$/.test(text)) return Number.NaN;
  const n = Number(text);
  if (!Number.isSafeInteger(n)) return Number.NaN;
  return n === 0 ? null : n;
}

function asNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Unit cost plus the line's per-unit cargo share. `cargoUnitCost` arrives as a
 * decimal string (or null) because it is stored with cents; a missing share
 * leaves the unit cost as it was.
 */
export function landedUnitCost(
  unitCost: number | string,
  cargoUnitCost: number | string | null | undefined
): number {
  return (asNumber(unitCost) ?? 0) + (asNumber(cargoUnitCost) ?? 0);
}

/** "1,300₮", or "1,666.67₮" when there are cents; "—" when missing. */
export function formatMntCents(value: number | string | null | undefined): string {
  const n = asNumber(value);
  if (n === null) return '—';
  const [whole, cents] = Math.abs(n).toFixed(2).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${n < 0 ? '-' : ''}${grouped}${cents === '00' ? '' : `.${cents}`}₮`;
}
