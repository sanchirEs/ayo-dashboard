"use server";
import Layout from "@/components/layout/Layout";
import PosOverviewClient from "./PosOverviewClient";

export default async function PosOverviewPage() {
  return (
    <Layout breadcrumbTitleParent="Касс" breadcrumbTitle="POS тойм">
      <PosOverviewClient />
    </Layout>
  );
}
