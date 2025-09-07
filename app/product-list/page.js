"use server";
import Layout from "@/components/layout/Layout";
import Link from "next/link";
import ProductTable from "./ProductTable";
import SearchQuery from "@/components/SearchQueryDebounced";
import AdvancedSearchButton from "./AdvancedSearchButton";

export default async function ProductList(props) {
  const searchParams = await props.searchParams;
  
  return (
    <>
      <Layout breadcrumbTitleParent="Бараа" breadcrumbTitle="Барааны жагсаалт" pageTitle="Барааны жагсаалт">
        <div className="wg-box">
          <div className="title-box">
            <i className="icon-coffee" />
            <div className="body-text">Зөвлөмж: Барааны нэр, SKU эсвэл ангиллаар хайж үзээрэй.</div>
          </div>
          <div className="flex items-center justify-between gap10 flex-wrap">
            <div className="wg-filter flex-grow" style={{ display: 'flex', gap: '8px' }}>
              <SearchQuery query="search" placeholder="Бараа хайх..." />
              <AdvancedSearchButton />
            </div>
            <Link className="tf-button style-1 w208" href="/add-product">
              <i className="icon-plus" />
              Шинээр нэмэх
            </Link>
          </div>
          <ProductTable searchParams={searchParams} />
        </div>
      </Layout>
    </>
  );
}