"use server";
import Layout from "@/components/layout/Layout";
import PartnersClient from "./PartnersClient";

export default async function PartnersPage() {
  return (
    <Layout breadcrumbTitleParent="Харилцагч" breadcrumbTitle="Харилцагчид">
      <PartnersClient />
    </Layout>
  );
}
