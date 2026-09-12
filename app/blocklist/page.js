"use server";
import Layout from "@/components/layout/Layout";
import BlocklistClient from "./BlocklistClient";

export default async function BlocklistPage() {
  return (
    <Layout
      breadcrumbTitleParent="Хэрэглэгч"
      breadcrumbTitle="Блоклосон жагсаалт"
      pageTitle="Блоклосон жагсаалт"
    >
      <BlocklistClient />
    </Layout>
  );
}
