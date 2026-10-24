"use client";

/**
 * One sent падаан: who signed for it, and shortfalls the partner reports
 * (spec §9). Nothing here edits the падаан itself; each shortfall is a new
 * adjustment.
 */

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { confirmDelivery, getDelivery, recordShortfall } from "@/lib/api/partners";
import { adjustmentKindLabel, formatDate, formatMnt } from "@/lib/partners/format";
import { Button, C, ErrorText, Modal, StatusBadge, Table, inputStyle, labelStyle } from "@/components/partners/ui";

const SHORTFALL_KINDS = [
  { key: "SHORTFALL_TO_STOCK", label: "Төвийн алдаа", hint: "Бараа Төвд үлдсэн: нөөцөд буцааж, харилцагчаас хасна" },
  { key: "SHORTFALL_LOST", label: "Замдаа алга болсон", hint: "Акталж, харилцагчаас хасна" },
  { key: "DISPUTED", label: "Маргаантай", hint: "Төлбөр хэвээр, тэмдэглэл үлдээнэ" },
];

function ConfirmModal({ delivery, token, onClose, onDone }) {
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await confirmDelivery(delivery.id, name, token);
      await onDone();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal title={`Баталгаажуулах · ${delivery.number}`} onClose={onClose}>
      <form onSubmit={submit}>
        <label>
          <span style={labelStyle}>Хүлээн авсан хүний нэр</span>
          <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} autoFocus required />
        </label>
        <ErrorText>{error}</ErrorText>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18 }}>
          <Button kind="secondary" onClick={onClose}>Болих</Button>
          <Button type="submit" disabled={busy || !name.trim()}>Баталгаажуулах</Button>
        </div>
      </form>
    </Modal>
  );
}

function ShortfallModal({ delivery, line, left, token, onClose, onDone }) {
  const [qty, setQty] = useState("1");
  const [kind, setKind] = useState("SHORTFALL_TO_STOCK");
  const [note, setNote] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const n = Number(qty);
  const valid = Number.isInteger(n) && n > 0 && n <= left;

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await recordShortfall(delivery.id, { deliveryLineId: line.id, qty: n, kind, note: note.trim() || undefined }, token);
      await onDone();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal title="Дутуу бүртгэх" onClose={onClose} width={520}>
      <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
        <div style={{ fontSize: 15, color: C.text }}>
          {line.nameSnapshot}
          <div style={{ fontSize: 13, color: C.muted }}>
            Илгээсэн {line.qty} ш · бүртгэх боломжтой {left} ш · {formatMnt(line.unitPrice)}/ш
          </div>
        </div>
        <label>
          <span style={labelStyle}>Тоо</span>
          <input value={qty} onChange={(e) => setQty(e.target.value)} inputMode="numeric" style={inputStyle} autoFocus />
        </label>
        <div style={{ display: "grid", gap: 8 }}>
          {SHORTFALL_KINDS.map((k) => (
            <label
              key={k.key}
              style={{
                display: "flex",
                gap: 10,
                padding: 10,
                borderRadius: 8,
                cursor: "pointer",
                border: `1px solid ${kind === k.key ? C.blue : C.line}`,
              }}
            >
              <input type="radio" name="kind" checked={kind === k.key} onChange={() => setKind(k.key)} />
              <span>
                <span style={{ fontSize: 15, color: C.text }}>{k.label}</span>
                <span style={{ display: "block", fontSize: 13, color: C.muted }}>{k.hint}</span>
              </span>
            </label>
          ))}
        </div>
        {kind === "SHORTFALL_TO_STOCK" && !delivery.stockApplied && (
          <div style={{ fontSize: 13, color: C.muted }}>Энэ падаан нөөц хөдөлгөөгүй (Төв Dayansoft дээр байсан) тул зөвхөн төлбөрөөс хасна.</div>
        )}
        <label>
          <span style={labelStyle}>Тэмдэглэл</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle} />
        </label>
        {valid && kind !== "DISPUTED" && (
          <div style={{ fontSize: 14, color: C.green }}>Харилцагчаас {formatMnt(n * line.unitPrice)} хасагдана.</div>
        )}
        <ErrorText>{error || (!valid && qty !== "" ? `1–${left} хооронд тоо оруулна уу` : null)}</ErrorText>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button kind="secondary" onClick={onClose}>Болих</Button>
          <Button type="submit" disabled={busy || !valid}>Бүртгэх</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function DeliveryDetailClient({ id }) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const router = useRouter();
  const [delivery, setDelivery] = useState(null);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [shortLine, setShortLine] = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const d = await getDelivery(id, token);
      if (d.status === "DRAFT") {
        router.replace(`/partners/${d.partner.id}/deliveries/new?draft=${d.id}`);
        return;
      }
      setDelivery(d);
    } catch (e) {
      setError(e.message);
    }
  }, [token, id, router]);

  useEffect(() => {
    load();
  }, [load]);

  if (!delivery) {
    return (
      <div className="wg-box">
        {error ? <ErrorText>{error}</ErrorText> : <div className="body-text">Ачаалж байна…</div>}
      </div>
    );
  }

  const shortBy = new Map();
  for (const a of delivery.adjustments) {
    if (a.deliveryLineId) shortBy.set(a.deliveryLineId, (shortBy.get(a.deliveryLineId) || 0) + (a.qty || 0));
  }
  const credited = delivery.adjustments.reduce((s, a) => s + a.amount, 0);
  const canConfirm = !delivery.confirmedAt;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div className="wg-box">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: C.text }}>{delivery.number}</span>
              <StatusBadge status={delivery.status} />
              {delivery.isHistorical && <span style={{ fontSize: 13, color: C.faint }}>Хүснэгтээс оруулсан</span>}
            </div>
            <div style={{ fontSize: 14, color: C.muted, marginTop: 6 }}>
              <Link href={`/partners/${delivery.partner.id}`} style={{ color: C.blue }}>{delivery.partner.name}</Link>
              {" · "}Илгээсэн {formatDate(delivery.sentAt)} · {delivery.fromLocation.name}
              {delivery.confirmedAt && ` · Хүлээн авсан ${delivery.signedByName} (${formatDate(delivery.confirmedAt)})`}
            </div>
            <div style={{ fontSize: 13, color: C.faint, marginTop: 4 }}>
              {delivery.stockApplied ? "Төвийн нөөцөөс хасагдсан" : "Нөөц хөдлөөгүй"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button kind="secondary" onClick={() => window.open(`/partner-deliveries/${delivery.id}/print`, "_blank")}>
              <i className="icon-printer" /> Хэвлэх
            </Button>
            {canConfirm && <Button onClick={() => setConfirming(true)}>Баталгаажуулах</Button>}
          </div>
        </div>
      </div>

      <div className="wg-box">
        <Table
          cols={[
            { key: "no", label: "№", width: 40 },
            { key: "name", label: "Бараа" },
            { key: "boxes", label: "Хайрцаг", align: "right" },
            { key: "qty", label: "Тоо", align: "right" },
            { key: "price", label: "Нэгж үнэ", align: "right" },
            { key: "total", label: "Дүн", align: "right" },
            { key: "short", label: "Дутуу", align: "right" },
            { key: "action", label: "" },
          ]}
          rows={delivery.lines.map((l, i) => {
            const short = shortBy.get(l.id) || 0;
            const left = l.qty - short;
            return {
              key: l.id,
              no: i + 1,
              name: l.nameSnapshot,
              boxes: l.boxes ?? "—",
              qty: l.qty,
              price: formatMnt(l.unitPrice),
              total: <span style={{ fontWeight: 600 }}>{formatMnt(l.lineTotal)}</span>,
              short: short ? <span style={{ color: C.amber }}>{short}</span> : <span style={{ color: C.faint }}>—</span>,
              action:
                left > 0 ? (
                  <Button kind="secondary" style={{ padding: "6px 12px", fontSize: 13 }} onClick={() => setShortLine({ line: l, left })}>
                    Дутуу бүртгэх
                  </Button>
                ) : null,
            };
          })}
          empty="Мөр алга."
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 24, marginTop: 16, fontSize: 15, flexWrap: "wrap" }}>
          <span style={{ color: C.muted }}>
            Падааны дүн <strong style={{ color: C.text }}>{formatMnt(delivery.total)}</strong>
          </span>
          {credited > 0 && (
            <span style={{ color: C.muted }}>
              Хасалт <strong style={{ color: C.green }}>−{formatMnt(credited)}</strong>
            </span>
          )}
        </div>
      </div>

      {delivery.adjustments.length > 0 && (
        <div className="wg-box">
          <div className="body-title" style={{ marginBottom: 12 }}>Дутуу, маргаан</div>
          <Table
            cols={[
              { key: "date", label: "Огноо" },
              { key: "line", label: "Бараа" },
              { key: "kind", label: "Төрөл" },
              { key: "qty", label: "Тоо", align: "right" },
              { key: "amount", label: "Хасалт", align: "right" },
              { key: "note", label: "Тэмдэглэл" },
            ]}
            rows={delivery.adjustments.map((a) => ({
              key: a.id,
              date: formatDate(a.createdAt),
              line: delivery.lines.find((l) => l.id === a.deliveryLineId)?.nameSnapshot || "—",
              kind: `${adjustmentKindLabel(a.kind)}${a.stockApplied ? " · нөөцөд буцсан" : ""}`,
              qty: a.qty ?? "—",
              amount: a.amount ? formatMnt(a.amount) : "—",
              note: a.note || "—",
            }))}
            empty=""
          />
        </div>
      )}

      {confirming && (
        <ConfirmModal
          delivery={delivery}
          token={token}
          onClose={() => setConfirming(false)}
          onDone={async () => {
            setConfirming(false);
            await load();
          }}
        />
      )}
      {shortLine && (
        <ShortfallModal
          delivery={delivery}
          line={shortLine.line}
          left={shortLine.left}
          token={token}
          onClose={() => setShortLine(null)}
          onDone={async () => {
            setShortLine(null);
            await load();
          }}
        />
      )}
    </div>
  );
}
