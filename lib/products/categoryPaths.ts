/**
 * Flattening and search for the category picker.
 *
 * The catalogue has ~728 categories since the retailer trees were mirrored under
 * category 62, and leaf names repeat across retailers ("Cleansers" exists under
 * both Costco and Olive Young). So the picker shows and searches full ancestor
 * paths rather than leaf names.
 */

export interface CategoryTreeNode {
  id: number;
  name: string;
  children?: CategoryTreeNode[] | null;
}

export interface CategoryPathEntry {
  id: number;
  name: string;
  path: string[];
  pathLabel: string;
}

export const PATH_SEPARATOR = ' › ';

export function flattenCategoryTree(nodes: CategoryTreeNode[] | null | undefined): CategoryPathEntry[] {
  if (!Array.isArray(nodes)) return [];

  const out: CategoryPathEntry[] = [];

  const walk = (node: CategoryTreeNode, ancestors: string[]) => {
    if (!node || typeof node.id !== 'number') return;
    const path = [...ancestors, node.name];
    out.push({
      id: node.id,
      name: node.name,
      path,
      pathLabel: path.join(PATH_SEPARATOR),
    });
    (node.children || []).forEach((child) => walk(child, path));
  };

  nodes.forEach((node) => walk(node, []));
  return out;
}

/**
 * Every whitespace-separated term must appear somewhere in the entry's full path,
 * so "olive cleansers" finds the Olive Young leaf while "cleansers" finds both.
 * Searching the whole path is what keeps ancestors from vanishing mid-search —
 * the bug in the old CategorySelector, which tested only a node's own name.
 */
export function searchCategoryPaths(
  entries: CategoryPathEntry[],
  query: string
): CategoryPathEntry[] {
  const terms = (query || '').toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return entries;

  return entries.filter((entry) => {
    const haystack = entry.pathLabel.toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}
