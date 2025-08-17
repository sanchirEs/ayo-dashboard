"use server";
import Layout from "@/components/layout/Layout";
import SalesOverview from "./SalesOverview";
import SalesCharts from "./SalesCharts";

export default async function Sales(props) {
  const searchParams = await props.searchParams;
  
  return (
    <>
      <Layout breadcrumbTitleParent="Аналитик" breadcrumbTitle="Борлуулалтын тойм">
        <div className="flex flex-column gap20">
          {/* Sales Overview Cards */}
          <SalesOverview searchParams={searchParams} />
          
          {/* Charts and Detailed Analytics */}
          <SalesCharts searchParams={searchParams} />
        </div>
      </Layout>
    </>
  );
}

