"use server";
import Layout from "@/components/layout/Layout";
import SettingsClient from "./SettingsClient";

export default async function PosSettingsPage() {
  return (
    <Layout breadcrumbTitleParent="Касс" breadcrumbTitle="Кассын тохиргоо">
      <SettingsClient />
    </Layout>
  );
}
