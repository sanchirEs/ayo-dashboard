import Layout from "@/components/layout/Layout";
import { Suspense } from "react";
import BannersClient from "./BannersClient";
import { getAdminBanners } from "@/lib/api/banners";

export const metadata = { title: "Баннер" };

export default async function BannersPage() {
  let banners = [];
  try {
    banners = await getAdminBanners();
  } catch {
    // Render with empty list — client shows error state
  }

  return (
    <Layout breadcrumbTitleParent="Тохиргоо" breadcrumbTitle="Баннер">
      <Suspense fallback={<div className="wg-box text-center py-5">Уншиж байна...</div>}>
        <BannersClient initialBanners={banners} />
      </Suspense>
    </Layout>
  );
}
