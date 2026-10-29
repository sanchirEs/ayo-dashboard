import Layout from "@/components/layout/Layout";
import { Suspense } from "react";
import RetailersClient from "./RetailersClient";
import { getRetailers } from "@/lib/api/retailers";
import { getCategories } from "@/lib/api/categories";
import { getAdminSettings } from "@/lib/api/settings";

export const metadata = { title: "Эх сурвалж (Retailers)" };
export const dynamic = "force-dynamic";

export default async function RetailersPage() {
  // All are fetched server-side so the first paint already has the FX/markup
  // values — the client only re-fetches after a mutation. The cargo rate is a
  // plain setting (the Карго page's overview would resolve every import product
  // just to read it); without it the cards simply omit the cargo link.
  const [retailersRes, categories, settings] = await Promise.all([
    getRetailers(),
    getCategories(true).catch(() => []),
    getAdminSettings().catch(() => []),
  ]);
  const rate = Number(settings.find((s) => s.key === "CARGO_RATE_PER_KG")?.value);
  const cargoRatePerKg = Number.isFinite(rate) ? rate : null;

  return (
    <Layout breadcrumbTitleParent="Тохиргоо" breadcrumbTitle="Эх сурвалж">
      <Suspense fallback={<div className="wg-box text-center py-5">Уншиж байна...</div>}>
        <RetailersClient
          initialRetailers={retailersRes.data}
          initialError={retailersRes.error ?? null}
          categories={categories}
          cargoRatePerKg={cargoRatePerKg}
        />
      </Suspense>
    </Layout>
  );
}
