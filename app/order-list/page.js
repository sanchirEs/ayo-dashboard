import Layout from "@/components/layout/Layout";
import { Suspense } from "react";
import OrderTable from "./OrderTable";
import OrderFilters from "./OrderFilters";

export default async function OrderList(props) {
    const searchParams = await props.searchParams;
    
    return (
        <>
            <Layout breadcrumbTitleParent="Orders" breadcrumbTitle="Order List">
                <div className="wg-box">
                    <Suspense fallback={<div>Loading filters...</div>}>
                        <OrderFilters />
                    </Suspense>
                    
                    <Suspense 
                        fallback={
                            <div className="wg-table table-all-category">
                                <div className="text-center py-8">
                                    <div className="spinner-border" role="status">
                                        <span className="sr-only">Loading orders...</span>
                                    </div>
                                </div>
                            </div>
                        }
                    >
                        <OrderTable searchParams={searchParams} />
                    </Suspense>
                </div>
            </Layout>
        </>
    );
}
