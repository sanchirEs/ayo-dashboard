"use server";
import Layout from "@/components/layout/Layout";
import Link from "next/link";
import CategoryTable from "./CategoryTable";
import SearchQuery from "@/components/SearchQueryDebounced";

export default async function CategoryList(props) {
  const searchParams = await props.searchParams;
  
  return (
    <>
      <Layout breadcrumbTitleParent="Category" breadcrumbTitle="All categories">
        <div className="wg-box">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="wg-filter flex-grow">
              <SearchQuery
                query="search"
                placeholder="Search categories..."
              />
            </div>
            <Link className="tf-button style-1 w208" href="/new-category">
              <i className="icon-plus" />
              Add new
            </Link>
          </div>
          <CategoryTable searchParams={searchParams} />
        </div>
      </Layout>
    </>
  );
}