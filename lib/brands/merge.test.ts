import { describe, it, expect } from 'vitest';
import { describeMergeResult, mergeCandidates, mergeConfirmText } from './merge';

describe('mergeConfirmText', () => {
  it('names the brand that disappears first and the one that stays second', () => {
    expect(mergeConfirmText('hersteller', 'Hersteller')).toBe(
      'hersteller → Hersteller руу нэгтгэнэ. Буцаах боломжгүй.'
    );
  });
});

describe('mergeCandidates', () => {
  const brands = [
    { id: 3, name: 'ELT' },
    { id: 427, name: 'hersteller' },
    { id: 2, name: 'Hersteller' },
    { id: 1780, name: 'ABOUT TONE' },
  ];

  it('never offers the brand being merged away', () => {
    expect(mergeCandidates(brands, 427, '').map((b) => b.id)).not.toContain(427);
  });

  it('lists the rest alphabetically, ignoring case', () => {
    expect(mergeCandidates(brands, 427, '').map((b) => b.name)).toEqual(['ABOUT TONE', 'ELT', 'Hersteller']);
  });

  it('filters by what was typed, ignoring case and spaces', () => {
    expect(mergeCandidates(brands, 427, 'about').map((b) => b.id)).toEqual([1780]);
    expect(mergeCandidates(brands, 427, 'abouttone').map((b) => b.id)).toEqual([1780]);
    expect(mergeCandidates(brands, 427, '  HERST ').map((b) => b.id)).toEqual([2]);
  });

  it('returns nothing for a missing list', () => {
    expect(mergeCandidates(undefined, 1, '')).toEqual([]);
  });
});

describe('describeMergeResult', () => {
  it('always reports the products and skips counts that are zero', () => {
    expect(
      describeMergeResult({
        movedProducts: 0,
        movedCampaignBrands: 0,
        droppedDuplicateCampaignBrands: 0,
        movedRetailerBrands: 0,
      })
    ).toEqual(['0 бараа шилжлээ']);
  });

  it('adds a line for each kind of record that moved', () => {
    expect(
      describeMergeResult({
        movedProducts: 12,
        movedCampaignBrands: 1,
        droppedDuplicateCampaignBrands: 2,
        movedRetailerBrands: 3,
      })
    ).toEqual([
      '12 бараа шилжлээ',
      '1 хямдралын брэнд шилжлээ',
      '2 давхардсан хямдралын брэнд хасагдлаа',
      '3 гадаад дэлгүүрийн брэнд шилжлээ',
    ]);
  });

  it('copes with a response that has no counts', () => {
    expect(describeMergeResult(undefined)).toEqual(['0 бараа шилжлээ']);
  });
});
