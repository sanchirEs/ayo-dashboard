"use server";
import Layout from "@/components/layout/Layout";
import SyncIssuesClient from "./SyncIssuesClient";

export default async function PosSyncIssuesPage() {
  return (
    <Layout breadcrumbTitleParent="Касс" breadcrumbTitle="Синк асуудал">
      <SyncIssuesClient />
    </Layout>
  );
}
