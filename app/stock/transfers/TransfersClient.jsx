"use client";

/**
 * Шилжүүлэг: stock moving between branches. A draft is sent (stock leaves the
 * sender), then received counted line by line; a short line needs a reason and a
 * surplus is booked as a find (spec 10.3). The second tab holds the branches' own
 * requests, which become drafts here.
 */

import { useCallback, useEffect, useState } from "react";
import {
  cancelTransfer,
  convertTransferRequest,
  createTransfer,
  listTransferRequests,
  listTransfers,
  receiveTransfer,
  sendTransfer,
} from "@/lib/api/stock";
import { discrepancyLabel, receiveLinesFor, TRANSFER_STATUS } from "@/lib/stock/labels";
import { Button, C, Dialog, ErrorText, Pill, Table, ago, inputStyle, labelStyle } from "@/components/pos/ui";
import { SMALL, LinesEditor, LocationSelect, Tabs, Toolbar, useLocations, useToken, useVariantNames } from "@/components/stock/shared";

const STATUS_FILTERS = [["", "Бүгд"], ["DRAFT", "Ноорог"], ["SENT", "Замд"], ["RECEIVED", "Хүлээн авсан"]];

function StatusPill({ status }) {
  const [tone, text] = TRANSFER_STATUS[status] ?? ["gray", status];
  return <Pill tone={tone}>{text}</Pill>;
}

function NewTransfer({ token, locations, onClose, onCreated }) {
  const [fromId, setFromId] = useState(null);
  const [toId, setToId] = useState(null);
  const [note, setNote] = useState("");
  const [lines, setLines] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (fromId == null || toId == null) return setError("Хаанаас, хаашаа гэдгийг сонгоно уу");
    if (fromId === toId) return setError("Илгээгч ба хүлээн авагч салбар өөр байх ёстой");
    if (lines.some((l) => !Number.isInteger(l.qty) || l.qty <= 0)) return setError("Тоо ширхэг эерэг бүхэл тоо байх ёстой");
    setBusy(true);
    setError(null);
    try {
      await createTransfer({ fromLocationId: fromId, toLocationId: toId, note: note.trim() || undefined, lines: lines.map((l) => ({ variantId: l.variant.id, qty: l.qty })) }, token);
      onCreated();
      onClose();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <Dialog title="Шинэ шилжүүлэг" onClose={onClose} width={720}>
      <Toolbar>
        <LocationSelect locations={locations} value={fromId} onChange={setFromId} label="Хаанаас" />
        <LocationSelect locations={locations} value={toId} onChange={setToId} label="Хаашаа" />
      </Toolbar>
      <LinesEditor token={token} lines={lines} onChange={setLines} />
      <label style={{ display: "block", marginTop: 14 }}>
        <span style={labelStyle}>Тайлбар</span>
        <input value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle} />
      </label>
      <ErrorText>{error}</ErrorText>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
        <Button kind="secondary" onClick={onClose}>Болих</Button>
        <Button onClick={save} disabled={busy || lines.length === 0}>{busy ? "Хадгалж байна…" : "Ноорог хадгалах"}</Button>
      </div>
    </Dialog>
  );
}

function Detail({ transfer, token, nameOf, onClose, onChanged }) {
  const nameFor = useVariantNames(transfer.lines.map((l) => l.variantId), token);
  const [entered, setEntered] = useState({});
  const [receiving, setReceiving] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async (action) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      onChanged();
      onClose();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  const shortWithoutReason = transfer.lines.some((l) => {
    const e = entered[l.id];
    return e?.qty != null && e.qty < l.qtySent && !e.discrepancy;
  });
  const setEntry = (id, patch) => setEntered((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  return (
    <Dialog title={`${transfer.number} · ${nameOf(transfer.fromLocationId)} → ${nameOf(transfer.toLocationId)}`} onClose={onClose} width={760}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
        <StatusPill status={transfer.status} />
        {transfer.sentAt && <span style={{ color: C.muted, fontSize: 14 }}>Илгээсэн {ago(transfer.sentAt)}</span>}
        {transfer.note && <span style={{ color: C.muted, fontSize: 14 }}>· {transfer.note}</span>}
      </div>
      <Table
        cols={[
          { key: "name", label: "Бараа" },
          { key: "sent", label: "Илгээсэн", align: "right", width: 90 },
          { key: "received", label: "Хүлээн авсан", align: "right", width: receiving ? 130 : 120 },
          { key: "note", label: receiving ? "Дутуу бол шалтгаан" : "Тэмдэглэл", width: 200 },
        ]}
        rows={transfer.lines.map((l) => {
          const e = entered[l.id];
          const qty = e?.qty ?? l.qtySent;
          return {
            key: l.id,
            name: nameFor(l.variantId),
            sent: l.qtySent,
            received: receiving ? (
              <input
                type="number"
                min={0}
                step={1}
                value={qty}
                onChange={(ev) => setEntry(l.id, { qty: ev.target.value === "" ? undefined : Math.trunc(Number(ev.target.value)) })}
                aria-label={`Хүлээн авсан: ${nameFor(l.variantId)}`}
                style={{ ...inputStyle, width: 90, textAlign: "right", padding: "6px 8px" }}
              />
            ) : (
              l.qtyReceived ?? "—"
            ),
            note: receiving ? (
              qty < l.qtySent ? (
                <select value={e?.discrepancy ?? ""} onChange={(ev) => setEntry(l.id, { discrepancy: ev.target.value })} style={{ ...inputStyle, padding: "6px 8px" }} aria-label="Дутуугийн шалтгаан">
                  <option value="">Сонгох…</option>
                  <option value="LOST">Алдагдсан</option>
                  <option value="AT_SOURCE">Илгээгч салбарт үлдсэн</option>
                </select>
              ) : qty > l.qtySent ? (
                <Pill tone="blue">Илүү олдсон</Pill>
              ) : (
                ""
              )
            ) : (
              discrepancyLabel(l.discrepancy)
            ),
          };
        })}
        empty="—"
      />
      <ErrorText>{error}</ErrorText>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
        {transfer.status === "DRAFT" && (
          <>
            <Button kind="danger" disabled={busy} onClick={() => run(() => cancelTransfer(transfer.id, token))}>Цуцлах</Button>
            <Button disabled={busy} onClick={() => run(() => sendTransfer(transfer.id, token))}>Илгээх</Button>
          </>
        )}
        {transfer.status === "SENT" && !receiving && <Button onClick={() => setReceiving(true)}>Хүлээн авах</Button>}
        {transfer.status === "SENT" && receiving && (
          <>
            <Button kind="secondary" onClick={() => setReceiving(false)}>Буцах</Button>
            <Button disabled={busy || shortWithoutReason} onClick={() => run(() => receiveTransfer(transfer.id, receiveLinesFor(transfer.lines, entered), token))}>
              {busy ? "Хадгалж байна…" : "Хүлээн авсан гэж батлах"}
            </Button>
          </>
        )}
      </div>
      {shortWithoutReason && receiving && <p style={{ color: C.amber, fontSize: 13, textAlign: "right", margin: "8px 0 0" }}>Дутуу мөр бүрт шалтгаанаа сонгоно уу.</p>}
    </Dialog>
  );
}

function Requests({ token, locations, nameOf, onConverted }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [fromId, setFromId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const ids = (rows ?? []).flatMap((r) => r.lines.map((l) => l.variantId));
  const nameFor = useVariantNames(ids, token);

  const load = useCallback(async () => {
    try {
      setRows(await listTransferRequests(token));
    } catch (e) {
      setError(e.message);
    }
  }, [token]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  const convert = async (r) => {
    setBusyId(r.id);
    setError(null);
    try {
      await convertTransferRequest(r.id, fromId, token);
      await load();
      onConverted();
    } catch (e) {
      setError(e.message);
    }
    setBusyId(null);
  };

  return (
    <div>
      <p style={{ margin: "0 0 14px", color: C.muted, fontSize: 15, maxWidth: 640 }}>
        Салбаруудын кассаас илгээсэн бараа хүссэн хүсэлтүүд. Хаанаас илгээхээ сонгоод «Ноорог болгох» дарна.
      </p>
      <Toolbar>
        <LocationSelect locations={locations} value={fromId} onChange={setFromId} label="Хаанаас илгээх" />
      </Toolbar>
      <ErrorText>{error}</ErrorText>
      <Table
        cols={[
          { key: "to", label: "Хаашаа", width: 180 },
          { key: "items", label: "Бараа" },
          { key: "at", label: "Хэзээ", width: 130 },
          { key: "act", label: "", width: 160 },
        ]}
        rows={(rows ?? []).map((r) => ({
          key: r.id,
          to: nameOf(r.locationId),
          items: (
            <div>
              {r.lines.map((l) => (
                <div key={l.variantId}>
                  {nameFor(l.variantId)} × {l.qty}
                </div>
              ))}
              {r.note && <div style={{ color: C.muted, fontSize: 12 }}>{r.note}</div>}
            </div>
          ),
          at: ago(r.createdAt),
          act: (
            <Button disabled={fromId == null || busyId === r.id} onClick={() => convert(r)} style={SMALL}>
              {busyId === r.id ? "…" : "Ноорог болгох"}
            </Button>
          ),
        }))}
        empty={rows === null && !error ? "Ачаалж байна…" : "Нээлттэй хүсэлт алга."}
      />
    </div>
  );
}

export default function TransfersClient() {
  const token = useToken();
  const { locations, nameOf, error: locationError } = useLocations(token);
  const [tab, setTab] = useState("transfers");
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      setRows(await listTransfers(token, status || undefined));
    } catch (e) {
      setError(e.message);
    }
  }, [token, status]);

  useEffect(() => {
    load();
  }, [load]);

  const table = (rows ?? []).map((t) => ({
    key: t.id,
    number: <strong>{t.number}</strong>,
    route: `${nameOf(t.fromLocationId)} → ${nameOf(t.toLocationId)}`,
    status: <StatusPill status={t.status} />,
    lines: `${t.lines.length} төрөл · ${t.lines.reduce((s, l) => s + l.qtySent, 0)} ш`,
    at: ago(t.createdAt),
    transfer: t,
  }));

  return (
    <div className="wg-box">
      <Tabs
        tabs={[["transfers", "Шилжүүлэг"], ["requests", "Салбарын хүсэлт"]]}
        value={tab}
        onChange={setTab}
      />
      {tab === "requests" ? (
        <Requests token={token} locations={locations} nameOf={nameOf} onConverted={load} />
      ) : (
        <>
          <Toolbar>
            <div style={{ display: "flex", gap: 8 }} role="group" aria-label="Төлөв">
              {STATUS_FILTERS.map(([key, label]) => (
                <Button key={key || "all"} kind={status === key ? "primary" : "secondary"} onClick={() => setStatus(key)} aria-pressed={status === key} style={SMALL}>
                  {label}
                </Button>
              ))}
            </div>
            <div style={{ flex: 1 }} />
            <Button onClick={() => setCreating(true)} disabled={locations.length < 2}>Шинэ шилжүүлэг</Button>
          </Toolbar>
          <ErrorText>{error || locationError}</ErrorText>
          <Table
            cols={[
              { key: "number", label: "Дугаар", width: 130 },
              { key: "route", label: "Чиглэл" },
              { key: "status", label: "Төлөв", width: 150 },
              { key: "lines", label: "Бараа", width: 160 },
              { key: "at", label: "Үүссэн", width: 130 },
            ]}
            rows={table}
            onRowClick={(row) => setOpen(row.transfer)}
            empty={rows === null && !error ? "Ачаалж байна…" : "Шилжүүлэг алга."}
          />
        </>
      )}
      {creating && <NewTransfer token={token} locations={locations} onClose={() => setCreating(false)} onCreated={load} />}
      {open && <Detail transfer={open} token={token} nameOf={nameOf} onClose={() => setOpen(null)} onChanged={load} />}
    </div>
  );
}
