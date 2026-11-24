"use server";
import { Suspense } from "react";
import Layout from "@/components/layout/Layout";
import CountReportClient from "./CountReportClient";

export default async function StockCountReportPage() {
  return (
    <Layout breadcrumbTitleParent="Нөөц" breadcrumbTitle="Тооллогын тайлан">
      <Suspense fallback={null}>
        <CountReportClient />
      </Suspense>
    </Layout>
  );
}
