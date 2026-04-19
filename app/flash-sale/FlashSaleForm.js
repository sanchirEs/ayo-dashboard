"use client";
import { useState, useTransition } from "react";
import { createFlashSale, cancelFlashSale } from "@/lib/api/flashSale";
import { useSession } from "next-auth/react";

const DURATIONS = [
  { label: '10 минут', minutes: 10 },
  { label: '15 минут', minutes: 15 },
  { label: '20 минут', minutes: 20 },
  { label: '30 минут', minutes: 30 },
];

// mode="create" | mode="cancel"
export default function FlashSaleForm({ mode = "create", campaignId, token: serverToken }) {
  const { data: session } = useSession();
  const token = serverToken || session?.user?.accessToken;

  const [form, setForm] = useState({
    productId: '',
    startDate: '',
    startTime: '12:00',
    duration: 10,
    discountPct: 20
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = () => {
    setError(null);
    if (!form.productId || !form.startDate || !form.startTime) {
      setError('Бүх талбарыг бөглөнө үү');
      return;
    }
    startTransition(async () => {
      try {
        const start = new Date(`${form.startDate}T${form.startTime}:00`);
        const end = new Date(start.getTime() + form.duration * 60 * 1000);
        await createFlashSale({
          productId: Number(form.productId),
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          discountPct: Number(form.discountPct)
        }, token);
        setSuccess(true);
        setTimeout(() => window.location.reload(), 1200);
      } catch (e) {
        setError(e.message);
      }
    });
  };

  const handleCancel = () => {
    if (!confirm('Flash sale цуцлах уу?')) return;
    startTransition(async () => {
      try {
        await cancelFlashSale(campaignId, token);
        window.location.reload();
      } catch (e) {
        alert(e.message);
      }
    });
  };

  if (mode === 'cancel') {
    return (
      <button
        onClick={handleCancel}
        disabled={isPending}
        style={{
          background: 'none',
          border: '1px solid #fca5a5',
          borderRadius: 6,
          cursor: isPending ? 'not-allowed' : 'pointer',
          color: '#ef4444',
          fontSize: 12,
          padding: '4px 10px'
        }}
      >
        {isPending ? '...' : 'Cancel'}
      </button>
    );
  }

  if (success) {
    return (
      <div className="wg-box">
        <div style={{ color: '#10b981', fontWeight: 600, fontSize: 16 }}>
          ✓ Flash sale амжилттай үүслээ! Хуудас шинэчлэгдэж байна...
        </div>
      </div>
    );
  }

  const previewStart = form.startDate && form.startTime
    ? new Date(`${form.startDate}T${form.startTime}:00`)
    : null;
  const previewEnd = previewStart
    ? new Date(previewStart.getTime() + form.duration * 60 * 1000)
    : null;

  return (
    <div className="wg-box">
      <h4 className="text-title mb-20">New Flash Sale</h4>

      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fca5a5',
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 16,
          color: '#b91c1c',
          fontSize: 14
        }}>
          {error}
        </div>
      )}

      <div className="flex flex-column gap20">
        <div>
          <label className="body-title" style={{ display: 'block', marginBottom: 6 }}>
            Product ID
          </label>
          <input
            type="number"
            value={form.productId}
            onChange={e => set('productId', e.target.value)}
            placeholder="e.g. 123"
            style={{
              width: 200,
              padding: '8px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              fontSize: 14
            }}
          />
          <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>
            Products хуудаснаас ID-г олно уу
          </div>
        </div>

        <div className="flex gap20">
          <div>
            <label className="body-title" style={{ display: 'block', marginBottom: 6 }}>
              Date
            </label>
            <input
              type="date"
              value={form.startDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => set('startDate', e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14 }}
            />
          </div>
          <div>
            <label className="body-title" style={{ display: 'block', marginBottom: 6 }}>
              Start Time
            </label>
            <input
              type="time"
              value={form.startTime}
              onChange={e => set('startTime', e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14 }}
            />
          </div>
        </div>

        <div>
          <label className="body-title" style={{ display: 'block', marginBottom: 8 }}>
            Duration
          </label>
          <div className="flex gap10">
            {DURATIONS.map(d => (
              <button
                key={d.minutes}
                type="button"
                onClick={() => set('duration', d.minutes)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  background: form.duration === d.minutes ? '#3b82f6' : '#f1f5f9',
                  color: form.duration === d.minutes ? 'white' : '#374151',
                  fontWeight: form.duration === d.minutes ? 600 : 400,
                  transition: 'all 0.15s'
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="body-title" style={{ display: 'block', marginBottom: 6 }}>
            Discount %
          </label>
          <input
            type="number"
            value={form.discountPct}
            min={1}
            max={99}
            onChange={e => set('discountPct', Number(e.target.value))}
            style={{
              width: 100,
              padding: '8px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              fontSize: 14
            }}
          />
        </div>

        {previewStart && (
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: 8,
            padding: '12px 16px',
            fontSize: 14
          }}>
            <strong>Preview:</strong>{' '}
            {previewStart.toLocaleString('mn-MN')} → {previewEnd.toLocaleString('mn-MN')}
            {' '}({form.duration} мин, <strong>{form.discountPct}%</strong> хямдрал)
          </div>
        )}

        <div>
          <button
            onClick={handleCreate}
            disabled={isPending}
            className="tf-button"
            style={{ opacity: isPending ? 0.7 : 1 }}
          >
            {isPending ? 'Үүсгэж байна...' : '⚡ Schedule Flash Sale'}
          </button>
        </div>
      </div>
    </div>
  );
}
