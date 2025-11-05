"use server";
import Link from "next/link";
import getToken from "@/lib/GetTokenServer";
import Pagination from "@/components/Pagination";
import { notFound } from "next/navigation";
import { getProducts } from "@/lib/api/products";
import ProductTableClient from "./ProductTableClient.jsx";

export default async function ProductTable({ searchParams }) {
  try {
    const { products, pagination } = await getProducts(searchParams);

    if (!products) {
      return <div>Products ачаалахад алдаа гарлаа</div>;
    }

    // UX-optimized grid template: shorter product column for better balance
    const gridTemplate = 'minmax(100px,1fr) 90px 90px 70px 140px 130px 120px 200px 90px';

    return (
      <>
        <ProductTableClient 
          products={products} 
          gridTemplate={gridTemplate} 
          initialPagination={pagination}
        />
      </>
    );
  } catch (error) {
    console.error('Error in ProductTable:', error);
    return <div>Products ачаалахад алдаа гарлаа: {error.message}</div>;
  }
}

// moved to client-only file QuickViewActionClient.jsx to avoid using hooks in a server component