import Layout from "@/components/layout/Layout";
import { Suspense } from "react";
import RetailersClient from "./RetailersClient";
import { getRetailers } from "@/lib/api/retailers";
import { getCategories } from "@/lib/api/categories";

export const metadata = { title: "Эх сурвалж (Retailers)" };
export const dynamic = "force-dynamic";

export default async function RetailersPage() {
  // Both are fetched server-side so the first paint already has the FX/markup
  // values — the client only re-fetches after a mutation.
  const [retailersRes, categories] = await Promise.all([
    getRetailers(),
    getCategories(true).catch(() => []),
  ]);

  return (
    <Layout breadcrumbTitleParent="Тохиргоо" breadcrumbTitle="Эх сурвалж">
      <Suspense fallback={<div className="wg-box text-center py-5">Уншиж байна...</div>}>
        <RetailersClient
          initialRetailers={retailersRes.data}
          initialError={retailersRes.error ?? null}
          categories={categories}
        />
      </Suspense>
    </Layout>
  );
}
