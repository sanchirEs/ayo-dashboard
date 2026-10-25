"use server";
import Layout from "@/components/layout/Layout";
import LowStockClient from "./LowStockClient";

export default async function StockLowPage() {
  return (
    <Layout breadcrumbTitleParent="Нөөц" breadcrumbTitle="Дуусаж буй">
      <LowStockClient />
    </Layout>
  );
}
