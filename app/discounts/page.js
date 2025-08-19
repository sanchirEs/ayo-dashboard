"use server";
export const dynamic = "force-dynamic";
import Layout from "@/components/layout/Layout";
import Link from "next/link";
import DiscountsOverview from "./DiscountsOverview";
import FlashSalesManager from "./FlashSalesManager";

export default async function Discounts(props) {
  const searchParams = await props.searchParams;
  
  return (
    <>
      <Layout breadcrumbTitleParent="Маркетинг" breadcrumbTitle="Хөнгөлөлт & Flash худалдаа">
        <div className="flex flex-column gap20">
          {/* Discounts Overview */}
          <DiscountsOverview />
          
          {/* Flash Sales Management */}
          <FlashSalesManager searchParams={searchParams} />
        </div>
      </Layout>
    </>
  );
}
