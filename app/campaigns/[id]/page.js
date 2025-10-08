import Layout from "@/components/layout/Layout";
import Link from "next/link";
import GetTokenServer from "@/lib/GetTokenServer";
import { getBackendUrl } from "@/lib/api/env";
import CampaignDetailView from "./CampaignDetailView";

async function getCampaignDetails(id, token) {
  const BACKEND_URL = getBackendUrl();
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/campaigns/${id}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch campaign details');
  }

  const result = await response.json();
  return result.data;
}

async function getCampaignAnalytics(id, token) {
  const BACKEND_URL = getBackendUrl();
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/v1/admin/campaigns/${id}/analytics?timeframe=7d`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Failed to fetch campaign analytics:', error);
    return null;
  }
}

export default async function CampaignDetail({ params }) {
  const { id } = await params;
  
  try {
    const token = await GetTokenServer();
    
    if (!token) {
      return (
        <Layout breadcrumbTitleParent="Урамшуулал" breadcrumbTitle="Дэлгэрэнгүй">
          <div className="text-center py-8">
            <h3 className="text-lg font-medium text-red-600 mb-4">Нэвтрэх шаардлагатай</h3>
            <p className="text-gray-600">Урамшуулал үзэхийн тулд нэвтэрнэ үү.</p>
          </div>
        </Layout>
      );
    }

    const [campaign, analytics] = await Promise.all([
      getCampaignDetails(id, token),
      getCampaignAnalytics(id, token)
    ]);

    return (
      <Layout breadcrumbTitleParent="Урамшуулал" breadcrumbTitle={campaign.name}>
        <div className="wg-box">
          <div className="flex items-center justify-between gap10 mb-20">
            <Link href="/campaigns" className="tf-button style-3">
              <i className="icon-arrow-left" style={{ marginRight: '8px' }} />
              Буцах
            </Link>
            <div className="flex gap10">
              <Link href={`/campaigns/${id}/edit`} className="tf-button style-2">
                <i className="icon-edit" style={{ marginRight: '8px' }} />
                Засах
              </Link>
            </div>
          </div>
          
          <CampaignDetailView campaign={campaign} analytics={analytics} />
        </div>
      </Layout>
    );
  } catch (error) {
    console.error('Error loading campaign details:', error);
    return (
      <Layout breadcrumbTitleParent="Урамшуулал" breadcrumbTitle="Алдаа">
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-red-600 mb-4">Урамшуулал ачаалахад алдаа гарлаа</h3>
          <p className="text-gray-600">{error.message}</p>
          <Link href="/campaigns" className="tf-button style-1 mt-4">
            Буцах
          </Link>
        </div>
      </Layout>
    );
  }
}

