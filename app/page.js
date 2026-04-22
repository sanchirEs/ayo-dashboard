import { redirect } from 'next/navigation';
import getToken from '@/lib/GetTokenServer';
import Layout from "@/components/layout/Layout"
import ChartDefault2 from "@/components/sections/ChartDefault2"
import Customers2 from "@/components/sections/Customers2"
import Goal1 from "@/components/sections/Goal1"
import Orders4 from "@/components/sections/Orders4"
import Product from "@/components/sections/Product"
import Revenue2 from "@/components/sections/Revenue2"
import Sales1 from "@/components/sections/Sales1"
import Sales2 from "@/components/sections/Sales2"
import Sales3 from "@/components/sections/Sales3"

export default async function DashboardPage() {
    const token = await getToken();
    if (!token) redirect('/login');

    return (
        <>
            <Layout breadcrumbTitle="Dashboard" breadcrumbTitleParent="">
                <div className="tf-section-4 mb-30">
                    <Goal1 />
                    <ChartDefault2 />
                </div>
                <div className="tf-section-8 mb-30">
                    <Sales1 />
                    <Orders4 />
                </div>
                <div className="tf-section-8 mb-30">
                    <Customers2 />
                    <div className="tf-section-2">
                        <Sales2 />
                        <Product />
                    </div>
                </div>
                <div className="tf-section-2">
                    <Sales3 />
                    <Revenue2 />
                </div>
            </Layout>
        </>
    )
}
