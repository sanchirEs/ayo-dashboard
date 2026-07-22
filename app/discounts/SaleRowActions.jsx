"use client";
import { useState, useTransition } from "react";
import { endProductSale, deleteCampaign } from "@/lib/api/campaigns";

const btn = {
  background: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 12,
  padding: '4px 10px',
};

export default function SaleRowActions({ sale, token, onChanged }) {
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();

  const isEnded = new Date(sale.endDate) <= new Date();

  const run = (fn) =>
    startTransition(async () => {
      setError(null);
      try {
        await fn();
        onChanged?.();
      } catch (e) {
        setError(e.message);
      }
    });

  return (
    <div className="flex gap10" style={{ alignItems: 'center' }}>
      {!isEnded && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            if (!confirm('Энэ хямдралыг зогсоох уу?')) return;
            run(() => endProductSale(sale.id, token));
          }}
          style={{ ...btn, border: '1px solid #fcd34d', color: '#b45309' }}
        >
          {isPending ? '...' : 'Зогсоох'}
        </button>
      )}
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (!confirm('Энэ хямдралыг устгах уу?')) return;
          run(() => deleteCampaign(sale.id, token));
        }}
        style={{ ...btn, border: '1px solid #fca5a5', color: '#ef4444' }}
      >
        {isPending ? '...' : 'Устгах'}
      </button>
      {error && <span style={{ color: '#b91c1c', fontSize: 11 }}>{error}</span>}
    </div>
  );
}
