"use client";

/** One partner: statement with running balance, падаан, payments (spec §9). */

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getPartner, getStatement, recordPayment } from "@/lib/api/partners";
import {
  AGING_KEYS,
  PAYMENT_METHODS,
  adjustmentKindLabel,
  agingLabel,
  formatDate,
  formatMnt,
  paymentMethodLabel,
} from "@/lib/partners/format";
import { Button, C, ErrorText, Modal, StatusBadge, Table, inputStyle, labelStyle } from "@/components/partners/ui";

const TABS = [
  { key: "statement", label: "Тооцоо" },
  { key: "deliveries", label: "Падаан" },
  { key: "payments", label: "Төлбөр" },
];

const todayUb = () => formatDate(new Date());

function PaymentModal({ partner, token, onClose, onSaved }) {
  const [form, setForm] = useState({ paidAt: todayUb(), amount: "", method: "BANK_TRANSFER", note: "" });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }));
  const amount = Number(String(form.amount).replace(/[,\s₮]/g, ""));

  const submit = async (event) => {
    event.preventDefault();
    if (!Number.isInteger(amount) || amount <= 0) {
      setError("Дүн 0-ээс их бүхэл тоо байна");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // Noon Ulaanbaatar time, so the date never slips a day either way.
      await recordPayment(partner.id, { paidAt: `${form.paidAt}T12:00:00+08:00`, amount, method: form.method, note: form.note.trim() || undefined }, token);
      await onSaved();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal title={`Төлбөр бүртгэх · ${partner.name}`} onClose={onClose}>
      <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
        <label>
          <span style={labelStyle}>Огноо</span>
          <input type="date" value={form.paidAt} onChange={set("paidAt")} style={inputStyle} required />
        </label>
        <label>
          <span style={labelStyle}>Дүн (₮)</span>
          <input value={form.amount} onChange={set("amount")} inputMode="numeric" style={inputStyle} autoFocus placeholder="0" />
          {amount > 0 && (
            <span style={{ fontSize: 13, color: C.muted, marginTop: 4, display: "block" }}>
              {formatMnt(amount)} · төлсний дараах үлдэгдэл {formatMnt(partner.balance - amount)}
            </span>
          )}
        </label>
        <label>
          <span style={labelStyle}>Хэлбэр</span>
          <select value={form.method} onChange={set("method")} style={inputStyle}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>{paymentMethodLabel(m)}</option>
            ))}
          </select>
        </label>
        <label>
          <span style={labelStyle}>Тэмдэглэл</span>
          <input value={form.note} onChange={set("note")} style={inputStyle} placeholder="Банк, гүйлгээний утга…" />
        </label>
        <ErrorText>{error}</ErrorText>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button kind="secondary" onClick={onClose}>Болих</Button>
          <Button type="submit" disabled={busy}>Хадгалах</Button>
        </div>
      </form>
    </Modal>
  );
}

const STATEMENT_TYPE = { DELIVERY: "Падаан", PAYMENT: "Төлбөр", CREDIT: "Хасалт" };

export default function PartnerDetailClient({ id }) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const router = useRouter();
  const [partner, setPartner] = useState(null);
  const [statement, setStatement] = useState(null);
  const [range, setRange] = useState({ from: "", to: "" });
  const [tab, setTab] = useState("statement");
  const [error, setError] = useState(null);
  const [paying, setPaying] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      // Whole Ulaanbaatar days (UTC+8), not UTC midnights.
      const ubRange = {
        from: range.from ? `${range.from}T00:00:00+08:00` : undefined,
        to: range.to ? `${range.to}T23:59:59.999+08:00` : undefined,
      };
      const [p, st] = await Promise.all([getPartner(id, token), getStatement(id, ubRange, token)]);
      setPartner(p);
      setStatement(st);
    } catch (e) {
      setError(e.message);
    }
  }, [token, id, range]);

  useEffect(() => {
    load();
  }, [load]);

  if (!partner) {
    return (
      <div className="wg-box">
        {error ? <ErrorText>{error}</ErrorText> : <div className="body-text">Ачаалж байна…</div>}
      </div>
    );
  }

  const deliveryHref = (d) => (d.status === "DRAFT" ? `/partners/${id}/deliveries/new?draft=${d.id}` : `/partner-deliveries/${d.id}`);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div className="wg-box">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.text }}>{partner.name}</div>
            <div style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>
              {[partner.contactName, partner.phone, partner.taxId && `ТТД ${partner.taxId}`].filter(Boolean).join(" · ") || "—"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button kind="secondary" onClick={() => setPaying(true)}>Төлбөр бүртгэх</Button>
            <Button onClick={() => router.push(`/partners/${id}/deliveries/new`)}>Шинэ падаан</Button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginTop: 18 }}>
          <div style={{ padding: 14, borderRadius: 10, backgroundColor: C.grayBg }}>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>Үлдэгдэл</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: partner.balance < 0 ? C.green : C.text }}>{formatMnt(partner.balance)}</div>
            {partner.balance < 0 && <div style={{ fontSize: 12, color: C.green }}>илүү төлсөн</div>}
          </div>
          {AGING_KEYS.map((k) => (
            <div key={k} style={{ padding: 14, borderRadius: 10, border: `1px solid ${C.line}` }}>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>{agingLabel(k)}</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: k === "d90plus" && partner.aging[k] > 0 ? C.red : C.text }}>
                {formatMnt(partner.aging[k])}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="wg-box">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {TABS.map((t) => (
            <Button key={t.key} kind={tab === t.key ? "primary" : "secondary"} onClick={() => setTab(t.key)}>
              {t.label}
            </Button>
          ))}
        </div>
        <ErrorText>{error}</ErrorText>

        {tab === "statement" && statement && (
          <div style={{ marginTop: 18 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 14 }}>
              <label>
                <span style={labelStyle}>Эхлэх</span>
                <input type="date" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} style={{ ...inputStyle, width: 170 }} />
              </label>
              <label>
                <span style={labelStyle}>Дуусах</span>
                <input type="date" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} style={{ ...inputStyle, width: 170 }} />
              </label>
              {(range.from || range.to) && (
                <Button kind="secondary" onClick={() => setRange({ from: "", to: "" })}>Бүгд</Button>
              )}
            </div>
            <Table
              cols={[
                { key: "date", label: "Огноо", width: 110 },
                { key: "type", label: "Төрөл" },
                { key: "ref", label: "Дугаар / тайлбар" },
                { key: "debit", label: "Авсан", align: "right" },
                { key: "credit", label: "Төлсөн / хасалт", align: "right" },
                { key: "balance", label: "Үлдэгдэл", align: "right" },
              ]}
              rows={[
                ...(range.from
                  ? [{ key: "opening", date: range.from, type: "", ref: <em style={{ color: C.muted }}>Эхний үлдэгдэл</em>, debit: "", credit: "", balance: formatMnt(statement.opening) }]
                  : []),
                ...statement.rows.map((r) => ({
                  key: `${r.type}-${r.id}`,
                  date: formatDate(r.date),
                  type: STATEMENT_TYPE[r.type],
                  ref:
                    r.type === "DELIVERY" ? (
                      <Link href={`/partner-deliveries/${r.id}`} style={{ color: C.blue }}>{r.ref}</Link>
                    ) : r.type === "PAYMENT" ? (
                      paymentMethodLabel(r.ref)
                    ) : (
                      adjustmentKindLabel(r.ref)
                    ),
                  debit: r.debit ? formatMnt(r.debit) : "",
                  credit: r.credit ? formatMnt(r.credit) : "",
                  balance: <span style={{ fontWeight: 600 }}>{formatMnt(r.balance)}</span>,
                })),
              ]}
              empty="Гүйлгээ алга."
            />
          </div>
        )}

        {tab === "deliveries" && (
          <div style={{ marginTop: 18 }}>
            <Table
              cols={[
                { key: "number", label: "Дугаар" },
                { key: "date", label: "Огноо" },
                { key: "status", label: "Төлөв" },
                { key: "lines", label: "Мөр", align: "right" },
                { key: "total", label: "Дүн", align: "right" },
                { key: "signed", label: "Хүлээн авсан" },
              ]}
              rows={partner.deliveries.map((d) => ({
                key: d.id,
                href: deliveryHref(d),
                number: (
                  <span style={{ fontWeight: 600 }}>
                    {d.number || "—"}
                    {d.isHistorical && <span style={{ color: C.faint, fontWeight: 400 }}> · түүх</span>}
                  </span>
                ),
                date: formatDate(d.sentAt || d.createdAt),
                status: <StatusBadge status={d.status} />,
                lines: d._count.lines,
                total: formatMnt(d.total),
                signed: d.signedByName || "—",
              }))}
              empty="Падаан алга."
              onRowClick={(row) => router.push(row.href)}
            />
          </div>
        )}

        {tab === "payments" && (
          <div style={{ marginTop: 18 }}>
            <Table
              cols={[
                { key: "date", label: "Огноо" },
                { key: "method", label: "Хэлбэр" },
                { key: "note", label: "Тэмдэглэл" },
                { key: "amount", label: "Дүн", align: "right" },
              ]}
              rows={partner.payments.map((p) => ({
                key: p.id,
                date: formatDate(p.paidAt),
                method: paymentMethodLabel(p.method),
                note: p.note || "—",
                amount: <span style={{ fontWeight: 600 }}>{formatMnt(p.amount)}</span>,
              }))}
              empty="Төлбөр бүртгэгдээгүй."
            />
          </div>
        )}
      </div>

      {paying && (
        <PaymentModal
          partner={partner}
          token={token}
          onClose={() => setPaying(false)}
          onSaved={async () => {
            setPaying(false);
            await load();
          }}
        />
      )}
    </div>
  );
}
