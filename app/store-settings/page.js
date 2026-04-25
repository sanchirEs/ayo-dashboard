import Layout from "@/components/layout/Layout";
import { Suspense } from "react";
import StoreSettingsClient from "./StoreSettingsClient";
import { getAdminSettings } from "@/lib/api/settings";

export const metadata = { title: "Дэлгүүрийн тохиргоо" };

export default async function StoreSettingsPage() {
  let settings = [];
  try {
    settings = await getAdminSettings();
  } catch {
    // Render with empty list — client shows error state
  }

  return (
    <Layout breadcrumbTitleParent="Тохиргоо" breadcrumbTitle="Дэлгүүрийн тохиргоо">
      <Suspense fallback={<div className="wg-box text-center py-5">Уншиж байна...</div>}>
        <StoreSettingsClient initialSettings={settings} />
      </Suspense>
    </Layout>
  );
}
