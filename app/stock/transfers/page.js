"use server";
import Layout from "@/components/layout/Layout";
import TransfersClient from "./TransfersClient";

export default async function StockTransfersPage() {
  return (
    <Layout breadcrumbTitleParent="Нөөц" breadcrumbTitle="Шилжүүлэг">
      <TransfersClient />
    </Layout>
  );
}
