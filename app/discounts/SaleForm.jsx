"use client";
import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import ProductCombobox from "@/components/ProductCombobox";
import { createProductSale } from "@/lib/api/campaigns";
import { formatUB, ubLocalInputToDate, ubNowLocalInput } from "@/lib/ubTime";

const QUICK_PCTS = [10, 15, 20, 30, 50];

const inputStyle = {
  padding: '8px 12px',
  border: '1px solid #e2e8f0',
  borderRadius: 6,
  fontSize: 14,
};

const labelStyle = { display: 'block', marginBottom: 6 };

/**
 * A "new price" entry is converted to a percentage before it is stored, so the
 * discount scales correctly across variants that are priced differently and the
 * badge percentage on the storefront is always exact.
 */
function priceToPercent(basePrice, targetPrice) {
  if (!basePrice || !targetPrice) return null;
  return ((basePrice - targetPrice) / basePrice) * 100;
}

export default function SaleForm({ token: serverToken }) {
  const { data: session } = useSession();
  const token = serverToken || session?.user?.accessToken;

  const [product, setProduct] = useState(null);
  const [mode, setMode] = useState('percent'); // 'percent' | 'price'
  const [percent, setPercent] = useState(20);
  const [newPrice, setNewPrice] = useState('');
  const [startNow, setStartNow] = useState(true);
  const [startAt, setStartAt] = useState('');
  const [hasEnd, setHasEnd] = useState(false);
  const [endAt, setEndAt] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const basePrice = product ? Number(product.price) : 0;

  const effectivePercent =
    mode === 'percent'
      ? Number(percent)
      : priceToPercent(basePrice, Number(newPrice));

  const previewPrice =
    effectivePercent > 0 ? Math.round(basePrice * (1 - effectivePercent / 100)) : null;

  const variantsDiffer =
    product?.priceRange && product.priceRange.min !== product.priceRange.max;

  const reset = () => {
    setProduct(null);
    setPercent(20);
    setNewPrice('');
    setHasEnd(false);
    setEndAt('');
    setStartNow(true);
    setStartAt('');
  };

  const handleSubmit = () => {
    setError(null);

    if (!product) {
      setError('Бараа сонгоно уу');
      return;
    }
    if (!(effectivePercent > 0) || effectivePercent >= 100) {
      setError(
        mode === 'percent'
          ? 'Хямдрал 1–99% хооронд байх ёстой'
          : 'Шинэ үнэ хуучин үнээс бага, 0-ээс их байх ёстой'
      );
      return;
    }
    if (!startNow && !startAt) {
      setError('Эхлэх огноог сонгоно уу');
      return;
    }
    if (hasEnd && !endAt) {
      setError('Дуусах огноог сонгоно уу');
      return;
    }
    // Entered times are Ulaanbaatar wall clock, never the browser's timezone.
    const startInstant = startNow ? null : ubLocalInputToDate(startAt);
    const endInstant = hasEnd ? ubLocalInputToDate(endAt) : null;

    if (!startNow && !startInstant) {
      setError('Эхлэх огноо буруу байна');
      return;
    }
    if (hasEnd && !endInstant) {
      setError('Дуусах огноо буруу байна');
      return;
    }
    if (endInstant && endInstant <= (startInstant ?? new Date())) {
      setError('Дуусах огноо эхлэх огнооноос хойш байх ёстой');
      return;
    }

    startTransition(async () => {
      try {
        await createProductSale(
          {
            productId: product.id,
            discountPercent: Number(effectivePercent.toFixed(4)),
            name: `Хямдрал — ${product.name}`,
            startDate: startInstant ? startInstant.toISOString() : undefined,
            endDate: endInstant ? endInstant.toISOString() : undefined,
          },
          token
        );
        setSuccess(true);
        setTimeout(() => window.location.reload(), 1200);
      } catch (e) {
        setError(e.message);
      }
    });
  };

  if (success) {
    return (
      <div className="wg-box">
        <div style={{ color: '#10b981', fontWeight: 600, fontSize: 16 }}>
          ✓ Хямдрал амжилттай тохирлоо! Хуудас шинэчлэгдэж байна...
        </div>
      </div>
    );
  }

  return (
    <div className="wg-box">
      <h4 className="text-title mb-20">Шинэ хямдрал</h4>

      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 16,
            color: '#b91c1c',
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      <div className="flex flex-column gap20">
        <div>
          <label className="body-title" style={labelStyle}>Бараа сонгох</label>
          <ProductCombobox value={product} onSelect={setProduct} />
        </div>

        <div>
          <label className="body-title" style={labelStyle}>Хямдрал</label>
          <div className="flex gap10" style={{ marginBottom: 12 }}>
            {[
              { key: 'percent', label: 'Хувиар (%)' },
              { key: 'price', label: 'Шинэ үнээр (₮)' },
            ].map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMode(m.key)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  background: mode === m.key ? '#3b82f6' : '#f1f5f9',
                  color: mode === m.key ? 'white' : '#374151',
                  fontWeight: mode === m.key ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {mode === 'percent' ? (
            <div className="flex gap10" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="number"
                value={percent}
                min={1}
                max={99}
                onChange={(e) => setPercent(e.target.value)}
                style={{ ...inputStyle, width: 100 }}
              />
              {QUICK_PCTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPercent(p)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid #e2e8f0',
                    background: Number(percent) === p ? '#eff6ff' : 'white',
                    color: '#374151',
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  {p}%
                </button>
              ))}
            </div>
          ) : (
            <input
              type="number"
              value={newPrice}
              min={0}
              placeholder="Шинэ үнэ"
              onChange={(e) => setNewPrice(e.target.value)}
              style={{ ...inputStyle, width: 180 }}
            />
          )}
        </div>

        <div className="flex gap20" style={{ flexWrap: 'wrap' }}>
          <div>
            <label className="body-title" style={labelStyle}>
              Эхлэх <span style={{ color: '#9ca3af', fontWeight: 400 }}>(УБ цаг)</span>
            </label>
            <div className="flex gap10" style={{ alignItems: 'center' }}>
              <label style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="checkbox"
                  checked={startNow}
                  onChange={(e) => setStartNow(e.target.checked)}
                />
                Одооноос
              </label>
              {!startNow && (
                <input
                  type="datetime-local"
                  value={startAt}
                  min={ubNowLocalInput()}
                  onChange={(e) => setStartAt(e.target.value)}
                  style={inputStyle}
                />
              )}
            </div>
          </div>

          <div>
            <label className="body-title" style={labelStyle}>
              Дуусах <span style={{ color: '#9ca3af', fontWeight: 400 }}>(УБ цаг)</span>
            </label>
            <div className="flex gap10" style={{ alignItems: 'center' }}>
              <label style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="checkbox"
                  checked={!hasEnd}
                  onChange={(e) => setHasEnd(!e.target.checked)}
                />
                Тодорхойгүй
              </label>
              {hasEnd && (
                <input
                  type="datetime-local"
                  value={endAt}
                  min={startAt || ubNowLocalInput()}
                  onChange={(e) => setEndAt(e.target.value)}
                  style={inputStyle}
                />
              )}
            </div>
          </div>
        </div>

        {variantsDiffer && mode === 'price' && (
          <div
            style={{
              background: '#fffbeb',
              border: '1px solid #fcd34d',
              borderRadius: 8,
              padding: '12px 16px',
              fontSize: 13,
              color: '#92400e',
            }}
          >
            ⚠ Энэ барааны хувилбарууд өөр өөр үнэтэй (
            {Number(product.priceRange.min).toLocaleString()}₮ –{' '}
            {Number(product.priceRange.max).toLocaleString()}₮). Оруулсан шинэ үнэ
            үндсэн хувилбарт тооцогдож, бусад хувилбарт ижил хувиар хямдарна.
          </div>
        )}

        {product && previewPrice !== null && (
          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: 8,
              padding: '12px 16px',
              fontSize: 15,
            }}
          >
            <span style={{ textDecoration: 'line-through', color: '#6b7280' }}>
              {basePrice.toLocaleString()}₮
            </span>{' '}
            → <strong>{previewPrice.toLocaleString()}₮</strong>{' '}
            <span style={{ color: '#dc2626', fontWeight: 600 }}>
              (−{Math.round(effectivePercent)}%)
            </span>
            <div style={{ color: '#4d7c0f', fontSize: 12, marginTop: 6 }}>
              {startNow ? 'Одооноос' : `${formatUB(ubLocalInputToDate(startAt))}-с`}
              {' '}
              {hasEnd ? `${formatUB(ubLocalInputToDate(endAt))} хүртэл` : 'хугацаагүй'}
              {' · Улаанбаатарын цагаар'}
            </div>
          </div>
        )}

        <div className="flex gap10">
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="tf-button"
            style={{ opacity: isPending ? 0.7 : 1 }}
          >
            {isPending ? 'Хадгалж байна...' : '🏷️ Хямдрал тохируулах'}
          </button>
          {product && (
            <button
              type="button"
              onClick={reset}
              style={{
                background: 'none',
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                padding: '0 16px',
                cursor: 'pointer',
                color: '#6b7280',
                fontSize: 14,
              }}
            >
              Цуцлах
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
