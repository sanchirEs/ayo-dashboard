"use server";
import Layout from "@/components/layout/Layout";
import Link from "next/link";
import StoreLocationTable from "./StoreLocationTable";

export default async function StoreLocationsPage() {
  return (
    <Layout breadcrumbTitleParent="Тохиргоо" breadcrumbTitle="Салбарууд">
      <div className="wg-box">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div />
          <Link className="tf-button style-1 w208" href="/store-locations/new">
            <i className="icon-plus" />
            Салбар нэмэх
          </Link>
        </div>
        <StoreLocationTable />
      </div>
    </Layout>
  );
}
