import Layout from "@/components/layout/Layout";
import { Suspense } from "react";
import SheetTable from "./SheetTable";

export const metadata = { title: "ДАНС CHECK" };

export default async function SheetPaymentsPage(props) {
  const searchParams = await props.searchParams;
  const searchKey = JSON.stringify(searchParams || {});

  return (
    <Layout breadcrumbTitleParent="Санхүү" breadcrumbTitle="ДАНС CHECK">
      <div className="wg-box">
        <Suspense
          key={searchKey}
          fallback={
            <div className="wg-table table-all-category">
              <div className="text-center py-8">
                <div className="spinner-border" role="status">
                  <span className="sr-only">Ачаалж байна...</span>
                </div>
              </div>
            </div>
          }
        >
          <SheetTable searchParams={searchParams} />
        </Suspense>
      </div>
    </Layout>
  );
}
