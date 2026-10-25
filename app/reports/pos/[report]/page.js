"use server";
import { notFound } from "next/navigation";
import Layout from "@/components/layout/Layout";
import ReportClient from "../ReportClient";
import { REPORTS } from "@/lib/reports/definitions";

export default async function PosReportPage({ params }) {
  const { report } = await params;
  if (!Object.prototype.hasOwnProperty.call(REPORTS, report)) notFound();
  return (
    <Layout breadcrumbTitleParent="Тайлан" breadcrumbTitle={REPORTS[report].title}>
      <ReportClient report={report} />
    </Layout>
  );
}
