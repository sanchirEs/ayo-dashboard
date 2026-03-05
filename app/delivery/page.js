import Layout from "@/components/layout/Layout";
import { Suspense } from "react";
import DeliveryTable from "./DeliveryTable";
import DeliveryFilters from "./DeliveryFilters";

export default async function DeliveryPage(props) {
  const searchParams = await props.searchParams;
  const searchKey = JSON.stringify(searchParams || {});

  return (
    <Layout breadcrumbTitleParent="Logistics" breadcrumbTitle="Delivery Management">
      <div className="wg-box">
        <Suspense fallback={<div />}>
          <DeliveryFilters />
        </Suspense>
        <Suspense
          key={searchKey}
          fallback={
            <div className="wg-table table-all-category">
              <div className="text-center py-8">
                <div className="spinner-border" role="status">
                  <span className="sr-only">Loading...</span>
                </div>
              </div>
            </div>
          }
        >
          <DeliveryTable searchParams={searchParams} />
        </Suspense>
      </div>
    </Layout>
  );
}
