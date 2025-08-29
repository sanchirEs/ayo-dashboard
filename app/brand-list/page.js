"use server";
import Layout from "@/components/layout/Layout";
import Link from "next/link";
import BrandTable from "./BrandTable";
import SearchQuery from "@/components/SearchQueryDebounced";

export default async function BrandList(props) {
  const searchParams = await props.searchParams;
  
  return (
    <>
      <Layout breadcrumbTitleParent="Бараа" breadcrumbTitle="Брэнд">
        <div className="wg-box">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="wg-filter flex-grow">
              <SearchQuery
                query="search"
                placeholder="Брэнд хайх..."
              />
            </div>
            <Link className="tf-button style-1 w208" href="/new-brand">
              <i className="icon-plus" />
              Шинээр нэмэх
            </Link>
          </div>
          <BrandTable searchParams={searchParams} />
        </div>
      </Layout>
    </>
  );
}
