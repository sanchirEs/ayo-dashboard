"use server";
import Layout from "@/components/layout/Layout";
import EditCategoryForm from "../EditCategoryForm";

export default async function EditCategory({ params }) {
  const id = Number((await params).id);
  return (
    <>
      <Layout breadcrumbTitleParent="Category" breadcrumbTitle="Edit category">
        <div className="wg-box">
          <EditCategoryForm categoryId={id} />
        </div>
      </Layout>
    </>
  );
}


