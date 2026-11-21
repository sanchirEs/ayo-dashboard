import Layout from "@/components/layout/Layout";
import OrderDetailClient from "./OrderDetailClient";

// The order is fetched in the browser with the session token (same path the
// order-list quick view uses). The old server-side fetch went through
// tokenService and came back empty, rendering "Order #undefined".
export default async function OrderDetailPage({ params }) {
  const { id } = await params;
  const orderId = Number.parseInt(id, 10);

  return (
    <Layout breadcrumbTitleParent="Захиалга" breadcrumbTitle={Number.isFinite(orderId) ? `#${orderId}` : "Захиалга"}>
      <OrderDetailClient orderId={Number.isFinite(orderId) && orderId > 0 ? orderId : null} />
    </Layout>
  );
}
