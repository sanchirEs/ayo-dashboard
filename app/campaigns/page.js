export const dynamic = "force-dynamic";
import Layout from "@/components/layout/Layout";
import Link from "next/link";
import CampaignTable from "./CampaignTable";
import CampaignStats from "./CampaignStats";
import SearchQuery from "@/components/SearchQueryDebounced";

export default async function Campaigns(props) {
  const searchParams = await props.searchParams;
  
  return (
    <>
      <Layout breadcrumbTitleParent="Маркетинг" breadcrumbTitle="Урамшуулал">
        {/* Campaign Statistics */}
        <CampaignStats />
        
        {/* Campaign Filter & Actions */}
        <div className="wg-box">
          <div className="flex items-center justify-between gap10 flex-wrap mb-20">
            <div className="wg-filter flex-grow">
              <SearchQuery
                query="search"
                placeholder="Урамшууллын нэрээр хайх..."
              />
            </div>
            <Link className="tf-button style-1 w208" href="/new-campaign">
              <i className="icon-plus" />
              Шинэ урамшуулал үүсгэх
            </Link>
          </div>
          
          {/* Quick Filters */}
          <div className="flex gap10 flex-wrap mb-20">
            <Link 
              href="/campaigns" 
              className={`tf-button ${!searchParams?.active ? 'style-1' : 'style-3'}`}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              Бүгд
            </Link>
            <Link 
              href="/campaigns?active=true" 
              className={`tf-button ${searchParams?.active === 'true' ? 'style-1' : 'style-3'}`}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              Идэвхтэй
            </Link>
            <Link 
              href="/campaigns?active=false" 
              className={`tf-button ${searchParams?.active === 'false' ? 'style-1' : 'style-3'}`}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              Идэвхгүй
            </Link>
          </div>
          
          <CampaignTable searchParams={searchParams} />
        </div>
      </Layout>
    </>
  );
}

