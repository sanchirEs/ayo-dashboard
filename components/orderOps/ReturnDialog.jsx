"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { money, opsFetch } from "./shared";
import s from "./ops.module.css";

const METHODS = [
  ["BANK_TRANSFER", "Дансаар"],
  ["CASH", "Бэлнээр"],
  ["QPAY", "QPay"],
  ["STOREPAY", "StorePay"],
  ["POCKET", "Pocket"],
  ["OTHER", "Бусад"],
];

/** Records a customer return on one order: units back to stock and/or money back. */
export default function ReturnDialog({ open, onOpenChange, orderId, token, onRecorded }) {
  const [info, setInfo] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [qty, setQty] = useState({});
  const [restock, setRestock] = useState(true);
  const [locationId, setLocationId] = useState("");
  const [refund, setRefund] = useState("");
  const [refundTouched, setRefundTouched] = useState(false);
  const [method, setMethod] = useState("BANK_TRANSFER");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setInfo(null); setLoadError(null); setQty({}); setRefund(""); setRefundTouched(false);
    setNote(""); setError(null); setRestock(true);
    opsFetch(`/backoffice/order-ops/orders/${orderId}/returns`, token)
      .then((d) => {
        setInfo(d);
        const preferred = d.locations.find((l) => l.id === d.fulfillmentLocationId) || d.locations[0];
        setLocationId(preferred ? String(preferred.id) : "");
      })
      .catch((e) => setLoadError(e.message));
  }, [open, orderId, token]);

  const lines = useMemo(
    () => (info?.items || []).map((i) => ({ ...i, left: i.quantity - i.returned, chosen: qty[i.id] || 0 })),
    [info, qty]
  );
  const chosen = lines.filter((l) => l.chosen > 0);
  const room = info ? Math.max(0, info.paid - info.refunded) : 0;
  const suggested = Math.min(room, chosen.reduce((sum, l) => sum + l.price * l.chosen, 0));
  const refundValue = refundTouched ? Number(refund) || 0 : suggested;
  const anyStocked = chosen.some((l) => l.stocked);
  const canRestock = anyStocked && info?.locations?.length > 0;

  async function submit(e) {
    e.preventDefault();
    if (chosen.length === 0) { setError("Буцаах бараа, тоогоо сонгоно уу."); return; }
    if (refundValue > room) { setError(`Буцаан олгох дүн ${money(room)}-с хэтрэхгүй.`); return; }
    setSaving(true);
    setError(null);
    try {
      await opsFetch(`/backoffice/order-ops/orders/${orderId}/returns`, token, {
        method: "POST",
        body: JSON.stringify({
          lines: chosen.map((l) => ({ orderItemId: l.id, qty: l.chosen })),
          restock: Boolean(canRestock && restock),
          locationId: canRestock && restock ? Number(locationId) : null,
          refundAmount: refundValue,
          refundMethod: refundValue > 0 ? method : null,
          note: note.trim() || null,
        }),
      });
      onOpenChange(false);
      onRecorded?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0" style={{ maxWidth: 600, width: "95vw", maxHeight: "92vh", overflowY: "auto", borderRadius: 16 }}>
        <form className={s.dialog} onSubmit={submit}>
          <div>
            <DialogTitle asChild><h2 className={s.dialogTitle}>Буцаалт бүртгэх · #{orderId}</h2></DialogTitle>
            <DialogDescription asChild>
              <p className={s.dialogSub}>Хэрэглэгчээс буцаж ирсэн барааг сонгоно. Зарагдах боломжтойг нөөцөд буцаана, гэмтэлтэйг буцаахгүй.</p>
            </DialogDescription>
          </div>

          {loadError ? (
            <p className={s.err}>{loadError}</p>
          ) : !info ? (
            <div className={`${s.sk}`} style={{ height: 120 }} />
          ) : info.blockedReason ? (
            <div className={s.info}>{info.blockedReason}</div>
          ) : (
            <>
              <fieldset className={s.field} style={{ border: 0, padding: 0, margin: 0 }}>
                <legend className={s.fieldLabel} style={{ marginBottom: 6 }}>Бараа</legend>
                {lines.map((l) => (
                  <div key={l.id} className={s.lineRow}>
                    <div style={{ minWidth: 0 }}>
                      <div className={s.lineName}>{l.name}</div>
                      <div className={s.small}>
                        {l.quantity} авсан{l.returned ? `, ${l.returned} буцаасан` : ""} · {money(l.price)}
                        {!l.stocked && " · захиалгын бараа, нөөцөд орохгүй"}
                      </div>
                    </div>
                    <label htmlFor={`rq-${l.id}`} className={s.small}>Буцаах</label>
                    <input
                      id={`rq-${l.id}`}
                      className={`${s.input} ${s.qty}`}
                      type="number" inputMode="numeric" min={0} max={l.left} step={1}
                      value={l.chosen || ""}
                      placeholder="0"
                      disabled={l.left === 0}
                      onChange={(e) => {
                        const v = Math.max(0, Math.min(l.left, Math.floor(Number(e.target.value) || 0)));
                        setQty((q) => ({ ...q, [l.id]: v }));
                      }}
                    />
                  </div>
                ))}
              </fieldset>

              {anyStocked && (
                <div className={s.field}>
                  {info.locations.length === 0 ? (
                    <div className={s.info}>Нөөцийн системд холбогдсон салбар алга. Бараа нөөцөд буцахгүй.</div>
                  ) : (
                    <>
                      <label className={s.check}>
                        <input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} />
                        Зарагдах боломжтой. Нөөцөд буцаах
                      </label>
                      {restock && (
                        <select
                          aria-label="Аль салбарын нөөцөд"
                          className={s.select}
                          style={{ width: "100%" }}
                          value={locationId}
                          onChange={(e) => setLocationId(e.target.value)}
                        >
                          {info.locations.map((loc) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                        </select>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className={s.fieldRow}>
                <div className={s.field}>
                  <label className={s.fieldLabel} htmlFor="refund-amount">Буцаан олгосон дүн</label>
                  <input
                    id="refund-amount"
                    className={s.input}
                    type="number" inputMode="numeric" min={0} max={room} step={1}
                    value={refundTouched ? refund : String(suggested)}
                    onChange={(e) => { setRefundTouched(true); setRefund(e.target.value); }}
                  />
                  <span className={s.small}>Төлсөн {money(info.paid)}{info.refunded ? `, өмнө буцаасан ${money(info.refunded)}` : ""}</span>
                </div>
                <div className={s.field}>
                  <label className={s.fieldLabel} htmlFor="refund-method">Хэрхэн буцаасан</label>
                  <select id="refund-method" className={s.select} style={{ width: "100%" }} value={method} onChange={(e) => setMethod(e.target.value)} disabled={refundValue <= 0}>
                    {METHODS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                  </select>
                </div>
              </div>

              <div className={s.field}>
                <label className={s.fieldLabel} htmlFor="return-note">Тэмдэглэл</label>
                <input id="return-note" className={s.input} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Шалтгаан, нөхцөл байдал" />
              </div>

              {error && <p className={s.err} role="alert">{error}</p>}
            </>
          )}

          <div className={s.dialogFoot}>
            <button type="button" className={s.ghostBtn} onClick={() => onOpenChange(false)}>Болих</button>
            {info && !info.blockedReason && (
              <button type="submit" className={s.primaryBtn} disabled={saving || chosen.length === 0}>
                {saving ? "Бүртгэж байна…" : "Буцаалт бүртгэх"}
              </button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
