"use client";
import { useState, Fragment } from "react";

function statusBadge(stats = {}) {
  const pending = stats.PENDING || 0;
  const sent = stats.SENT || 0;
  const failed = stats.FAILED || 0;

  if (pending > 0) return <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>Дарагдаж байна</span>;
  if (failed > 0 && sent === 0) return <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>Амжилтгүй</span>;
  if (failed > 0) return <span style={{ background: '#f3f4f6', color: '#374151', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>Хэсэгчилсэн</span>;
  return <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>Дууссан</span>;
}

export default function BroadcastHistory({ broadcasts, onRefresh }) {
  const [expandedId, setExpandedId] = useState(null);

  if (broadcasts.length === 0) {
    return (
      <div className="wg-box text-center" style={{ fontSize: 14, color: '#9ca3af' }}>
        Илгээсэн мессеж байхгүй байна
      </div>
    );
  }

  return (
    <div className="wg-box">
      <div className="flex items-center justify-between mb-16">
        <h6 className="mb-0">Илгээсэн мессежийн түүх</h6>
        <button type="button" className="tf-button style-2 btn-sm" onClick={onRefresh}>
          Шинэчлэх
        </button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ fontSize: 13 }}>
          <thead>
            <tr>
              <th>Гарчиг</th>
              <th>Огноо</th>
              <th>Мессеж</th>
              <th>Хүлээн авагч</th>
              <th>Явсан</th>
              <th>Амжилтгүй</th>
              <th>Төлөв</th>
            </tr>
          </thead>
          <tbody>
            {broadcasts.map((b) => (
              <Fragment key={b.id}>
                <tr
                  style={{ cursor: 'pointer' }}
                  onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}
                >
                  <td style={{ fontWeight: 600 }}>{b.title}</td>
                  <td>{new Date(b.createdAt).toLocaleString('mn-MN', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.message}
                  </td>
                  <td>{b.targetCount}</td>
                  <td style={{ color: '#15803d', fontWeight: 600 }}>{b.stats?.SENT || 0}</td>
                  <td style={{ color: (b.stats?.FAILED || 0) > 0 ? '#dc2626' : 'inherit' }}>
                    {b.stats?.FAILED || 0}
                  </td>
                  <td>{statusBadge(b.stats)}</td>
                </tr>
                {expandedId === b.id && (
                  <tr>
                    <td colSpan={7} style={{ background: '#f9fafb', padding: '12px 16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, fontSize: 13, marginBottom: 8 }}>
                        <span><strong>Нийт:</strong> {b.targetCount}</span>
                        <span style={{ color: '#6b7280' }}><strong>Орхигдсон (утасгүй):</strong> {b.skippedCount}</span>
                        <span style={{ color: '#15803d' }}><strong>Явсан:</strong> {b.stats?.SENT || 0}</span>
                        <span style={{ color: '#6b7280' }}><strong>Хүлээгдэж байна:</strong> {b.stats?.PENDING || 0}</span>
                        <span style={{ color: '#d97706' }}><strong>Хязгаарлагдсан:</strong> {b.stats?.RATE_LIMITED || 0}</span>
                        <span style={{ color: '#dc2626' }}><strong>Амжилтгүй:</strong> {b.stats?.FAILED || 0}</span>
                      </div>
                      <div style={{ fontSize: 13, color: '#374151', background: '#fff', padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e7eb' }}>
                        {b.message}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
