import Layout from "@/components/layout/Layout";
import { Suspense } from "react";
import ProductOrdersTable from "./ProductOrdersTable";
import ProductOrdersFilters from "./ProductOrdersFilters";

export default async function ProductOrders(props) {
    const searchParams = await props.searchParams;
    const searchKey = JSON.stringify(searchParams || {});

    return (
        <Layout breadcrumbTitleParent="Захиалга" breadcrumbTitle="Бүтээгдэхүүнээр">
            <div className="wg-box">
                <Suspense fallback={<div>Loading filters...</div>}>
                    <ProductOrdersFilters />
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
                    <ProductOrdersTable searchParams={searchParams} />
                </Suspense>
            </div>
        </Layout>
    );
}
