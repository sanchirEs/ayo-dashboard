/**
 * Cargo page helpers: weight input parsing and display.
 *
 * Weights are whole grams everywhere (the backend stores an Int and reads 0 as
 * "not set"), so the parser never lets a 0, a fraction of a gram or a negative
 * through — the page would otherwise save a weight that silently means "unset".
 */

/** Largest weight the page accepts (200 kg). Mirrors the backend's sanity cap. */
export const MAX_WEIGHT_G = 200_000;

export const SOURCE_LABEL = {
  MEASURED: 'Жинлэсэн',
  CATEGORY: 'Ангиллын',
  DEFAULT: 'Анхдагч',
} as const;

export type WeightSource = keyof typeof SOURCE_LABEL;

// "250", "250 гр", "0.25кг", "1,5 кг", "1 kg" — a number, then an optional unit.
const GRAMS_INPUT = /^(\d+(?:[.,]\d+)?)\s*(?:(кг|kg|гр|грамм|g)\.?)?$/i;

/**
 * Parse what the owner typed into whole grams.
 *  - blank            -> null  (clear the measured weight)
 *  - "250", "250 гр"  -> 250
 *  - "0.25кг"         -> 250
 *  - anything else    -> NaN   (0, negative, fractional gram, > MAX_WEIGHT_G, junk)
 */
export function parseGrams(input: string): number | null {
  const text = (input ?? '').trim();
  if (text === '') return null;

  const match = GRAMS_INPUT.exec(text);
  if (!match) return Number.NaN;

  const amount = Number(match[1].replace(',', '.'));
  const unit = (match[2] ?? 'г').toLowerCase();
  const grams = unit === 'кг' || unit === 'kg' ? amount * 1000 : amount;

  // 1.1 kg is 1100.0000000000002 g in floating point — round that noise away,
  // but keep a genuine fraction of a gram (250.5) invalid.
  const whole = Math.round(grams);
  if (Math.abs(grams - whole) > 1e-6) return Number.NaN;
  if (whole < 1 || whole > MAX_WEIGHT_G) return Number.NaN;
  return whole;
}

/** "250 гр" below a kilogram, "1.2 кг" from 1000 g up. */
export function formatWeight(g: number): string {
  if (typeof g !== 'number' || !Number.isFinite(g)) return '—';
  if (g < 1000) return `${g} гр`;
  // Integer grams -> at most 3 decimals of a kilogram, so nothing is rounded off.
  const kg = String(Number((g / 1000).toFixed(3)));
  return `${kg} кг`;
}

/** Whole tugrik with thousands separators: 1300 -> "₮1,300". Missing = 0. */
export function formatMnt(amount: number | null | undefined): string {
  const n = typeof amount === 'number' && Number.isFinite(amount) ? Math.round(amount) : 0;
  return `₮${n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}
