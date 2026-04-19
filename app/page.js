import { redirect } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, ShoppingCart, Users, Package } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import getToken from '@/lib/GetTokenServer';
import {
  getOverview,
  getRevenueSeries,
  getTopProducts,
  getRecentOrders,
} from '@/lib/api/analytics';
import styles from './dashboard.module.css';

// ─── Pure helpers (run on server, zero client JS) ─────────────────────────────

function formatMNT(amount) {
  if (amount === null || amount === undefined) return '₮—';
  const n = Math.round(Number(amount));
  if (n >= 1_000_000) return `₮${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 100_000)   return `₮${(n / 1_000).toFixed(0)}K`;
  return `₮${n.toLocaleString('en-US')}`;
}

function formatMNTFull(amount) {
  if (amount === null || amount === undefined) return '₮—';
  return '₮' + Math.round(Number(amount)).toLocaleString('en-US');
}

function formatNumber(n) {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString('en-US');
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)   return `${diff}с`;
  if (diff < 3600) return `${Math.floor(diff / 60)}м`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}ц`;
  return `${Math.floor(diff / 86400)}х`;
}

function formatDate(dateStr) {
  // "YYYY-MM-DD" → "M/D"
  const [, m, d] = dateStr.split('-');
  return `${Number(m)}/${Number(d)}`;
}

// ─── SVG chart generators (pure functions, server-side only) ──────────────────

function buildSparklineSVG(series, color) {
  if (!series || series.length < 2) return null;
  const W = 72, H = 32;
  const values = series.map(p => p.value);
  const max = Math.max(...values, 1);
  const min = 0;
  const range = max - min || 1;
  const xi = (i) => (i / (series.length - 1)) * W;
  const yi = (v) => H - 2 - ((v - min) / range) * (H - 4);
  const pts = series.map((p, i) => `${xi(i).toFixed(1)},${yi(p.value).toFixed(1)}`).join(' ');
  const areaPts = [
    `0,${H}`,
    ...series.map((p, i) => `${xi(i).toFixed(1)},${yi(p.value).toFixed(1)}`),
    `${W},${H}`,
  ].join(' ');
  const gradId = `sg${color.replace(/[^a-z0-9]/gi, '')}`;
  return { pts, areaPts, gradId, color, W, H };
}

function buildAreaChart(series) {
  if (!series || series.length < 2) return null;
  const W = 540, H = 185;
  const PL = 56, PR = 12, PT = 10, PB = 38;
  const plotW = W - PL - PR;
  const plotH = H - PT - PB;
  const values = series.map(p => p.value);
  const maxVal = Math.max(...values, 1);
  const xi = (i) => PL + (i / (series.length - 1)) * plotW;
  const yi = (v) => PT + plotH - (v / maxVal) * plotH;
  const linePts = series.map((p, i) => `${xi(i).toFixed(1)},${yi(p.value).toFixed(1)}`).join(' ');
  const areaPts = [
    `${xi(0).toFixed(1)},${(PT + plotH).toFixed(1)}`,
    ...series.map((p, i) => `${xi(i).toFixed(1)},${yi(p.value).toFixed(1)}`),
    `${xi(series.length - 1).toFixed(1)},${(PT + plotH).toFixed(1)}`,
  ].join(' ');

  // Y-axis: 4 reference lines
  const yTicks = [0, 0.33, 0.67, 1].map(t => ({
    y: (PT + plotH - t * plotH).toFixed(1),
    label: (() => {
      const v = Math.round(t * maxVal);
      if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
      if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}K`;
      return String(v);
    })(),
  }));

  // X-axis: evenly spaced labels, max 7
  const step = Math.max(1, Math.ceil(series.length / 6));
  const xLabels = series
    .map((p, i) => ({ x: xi(i).toFixed(1), label: formatDate(p.date), i }))
    .filter((_, i) => i % step === 0 || i === series.length - 1);

  return { linePts, areaPts, yTicks, xLabels, W, H, PL, PR, PT, PB, plotH, maxVal };
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  PENDING:    { label: 'Хүлээгдэж буй', color: '#F59E0B', css: styles.sPending },
  PROCESSING: { label: 'Боловсруулж байна', color: '#3B82F6', css: styles.sProcessing },
  SHIPPED:    { label: 'Илгээсэн', color: '#14B8A6', css: styles.sShipped },
  DELIVERED:  { label: 'Хүргэсэн', color: '#10B981', css: styles.sDelivered },
};

// ─── Sub-components (server, no "use client") ─────────────────────────────────

function TrendBadge({ pct }) {
  if (pct === undefined || pct === null) return null;
  const cls = pct > 0 ? styles.trendUp : pct < 0 ? styles.trendDown : styles.trendFlat;
  const arrow = pct > 0 ? '↑' : pct < 0 ? '↓' : '→';
  return (
    <span className={`${styles.trendBadge} ${cls}`}>
      {arrow} {Math.abs(pct)}%
    </span>
  );
}

function Sparkline({ series, color }) {
  const d = buildSparklineSVG(series, color);
  if (!d) return null;
  return (
    <svg
      viewBox={`0 0 ${d.W} ${d.H}`}
      width={d.W}
      height={d.H}
      className={styles.kpiSparkline}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={d.gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={d.color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={d.color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={d.areaPts} fill={`url(#${d.gradId})`} />
      <polyline
        points={d.pts}
        fill="none"
        stroke={d.color}
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function KpiCard({ label, value, sub, trend, sparkline, sparkColor, accent, icon: Icon }) {
  return (
    <div className={`${styles.kpiCard} ${styles[accent]}`}>
      <div className={styles.kpiTop}>
        <span className={styles.kpiLabel}>{label}</span>
        {Icon && <Icon size={18} className={styles.kpiIcon} strokeWidth={1.75} />}
      </div>
      <div className={styles.kpiBody}>
        <div className={styles.kpiValue}>{value}</div>
        {sparkline && <Sparkline series={sparkline} color={sparkColor} />}
      </div>
      <div className={styles.kpiFooter}>
        <span className={styles.kpiSub}>{sub}</span>
        <TrendBadge pct={trend} />
      </div>
    </div>
  );
}

function RevenueChart({ data, period }) {
  if (!data?.series) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>📊</span>
        Орлогын мэдээлэл байхгүй
      </div>
    );
  }
  const chart = buildAreaChart(data.series);
  return (
    <>
      <div className={styles.chartTotal}>
        <div className={styles.chartStat}>
          <span className={styles.chartStatValue}>{formatMNT(data.totalRevenue)}</span>
          <span className={styles.chartStatLabel}>{period}Х орлого</span>
        </div>
        <div className={styles.chartStat}>
          <span className={styles.chartStatValue}>{formatNumber(data.totalTransactions)}</span>
          <span className={styles.chartStatLabel}>Гүйлгээ</span>
        </div>
      </div>
      {chart ? (
        <svg
          viewBox={`0 0 ${chart.W} ${chart.H}`}
          className={styles.chartSvg}
          aria-label={`${period}-day revenue chart`}
        >
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {chart.yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={chart.PL} y1={tick.y}
                x2={chart.W - chart.PR} y2={tick.y}
                stroke="#F3F4F6" strokeWidth="1"
              />
              <text
                x={chart.PL - 6} y={tick.y}
                textAnchor="end" dominantBaseline="middle"
                fontSize="10" fill="#C4C4CC"
              >
                {tick.label}
              </text>
            </g>
          ))}

          {/* Baseline */}
          <line
            x1={chart.PL} y1={chart.PT + chart.plotH}
            x2={chart.W - chart.PR} y2={chart.PT + chart.plotH}
            stroke="#E5E7EB" strokeWidth="1"
          />

          {/* Area fill */}
          <polygon points={chart.areaPts} fill="url(#areaGrad)" />

          {/* Line */}
          <polyline
            points={chart.linePts}
            fill="none"
            stroke="#6366F1"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Data dots — only when few points */}
          {data.series.length <= 35 && data.series.map((p, i) => {
            const cx = (chart.PL + (i / (data.series.length - 1)) * (chart.W - chart.PL - chart.PR)).toFixed(1);
            const cy = (chart.PT + chart.plotH - (p.value / chart.maxVal) * chart.plotH).toFixed(1);
            return p.value > 0 ? (
              <circle
                key={i}
                cx={cx} cy={cy} r="2.5"
                fill="#6366F1" stroke="white" strokeWidth="1.5"
              />
            ) : null;
          })}

          {/* X-axis labels */}
          {chart.xLabels.map((l, i) => (
            <text
              key={i}
              x={l.x} y={chart.H - 6}
              textAnchor="middle" fontSize="10" fill="#C4C4CC"
            >
              {l.label}
            </text>
          ))}
        </svg>
      ) : (
        <div className={styles.empty}>Мэдээлэл хангалтгүй</div>
      )}
    </>
  );
}

function OrderStatusWidget({ orders }) {
  if (!orders?.byStatus) {
    return <div className={styles.empty}>Захиалгын мэдээлэл байхгүй</div>;
  }
  const { byStatus, total } = orders;
  const statuses = ['DELIVERED', 'SHIPPED', 'PROCESSING', 'PENDING'];
  return (
    <>
      {/* Segmented bar */}
      <div className={styles.statusBarWrap}>
        {statuses.map(s => {
          const count = byStatus[s] || 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          if (pct < 0.5) return null;
          return (
            <div
              key={s}
              className={styles.statusSegment}
              style={{ width: `${pct}%`, background: STATUS_CONFIG[s].color }}
              title={`${STATUS_CONFIG[s].label}: ${count}`}
            />
          );
        })}
      </div>

      {/* Legend rows */}
      <div className={styles.statusList}>
        {statuses.map(s => {
          const count = byStatus[s] || 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={s} className={styles.statusRow}>
              <div className={styles.statusDot} style={{ background: STATUS_CONFIG[s].color }} />
              <span className={styles.statusName}>{STATUS_CONFIG[s].label}</span>
              <span className={styles.statusCount}>{count}</span>
              <span className={styles.statusPct}>{pct}%</span>
            </div>
          );
        })}
        <div className={styles.statusRow} style={{ borderTop: '1px solid #F3F4F6', paddingTop: 8, marginTop: 4 }}>
          <div className={styles.statusDot} style={{ background: 'transparent' }} />
          <span className={styles.statusName} style={{ fontWeight: 700, color: '#111827' }}>Нийт</span>
          <span className={styles.statusCount} style={{ color: '#6366F1' }}>{total}</span>
          <span className={styles.statusPct}>100%</span>
        </div>
      </div>
    </>
  );
}

function RecentOrdersTable({ orders }) {
  if (!orders?.length) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>📋</span>
        Захиалга байхгүй байна
      </div>
    );
  }
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.ordersTable}>
        <thead>
          <tr>
            <th>#</th>
            <th>Харилцагч</th>
            <th>Бараа</th>
            <th>Дүн</th>
            <th>Төлөв</th>
            <th>Хугацаа</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
            return (
              <tr key={order.id}>
                <td>
                  <Link
                    href={`/order-detail/${order.id}`}
                    className={styles.cellId}
                    style={{ textDecoration: 'none' }}
                  >
                    #{order.id}
                  </Link>
                </td>
                <td className={styles.cellCustomer}>
                  <div className={styles.cellCustomerName}>{order.customerName}</div>
                  <div className={styles.cellCustomerEmail}>{order.customerEmail}</div>
                </td>
                <td>
                  <span className={styles.itemsBadge}>{order.itemCount}</span>
                </td>
                <td className={styles.cellAmount}>{formatMNTFull(order.total)}</td>
                <td>
                  <span className={`${styles.statusPill} ${cfg.css}`}>
                    {cfg.label}
                  </span>
                </td>
                <td className={styles.cellTime}>{timeAgo(order.createdAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TopProductsList({ products }) {
  if (!products?.length) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>📦</span>
        Бараа байхгүй байна
      </div>
    );
  }
  const rankCss = (rank) => {
    if (rank === 1) return styles.productRankGold;
    if (rank === 2) return styles.productRankSilver;
    if (rank === 3) return styles.productRankBronze;
    return '';
  };
  return (
    <div className={styles.productList}>
      {products.map(p => (
        <div key={p.id} className={styles.productRow}>
          <span className={`${styles.productRank} ${rankCss(p.rank)}`}>{p.rank}</span>
          <div className={styles.productInfo}>
            <div className={styles.productName}>{p.name}</div>
            <div className={styles.productMeta}>{p.quantity} ширхэг · {p.orders} захиалга</div>
            <div className={styles.productBarTrack}>
              <div className={styles.productBarFill} style={{ width: `${p.revenuePercent}%` }} />
            </div>
          </div>
          <div className={styles.productRevenue}>
            <div className={styles.productRevenueAmount}>{formatMNT(p.revenue)}</div>
            <div className={styles.productRevenueQty}>{p.revenuePercent}%</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page (server component) ──────────────────────────────────────────────────

export default async function DashboardPage({ searchParams }) {
  const token = await getToken();
  if (!token) redirect('/login');

  const params = await searchParams;
  const rawPeriod = Number(params?.period);
  const period = [7, 30, 90].includes(rawPeriod) ? rawPeriod : 30;

  // Fire all 4 requests concurrently — each is independently cached at the backend
  const [overviewRes, revenueRes, productsRes, ordersRes] = await Promise.allSettled([
    getOverview(token),
    getRevenueSeries(period, token),
    getTopProducts(token),
    getRecentOrders(token),
  ]);

  const overview  = overviewRes.status  === 'fulfilled' ? overviewRes.value  : null;
  const revenue   = revenueRes.status   === 'fulfilled' ? revenueRes.value   : null;
  const products  = productsRes.status  === 'fulfilled' ? productsRes.value  : null;
  const recentOrd = ordersRes.status    === 'fulfilled' ? ordersRes.value    : null;

  const generatedAt = overview?.generatedAt
    ? new Date(overview.generatedAt).toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })
    : null;

  const hasPending = (overview?.orders?.pending || 0) > 0;

  return (
    <Layout breadcrumbTitle="Хяналтын самбар" breadcrumbTitleParent="">
      <div className={styles.dashboard}>

        {/* ── Page header ─────────────────────────────────────── */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Хяналтын самбар</h1>
            <p className={styles.pageSubtitle}>
              {generatedAt ? `Сүүлд шинэчилсэн: ${generatedAt}` : 'Мэдээлэл ачаалж байна...'}
            </p>
          </div>
          <div className={styles.liveChip}>
            <span className={styles.liveDot} />
            Live
          </div>
        </div>

        {/* ── Pending orders alert ─────────────────────────────── */}
        {hasPending && (
          <div className={styles.pendingAlert}>
            <span>⚠️</span>
            <span>
              <span className={styles.pendingAlertCount}>{overview.orders.pending}</span>
              {' '}захиалга шийдвэрлэхийг хүлээж байна
            </span>
            <Link href="/order-list?status=PENDING" className={styles.pendingAlertLink}>
              Харах →
            </Link>
          </div>
        )}

        {/* ── KPI cards ────────────────────────────────────────── */}
        <div className={styles.kpiGrid}>
          <KpiCard
            label="7 хоногийн орлого"
            value={formatMNT(overview?.revenue?.thisWeek)}
            sub={`${formatMNT(overview?.revenue?.today)} өнөөдөр`}
            trend={overview?.revenue?.weekTrend}
            sparkline={overview?.revenue?.sparkline}
            sparkColor="#6366F1"
            accent="accentIndigo"
            icon={TrendingUp}
          />
          <KpiCard
            label="Өнөөдрийн захиалга"
            value={formatNumber(overview?.orders?.today)}
            sub={`Нийт ${formatNumber(overview?.orders?.total)} захиалга`}
            trend={overview?.orders?.weekTrend}
            sparkline={overview?.orders?.sparkline}
            sparkColor="#F59E0B"
            accent="accentAmber"
            icon={ShoppingCart}
          />
          <KpiCard
            label="Нийт харилцагч"
            value={formatNumber(overview?.customers?.total)}
            sub={`+${overview?.customers?.newToday ?? 0} өнөөдөр нэмэгдсэн`}
            sparkColor="#10B981"
            accent="accentEmerald"
            icon={Users}
          />
          <KpiCard
            label="Идэвхтэй бараа"
            value={formatNumber(overview?.products?.active)}
            sub={`Нийт ${formatNumber(overview?.products?.total)} бараанаас`}
            sparkColor="#3B82F6"
            accent="accentBlue"
            icon={Package}
          />
        </div>

        {/* ── Revenue chart + order status ─────────────────────── */}
        <div className={styles.mainGrid}>
          {/* Revenue area chart */}
          <div className={styles.widget} style={{ animationDelay: '0.28s' }}>
            <div className={styles.widgetHeader}>
              <div className={styles.widgetTitleGroup}>
                <span className={styles.widgetTitle}>Орлогын график</span>
                <span className={styles.widgetSubtitle}>Амжилттай гүйлгээнүүд</span>
              </div>
              <div className={styles.periodTabs}>
                {([7, 30, 90]).map(p => (
                  <Link
                    key={p}
                    href={`/?period=${p}`}
                    className={`${styles.periodTab} ${period === p ? styles.periodTabActive : ''}`}
                  >
                    {p}Х
                  </Link>
                ))}
              </div>
            </div>
            <RevenueChart data={revenue} period={period} />
          </div>

          {/* Order status breakdown */}
          <div className={styles.widget} style={{ animationDelay: '0.34s' }}>
            <div className={styles.widgetHeader}>
              <div className={styles.widgetTitleGroup}>
                <span className={styles.widgetTitle}>Захиалгын тойм</span>
                <span className={styles.widgetSubtitle}>Нийт төлөвөөр</span>
              </div>
              <Link href="/order-list" className={styles.viewAll}>
                Бүгдийг харах →
              </Link>
            </div>
            <OrderStatusWidget orders={overview?.orders} />
          </div>
        </div>

        {/* ── Recent orders + top products ─────────────────────── */}
        <div className={styles.mainGrid}>
          {/* Recent orders table */}
          <div className={styles.widget} style={{ animationDelay: '0.38s' }}>
            <div className={styles.widgetHeader}>
              <div className={styles.widgetTitleGroup}>
                <span className={styles.widgetTitle}>Сүүлийн захиалгууд</span>
                <span className={styles.widgetSubtitle}>Хамгийн сүүлийн 8</span>
              </div>
              <Link href="/order-list" className={styles.viewAll}>
                Бүгдийг харах →
              </Link>
            </div>
            <RecentOrdersTable orders={recentOrd?.orders} />
          </div>

          {/* Top products */}
          <div className={styles.widget} style={{ animationDelay: '0.44s' }}>
            <div className={styles.widgetHeader}>
              <div className={styles.widgetTitleGroup}>
                <span className={styles.widgetTitle}>Шилдэг бараанууд</span>
                <span className={styles.widgetSubtitle}>Орлогоор</span>
              </div>
              <Link href="/product-list" className={styles.viewAll}>
                Бүгдийг харах →
              </Link>
            </div>
            <TopProductsList products={products?.products} />
          </div>
        </div>

      </div>
    </Layout>
  );
}
