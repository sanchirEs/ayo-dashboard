"use client";

/**
 * Салбарын нөөц: a branch's stock by item, with cost and value, and the movement
 * history of any item (spec 8.7, 16.2). The ledger is the source of truth; this
 * page only reads it.
 */

import { useCallback, useEffect, useState } from "react";
import { itemHistory, searchStock } from "@/lib/api/stock";
import { formatMnt } from "@/lib/partners/format";
import { formatDateTime, movementReasonLabel, signed } from "@/lib/stock/labels";
import { Button, C, Dialog, ErrorText, Pill, Table, ago, inputStyle, labelStyle } from "@/components/pos/ui";
import { LocationSelect, SMALL, Toolbar, useLocations, useToken, variantTitle } from "@/components/stock/shared";

function History({ row, locationName, locationId, token, onClose }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    itemHistory(row.variantId, locationId, token)
      .then(setRows)
      .catch((e) => setError(e.message));
  }, [row.variantId, locationId, token]);

  const table = (rows ?? []).map((m) => ({
    key: m.id,
    at: formatDateTime(m.at),
    reason: movementReasonLabel(m.reason, m.subReason),
    qty: <strong style={{ color: m.qty < 0 ? C.red : C.green }}>{signed(m.qty)}</strong>,
    balance: m.balanceAfter,
    cost: m.unitCost == null ? "—" : formatMnt(m.unitCost),
    by: m.by ?? "—",
    note: m.note ?? "",
  }));

  return (
    <Dialog title={`${variantTitle(row)} · ${locationName}`} onClose={onClose} width={860}>
      <ErrorText>{error}</ErrorText>
      <Table
        cols={[
          { key: "at", label: "Хэзээ", width: 150 },
          { key: "reason", label: "Үйлдэл" },
          { key: "qty", label: "Тоо", align: "right", width: 70 },
          { key: "balance", label: "Үлдэгдэл", align: "right", width: 90 },
          { key: "cost", label: "Өртөг", align: "right", width: 100 },
          { key: "by", label: "Хэн", width: 140 },
          { key: "note", label: "Тайлбар" },
        ]}
        rows={table}
        empty={rows === null && !error ? "Ачаалж байна…" : "Хөдөлгөөн алга."}
      />
    </Dialog>
  );
}

export default function StockClient() {
  const token = useToken();
  const { locations, nameOf, error: locationError } = useLocations(token);
  const [locationId, setLocationId] = useState(null);
  const [q, setQ] = useState("");
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(null);

  // Төв is the first location the owner will want; fall back to whatever is first.
  useEffect(() => {
    if (locationId == null && locations.length > 0) setLocationId((locations.find((l) => l.code === "TUV" || /төв/i.test(l.name)) ?? locations[0]).id);
  }, [locations, locationId]);

  const search = useCallback(
    async (event) => {
      event?.preventDefault();
      if (!token || locationId == null || q.trim().length < 2) return;
      setBusy(true);
      setError(null);
      try {
        setRows(await searchStock(locationId, q.trim(), token));
      } catch (e) {
        setError(e.message);
      }
      setBusy(false);
    },
    [token, locationId, q],
  );

  const location = locations.find((l) => l.id === locationId);
  const total = (rows ?? []).reduce((sum, r) => sum + (r.value ?? 0), 0);

  const table = (rows ?? []).map((r) => ({
    key: r.variantId,
    name: (
      <div>
        <div>{variantTitle(r)}</div>
        <div style={{ color: C.muted, fontSize: 12 }}>
          {r.sku}
          {r.isSet ? " · сет" : ""}
        </div>
      </div>
    ),
    onHand: <strong style={{ color: r.onHand < 0 ? C.red : C.text }}>{r.onHand}</strong>,
    reserved: r.reserved,
    available: r.available,
    cost: r.avgCost == null ? <Pill tone="amber">өртөггүй</Pill> : formatMnt(r.avgCost),
    value: r.value == null ? "—" : formatMnt(r.value),
    history: (
      <Button kind="secondary" style={SMALL} onClick={() => setOpen(r)}>
        Түүх
      </Button>
    ),
  }));

  return (
    <div className="wg-box">
      <p style={{ margin: "0 0 16px", color: C.muted, fontSize: 15, maxWidth: 680 }}>
        Салбар сонгоод бараагаа хайна уу. «Түүх» дарвал тухайн барааны бүх хөдөлгөөн (хэн, яагаад) харагдана.
      </p>
      <form onSubmit={search}>
        <Toolbar>
          <LocationSelect locations={locations} value={locationId} onChange={setLocationId} />
          <label style={{ flex: "1 1 260px" }}>
            <span style={labelStyle}>Бараа</span>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Нэр, SKU эсвэл баркод (2+ тэмдэгт)" style={inputStyle} />
          </label>
          <Button type="submit" disabled={!token || busy || locationId == null || q.trim().length < 2}>
            {busy ? "Хайж байна…" : "Хайх"}
          </Button>
        </Toolbar>
      </form>
      {location?.stockMode === "DAYANSOFT" && (
        <p role="note" style={{ margin: "0 0 14px", padding: "10px 14px", borderRadius: 10, backgroundColor: C.amberBg, color: C.amber, fontSize: 14 }}>
          {location.name} салбар одоо Dayansoft дээр ажиллаж байгаа тул Ayo-д нөөц бүртгэгдээгүй. Идэвхжүүлсний дараа энд харагдана.
        </p>
      )}
      <ErrorText>{error || locationError}</ErrorText>
      <Table
        cols={[
          { key: "name", label: "Бараа" },
          { key: "onHand", label: "Үлдэгдэл", align: "right", width: 100 },
          { key: "reserved", label: "Нөөцөлсөн", align: "right", width: 100 },
          { key: "available", label: "Боломжит", align: "right", width: 100 },
          { key: "cost", label: "Дундаж өртөг", align: "right", width: 130 },
          { key: "value", label: "Үнэлгээ", align: "right", width: 120 },
          { key: "history", label: "", width: 90 },
        ]}
        rows={table}
        empty={rows === null ? "Бараа хайна уу." : "Олдсонгүй."}
      />
      {rows && rows.length > 0 && (
        <p style={{ textAlign: "right", color: C.muted, fontSize: 14, marginTop: 12 }}>
          Үр дүнгийн нийт үнэлгээ: <strong style={{ color: C.text }}>{formatMnt(total)}</strong>
          {rows.length >= 100 && " · эхний 100 бараа, хайлтаа нарийсгана уу"}
        </p>
      )}
      {open && <History row={open} locationId={locationId} locationName={nameOf(locationId)} token={token} onClose={() => setOpen(null)} />}
    </div>
  );
}
