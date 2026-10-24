"use server";
import Layout from "@/components/layout/Layout";
import DeliveryEditor from "./DeliveryEditor";

// ?draft=<id> reopens a saved draft; without it the editor starts empty and
// creates the draft on first save.
export default async function NewDeliveryPage({ params, searchParams }) {
  const { id } = await params;
  const { draft } = await searchParams;
  return (
    <Layout breadcrumbTitleParent="Харилцагч" breadcrumbTitle="Падаан">
      <DeliveryEditor partnerId={id} draftId={typeof draft === "string" ? draft : null} />
    </Layout>
  );
}
