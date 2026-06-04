import Layout from "@/components/layout/Layout";
import { Suspense } from "react";
import PickupPinsClient from "./PickupPinsClient";

export const metadata = { title: "Pickup PIN — Ayo Dashboard" };

export default function PickupPinsPage() {
  return (
    <Layout breadcrumbTitleParent="Захиалга" breadcrumbTitle="Pickup PIN">
      <Suspense
        fallback={
          <div className="wg-box text-center py-12" style={{ color: "#9ca3af" }}>
            Уншиж байна...
          </div>
        }
      >
        <PickupPinsClient />
      </Suspense>
    </Layout>
  );
}
