import Layout from "@/components/layout/Layout";
import Link from "next/link";

export default function OrderDetailRedirect() {
  return (
    <Layout breadcrumbTitleParent="Orders" breadcrumbTitle="Order Detail">
      <div className="wg-box">
        <div className="text-center py-8">
          <h3 className="mb-4">Select an Order to View Details</h3>
          <p className="text-gray-600 mb-6">
            Please navigate from the order list or provide a specific order ID in the URL.
          </p>
          <Link 
            href="/order-list"
            className="tf-button style-1"
          >
            <i className="icon-list" />
            Go to Order List
          </Link>
        </div>
      </div>
    </Layout>
  );
}