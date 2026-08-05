import Layout from "@/components/layout/Layout";
import { Suspense } from "react";
import QueueClient from "./QueueClient";
import {
  getStagingProducts,
  getStatusSummary,
  getRetailerCategories,
  getRetailers,
} from "@/lib/api/retailers";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return { title: `${slug} — бүтээгдэхүүн` };
}

export default async function RetailerQueuePage({ params, searchParams }) {
  const { slug } = await params;
  const sp = (await searchParams) ?? {};
  const status = typeof sp.status === "string" ? sp.status : "NEW";

  const [productsRes, summaryRes, categoriesRes, retailersRes] = await Promise.all([
    getStagingProducts(slug, { status, page: 1, limit: 50 }),
    getStatusSummary(slug),
    getRetailerCategories(slug),
    getRetailers(),
  ]);

  // The publish gate falls back to the retailer's defaultCategoryId, so the
  // client needs the retailer to mirror that rule instead of over-blocking.
  const retailer = retailersRes.data.find((r) => r.slug === slug) ?? null;

  return (
    <Layout breadcrumbTitleParent="Эх сурвалж" breadcrumbTitle="Бүтээгдэхүүн">
      <Suspense fallback={<div className="wg-box text-center py-5">Уншиж байна...</div>}>
        <QueueClient
          slug={slug}
          retailer={retailer}
          initialStatus={status}
          initialRows={productsRes.data}
          initialPagination={productsRes.pagination ?? null}
          initialSummary={summaryRes.data}
          initialError={productsRes.error ?? null}
          categories={categoriesRes.data}
        />
      </Suspense>
    </Layout>
  );
}
