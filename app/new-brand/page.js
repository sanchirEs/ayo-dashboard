import Layout from "@/components/layout/Layout";
import NewBrandForm from "./NewBrandForm";

export default function NewBrand() {
  return (
    <>
      <Layout breadcrumbTitleParent="Бараа" breadcrumbTitle="Шинэ брэнд">
        <div className="wg-box">
          <NewBrandForm />
        </div>
      </Layout>
    </>
  );
}
