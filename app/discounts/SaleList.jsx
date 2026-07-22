"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { getProductSales, isOpenEnded } from "@/lib/api/campaigns";
import { resolveImageUrl } from "@/lib/api/env";
import { formatUB } from "@/lib/ubTime";
import SaleRowActions from "./SaleRowActions";

const TABS = [
  { key: 'live', label: 'Идэвхтэй' },
  { key: 'scheduled', label: 'Товлосон' },
  { key: 'ended', label: 'Дууссан' },
];

const th = { textAlign: 'left', padding: '10px 12px', fontSize: 12, color: '#6b7280', fontWeight: 600 };
const td = { padding: '10px 12px', fontSize: 13, color: '#374151', verticalAlign: 'middle' };

// Always Ulaanbaatar, never the viewing machine's timezone — the form stores
// what the admin typed as UB wall clock, so the list must read it back the same.
const formatDate = formatUB;

export default function SaleList({ token: serverToken }) {
  const { data: session } = useSession();
  const token = serverToken || session?.user?.accessToken;

  const [tab, setTab] = useState('live');
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    getProductSales(token, { status: tab })
      .then(setSales)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, tab]);

  useEffect(load, [load]);

  return (
    <div className="wg-box" style={{ marginTop: 20 }}>
      <div className="flex items-center justify-between gap10 flex-wrap mb-20">
        <h4 className="text-title">
          Хямдралууд{' '}
          <span style={{ color: '#9ca3af', fontSize: 12, fontWeight: 400 }}>
            (Улаанбаатарын цагаар)
          </span>
        </h4>
        <div className="flex gap10">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                background: tab === t.key ? '#3b82f6' : '#f1f5f9',
                color: tab === t.key ? 'white' : '#374151',
                fontWeight: tab === t.key ? 600 : 400,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ color: '#b91c1c', fontSize: 14, padding: '12px 0' }}>{error}</div>
      )}

      {loading ? (
        <div style={{ color: '#9ca3af', fontSize: 14, padding: '20px 0' }}>Ачааллаж байна...</div>
      ) : sales.length === 0 ? (
        <div style={{ color: '#9ca3af', fontSize: 14, padding: '20px 0' }}>
          {tab === 'live' ? 'Идэвхтэй хямдрал алга' : 'Бичлэг алга'}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <th style={th}>Бараа</th>
                <th style={th}>Үнэ</th>
                <th style={th}>Хямдрал</th>
                <th style={th}>Эхэлсэн</th>
                <th style={th}>Дуусах</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => {
                const product = sale.products?.[0]?.product;
                const basePrice = Number(product?.price ?? 0);
                const pct = Number(sale.discountValue);
                const salePrice = Math.round(basePrice * (1 - pct / 100));
                const imageUrl = product?.ProductImages?.[0]?.imageUrl;

                return (
                  <tr key={sale.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={td}>
                      <div className="flex" style={{ alignItems: 'center', gap: 10 }}>
                        {imageUrl ? (
                          <img
                            src={resolveImageUrl(imageUrl)}
                            alt={product?.name || ''}
                            style={{ width: 36, height: 36, borderRadius: 4, objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ width: 36, height: 36, borderRadius: 4, background: '#f1f5f9' }} />
                        )}
                        <div>
                          <div style={{ fontWeight: 600, color: '#111827' }}>
                            {product?.name || sale.name}
                          </div>
                          {product?.sku && (
                            <div style={{ fontSize: 11, color: '#9ca3af' }}>SKU: {product.sku}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={td}>
                      <span style={{ textDecoration: 'line-through', color: '#9ca3af' }}>
                        {basePrice.toLocaleString()}₮
                      </span>
                      <br />
                      <strong>{salePrice.toLocaleString()}₮</strong>
                    </td>
                    <td style={td}>
                      <span
                        style={{
                          background: '#fee2e2',
                          color: '#dc2626',
                          borderRadius: 4,
                          padding: '2px 8px',
                          fontWeight: 600,
                          fontSize: 12,
                        }}
                      >
                        −{Math.round(pct)}%
                      </span>
                    </td>
                    <td style={td}>{formatDate(sale.startDate)}</td>
                    <td style={td}>
                      {isOpenEnded(sale.endDate) ? (
                        <span style={{ color: '#6b7280' }}>Тодорхойгүй</span>
                      ) : (
                        formatDate(sale.endDate)
                      )}
                    </td>
                    <td style={td}>
                      <SaleRowActions sale={sale} token={token} onChanged={load} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
