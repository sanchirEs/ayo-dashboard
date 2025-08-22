"use server";
import { getCategoryTreePublic } from "@/lib/api/categories";
import CategoryRowsClient from "./CategoryRowsClient.jsx";

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

    // Client-rendered collapsible rows

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
            <CategoryRowsClient nodes={data} query={query} />
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