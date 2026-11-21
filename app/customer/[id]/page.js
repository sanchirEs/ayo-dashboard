import Layout from "@/components/layout/Layout";
import CustomerClient from "./CustomerClient";

export default async function CustomerPage({ params }) {
  const { id } = await params;
  const userId = Number.parseInt(id, 10);
  const valid = Number.isFinite(userId) && userId > 0;
  return (
    <Layout breadcrumbTitleParent="Хэрэглэгч" breadcrumbTitle={valid ? `#${userId}` : "Хэрэглэгч"}>
      <CustomerClient userId={valid ? userId : null} />
    </Layout>
  );
}
