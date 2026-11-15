"use client";

/**
 * The whole receipt, drawn like the 80 mm slip the till prints, so an owner reads it the
 * way they read paper: header, items, totals, how it was paid, then everything that
 * happened to it afterwards (refunds, voids), whatever the report's date range.
 */

import { useEffect, useRef, useState } from "react";
import { C } from "@/components/pos/ui";
import { fetchLedgerReceipt } from "@/lib/api/reports";
import { cellText, columnOf, METHOD_LABELS } from "@/lib/reports/ledgerColumns";

const money = (v) => (v === null || v === undefined ? "" : Math.round(Number(v)).toLocaleString("en-US"));
const when = (v) => cellText(columnOf("receipts", "occurredAt"), v);
const vat = (v) => cellText(columnOf("receipts", "vatCalculated"), v ?? 0);

function Row({ label, value, strong, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontWeight: strong ? 700 : 400, color: color || C.text, padding: "2px 0" }}>
      <span>{label}</span>
      <span style={{ whiteSpace: "nowrap" }}>{value}</span>
    </div>
  );
}

const rule = { borderTop: `1px dashed #cbd5e1`, margin: "12px 0" };

export default function ReceiptPanel({ saleId, token, rangeEnd, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const closeRef = useRef(null);

  useEffect(() => {
    let live = true;
    setData(null);
    setError(null);
    fetchLedgerReceipt(saleId, token).then((d) => live && setData(d)).catch((e) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [saleId, token]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const s = data?.sale;
  const voided = s?.status === "VOIDED";

  return (
    <div role="dialog" aria-modal="true" aria-label="Баримт" style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, backgroundColor: "rgba(17,24,39,.35)" }} />
      <aside
        style={{
          position: "relative", width: "min(460px, 100vw)", height: "100%", overflowY: "auto", backgroundColor: "#eef1f5",
          padding: "20px 20px 40px", boxShadow: "-12px 0 32px rgba(17,24,39,.18)", animation: "ledgerSlide .18s ease-out",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 14, color: C.muted }}>Баримт</span>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Хаах" style={{ border: `1px solid ${C.line}`, background: "#fff", borderRadius: 6, height: 32, padding: "0 12px", fontSize: 13, cursor: "pointer" }}>
            Хаах
          </button>
        </div>

        {error && <p style={{ color: C.red, fontSize: 14 }}>{error}</p>}
        {!data && !error && <p style={{ color: C.muted, fontSize: 14 }}>Ачаалж байна…</p>}

        {s && (
          <article
            style={{
              backgroundColor: "#fff", padding: "22px 22px 26px", fontSize: 13, lineHeight: "19px", color: C.text,
              fontVariantNumeric: "tabular-nums", boxShadow: "0 1px 2px rgba(17,24,39,.08)",
              // The torn edge of a till roll.
              maskImage: "linear-gradient(135deg, transparent 6px, #000 0) bottom left / 12px 12px repeat-x, linear-gradient(#000, #000) top / 100% calc(100% - 6px) no-repeat",
              WebkitMaskImage: "linear-gradient(135deg, transparent 6px, #000 0) bottom left / 12px 12px repeat-x, linear-gradient(#000, #000) top / 100% calc(100% - 6px) no-repeat",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>{s.locationName}</div>
              <div style={{ color: C.muted }}>{[s.registerName, s.cashierName].filter(Boolean).join(", ")}</div>
              <div style={{ marginTop: 6, fontSize: 15, fontWeight: 600 }}>{s.saleNumber}</div>
              <div style={{ color: C.muted }}>{when(s.occurredAt)}</div>
              {voided && (
                <div style={{ marginTop: 8, display: "inline-block", padding: "2px 10px", border: `2px solid ${C.red}`, color: C.red, fontWeight: 700, transform: "rotate(-4deg)" }}>
                  ХҮЧИНГҮЙ
                </div>
              )}
            </div>

            <div style={rule} />
            {data.lines.map((l) => (
              <div key={l.lineId} style={{ padding: "4px 0" }}>
                <div style={{ fontWeight: 500 }}>{l.productName}</div>
                <Row label={<span style={{ color: C.muted }}>{l.qty} × {money(l.unitPrice)}{l.sku ? `  ·  ${l.sku}` : ""}</span>} value={money(l.lineTotal)} />
                {(l.campaignDiscount > 0 || l.manualDiscount > 0 || l.cartDiscountShare > 0) && (
                  <div style={{ color: C.muted, fontSize: 12 }}>
                    {[
                      l.campaignDiscount > 0 && `Хямдрал −${money(l.campaignDiscount)}${l.campaignName ? ` (${l.campaignName})` : ""}`,
                      l.manualDiscount > 0 && `Гар хөнгөлөлт −${money(l.manualDiscount)}${l.discountApprovedByName ? `, зөвшөөрсөн ${l.discountApprovedByName}` : ""}`,
                      l.cartDiscountShare > 0 && `Сагсны хөнгөлөлт −${money(l.cartDiscountShare)}`,
                    ].filter(Boolean).join("; ")}
                  </div>
                )}
                {l.qtyReturned > 0 && <div style={{ color: C.red, fontSize: 12 }}>Буцаасан {l.qtyReturned} ш, {money(l.refunded)}</div>}
              </div>
            ))}

            <div style={rule} />
            <Row label="Үндсэн үнээр" value={money(s.listTotal)} />
            {s.campaignDiscount > 0 && <Row label="Хямдрал" value={`−${money(s.campaignDiscount)}`} />}
            {s.manualDiscount > 0 && <Row label="Гар хөнгөлөлт" value={`−${money(s.manualDiscount)}`} />}
            {s.cargo > 0 && <Row label="Карго" value={money(s.cargo)} />}
            <Row label="Нийт" value={money(s.total)} strong />
            <Row label="НӨАТ (баримтад)" value={vat(s.vatCharged)} color={C.muted} />
            <Row label="НӨАТ (тооцоолсон 1/11)" value={vat(s.vatCalculated)} color={C.muted} />
            {s.profit !== null && <Row label="Ашиг" value={money(s.profit)} color={C.muted} />}

            <div style={rule} />
            {data.payments.filter((p) => !p.returnId).map((p) => (
              <Row key={p.id} label={`${METHOD_LABELS[p.method] ?? p.method}${p.reference ? ` (${p.reference})` : ""}`} value={money(p.amount)} />
            ))}
            {s.tendered > 0 && <Row label="Өгсөн бэлэн" value={money(s.tendered)} color={C.muted} />}
            {s.change > 0 && <Row label="Хариулт" value={money(s.change)} color={C.muted} />}

            <div style={rule} />
            <Row label="Худалдан авагч" value={[s.customerName, s.customerPhone].filter(Boolean).join(", ") || "—"} />
            {s.receiptType === "COMPANY" && <Row label="Байгууллага" value={[s.buyerName, s.buyerTin].filter(Boolean).join(", ")} />}
            <Row label="И-баримт" value={cellText(columnOf("receipts", "ebarimtStatus"), s.ebarimtStatus)} />
            {s.receivedAt && s.receivedAt !== s.occurredAt && <Row label="Серверт ирсэн" value={when(s.receivedAt)} color={C.muted} />}
            {s.flags && <Row label="Тэмдэглэгээ" value={s.flags} color={C.amber} />}
            {s.note && <div style={{ marginTop: 6, color: C.muted }}>“{s.note}”</div>}
          </article>
        )}

        {data && data.returns.length > 0 && (
          <section style={{ marginTop: 18 }}>
            <h3 style={{ fontSize: 14, margin: "0 0 8px", color: C.text }}>Дараа нь болсон</h3>
            {data.returns.map((r) => {
              const after = rangeEnd && new Date(r.occurredAt) >= rangeEnd;
              return (
                <div key={r.id} style={{ backgroundColor: "#fff", borderLeft: `3px solid ${C.red}`, padding: "10px 12px", marginBottom: 8, fontSize: 13 }}>
                  <Row label={<strong>{r.kind === "VOID" ? "Хүчингүй болгосон" : "Буцаалт"}</strong>} value={`−${money(r.total)}`} color={C.red} />
                  <div style={{ color: C.muted }}>
                    {when(r.occurredAt)}
                    {r.cashierName ? `, ${r.cashierName}` : ""}
                    {r.approvedByName ? `, зөвшөөрсөн ${r.approvedByName}` : ""}
                    {after ? ", хугацааны дараа" : ""}
                  </div>
                  {r.lines.map((l, i) => (
                    <div key={i} style={{ marginTop: 4 }}>
                      {l.name} × {l.qty}, {money(l.refundAmount)}. {l.reason}{l.restock ? "" : " (тавиурт буцаагүй)"}
                    </div>
                  ))}
                  {data.payments.filter((p) => p.returnId === r.id).map((p) => (
                    <div key={p.id} style={{ color: C.muted }}>Буцааж өгсөн: {METHOD_LABELS[p.method] ?? p.method} {money(-p.amount)}</div>
                  ))}
                </div>
              );
            })}
          </section>
        )}
        <style>{`@keyframes ledgerSlide { from { transform: translateX(24px); opacity: .6 } to { transform: none; opacity: 1 } } @media (prefers-reduced-motion: reduce) { aside { animation: none !important } }`}</style>
      </aside>
    </div>
  );
}
