"use server";
import Link from "next/link";
import { getCategoryTreePublic } from "@/lib/api/categories";
import CategoryRowActions from "./CategoryRowActions";

// A modern, responsive, easy-to-scan category tree
export default async function CategoryTable({ searchParams }) {
  try {
    const tree = await getCategoryTreePublic();
    const query = searchParams?.search?.toLowerCase?.() || "";

    const filterTree = (nodes) => {
      if (!query) return nodes;
      const walk = (arr) =>
        arr
          .map((n) => ({ ...n, children: n.children ? walk(n.children) : [] }))
          .filter(
            (n) =>
              n.name.toLowerCase().includes(query) ||
              (n.description || "").toLowerCase().includes(query) ||
              (n.children && n.children.length > 0)
          );
      return walk(nodes);
    };

    const data = filterTree(tree);

    const renderRows = (nodes, depth = 0) => {
      const rows = [];
      for (const c of nodes || []) {
        rows.push(
          <li
            key={c.id}
            className="grid grid-cols-[minmax(260px,1.2fr)_minmax(240px,1fr)_110px_120px] items-center gap-4 rounded-lg border border-neutral-100 bg-white px-4 py-3 mb-2 shadow-[0_1px_0_0_rgba(0,0,0,0.02)]"
          >
            {/* Category column */}
            <div className="flex items-center gap-3 min-w-0" style={{ paddingLeft: depth * 16 }}>
              <i className="icon-folder" style={{ fontSize: 20 }} />
              <div className="min-w-0">
                <Link href={`/category-detail/${c.id}`} className="body-title-2 block truncate" title={c.name}>
                  {c.name}
                </Link>
                {depth > 0 && (
                  <span className="text-xs text-neutral-500">level {depth}</span>
                )}
              </div>
            </div>

            {/* Description column */}
            <div className="body-text text-neutral-600 truncate" title={c.description || "No description"}>
              {c.description || "No description"}
            </div>

            {/* Products column */}
            <div>
              <span className="inline-flex items-center justify-center rounded-full bg-neutral-100 px-2 py-1 text-xs text-neutral-700">
                {c._count?.products || 0} products
              </span>
            </div>

            {/* Actions column */}
            <div className="justify-self-end">
              <CategoryRowActions id={c.id} />
            </div>
          </li>
        );
        if (c.children?.length) rows.push(...renderRows(c.children, depth + 1));
      }
      return rows;
    };

    // Render EXACTLY like the attributes table: same wrapper/classes and responsive behavior
    const renderRowsAttributesExact = (nodes, depth = 0) => {
      const rows = [];
      for (const c of nodes || []) {
        rows.push(
          <li key={c.id} className="attribute-item flex items-center justify-between gap20">
            <div className="name" style={{ paddingLeft: depth * 16 }}>
              <Link href={`/category-detail/${c.id}`} className="body-title-2">
                {c.name}
              </Link>
              {depth > 0 ? (
                <span className="text-xs text-muted-foreground ml-2">(level {depth})</span>
              ) : null}
            </div>
            <div className="body-text">
              {c.description || "No description"}
            </div>
            <div className="body-text">{c._count?.products || 0} products</div>
            <CategoryRowActions id={c.id} />
          </li>
        );
        if (c.children?.length) rows.push(...renderRowsAttributesExact(c.children, depth + 1));
      }
      return rows;
    };

    return (
      <div className="wg-table table-all-attribute">
        <ul className="table-title flex gap20 mb-14">
          <li>
            <div className="body-title">Category</div>
          </li>
          <li>
            <div className="body-title">Description</div>
          </li>
          <li>
            <div className="body-title">Products</div>
          </li>
          <li>
            <div className="body-title">Actions</div>
          </li>
        </ul>
        <ul className="flex flex-column">
          {data.length ? (
            renderRowsAttributesExact(data)
          ) : (
            <li className="text-center py-4">
              <div className="body-text">No categories</div>
            </li>
          )}
        </ul>
      </div>
    );
  } catch (error) {
    console.error("Error in CategoryTable:", error);
    return <div>Failed to load categories: {error.message}</div>;
  }
}