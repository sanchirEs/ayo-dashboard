import Layout from "@/components/layout/Layout";
import { Suspense } from "react";
import PickupLogsClient from "./PickupLogsClient";

export const metadata = { title: "Pickup лог — Ayo Dashboard" };

export default function PickupLogsPage() {
  return (
    <Layout breadcrumbTitleParent="Захиалга" breadcrumbTitle="Pickup лог">
      <Suspense
        fallback={
          <div className="wg-box text-center py-12" style={{ color: "#9ca3af" }}>
            Уншиж байна...
          </div>
        }
      >
        <PickupLogsClient />
      </Suspense>
    </Layout>
  );
}
