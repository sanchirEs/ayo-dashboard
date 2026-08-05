import Layout from "@/components/layout/Layout";
import { Suspense } from "react";
import BrandMapClient from "./BrandMapClient";
import { getRetailerBrands } from "@/lib/api/retailers";
import { getAllBrands } from "@/lib/api/brands";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return { title: `${slug} — брэнд холбох` };
}

export default async function RetailerBrandsPage({ params }) {
  const { slug } = await params;

  const [rowsRes, brands] = await Promise.all([
    getRetailerBrands(slug),
    getAllBrands().catch(() => []),
  ]);

  return (
    <Layout breadcrumbTitleParent="Эх сурвалж" breadcrumbTitle="Брэнд холбох">
      <Suspense fallback={<div className="wg-box text-center py-5">Уншиж байна...</div>}>
        <BrandMapClient
          slug={slug}
          initialRows={rowsRes.data}
          initialError={rowsRes.error ?? null}
          brands={brands}
        />
      </Suspense>
    </Layout>
  );
}
