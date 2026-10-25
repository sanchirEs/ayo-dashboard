"use server";
import Layout from "@/components/layout/Layout";
import CountsClient from "./CountsClient";

export default async function StockCountsPage() {
  return (
    <Layout breadcrumbTitleParent="Нөөц" breadcrumbTitle="Тооллого">
      <CountsClient />
    </Layout>
  );
}
