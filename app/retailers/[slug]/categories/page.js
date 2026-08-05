import Layout from "@/components/layout/Layout";
import { Suspense } from "react";
import CategoryMapClient from "./CategoryMapClient";
import { getRetailerCategories } from "@/lib/api/retailers";
import { getCategories } from "@/lib/api/categories";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return { title: `${slug} — ангилал холбох` };
}

export default async function RetailerCategoriesPage({ params }) {
  const { slug } = await params;

  const [rowsRes, categories] = await Promise.all([
    getRetailerCategories(slug),
    getCategories(true).catch(() => []),
  ]);

  return (
    <Layout breadcrumbTitleParent="Эх сурвалж" breadcrumbTitle="Ангилал холбох">
      <Suspense fallback={<div className="wg-box text-center py-5">Уншиж байна...</div>}>
        <CategoryMapClient
          slug={slug}
          initialRows={rowsRes.data}
          initialError={rowsRes.error ?? null}
          categories={categories}
        />
      </Suspense>
    </Layout>
  );
}
