"use server";
import Layout from "@/components/layout/Layout";
import Link from "next/link";
import CouponsTable from "./CouponsTable";
import SearchQuery from "@/components/SearchQueryDebounced";

export default async function Coupons(props) {
  const searchParams = await props.searchParams;
  
  return (
    <>
      <Layout breadcrumbTitleParent="Marketing" breadcrumbTitle="Coupons">
        <div className="wg-box">
          <div className="flex items-center justify-between gap10 flex-wrap">
            <div className="wg-filter flex-grow">
              <SearchQuery
                query="search"
                placeholder="Search coupons by code..."
              />
            </div>
            <Link className="tf-button style-1 w208" href="/new-coupon">
              <i className="icon-plus" />
              Add new
            </Link>
          </div>
          <CouponsTable searchParams={searchParams} />
        </div>
      </Layout>
    </>
  );
}
