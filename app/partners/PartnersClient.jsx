"use client";

/**
 * Partners (Бөхийн өргөө, ХУД 19, …): what each owes and how old the debt is
 * (spec §9, §16.2). Replaces the two Google Sheets.
 */

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { createPartner, listPartners } from "@/lib/api/partners";
import { AGING_KEYS, agingLabel, formatDate, formatMnt } from "@/lib/partners/format";
import { Button, C, ErrorText, Modal, Table, inputStyle, labelStyle } from "@/components/partners/ui";

function NewPartnerModal({ token, onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", contactName: "", phone: "", taxId: "" });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Нэр оруулна уу");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const data = Object.fromEntries(Object.entries(form).filter(([, v]) => v.trim()));
      await onCreated(await createPartner(data, token));
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal title="Шинэ харилцагч" onClose={onClose}>
      <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
        {[
          ["name", "Нэр"],
          ["contactName", "Холбоо барих хүн"],
          ["phone", "Утас"],
          ["taxId", "Регистр / ТТД"],
        ].map(([key, label]) => (
          <label key={key}>
            <span style={labelStyle}>{label}</span>
            <input value={form[key]} onChange={set(key)} style={inputStyle} autoFocus={key === "name"} />
          </label>
        ))}
        <ErrorText>{error}</ErrorText>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button kind="secondary" onClick={onClose}>Болих</Button>
          <Button type="submit" disabled={busy}>Хадгалах</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function PartnersClient() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const router = useRouter();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setPartners(await listPartners(token));
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [token]);

  // token is a dependency on purpose: useSession is undefined on first render.
  useEffect(() => {
    load();
  }, [load]);

  const total = partners.reduce((sum, p) => sum + p.balance, 0);

  const rows = partners.map((p) => ({
    key: p.id,
    id: p.id,
    name: (
      <span style={{ fontWeight: 600 }}>
        {p.name}
        {!p.active && <span style={{ color: C.faint, fontWeight: 400 }}> · идэвхгүй</span>}
      </span>
    ),
    balance: <span style={{ fontWeight: 600, color: p.balance < 0 ? C.green : C.text }}>{formatMnt(p.balance)}</span>,
    ...Object.fromEntries(
      AGING_KEYS.map((k) => [
        k,
        <span key={k} style={{ color: p.aging[k] === 0 ? C.faint : k === "d90plus" ? C.red : C.text }}>{formatMnt(p.aging[k])}</span>,
      ])
    ),
    lastPaymentAt: formatDate(p.lastPaymentAt),
  }));

  return (
    <div className="wg-box">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 14, color: C.muted, marginBottom: 4 }}>Нийт авлага</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: C.text }}>{formatMnt(total)}</div>
        </div>
        <Button onClick={() => setCreating(true)} disabled={!token}>
          <i className="icon-plus" /> Шинэ харилцагч
        </Button>
      </div>

      <ErrorText>{error}</ErrorText>

      <div style={{ marginTop: 18 }}>
        <Table
          cols={[
            { key: "name", label: "Харилцагч" },
            { key: "balance", label: "Үлдэгдэл", align: "right" },
            ...AGING_KEYS.map((k) => ({ key: k, label: agingLabel(k), align: "right" })),
            { key: "lastPaymentAt", label: "Сүүлийн төлбөр", align: "right" },
          ]}
          rows={loading ? [] : rows}
          empty={loading || !token ? "Ачаалж байна…" : "Харилцагч алга."}
          onRowClick={(row) => router.push(`/partners/${row.id}`)}
        />
      </div>

      {creating && (
        <NewPartnerModal
          token={token}
          onClose={() => setCreating(false)}
          onCreated={async () => {
            setCreating(false);
            await load();
          }}
        />
      )}
    </div>
  );
}
