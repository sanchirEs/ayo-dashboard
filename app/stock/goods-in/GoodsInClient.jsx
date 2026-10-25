"use client";

/**
 * Бараа орлого: goods received from a supplier, with the unit cost of each line.
 * Cost feeds the company-wide weighted-average cost even at a branch still on
 * Dayansoft; only branches on the Ayo ledger get stock (spec 10.2, D24).
 * A 0₮ cost is allowed: a free gift from the supplier.
 */

import { useCallback, useEffect, useState } from "react";
import { createSupplier, listGoodsReceipts, listSuppliers, receiveGoods, updateSupplier } from "@/lib/api/stock";
import { formatMnt } from "@/lib/partners/format";
import { Button, C, Dialog, ErrorText, Field, Pill, Table, ago, inputStyle, labelStyle } from "@/components/pos/ui";
import { SMALL, LinesEditor, LocationSelect, Toolbar, useLocations, useToken, useVariantNames } from "@/components/stock/shared";

function NewReceipt({ token, locations, suppliers, onClose, onSaved }) {
  const [locationId, setLocationId] = useState(null);
  const [supplierId, setSupplierId] = useState("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const total = lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.unitCost) || 0), 0);

  const save = async () => {
    if (locationId == null) return setError("Аль салбарт орох вэ гэдгийг сонгоно уу");
    if (lines.some((l) => !Number.isInteger(l.qty) || l.qty <= 0)) return setError("Тоо ширхэг эерэг бүхэл тоо байх ёстой");
    if (lines.some((l) => !Number.isInteger(l.unitCost) || l.unitCost < 0)) return setError("Өртөг 0 буюу түүнээс их бүхэл тоо байх ёстой (үнэгүй бол 0)");
    setBusy(true);
    setError(null);
    try {
      await receiveGoods(
        {
          locationId,
          supplierId: supplierId === "" ? null : Number(supplierId),
          note: note.trim() || undefined,
          lines: lines.map((l) => ({ variantId: l.variant.id, qty: l.qty, unitCost: l.unitCost })),
        },
        token,
      );
      onSaved();
      onClose();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <Dialog title="Бараа орлого авах" onClose={onClose} width={780}>
      <Toolbar>
        <LocationSelect locations={locations} value={locationId} onChange={setLocationId} label="Аль салбарт" />
        <label>
          <span style={labelStyle}>Нийлүүлэгч</span>
          <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} style={{ ...inputStyle, minWidth: 220 }}>
            <option value="">Тодорхойгүй</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
      </Toolbar>
      <LinesEditor token={token} lines={lines} onChange={setLines} withCost />
      <label style={{ display: "block", marginTop: 14 }}>
        <span style={labelStyle}>Тайлбар</span>
        <input value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle} />
      </label>
      <p style={{ textAlign: "right", margin: "14px 0 0", color: C.muted }}>
        Нийт өртөг: <strong style={{ color: C.text }}>{formatMnt(total)}</strong>
      </p>
      <ErrorText>{error}</ErrorText>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
        <Button kind="secondary" onClick={onClose}>Болих</Button>
        <Button onClick={save} disabled={busy || lines.length === 0}>{busy ? "Хадгалж байна…" : "Орлого батлах"}</Button>
      </div>
    </Dialog>
  );
}

function Suppliers({ token, onClose, onChanged }) {
  const [rows, setRows] = useState(null);
  const [draft, setDraft] = useState({ name: "", phone: "", country: "" });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setRows(await listSuppliers(token, true));
    } catch (e) {
      setError(e.message);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createSupplier({ name: draft.name, phone: draft.phone, country: draft.country }, token);
      setDraft({ name: "", phone: "", country: "" });
      await load();
      onChanged();
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  const toggle = async (s) => {
    setError(null);
    try {
      await updateSupplier(s.id, { active: !s.active }, token);
      await load();
      onChanged();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Dialog title="Нийлүүлэгчид" onClose={onClose} width={680}>
      <form onSubmit={add} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 16 }}>
        <Field label="Нэр" style={{ flex: "2 1 180px" }}>
          {(props) => <input {...props} required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />}
        </Field>
        <Field label="Утас" style={{ flex: "1 1 120px" }}>
          {(props) => <input {...props} value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />}
        </Field>
        <Field label="Улс" style={{ flex: "1 1 100px" }}>
          {(props) => <input {...props} value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })} />}
        </Field>
        <Button type="submit" disabled={busy || !draft.name.trim()}>Нэмэх</Button>
      </form>
      <ErrorText>{error}</ErrorText>
      <Table
        cols={[
          { key: "name", label: "Нэр" },
          { key: "phone", label: "Утас", width: 130 },
          { key: "country", label: "Улс", width: 100 },
          { key: "act", label: "", width: 130 },
        ]}
        rows={(rows ?? []).map((s) => ({
          key: s.id,
          name: (
            <span>
              {s.name} {!s.active && <Pill>идэвхгүй</Pill>}
            </span>
          ),
          phone: s.phone ?? "—",
          country: s.country ?? "—",
          act: (
            <Button kind="secondary" onClick={() => toggle(s)} style={SMALL}>
              {s.active ? "Идэвхгүй болгох" : "Идэвхжүүлэх"}
            </Button>
          ),
        }))}
        empty={rows === null ? "Ачаалж байна…" : "Нийлүүлэгч алга."}
      />
    </Dialog>
  );
}

export default function GoodsInClient() {
  const token = useToken();
  const { locations, nameOf, error: locationError } = useLocations(token);
  const [locationId, setLocationId] = useState(null);
  const [receipts, setReceipts] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [managing, setManaging] = useState(false);
  const nameFor = useVariantNames((receipts ?? []).flatMap((r) => r.lines.map((l) => l.variantId)), token);
  const [expanded, setExpanded] = useState(null);

  const loadSuppliers = useCallback(async () => {
    if (!token) return;
    try {
      setSuppliers(await listSuppliers(token));
    } catch (e) {
      setError(e.message);
    }
  }, [token]);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      setReceipts(await listGoodsReceipts(token, locationId ?? undefined));
    } catch (e) {
      setError(e.message);
    }
  }, [token, locationId]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const table = (receipts ?? []).map((r) => {
    const cost = r.lines.reduce((s, l) => s + l.qty * l.unitCost, 0);
    return {
      key: r.id,
      number: <strong>{r.number}</strong>,
      location: (
        <span>
          {nameOf(r.locationId)} {!r.stockApplied && <Pill tone="amber">үлдэгдэлд нөлөөлөөгүй</Pill>}
        </span>
      ),
      supplier: r.supplier?.name ?? "—",
      lines: `${r.lines.length} төрөл · ${r.lines.reduce((s, l) => s + l.qty, 0)} ш`,
      cost: formatMnt(cost),
      at: ago(r.receivedAt),
      receipt: r,
    };
  });

  const open = expanded && receipts?.find((r) => r.id === expanded);

  return (
    <div className="wg-box">
      <Toolbar>
        <LocationSelect locations={locations} value={locationId} onChange={setLocationId} allowAll label="Салбар" />
        <div style={{ flex: 1 }} />
        <Button kind="secondary" onClick={() => setManaging(true)}>Нийлүүлэгчид</Button>
        <Button onClick={() => setCreating(true)} disabled={locations.length === 0}>Орлого авах</Button>
      </Toolbar>
      <ErrorText>{error || locationError}</ErrorText>
      <Table
        cols={[
          { key: "number", label: "Дугаар", width: 130 },
          { key: "location", label: "Салбар" },
          { key: "supplier", label: "Нийлүүлэгч", width: 180 },
          { key: "lines", label: "Бараа", width: 150 },
          { key: "cost", label: "Нийт өртөг", align: "right", width: 130 },
          { key: "at", label: "Хэзээ", width: 130 },
        ]}
        rows={table}
        onRowClick={(row) => setExpanded(row.receipt.id === expanded ? null : row.receipt.id)}
        empty={receipts === null && !error ? "Ачаалж байна…" : "Орлого алга."}
      />
      {open && (
        <Dialog title={`${open.number} · ${nameOf(open.locationId)}`} onClose={() => setExpanded(null)} width={680}>
          {open.note && <p style={{ margin: "0 0 12px", color: C.muted }}>{open.note}</p>}
          <Table
            cols={[
              { key: "name", label: "Бараа" },
              { key: "qty", label: "Тоо", align: "right", width: 80 },
              { key: "unitCost", label: "Нэгж өртөг", align: "right", width: 120 },
              { key: "sum", label: "Дүн", align: "right", width: 120 },
            ]}
            rows={open.lines.map((l) => ({ key: l.id ?? l.variantId, name: nameFor(l.variantId), qty: l.qty, unitCost: formatMnt(l.unitCost), sum: formatMnt(l.qty * l.unitCost) }))}
            empty="—"
          />
        </Dialog>
      )}
      {creating && <NewReceipt token={token} locations={locations} suppliers={suppliers} onClose={() => setCreating(false)} onSaved={load} />}
      {managing && <Suppliers token={token} onClose={() => setManaging(false)} onChanged={loadSuppliers} />}
    </div>
  );
}
