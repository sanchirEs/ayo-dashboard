"use server";
import Layout from "@/components/layout/Layout";
import EditBrandForm from "../EditBrandForm";

export default async function EditBrand({ params }) {
  const id = Number((await params).id);
  return (
    <>
      <Layout breadcrumbTitleParent="Бараа" breadcrumbTitle="Брэнд засах">
        <div className="wg-box">
          <EditBrandForm brandId={id} />
        </div>
      </Layout>
    </>
  );
}
