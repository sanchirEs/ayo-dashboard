"use server";
import Layout from "@/components/layout/Layout";
import BarcodeLinksClient from "./BarcodeLinksClient";

export default async function PosBarcodeLinksPage() {
  return (
    <Layout breadcrumbTitleParent="Касс" breadcrumbTitle="Шинэ баркод">
      <BarcodeLinksClient />
    </Layout>
  );
}
