"use server";
import Layout from "@/components/layout/Layout";
import { getStoreLocationById } from "@/lib/api/storeLocations";
import StoreLocationForm from "../../StoreLocationForm";
import { notFound } from "next/navigation";

export default async function EditStoreLocationPage({ params }) {
  const { id } = await params;
  const location = await getStoreLocationById(Number(id));

  if (!location) notFound();

  return (
    <Layout breadcrumbTitleParent="Салбарууд" breadcrumbTitle="Салбар засах">
      <div className="wg-box">
        <StoreLocationForm existing={location} />
      </div>
    </Layout>
  );
}
