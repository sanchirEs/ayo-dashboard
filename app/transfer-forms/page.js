"use server";
import Layout from "@/components/layout/Layout";
import TransferFormsClient from "./TransferFormsClient";

// Requests customers send from ayo.mn/form after a bank transfer. Staff pick the products,
// find the transfer on the bank sheet, and that makes the order.
export default async function TransferFormsPage() {
  return (
    <Layout breadcrumbTitleParent="Захиалга" breadcrumbTitle="Хүргэлтийн хүсэлт">
      <TransferFormsClient />
    </Layout>
  );
}
