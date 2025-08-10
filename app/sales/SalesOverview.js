"use server";
import { getAnalytics, formatCurrency, formatNumber, getDateRange } from "@/lib/api/analytics";
import { auth } from "@/auth";

export default async function SalesOverview({ searchParams }) {
  try {
    const session = await auth();
    const token = session?.user?.accessToken || null;
    if (!token) {
      return (
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-red-600 mb-4">Authentication Required</h3>
          <p className="text-gray-600">Please log in to view sales analytics.</p>
        </div>
      );
    }

    const dateRange = searchParams?.days ? getDateRange(parseInt(searchParams.days)) : getDateRange(30);

    const analytics = await getAnalytics({ ...dateRange, type: 'sales' }, token);

    const salesChange = 12.5; 
    const ordersChange = 8.3;  
    const avgOrderChange = 4.2; 

    return (
      <div className="wg-box">
        <div className="flex items-center justify-between mb-20">
          <h4 className="text-title">Sales Overview</h4>
          <div className="flex gap10">
            <a href="/sales?days=7" className={`text-tiny ${searchParams?.days === '7' ? 'text-primary' : 'text-secondary'}`}>7 Days</a>
            <a href="/sales?days=30" className={`text-tiny ${!searchParams?.days || searchParams?.days === '30' ? 'text-primary' : 'text-secondary'}`}>30 Days</a>
            <a href="/sales?days=90" className={`text-tiny ${searchParams?.days === '90' ? 'text-primary' : 'text-secondary'}`}>90 Days</a>
          </div>
        </div>

        <div className="flex gap20 flex-wrap">
          <div className="sales-card flex-grow" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', padding: '24px', color: 'white', minWidth: '280px' }}>
            <div className="flex items-center justify-between mb-10">
              <div className="icon-wrapper" style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '8px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="icon-dollar-sign" style={{ fontSize: '20px' }} />
              </div>
              <div className="change-indicator" style={{ backgroundColor: salesChange > 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: salesChange > 0 ? '#22c55e' : '#ef4444', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>{salesChange > 0 ? '+' : ''}{salesChange}%</div>
            </div>
            <h3 style={{ fontSize: '28px', fontWeight: 'bold', margin: '8px 0' }}>{formatCurrency(analytics.totalSales)}</h3>
            <p style={{ opacity: 0.8, fontSize: '14px' }}>Total Sales</p>
          </div>

          <div className="sales-card flex-grow" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', borderRadius: '12px', padding: '24px', color: 'white', minWidth: '280px' }}>
            <div className="flex items-center justify-between mb-10">
              <div className="icon-wrapper" style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '8px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="icon-shopping-bag" style={{ fontSize: '20px' }} />
              </div>
              <div className="change-indicator" style={{ backgroundColor: ordersChange > 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: ordersChange > 0 ? '#22c55e' : '#ef4444', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>{ordersChange > 0 ? '+' : ''}{ordersChange}%</div>
            </div>
            <h3 style={{ fontSize: '28px', fontWeight: 'bold', margin: '8px 0' }}>{formatNumber(analytics.totalOrders)}</h3>
            <p style={{ opacity: 0.8, fontSize: '14px' }}>Total Orders</p>
          </div>

          <div className="sales-card flex-grow" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', borderRadius: '12px', padding: '24px', color: 'white', minWidth: '280px' }}>
            <div className="flex items-center justify-between mb-10">
              <div className="icon-wrapper" style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '8px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="icon-trending-up" style={{ fontSize: '20px' }} />
              </div>
              <div className="change-indicator" style={{ backgroundColor: avgOrderChange > 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: avgOrderChange > 0 ? '#22c55e' : '#ef4444', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>{avgOrderChange > 0 ? '+' : ''}{avgOrderChange}%</div>
            </div>
            <h3 style={{ fontSize: '28px', fontWeight: 'bold', margin: '8px 0' }}>{formatCurrency(analytics.averageOrderValue)}</h3>
            <p style={{ opacity: 0.8, fontSize: '14px' }}>Average Order Value</p>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in SalesOverview:', error);
    return (
      <div className="wg-box">
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-red-600 mb-4">Error Loading Sales Data</h3>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }
}

