"use server";
import Layout from "@/components/layout/Layout";
import StoreLocationForm from "../StoreLocationForm";

export default async function NewStoreLocationPage() {
  return (
    <Layout breadcrumbTitleParent="Салбарууд" breadcrumbTitle="Шинэ салбар нэмэх">
      <div className="wg-box">
        <StoreLocationForm />
      </div>
    </Layout>
  );
}
