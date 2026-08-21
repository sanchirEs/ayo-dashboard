"use server";
import Layout from "@/components/layout/Layout";
import BarcodeClient from "./BarcodeClient";

export default async function BarcodesPage() {
  return (
    <Layout breadcrumbTitleParent="Бүтээгдэхүүн" breadcrumbTitle="Штрих код">
      <BarcodeClient />
    </Layout>
  );
}
