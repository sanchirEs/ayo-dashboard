"use server";
import Layout from "@/components/layout/Layout";
import PickupsClient from "./PickupsClient";

export default async function PosPickupsReportPage() {
  return (
    <Layout breadcrumbTitleParent="Тайлан" breadcrumbTitle="Салбарын захиалга">
      <PickupsClient />
    </Layout>
  );
}
