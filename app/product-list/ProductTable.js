"use server";
import Link from "next/link";
import getToken from "@/lib/GetTokenServer";
import Pagination from "@/components/Pagination";
import { notFound } from "next/navigation";
import { getProducts } from "@/lib/api/products";
import ProductImage from "./ProductImage";
import ProductQuickView from "./ProductQuickView";
import QuickViewAction from "./QuickViewActionClient";

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
              <li
                key={product.id}
                className="product-item"
                style={{ display: 'grid', gridTemplateColumns: gridTemplate, alignItems: 'center', columnGap: 20, minHeight: 72 }}
              >
                <div className="flex items-center" style={{ gap: 16, minWidth: 0 }}>
                  <ProductImage product={product} size={56} />
                  <div className="name" style={{ minWidth: 0 }}>
                    <Link href={`/edit-product/${product.id}`} className="body-title-2" style={{ display: 'inline-block', maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {product.name}
                    </Link>
                  </div>
                </div>
                <div className="body-text">{product.sku}</div>
                <div className="body-text">MNT {product.price}</div>
                <div className="body-text">{product.stock || 0}</div>
                <div className="body-text">{product.category?.name || 'N/A'}</div>
                <div className="body-text" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {(product.tags || []).join(', ') || '-'}
                </div>
                <div className="body-text">{new Date(product.createdAt).toLocaleDateString()}</div>
                <div className="list-icon-function">
                  <QuickViewAction product={product} />
                  <Link href={`/edit-product/${product.id}`} className="item edit">
                    <i className="icon-edit-3" />
                  </Link>
                  <div className="item trash">
                    <i className="icon-trash-2" />
                  </div>
                </div>
              </li>
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