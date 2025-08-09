import Layout from "@/components/layout/Layout";
import NewCategoryForm from "./NewCategoryForm";

export default async function NewCategory(props) {
  const searchParams = await props.searchParams;
  const parentId = searchParams?.parentId ? Number(searchParams.parentId) : null;
  return (
    <>
      <Layout breadcrumbTitleParent="Category" breadcrumbTitle="New category">
        <div className="wg-box">
          <NewCategoryForm parentId={parentId} />
        </div>
      </Layout>
    </>
  );
}
