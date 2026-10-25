"use server";
import Layout from "@/components/layout/Layout";
import AdjustmentsClient from "./AdjustmentsClient";

export default async function StockAdjustmentsPage() {
  return (
    <Layout breadcrumbTitleParent="Нөөц" breadcrumbTitle="Залруулга">
      <AdjustmentsClient />
    </Layout>
  );
}
