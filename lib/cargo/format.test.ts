import { describe, expect, it } from 'vitest';
import {
  MAX_WEIGHT_G,
  SOURCE_LABEL,
  formatMnt,
  formatWeight,
  parseGrams,
} from './format';

describe('parseGrams', () => {
  it('treats a blank input as "clear the weight" (null)', () => {
    expect(parseGrams('')).toBeNull();
    expect(parseGrams('   ')).toBeNull();
  });

  it('reads plain grams, with or without the unit', () => {
    expect(parseGrams('250')).toBe(250);
    expect(parseGrams('250 гр')).toBe(250);
    expect(parseGrams('250гр')).toBe(250);
    expect(parseGrams(' 250 g ')).toBe(250);
  });

  it('reads kilograms and converts to whole grams', () => {
    expect(parseGrams('0.25кг')).toBe(250);
    expect(parseGrams('0.25 кг')).toBe(250);
    expect(parseGrams('1.2 кг')).toBe(1200);
    expect(parseGrams('1,5 кг')).toBe(1500);
    expect(parseGrams('1 kg')).toBe(1000);
    // 1.1 * 1000 is 1100.0000000000002 in floating point.
    expect(parseGrams('1.1кг')).toBe(1100);
  });

  it('rejects zero — the backend reads 0 as "not set"', () => {
    expect(parseGrams('0')).toBeNaN();
    expect(parseGrams('0 гр')).toBeNaN();
    expect(parseGrams('0кг')).toBeNaN();
  });

  it('rejects negatives, fractions of a gram and junk', () => {
    expect(parseGrams('-5')).toBeNaN();
    expect(parseGrams('250.5')).toBeNaN();
    expect(parseGrams('0.0005кг')).toBeNaN();
    expect(parseGrams('abc')).toBeNaN();
    expect(parseGrams('12 кг гр')).toBeNaN();
    expect(parseGrams('1e3')).toBeNaN();
  });

  it('accepts 1 and 200,000 g, rejects beyond', () => {
    expect(MAX_WEIGHT_G).toBe(200000);
    expect(parseGrams('1')).toBe(1);
    expect(parseGrams('200000')).toBe(200000);
    expect(parseGrams('200 кг')).toBe(200000);
    expect(parseGrams('200001')).toBeNaN();
    expect(parseGrams('201 кг')).toBeNaN();
  });
});

describe('formatWeight', () => {
  it('shows grams below one kilogram', () => {
    expect(formatWeight(250)).toBe('250 гр');
    expect(formatWeight(999)).toBe('999 гр');
  });

  it('shows kilograms from 1000 g up, without trailing zeros', () => {
    expect(formatWeight(1000)).toBe('1 кг');
    expect(formatWeight(1200)).toBe('1.2 кг');
    expect(formatWeight(1250)).toBe('1.25 кг');
    expect(formatWeight(1234)).toBe('1.234 кг');
  });

  it('shows a dash for a missing weight instead of crashing', () => {
    expect(formatWeight(Number.NaN)).toBe('—');
    expect(formatWeight(undefined as unknown as number)).toBe('—');
  });
});

describe('formatMnt', () => {
  it('groups thousands and prefixes ₮', () => {
    expect(formatMnt(0)).toBe('₮0');
    expect(formatMnt(1300)).toBe('₮1,300');
    expect(formatMnt(1234567)).toBe('₮1,234,567');
  });

  it('treats a missing amount as 0', () => {
    expect(formatMnt(null)).toBe('₮0');
    expect(formatMnt(undefined)).toBe('₮0');
  });
});

describe('SOURCE_LABEL', () => {
  it('names the three weight sources', () => {
    expect(SOURCE_LABEL).toEqual({
      MEASURED: 'Жинлэсэн',
      CATEGORY: 'Ангиллын',
      DEFAULT: 'Анхдагч',
    });
  });
});
