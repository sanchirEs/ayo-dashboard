"use server";
import Layout from "@/components/layout/Layout";
import GoodsInClient from "./GoodsInClient";

export default async function StockGoodsInPage() {
  return (
    <Layout breadcrumbTitleParent="Нөөц" breadcrumbTitle="Бараа орлого">
      <GoodsInClient />
    </Layout>
  );
}
