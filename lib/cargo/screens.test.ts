import { describe, expect, it } from 'vitest';
import {
  landedUnitCost,
  orderCargoTotal,
  parseCargoCostMnt,
  formatMntCents,
  resolveWeightInput,
} from './screens';

describe('resolveWeightInput', () => {
  it('an untouched prefilled input is not a change', () => {
    expect(resolveWeightInput('250', 250)).toEqual({ ok: true, changed: false, weightG: 250 });
    expect(resolveWeightInput('250 гр', 250)).toEqual({ ok: true, changed: false, weightG: 250 });
    expect(resolveWeightInput('0.25кг', 250)).toEqual({ ok: true, changed: false, weightG: 250 });
  });

  it('a blank input over a blank weight is not a change', () => {
    expect(resolveWeightInput('', null)).toEqual({ ok: true, changed: false, weightG: null });
    expect(resolveWeightInput('  ', undefined)).toEqual({ ok: true, changed: false, weightG: null });
  });

  it('a new weight is a change', () => {
    expect(resolveWeightInput('300', null)).toEqual({ ok: true, changed: true, weightG: 300 });
    expect(resolveWeightInput('1.2 кг', 250)).toEqual({ ok: true, changed: true, weightG: 1200 });
  });

  it('blanking a measured weight clears it', () => {
    expect(resolveWeightInput('', 250)).toEqual({ ok: true, changed: true, weightG: null });
  });

  it('rejects 0, fractions of a gram, negatives, out-of-range values and junk', () => {
    for (const bad of ['0', '0 гр', '-5', '250.5', '200001', 'abc']) {
      expect(resolveWeightInput(bad, 250)).toEqual({ ok: false });
      expect(resolveWeightInput(bad, null)).toEqual({ ok: false });
    }
  });
});

describe('orderCargoTotal', () => {
  it('sums per-unit cargo x quantity over the lines', () => {
    expect(
      orderCargoTotal([
        { cargoMnt: 1300, quantity: 2 },
        { cargoMnt: 500, quantity: 1 },
        { cargoMnt: null, quantity: 4 },
      ])
    ).toBe(3100);
  });

  it('treats a missing field as 0 and never throws', () => {
    expect(orderCargoTotal([{ quantity: 3 }, {}, { cargoMnt: 100 }])).toBe(0);
    expect(orderCargoTotal(undefined)).toBe(0);
    expect(orderCargoTotal(null)).toBe(0);
    expect(orderCargoTotal([])).toBe(0);
    expect(orderCargoTotal([null as any, { cargoMnt: 'x' as any, quantity: 2 }])).toBe(0);
  });

  it('accepts numeric strings', () => {
    expect(orderCargoTotal([{ cargoMnt: '1300' as any, quantity: '2' as any }])).toBe(2600);
  });
});

describe('parseCargoCostMnt', () => {
  it('blank and 0 mean "no cargo cost" (null) and are not sent', () => {
    expect(parseCargoCostMnt('')).toBeNull();
    expect(parseCargoCostMnt('   ')).toBeNull();
    expect(parseCargoCostMnt('0')).toBeNull();
  });

  it('reads a positive whole number, tolerating thousands separators', () => {
    expect(parseCargoCostMnt('45000')).toBe(45000);
    expect(parseCargoCostMnt(' 45,000 ')).toBe(45000);
    expect(parseCargoCostMnt('1 200 000')).toBe(1200000);
  });

  it('rejects fractions, negatives and junk', () => {
    for (const bad of ['-5', '12.5', 'abc', '1e3', '12₮']) {
      expect(parseCargoCostMnt(bad)).toBeNaN();
    }
  });
});

describe('landedUnitCost', () => {
  it('adds the per-unit cargo share (a decimal string) to the unit cost', () => {
    expect(landedUnitCost(10000, '1666.67')).toBeCloseTo(11666.67, 2);
    expect(landedUnitCost(10000, 500)).toBe(10500);
  });

  it('a missing or null cargo share leaves the unit cost alone', () => {
    expect(landedUnitCost(10000, null)).toBe(10000);
    expect(landedUnitCost(10000, undefined)).toBe(10000);
    expect(landedUnitCost(10000, 'oops')).toBe(10000);
  });

  it('copes with a string unit cost (Decimal over JSON)', () => {
    expect(landedUnitCost('10000', '250.5')).toBe(10250.5);
  });
});

describe('formatMntCents', () => {
  it('shows whole tugrik without decimals', () => {
    expect(formatMntCents(1300)).toBe('1,300₮');
    expect(formatMntCents('1300.00')).toBe('1,300₮');
  });

  it('keeps cents when there are any', () => {
    expect(formatMntCents('1666.67')).toBe('1,666.67₮');
    expect(formatMntCents(11666.5)).toBe('11,666.50₮');
  });

  it('missing -> dash', () => {
    expect(formatMntCents(null)).toBe('—');
    expect(formatMntCents(undefined)).toBe('—');
    expect(formatMntCents('x')).toBe('—');
  });
});
