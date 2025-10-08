"use server";
import GetTokenServer from "@/lib/GetTokenServer";
import { getBackendUrl } from "@/lib/api/env";

async function getCampaignMetrics(token) {
  try {
    const BACKEND_URL = getBackendUrl();
    const response = await fetch(`${BACKEND_URL}/api/v1/admin/campaigns/metrics/overview`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Failed to fetch campaign metrics:', error);
    return null;
  }
}

export default async function CampaignStats() {
  try {
    const token = await GetTokenServer();
    
    if (!token) {
      return null;
    }

    const metrics = await getCampaignMetrics(token);

    if (!metrics) {
      return null;
    }

    return (
      <div className="flex gap20 flex-wrap mb-20">
        {/* Total Campaigns */}
        <div className="flex-grow wg-box" style={{ minWidth: '200px' }}>
          <div className="flex items-center gap15">
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <i className="icon-zap" style={{ fontSize: '24px', color: 'white' }} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                {metrics.overview.totalCampaigns || 0}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Нийт урамшуулал
              </div>
            </div>
          </div>
        </div>

        {/* Active Campaigns */}
        <div className="flex-grow wg-box" style={{ minWidth: '200px' }}>
          <div className="flex items-center gap15">
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <i className="icon-check-circle" style={{ fontSize: '24px', color: 'white' }} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#065f46' }}>
                {metrics.overview.activeCampaigns || 0}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Идэвхтэй
              </div>
            </div>
          </div>
        </div>

        {/* Total Usage */}
        <div className="flex-grow wg-box" style={{ minWidth: '200px' }}>
          <div className="flex items-center gap15">
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <i className="icon-users" style={{ fontSize: '24px', color: 'white' }} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#92400e' }}>
                {metrics.overview.totalUsage || 0}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Ашигласан тоо
              </div>
            </div>
          </div>
        </div>

        {/* Total Discount Given */}
        <div className="flex-grow wg-box" style={{ minWidth: '200px' }}>
          <div className="flex items-center gap15">
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ec4899, #db2777)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <i className="icon-dollar-sign" style={{ fontSize: '24px', color: 'white' }} />
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#be185d' }}>
                ₮{Math.round(metrics.overview.totalDiscountGiven).toLocaleString()}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Нийт хөнгөлөлт
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading campaign stats:', error);
    return null;
  }
}

