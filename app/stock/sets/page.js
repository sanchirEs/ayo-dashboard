"use server";
import Layout from "@/components/layout/Layout";
import SetsClient from "./SetsClient";

export default async function StockSetsPage() {
  return (
    <Layout breadcrumbTitleParent="Нөөц" breadcrumbTitle="Сет">
      <SetsClient />
    </Layout>
  );
}
