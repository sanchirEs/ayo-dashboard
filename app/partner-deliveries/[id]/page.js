"use server";
import Layout from "@/components/layout/Layout";
import DeliveryDetailClient from "./DeliveryDetailClient";

export default async function PartnerDeliveryPage({ params }) {
  const { id } = await params;
  return (
    <Layout breadcrumbTitleParent="Харилцагч" breadcrumbTitle="Падаан">
      <DeliveryDetailClient id={id} />
    </Layout>
  );
}
