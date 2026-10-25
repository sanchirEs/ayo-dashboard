"use server";
import Layout from "@/components/layout/Layout";
import StockClient from "./StockClient";

export default async function StockPage() {
  return (
    <Layout breadcrumbTitleParent="Нөөц" breadcrumbTitle="Салбарын нөөц">
      <StockClient />
    </Layout>
  );
}
