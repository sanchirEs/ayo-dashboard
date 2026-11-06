import { describe, expect, it } from 'vitest';
import { analyzeSms, transliterateMn, SMS_SEGMENT_PRICE_MNT } from './smsSegments';

// The expectations below were read from the provider's own dry-run endpoint, so a
// mismatch means this preview would misquote what a broadcast really costs.
describe('analyzeSms', () => {
  it('counts Cyrillic as Unicode: 70 in one SMS', () => {
    expect(analyzeSms('а'.repeat(70))).toMatchObject({ encoding: 'ucs2', units: 70, segments: 1 });
  });

  it('drops to 67 per part past 70', () => {
    expect(analyzeSms('а'.repeat(71))).toMatchObject({ units: 71, segments: 2 });
    expect(analyzeSms('а'.repeat(134)).segments).toBe(2);
    expect(analyzeSms('а'.repeat(135)).segments).toBe(3);
    expect(analyzeSms('а'.repeat(160)).segments).toBe(3);
  });

  it('counts Latin as GSM: 160 in one SMS, 153 per part past that', () => {
    expect(analyzeSms('a'.repeat(160))).toMatchObject({ encoding: 'gsm7', segments: 1 });
    expect(analyzeSms('a'.repeat(161)).segments).toBe(2);
  });

  it('counts GSM extension characters twice', () => {
    expect(analyzeSms('a€')).toMatchObject({ encoding: 'gsm7', units: 3 });
  });

  it('one emoji turns the whole message Unicode, and counts as two units', () => {
    expect(analyzeSms('Sale 22:00 🛍')).toMatchObject({ encoding: 'ucs2', units: 13, segments: 1 });
  });

  it('is empty for an empty message', () => {
    expect(analyzeSms('')).toMatchObject({ units: 0, segments: 0 });
  });

  it('analyzes the Latin text when transliterating', () => {
    const cyrillic = 'а'.repeat(160);
    expect(analyzeSms(cyrillic, { transliterate: true })).toMatchObject({ encoding: 'gsm7', segments: 1 });
  });

  it('counts the longer Latin spelling, not the Cyrillic length', () => {
    expect(analyzeSms('ш'.repeat(100), { transliterate: true })).toMatchObject({ units: 200, segments: 2 });
  });

  it('prices by segment', () => {
    expect(SMS_SEGMENT_PRICE_MNT).toBe(50);
  });
});

describe('transliterateMn', () => {
  it.each([
    ['Ayo: нэвтрэх код: 123456 (5 мин хүчинтэй)', 'Ayo: nevtreh kod: 123456 (5 min huchintei)'],
    ['Таны захиалгын баталгаажуулах', 'Tanii zahialgiin batalgaajuulah'],
    ['Өөрийн үүрэг хүлээн авах', 'Uuriin uureg huleen avah'],
  ])('matches the provider for %s', (input, expected) => {
    expect(transliterateMn(input)).toBe(expected);
  });

  it('keeps capitals the way the provider does', () => {
    expect(transliterateMn('Шар')).toBe('Shar');
    expect(transliterateMn('ШАР')).toBe('SHAR');
  });
});
