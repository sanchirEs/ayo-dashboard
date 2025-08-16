"use server";
import Link from "next/link";
import getToken from "@/lib/GetTokenServer";
import Pagination from "@/components/Pagination";
import { notFound } from "next/navigation";
import { getProducts } from "@/lib/api/products";
import ProductRowClient from "./ProductRowClient.jsx";

export default async function ProductTable({ searchParams }) {
  try {
    const { products, pagination } = await getProducts(searchParams);

    if (!products) {
      return <div>Products ачаалахад алдаа гарлаа</div>;
    }

    // Tags are now included in list API to avoid N+1 requests

    const gridTemplate = 'minmax(280px,2fr) 140px 140px 100px 200px 240px 140px 120px';

    return (
      <>
        <div className="wg-table table-product-list">
          <ul className="table-title mb-14" style={{ display: 'grid', gridTemplateColumns: gridTemplate, alignItems: 'center', columnGap: 20 }}>
            <li><div className="body-title">Product</div></li>
            <li><div className="body-title">SKU</div></li>
            <li><div className="body-title">Price</div></li>
            <li><div className="body-title">Stock</div></li>
            <li><div className="body-title">Category</div></li>
            <li><div className="body-title">Tags</div></li>
            <li><div className="body-title">Created Date</div></li>
            <li><div className="body-title">Action</div></li>
          </ul>
          <ul className="flex flex-column">
            {products.map((product) => (
              <ProductRowClient key={product.id} product={product} gridTemplate={gridTemplate} />
            ))}
          </ul>
        </div>
        <Pagination
          currentPage={pagination.page}
          limit={pagination.limit}
          totalPages={pagination.pages}
        />
      </>
    );
  } catch (error) {
    console.error('Error in ProductTable:', error);
    return <div>Products ачаалахад алдаа гарлаа: {error.message}</div>;
  }
}

// moved to client-only file QuickViewActionClient.jsx to avoid using hooks in a server component