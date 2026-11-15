"use server";
import Layout from "@/components/layout/Layout";
import AllTransactionsClient from "./AllTransactionsClient";

export default async function PosAllTransactionsPage() {
  return (
    <Layout breadcrumbTitleParent="Тайлан" breadcrumbTitle="Бүх гүйлгээ">
      <AllTransactionsClient />
    </Layout>
  );
}
