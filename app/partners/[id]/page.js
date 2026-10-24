"use server";
import Layout from "@/components/layout/Layout";
import PartnerDetailClient from "./PartnerDetailClient";

export default async function PartnerPage({ params }) {
  const { id } = await params;
  return (
    <Layout breadcrumbTitleParent="Харилцагч" breadcrumbTitle="Тооцоо">
      <PartnerDetailClient id={id} />
    </Layout>
  );
}
