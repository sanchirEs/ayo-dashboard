"use server";
import Link from "next/link";
import { getBrands } from "@/lib/api/brands";
import BrandRowsClient from "./BrandRowsClient.jsx";
import Pagination from "@/components/Pagination";

export default async function BrandTable({ searchParams }) {
  try {
    const { brands, pagination } = await getBrands(searchParams);

    return (
      <>
        <div className="wg-table table-all-attribute">
          <ul className="table-title flex gap20 mb-14">
            <li>
              <div className="body-title">Brand</div>
            </li>
            <li>
              <div className="body-title">Description</div>
            </li>
            <li>
              <div className="body-title">Website</div>
            </li>
            <li>
              <div className="body-title">Products</div>
            </li>
            <li>
              <div className="body-title">Created Date</div>
            </li>
            <li>
              <div className="body-title">Actions</div>
            </li>
          </ul>
          <ul className="flex flex-column">
            {brands.length ? (
              brands.map((brand) => (
                <BrandRowsClient key={brand.id} brand={brand} />
              ))
            ) : (
              <li className="text-center py-4">
                <div className="body-text">
                  {searchParams?.search ? 'No brands found matching your search.' : 'No brands created yet.'}
                </div>
                {!searchParams?.search && (
                  <Link href="/new-brand" className="tf-button style-1 mt-4">
                    Create your first brand
                  </Link>
                )}
              </li>
            )}
          </ul>
        </div>
        
        {brands.length > 0 && (
          <Pagination
            currentPage={pagination.page}
            limit={pagination.limit}
            totalPages={pagination.pages}
          />
        )}
      </>
    );
  } catch (error) {
    console.error("Error in BrandTable:", error);
    return <div>Failed to load brands: {error.message}</div>;
  }
}
