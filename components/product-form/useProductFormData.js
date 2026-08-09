"use client";

import { useEffect, useMemo, useState } from "react";
import { getCategoryTreePublic } from "@/lib/api/categories";
import { getBrandsClient } from "@/lib/api/brands";
import { getAttributes } from "@/lib/api/attributes";
import { getTagPresets } from "@/lib/api/tags";
import { getTagGroups } from "@/lib/api/hierarchicalTags";
import { flattenCategoryTree } from "@/lib/products/categoryPaths";

/**
 * Loads every piece of reference data the product form needs, in one place.
 *
 * Replaces the old component's four separate loading booleans with one flag.
 * Categories come from the tree endpoint, not the flat list: the flat list has
 * no parentId, so it cannot produce the ancestor paths the picker displays.
 */
export default function useProductFormData(token) {
  const [tree, setTree] = useState([]);
  const [brands, setBrands] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [tagPresets, setTagPresets] = useState([]);
  const [tagGroups, setTagGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      try {
        const [treeData, brandsData, attributesData, presets, groups] = await Promise.all([
          getCategoryTreePublic(),
          getBrandsClient(token),
          getAttributes(),
          getTagPresets(),
          getTagGroups(),
        ]);
        if (cancelled) return;

        setTree(treeData || []);
        setBrands(brandsData || []);
        setAttributes(
          (attributesData || []).filter(
            (attr) => Array.isArray(attr.options) && attr.options.length > 0
          )
        );
        setTagPresets(presets || []);
        setTagGroups(groups || []);
      } catch (err) {
        if (!cancelled) setError("Өгөгдөл ачаалахад алдаа гарлаа");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const categoryEntries = useMemo(() => flattenCategoryTree(tree), [tree]);

  return { categoryEntries, brands, attributes, tagPresets, tagGroups, loading, error };
}
