"use server";
import { getAnalytics, formatCurrency, formatNumber, getDateRange } from "@/lib/api/analytics";
import { auth } from "@/auth";

export default async function SalesCharts({ searchParams }) {
  try {
    const session = await auth();
    const token = session?.user?.accessToken || null;
    if (!token) return null;

    const dateRange = searchParams?.days ? getDateRange(parseInt(searchParams.days)) : getDateRange(30);

    const analytics = await getAnalytics({ ...dateRange, type: 'sales' }, token);

    return (
      <div className="flex gap20 flex-wrap">
        <div className="wg-box flex-grow" style={{ minWidth: '400px' }}>
          <h4 className="text-title mb-20">Sales Trend</h4>
          <div className="chart-placeholder" style={{ height: '300px', backgroundColor: '#f8fafc', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #e2e8f0' }}>
            <i className="icon-bar-chart" style={{ fontSize: '48px', color: '#94a3b8', marginBottom: '16px' }} />
            <h4 style={{ color: '#64748b', marginBottom: '8px' }}>Sales Chart</h4>
            <p style={{ color: '#94a3b8', textAlign: 'center', maxWidth: '250px' }}>Chart visualization will be implemented with a charting library like Chart.js or Recharts</p>
            <div style={{ marginTop: '20px', fontSize: '12px', color: '#64748b' }}>
              <div>Sample data points: {analytics.salesByDate?.length || 0}</div>
              <div>Date range: {dateRange.startDate} to {dateRange.endDate}</div>
            </div>
          </div>
        </div>

        <div className="wg-box" style={{ minWidth: '300px', maxWidth: '400px' }}>
          <h4 className="text-title mb-20">Top Products</h4>
          <div className="top-products-list">
            {analytics.topProducts && analytics.topProducts.length > 0 ? (
              analytics.topProducts.slice(0, 5).map((product, index) => (
                <div key={product.id} className="flex items-center justify-between mb-12 p-12" style={{ backgroundColor: index % 2 === 0 ? '#f8fafc' : 'transparent', borderRadius: '6px' }}>
                  <div className="flex items-center gap10">
                    <div className="rank" style={{ backgroundColor: index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : index === 2 ? '#f59e0b' : '#e5e7eb', color: index < 3 ? 'white' : '#64748b', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>{index + 1}</div>
                    <div>
                      <div className="body-title-2" style={{ fontSize: '14px' }}>{product.name}</div>
                      <div className="text-tiny text-gray-500">{product.sales} sold</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="body-text" style={{ fontWeight: 'bold' }}>{formatCurrency(product.revenue)}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <i className="icon-package" style={{ fontSize: '32px', color: '#94a3b8', marginBottom: '12px' }} />
                <p className="text-gray-500">No product data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in SalesCharts:', error);
    return (
      <div className="wg-box">
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-red-600 mb-4">Error Loading Charts</h3>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }
}

