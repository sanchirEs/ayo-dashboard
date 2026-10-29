import Layout from "@/components/layout/Layout";
import { Suspense } from "react";
import CargoClient from "./CargoClient";
import { getCargoOverview } from "@/lib/api/cargo";

export const metadata = { title: "Карго (Cargo)" };
export const dynamic = "force-dynamic";

export default async function CargoPage() {
  // Only the overview is fetched server-side so the first paint already has the
  // rate and coverage numbers; the to-weigh list and category tree depend on
  // filters the client owns, so it loads those itself.
  const overviewRes = await getCargoOverview();

  return (
    <Layout breadcrumbTitleParent="Тохиргоо" breadcrumbTitle="Карго">
      <Suspense fallback={<div className="wg-box text-center py-5">Уншиж байна...</div>}>
        <CargoClient
          initialOverview={overviewRes.data ?? null}
          initialError={overviewRes.error ?? null}
        />
      </Suspense>
    </Layout>
  );
}
