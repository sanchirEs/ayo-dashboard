import { describe, expect, it } from 'vitest';
import { inWeighFilter, nextSkip, prevSkip, rowsLeftFilter } from './paging';

describe('inWeighFilter', () => {
  it('unmeasured holds rows without a measured weight', () => {
    expect(inWeighFilter('unmeasured', null)).toBe(true);
    expect(inWeighFilter('unmeasured', undefined)).toBe(true);
    expect(inWeighFilter('unmeasured', 0)).toBe(true);
    expect(inWeighFilter('unmeasured', 250)).toBe(false);
  });

  it('measured holds rows with a measured weight', () => {
    expect(inWeighFilter('measured', 250)).toBe(true);
    expect(inWeighFilter('measured', null)).toBe(false);
  });

  it('all holds everything', () => {
    expect(inWeighFilter('all', null)).toBe(true);
    expect(inWeighFilter('all', 250)).toBe(true);
  });
});

describe('rowsLeftFilter', () => {
  const rows = [
    { cargoWeightG: 250 }, // weighed on this page
    { cargoWeightG: null },
    { cargoWeightG: 90 }, // weighed on this page
    { cargoWeightG: null },
  ];

  it('counts rows that were saved out of the unmeasured set', () => {
    expect(rowsLeftFilter('unmeasured', rows)).toBe(2);
  });

  it('counts rows that were cleared out of the measured set', () => {
    expect(rowsLeftFilter('measured', rows)).toBe(2);
  });

  it('is 0 for "all", which a save can never leave', () => {
    expect(rowsLeftFilter('all', rows)).toBe(0);
  });
});

describe('nextSkip', () => {
  it('advances by the page when nothing left the set', () => {
    expect(nextSkip(0, 50, 0)).toBe(50);
    expect(nextSkip(50, 50, 0)).toBe(100);
  });

  it('does not jump over unseen rows after some were weighed out of the set', () => {
    // 50 shown, 3 weighed: the set shrank, so the 4th-from-last unseen row is
    // now at index 47, not 50.
    expect(nextSkip(0, 50, 3)).toBe(47);
    expect(nextSkip(50, 50, 50)).toBe(50);
  });

  it('works for a short last page', () => {
    expect(nextSkip(100, 20, 5)).toBe(115);
  });

  it('never goes negative', () => {
    expect(nextSkip(0, 0, 0)).toBe(0);
    expect(nextSkip(0, 2, 5)).toBe(0);
  });

  it('lets the next page start exactly at the first unseen row (no skip, no repeat)', () => {
    // Simulate: set of 130 ids, page 0 = ids 0..49, owner weighs ids 0,1,2.
    const set = Array.from({ length: 130 }, (_, i) => i);
    const page0 = set.slice(0, 50);
    const weighed = new Set([0, 1, 2]);
    const shrunk = set.filter((id) => !weighed.has(id));
    const skip = nextSkip(0, page0.length, weighed.size);
    expect(shrunk[skip]).toBe(50); // first id never shown
  });
});

describe('prevSkip', () => {
  it('steps back a page and stops at 0', () => {
    expect(prevSkip(100, 50)).toBe(50);
    expect(prevSkip(47, 50)).toBe(0);
    expect(prevSkip(0, 50)).toBe(0);
  });
});
