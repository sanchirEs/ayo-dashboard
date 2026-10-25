"use server";
import Layout from "@/components/layout/Layout";
import NegativeClient from "./NegativeClient";

export default async function StockNegativePage() {
  return (
    <Layout breadcrumbTitleParent="Нөөц" breadcrumbTitle="Хасах үлдэгдэл">
      <NegativeClient />
    </Layout>
  );
}
