"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { resolveImageUrl } from "@/lib/api/env";
import { exportToExcel } from "@/lib/exportToExcel";

// ─── Status badge helpers (same pattern as order-list) ───────────────────────
const STATUS_MAP = {
  PENDING:    { label: "Хүлээгдэж байна", dot: "#f59e0b", bg: "#fffbeb", text: "#92400e" },
  PROCESSING: { label: "Боловсруулж байна", dot: "#3b82f6", bg: "#eff6ff", text: "#1e40af" },
  SHIPPED:    { label: "Хүргэлтэнд",        dot: "#f97316", bg: "#fff7ed", text: "#9a3412" },
  DELIVERED:  { label: "Хүргэгдсэн",        dot: "#10b981", bg: "#ecfdf5", text: "#065f46" },
  CANCELLED:  { label: "Цуцлагдсан",        dot: "#ef4444", bg: "#fef2f2", text: "#991b1b" },
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, dot: "#6b7280", bg: "#f9fafb", text: "#374151" };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
      backgroundColor: s.bg, color: s.text,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

// ─── Format helpers ───────────────────────────────────────────────────────────
function formatCurrency(amount) {
  return new Intl.NumberFormat('mn-MN').format(Math.round(amount)) + '₮';
}
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('mn-MN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

// ─── Summary stat card ────────────────────────────────────────────────────────
function StatCard({ label, value, sub }) {
  return (
    <div style={{
      flex: '1 1 160px',
      padding: '16px 20px',
      borderRadius: '10px',
      background: 'white',
      border: '1px solid #e5e7eb',
      minWidth: '140px',
    }}>
      <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '22px', fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{sub}</div>}
    </div>
  );
}

// ─── Expanded order rows for a product ───────────────────────────────────────
function ExpandedOrders({ orders }) {
  if (!orders || orders.length === 0) {
    return <div style={{ padding: '12px 20px', color: '#6b7280', fontSize: '13px' }}>Захиалга олдсонгүй.</div>;
  }
  return (
    <div style={{ backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
      {/* Sub-table header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '80px 1fr 1fr 70px 110px 70px',
        gap: '0',
        padding: '8px 20px 8px 56px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f3f4f6',
      }}>
        {['Захиалга #', 'Огноо', 'Хэрэглэгч', 'Тоо', 'Статус', ''].map((h, i) => (
          <div key={i} style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</div>
        ))}
      </div>
      {orders.map((o) => (
        <div
          key={o.id}
          style={{
            display: 'grid',
            gridTemplateColumns: '80px 1fr 1fr 70px 110px 70px',
            gap: '0',
            padding: '10px 20px 10px 56px',
            borderBottom: '1px solid #eeeff1',
            alignItems: 'center',
            transition: 'background 0.1s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#3b82f6' }}>#{o.id}</div>
          <div style={{ fontSize: '12px', color: '#374151' }}>{formatDate(o.createdAt)}</div>
          <div style={{ fontSize: '12px', color: '#374151' }}>{o.customerName || '—'}</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{o.qty} ш</div>
          <StatusBadge status={o.status} />
          <div>
            <Link
              href={`/order-list?search=${o.id}`}
              style={{ fontSize: '12px', color: '#6b7280', textDecoration: 'none' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#374151'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
            >
              Харах →
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── User expanded orders ─────────────────────────────────────────────────────
function ExpandedUserOrders({ orders }) {
  if (!orders || orders.length === 0) {
    return <div style={{ padding: '12px 20px', color: '#6b7280', fontSize: '13px' }}>Захиалга олдсонгүй.</div>;
  }
  return (
    <div style={{ backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '80px 1fr 70px 120px 110px 70px',
        padding: '8px 20px 8px 56px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f3f4f6',
      }}>
        {['Захиалга #', 'Огноо', 'Бараа тоо', 'Дүн', 'Статус', ''].map((h, i) => (
          <div key={i} style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</div>
        ))}
      </div>
      {orders.map((o) => (
        <div
          key={o.id}
          style={{
            display: 'grid',
            gridTemplateColumns: '80px 1fr 70px 120px 110px 70px',
            padding: '10px 20px 10px 56px',
            borderBottom: '1px solid #eeeff1',
            alignItems: 'center',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#3b82f6' }}>#{o.id}</div>
          <div style={{ fontSize: '12px', color: '#374151' }}>{formatDate(o.createdAt)}</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{o.qty} ш</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{formatCurrency(parseFloat(o.total) || 0)}</div>
          <StatusBadge status={o.status} />
          <div>
            <Link href={`/order-list?search=${o.id}`} style={{ fontSize: '12px', color: '#6b7280', textDecoration: 'none' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#374151'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
            >Харах →</Link>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── User grouped table ───────────────────────────────────────────────────────
function UserGroupsTable({ userGroups }) {
  const [localSearch, setLocalSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [sortBy, setSortBy] = useState('totalSpent');
  const [sortDir, setSortDir] = useState('desc');

  const filtered = useMemo(() => {
    const q = localSearch.trim().toLowerCase();
    const list = q
      ? userGroups.filter(g =>
          g.customerName.toLowerCase().includes(q) ||
          g.email.toLowerCase().includes(q) ||
          g.phone.toLowerCase().includes(q)
        )
      : userGroups;
    return [...list].sort((a, b) => {
      let av = a[sortBy], bv = b[sortBy];
      if (sortBy === 'lastOrderedAt') { av = av ? new Date(av).getTime() : 0; bv = bv ? new Date(bv).getTime() : 0; }
      return sortDir === 'desc' ? bv - av : av - bv;
    });
  }, [userGroups, localSearch, sortBy, sortDir]);

  const toggleExpand = (id) => setExpandedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const handleSort = (field) => { if (sortBy === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc'); else { setSortBy(field); setSortDir('desc'); } };

  const SortIcon = ({ field }) => sortBy !== field
    ? <span style={{ color: '#d1d5db', marginLeft: 3 }}>↕</span>
    : <span style={{ color: '#3730a3', marginLeft: 3 }}>{sortDir === 'desc' ? '↓' : '↑'}</span>;

  const colHeader = (label, field) => (
    <div className="body-title" onClick={() => handleSort(field)}
      style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
      {label}<SortIcon field={field} />
    </div>
  );

  const totalUsers = userGroups.length;
  const totalOrders = userGroups.reduce((s, g) => s + g.orderCount, 0);
  const totalSpent = userGroups.reduce((s, g) => s + g.totalSpent, 0);

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <StatCard label="Хэрэглэгч" value={totalUsers} sub="захиалга хийсэн" />
        <StatCard label="Нийт захиалга" value={totalOrders} sub="нийт захиалгын тоо" />
        <StatCard label="Нийт орлого" value={formatCurrency(totalSpent)} sub="бүх захиалгын дүн" />
        <StatCard label="Хайлтын үр дүн" value={filtered.length} sub={`/ ${totalUsers} хэрэглэгч`} />
      </div>

      {/* Client search */}
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ position: 'relative', flex: '0 0 300px' }}>
          <input
            type="text"
            placeholder="Нэр, имэйл, утасны дугаараар хайх..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            style={{
              width: '100%', padding: '7px 36px 7px 12px',
              borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '13px', outline: 'none',
            }}
            onFocus={(e) => e.target.style.borderColor = '#3730a3'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
          {localSearch && (
            <button onClick={() => setLocalSearch('')}
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '14px' }}>✕</button>
          )}
        </div>
        <span style={{ fontSize: '13px', color: '#6b7280' }}>{filtered.length} хэрэглэгч</span>
      </div>

      {/* Table */}
      <div className="wg-table table-all-category">
        <ul className="table-title flex gap20 mb-14" style={{ alignItems: 'center' }}>
          <li style={{ width: '36px', flexShrink: 0 }} />
          <li style={{ flex: '2 1 180px' }}><div className="body-title">Хэрэглэгч</div></li>
          <li style={{ flex: '1 1 80px', minWidth: 80 }}>{colHeader('Захиалга', 'orderCount')}</li>
          <li style={{ flex: '1 1 80px', minWidth: 80 }}>{colHeader('Нийт ш', 'totalQty')}</li>
          <li style={{ flex: '1 1 120px', minWidth: 100 }}>{colHeader('Нийт дүн', 'totalSpent')}</li>
          <li style={{ flex: '1 1 120px', minWidth: 100 }}>{colHeader('Сүүлд захиалсан', 'lastOrderedAt')}</li>
          <li style={{ flex: '1 1 140px', minWidth: 120 }}><div className="body-title">Холбоо барих</div></li>
        </ul>

        <ul className="flex flex-column">
          {filtered.length === 0 && (
            <li style={{ padding: '32px 0', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Хэрэглэгч олдсонгүй.</li>
          )}
          {filtered.map((group) => {
            const isExpanded = expandedIds.has(group.userId);
            const initials = group.customerName !== `Хэрэглэгч #${group.userId}`
              ? group.customerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
              : '?';
            return (
              <li key={group.userId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <div
                  className="product-item gap14"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '20px', padding: '12px 0',
                    cursor: 'pointer', background: isExpanded ? '#f8f9ff' : 'transparent',
                  }}
                  onClick={() => toggleExpand(group.userId)}
                  onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = '#fafafa'; }}
                  onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
                >
                  {/* Chevron */}
                  <div style={{
                    width: '36px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#9ca3af', fontSize: '13px', transition: 'transform 0.2s',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  }}>▶</div>

                  {/* Avatar + name */}
                  <div style={{ flex: '2 1 180px', display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                      backgroundColor: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '14px', fontWeight: 700, color: '#5b21b6',
                    }}>{initials}</div>
                    <div style={{ minWidth: 0 }}>
                      <div className="body-text" style={{ fontWeight: 600, color: '#111827', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {group.customerName}
                      </div>
                      <div className="text-tiny" style={{ color: '#6b7280', fontSize: '11px', marginTop: '1px' }}>
                        ID #{group.userId}
                      </div>
                    </div>
                  </div>

                  {/* Order count */}
                  <div style={{ flex: '1 1 80px', minWidth: 80 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      minWidth: '32px', height: '24px', padding: '0 8px',
                      borderRadius: '6px', fontSize: '13px', fontWeight: 700,
                      backgroundColor: '#eff6ff', color: '#1e40af',
                    }}>{group.orderCount}</span>
                  </div>

                  {/* Total qty */}
                  <div style={{ flex: '1 1 80px', minWidth: 80 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      minWidth: '36px', height: '24px', padding: '0 8px',
                      borderRadius: '6px', fontSize: '13px', fontWeight: 700,
                      backgroundColor: '#f0fdf4', color: '#166534',
                    }}>{group.totalQty} ш</span>
                  </div>

                  {/* Total spent */}
                  <div style={{ flex: '1 1 120px', minWidth: 100 }}>
                    <span className="body-text" style={{ fontWeight: 600, color: '#111827', fontSize: '13px' }}>
                      {formatCurrency(group.totalSpent)}
                    </span>
                  </div>

                  {/* Last ordered */}
                  <div style={{ flex: '1 1 120px', minWidth: 100 }}>
                    <span className="text-tiny" style={{ color: '#6b7280', fontSize: '12px' }}>
                      {formatDate(group.lastOrderedAt)}
                    </span>
                  </div>

                  {/* Contact */}
                  <div style={{ flex: '1 1 140px', minWidth: 120 }}>
                    <div style={{ fontSize: '12px', color: '#374151' }}>{group.email !== '—' ? group.email : ''}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '1px' }}>{group.phone}</div>
                  </div>
                </div>

                {isExpanded && <ExpandedUserOrders orders={group.orders} />}
              </li>
            );
          })}
        </ul>
      </div>

      {userGroups.length > 0 && (
        <div style={{ marginTop: '16px', fontSize: '12px', color: '#9ca3af', textAlign: 'right' }}>
          Нийт {userGroups.length} хэрэглэгч · 500 захиалга хүртэл харуулж байна
        </div>
      )}
    </div>
  );
}

// ─── Main client component ────────────────────────────────────────────────────
export default function ProductOrdersClient({ groups, userGroups, stats }) {
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'users'
  const [localSearch, setLocalSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [sortBy, setSortBy] = useState('totalQty'); // totalQty | totalRevenue | orderCount | lastOrderedAt
  const [sortDir, setSortDir] = useState('desc');

  // Client-side search filter (instant, no server round-trip)
  const filtered = useMemo(() => {
    const q = localSearch.trim().toLowerCase();
    const list = q
      ? groups.filter(g => g.productName.toLowerCase().includes(q))
      : groups;

    return [...list].sort((a, b) => {
      let av = a[sortBy], bv = b[sortBy];
      if (sortBy === 'lastOrderedAt') {
        av = av ? new Date(av).getTime() : 0;
        bv = bv ? new Date(bv).getTime() : 0;
      }
      return sortDir === 'desc' ? bv - av : av - bv;
    });
  }, [groups, localSearch, sortBy, sortDir]);

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSort = (field) => {
    if (sortBy === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <span style={{ color: '#d1d5db', marginLeft: 3 }}>↕</span>;
    return <span style={{ color: '#3730a3', marginLeft: 3 }}>{sortDir === 'desc' ? '↓' : '↑'}</span>;
  };

  const colHeader = (label, field) => (
    <div
      className="body-title"
      onClick={() => handleSort(field)}
      style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: 2 }}
    >
      {label}<SortIcon field={field} />
    </div>
  );

  const exportProductsToExcel = async () => {
    const rows = filtered.map((group) => ({
      "Бүтээгдэхүүний ID": group.productId,
      "Бүтээгдэхүүн": group.productName,
      "Захиалгын тоо": group.orderCount,
      "Нийт ширхэг": group.totalQty,
      "Орлого": group.totalRevenue,
      "Сүүлд захиалсан": formatDate(group.lastOrderedAt),
      "Вариант SKU": group.variantSkus.join(", "),
    }));

    const date = new Date().toISOString().slice(0, 10);
    await exportToExcel(rows, `product-orders-paid-successful-${date}`);
  };

  const exportUsersToExcel = async () => {
    const rows = userGroups.map((group) => ({
      "Хэрэглэгчийн ID": group.userId,
      "Нэр": group.customerName,
      "И-мэйл": group.email,
      "Утас": group.phone,
      "Захиалгын тоо": group.orderCount,
      "Нийт ширхэг": group.totalQty,
      "Нийт дүн": group.totalSpent,
      "Сүүлд захиалсан": formatDate(group.lastOrderedAt),
    }));

    const date = new Date().toISOString().slice(0, 10);
    await exportToExcel(rows, `product-orders-users-paid-successful-${date}`);
  };

  useEffect(() => {
    const handler = () => {
      if (activeTab === 'users') {
        void exportUsersToExcel();
        return;
      }
      void exportProductsToExcel();
    };

    window.addEventListener('export-product-orders-excel', handler);
    return () => window.removeEventListener('export-product-orders-excel', handler);
  }, [activeTab, filtered, userGroups]);

  return (
    <div>
      {/* ── Tab switcher ── */}
      <div style={{
        display: 'flex', gap: '4px', marginBottom: '24px',
        borderBottom: '2px solid #e5e7eb', paddingBottom: '0',
      }}>
        {[
          { key: 'products', label: '📦 Бүтээгдэхүүнээр' },
          { key: 'users',    label: '👤 Хэрэглэгчээр' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '9px 18px',
              fontSize: '13px',
              fontWeight: activeTab === tab.key ? 700 : 500,
              color: activeTab === tab.key ? '#3730a3' : '#6b7280',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid #3730a3' : '2px solid transparent',
              marginBottom: '-2px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => { if (activeTab !== tab.key) e.currentTarget.style.color = '#374151'; }}
            onMouseLeave={(e) => { if (activeTab !== tab.key) e.currentTarget.style.color = '#6b7280'; }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Users tab ── */}
      {activeTab === 'users' && <UserGroupsTable userGroups={userGroups || []} />}

      {/* ── Products tab ── */}
      {activeTab === 'products' && <div>
      {/* ── Stats row ── */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <StatCard label="Бүтээгдэхүүн" value={stats.totalProducts} sub="захиалагдсан" />
        <StatCard label="Нийт тоо" value={`${stats.totalUnits.toLocaleString()} ш`} sub="нийт ширхэг" />
        <StatCard label="Нийт орлого" value={formatCurrency(stats.totalRevenue)} sub="бүх захиалгын дүн" />
        <StatCard label="Хайлтын үр дүн" value={filtered.length} sub={`/ ${groups.length} бүтээгдэхүүн`} />
      </div>

      {/* ── Client-side search ── */}
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ position: 'relative', flex: '0 0 300px' }}>
          <input
            type="text"
            placeholder="Бүтээгдэхүүний нэрээр шүүх..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            style={{
              width: '100%', padding: '7px 36px 7px 12px',
              borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '13px', outline: 'none',
            }}
            onFocus={(e) => e.target.style.borderColor = '#3730a3'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
          {localSearch && (
            <button
              onClick={() => setLocalSearch('')}
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '14px' }}
            >✕</button>
          )}
        </div>
        <span style={{ fontSize: '13px', color: '#6b7280' }}>{filtered.length} бүтээгдэхүүн</span>
      </div>

      {/* ── Table ── */}
      <div className="wg-table table-all-category">
        {/* Table header */}
        <ul className="table-title flex gap20 mb-14" style={{ alignItems: 'center' }}>
          <li style={{ width: '36px', flexShrink: 0 }} />
          <li style={{ flex: '2 1 200px' }}>
            <div className="body-title">Бүтээгдэхүүн</div>
          </li>
          <li style={{ flex: '1 1 80px', minWidth: 80 }}>
            {colHeader('Захиалга', 'orderCount')}
          </li>
          <li style={{ flex: '1 1 80px', minWidth: 80 }}>
            {colHeader('Нийт ш', 'totalQty')}
          </li>
          <li style={{ flex: '1 1 120px', minWidth: 100 }}>
            {colHeader('Орлого', 'totalRevenue')}
          </li>
          <li style={{ flex: '1 1 120px', minWidth: 100 }}>
            {colHeader('Сүүлд захиалсан', 'lastOrderedAt')}
          </li>
          <li style={{ flex: '1 1 120px', minWidth: 100 }}>
            <div className="body-title">Вариант</div>
          </li>
        </ul>

        {/* Table rows */}
        <ul className="flex flex-column">
          {filtered.length === 0 && (
            <li style={{ padding: '32px 0', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
              Бүтээгдэхүүн олдсонгүй.
            </li>
          )}
          {filtered.map((group) => {
            const isExpanded = expandedIds.has(group.productId);
            return (
              <li
                key={group.productId}
                style={{
                  borderBottom: '1px solid #f3f4f6',
                  transition: 'background 0.1s',
                }}
              >
                {/* Product row */}
                <div
                  className="product-item gap14"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    padding: '12px 0',
                    cursor: 'pointer',
                    background: isExpanded ? '#f8f9ff' : 'transparent',
                  }}
                  onClick={() => toggleExpand(group.productId)}
                  onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = '#fafafa'; }}
                  onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
                >
                  {/* Expand chevron */}
                  <div style={{
                    width: '36px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#9ca3af', fontSize: '13px', transition: 'transform 0.2s',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  }}>
                    ▶
                  </div>

                  {/* Product image + name */}
                  <div style={{ flex: '2 1 200px', display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0,
                      backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb',
                    }}>
                      <img
                        src={resolveImageUrl(group.imageUrl)}
                        alt={group.productName}
                        onError={(e) => { e.target.src = '/images/products/1.png'; }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="body-text" style={{ fontWeight: 600, color: '#111827', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {group.productName}
                      </div>
                      <div className="text-tiny" style={{ color: '#6b7280', fontSize: '11px', marginTop: '1px' }}>
                        ID #{group.productId}
                      </div>
                    </div>
                  </div>

                  {/* Order count */}
                  <div style={{ flex: '1 1 80px', minWidth: 80 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      minWidth: '32px', height: '24px', padding: '0 8px',
                      borderRadius: '6px', fontSize: '13px', fontWeight: 700,
                      backgroundColor: '#eff6ff', color: '#1e40af',
                    }}>
                      {group.orderCount}
                    </span>
                  </div>

                  {/* Total qty */}
                  <div style={{ flex: '1 1 80px', minWidth: 80 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      minWidth: '36px', height: '24px', padding: '0 8px',
                      borderRadius: '6px', fontSize: '13px', fontWeight: 700,
                      backgroundColor: '#f0fdf4', color: '#166534',
                    }}>
                      {group.totalQty} ш
                    </span>
                  </div>

                  {/* Revenue */}
                  <div style={{ flex: '1 1 120px', minWidth: 100 }}>
                    <span className="body-text" style={{ fontWeight: 600, color: '#111827', fontSize: '13px' }}>
                      {formatCurrency(group.totalRevenue)}
                    </span>
                  </div>

                  {/* Last ordered */}
                  <div style={{ flex: '1 1 120px', minWidth: 100 }}>
                    <span className="text-tiny" style={{ color: '#6b7280', fontSize: '12px' }}>
                      {formatDate(group.lastOrderedAt)}
                    </span>
                  </div>

                  {/* Variants */}
                  <div style={{ flex: '1 1 120px', minWidth: 100, display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {group.variantSkus.length > 0
                      ? group.variantSkus.slice(0, 3).map(sku => (
                          <span key={sku} style={{
                            padding: '2px 7px', borderRadius: '4px', fontSize: '11px',
                            backgroundColor: '#f3f4f6', color: '#374151', fontWeight: 500,
                          }}>{sku}</span>
                        ))
                      : <span style={{ color: '#d1d5db', fontSize: '12px' }}>—</span>
                    }
                    {group.variantSkus.length > 3 && (
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>+{group.variantSkus.length - 3}</span>
                    )}
                  </div>
                </div>

                {/* Expanded orders sub-table */}
                {isExpanded && <ExpandedOrders orders={group.orders} />}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Footer note */}
      {groups.length > 0 && (
        <div style={{ marginTop: '16px', fontSize: '12px', color: '#9ca3af', textAlign: 'right' }}>
          Нийт {groups.length} бүтээгдэхүүн · 500 захиалга хүртэл харуулж байна
        </div>
      )}
      </div>}
    </div>
  );
}
