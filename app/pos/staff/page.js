"use server";
import Layout from "@/components/layout/Layout";
import StaffClient from "./StaffClient";

export default async function PosStaffPage() {
  return (
    <Layout breadcrumbTitleParent="Касс" breadcrumbTitle="Ажилтан">
      <StaffClient />
    </Layout>
  );
}
