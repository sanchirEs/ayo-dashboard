import { describe, it, expect } from 'vitest';
import { flattenCategoryTree, searchCategoryPaths } from './categoryPaths';

const tree = [
  {
    id: 1,
    name: 'Гоо сайхан',
    children: [
      {
        id: 2,
        name: 'Арьс арчилгаа',
        children: [{ id: 3, name: 'Цэвэрлэгч', children: [] }],
      },
    ],
  },
  {
    id: 62,
    name: 'Захиалгын бараа',
    children: [
      { id: 70, name: 'Costco', children: [{ id: 71, name: 'Cleansers', children: [] }] },
      { id: 80, name: 'Olive Young', children: [{ id: 81, name: 'Cleansers', children: [] }] },
    ],
  },
];

describe('flattenCategoryTree', () => {
  it('returns one entry per node, including branches', () => {
    expect(flattenCategoryTree(tree)).toHaveLength(8);
  });

  it('builds the full ancestor path for a leaf', () => {
    const entry = flattenCategoryTree(tree).find((e) => e.id === 3)!;
    expect(entry.path).toEqual(['Гоо сайхан', 'Арьс арчилгаа', 'Цэвэрлэгч']);
    expect(entry.pathLabel).toBe('Гоо сайхан › Арьс арчилгаа › Цэвэрлэгч');
    expect(entry.name).toBe('Цэвэрлэгч');
  });

  it('distinguishes same-named leaves under different parents', () => {
    const labels = flattenCategoryTree(tree)
      .filter((e) => e.name === 'Cleansers')
      .map((e) => e.pathLabel);
    expect(labels).toEqual([
      'Захиалгын бараа › Costco › Cleansers',
      'Захиалгын бараа › Olive Young › Cleansers',
    ]);
  });

  it('handles an empty or missing tree', () => {
    expect(flattenCategoryTree([])).toEqual([]);
    expect(flattenCategoryTree(undefined as any)).toEqual([]);
  });
});

describe('searchCategoryPaths', () => {
  const entries = flattenCategoryTree(tree);

  it('returns everything for a blank query', () => {
    expect(searchCategoryPaths(entries, '')).toHaveLength(8);
    expect(searchCategoryPaths(entries, '   ')).toHaveLength(8);
  });

  it('matches on the leaf name case-insensitively', () => {
    expect(searchCategoryPaths(entries, 'цэвэрл').map((e) => e.id)).toEqual([3]);
  });

  it('keeps a match when the query hits an ancestor, not the leaf', () => {
    const ids = searchCategoryPaths(entries, 'costco').map((e) => e.id);
    expect(ids).toContain(70);
    expect(ids).toContain(71);
  });

  it('matches across the whole path string', () => {
    const ids = searchCategoryPaths(entries, 'olive cleansers').map((e) => e.id);
    expect(ids).toEqual([81]);
  });

  it('returns an empty array when nothing matches', () => {
    expect(searchCategoryPaths(entries, 'zzzz')).toEqual([]);
  });
});
