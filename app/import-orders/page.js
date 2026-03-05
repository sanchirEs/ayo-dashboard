import Layout from "@/components/layout/Layout";
import { Suspense } from "react";
import ImportOrdersClient from "./ImportOrdersClient";
import { getImportStats } from "@/lib/api/importOrders";

export default async function ImportOrdersPage() {
  const statsRes = await getImportStats();
  const stats = statsRes?.data || { waiting: 0, arrived: 0, dispatched: 0, total: 0 };

  return (
    <Layout breadcrumbTitleParent="Захиалга" breadcrumbTitle="Импорт захиалга">
      <Suspense fallback={<div className="wg-box text-center py-8">Уншиж байна...</div>}>
        <ImportOrdersClient initialStats={stats} />
      </Suspense>
    </Layout>
  );
}
