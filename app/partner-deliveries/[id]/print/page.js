"use server";
import PrintDelivery from "./PrintDelivery";

// No dashboard Layout: this page is only ever printed.
export default async function PrintDeliveryPage({ params }) {
  const { id } = await params;
  return <PrintDelivery id={id} />;
}
