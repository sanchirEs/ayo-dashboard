"use server";
import Layout from "@/components/layout/Layout";
import RegistersClient from "./RegistersClient";

export default async function PosRegistersPage() {
  return (
    <Layout breadcrumbTitleParent="Касс" breadcrumbTitle="Кассууд">
      <RegistersClient />
    </Layout>
  );
}
