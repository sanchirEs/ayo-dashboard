"use client";

/**
 * Залруулга: write-offs and finds with a reason (damaged, expired, tester, lost,
 * gift) or a find (spec 10.4). The reason rides on the movement so reports can
 * keep testers out of both sales and losses. FOUND adds stock; the rest take it out,
 * so the person enters a plain count and the page signs it.
 */

import { useCallback, useEffect, useState } from "react";
import { createAdjustment, listAdjustments } from "@/lib/api/stock";
import { ADJUSTMENT_LABEL, ADJUSTMENT_REASONS, adjustmentSign, signed } from "@/lib/stock/labels";
import { Button, C, Dialog, ErrorText, Pill, Table, ago, inputStyle, labelStyle } from "@/components/pos/ui";
import { LinesEditor, LocationSelect, Toolbar, useLocations, useToken, useVariantNames } from "@/components/stock/shared";

function NewAdjustment({ token, locations, onClose, onSaved }) {
  const [locationId, setLocationId] = useState(null);
  const [reason, setReason] = useState("DAMAGED");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const sign = adjustmentSign(reason);

  const save = async () => {
    if (locationId == null) return setError("Салбараа сонгоно уу");
    if (lines.some((l) => !Number.isInteger(l.qty) || l.qty <= 0)) return setError("Тоо ширхэг эерэг бүхэл тоо байх ёстой");
    setBusy(true);
    setError(null);
    try {
      await createAdjustment(
        { locationId, reason, note: note.trim() || undefined, lines: lines.map((l) => ({ variantId: l.variant.id, qty: sign * l.qty })) },
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
    <Dialog title="Шинэ залруулга" onClose={onClose} width={720}>
      <Toolbar>
        <LocationSelect locations={locations} value={locationId} onChange={setLocationId} />
        <label>
          <span style={labelStyle}>Шалтгаан</span>
          <select value={reason} onChange={(e) => setReason(e.target.value)} style={{ ...inputStyle, minWidth: 200 }}>
            {ADJUSTMENT_REASONS.map((r) => (
              <option key={r} value={r}>{ADJUSTMENT_LABEL[r]}</option>
            ))}
          </select>
        </label>
      </Toolbar>
      <p style={{ margin: "0 0 12px", fontSize: 14, color: sign > 0 ? C.green : C.amber }}>
        {sign > 0 ? "Олдсон бараа үлдэгдэлд нэмэгдэнэ." : "Эдгээр бараа үлдэгдлээс хасагдана."}
      </p>
      <LinesEditor token={token} lines={lines} onChange={setLines} qtyLabel={sign > 0 ? "Олдсон тоо" : "Хасах тоо"} />
      <label style={{ display: "block", marginTop: 14 }}>
        <span style={labelStyle}>Тайлбар</span>
        <input value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle} />
      </label>
      <ErrorText>{error}</ErrorText>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
        <Button kind="secondary" onClick={onClose}>Болих</Button>
        <Button onClick={save} disabled={busy || lines.length === 0}>{busy ? "Хадгалж байна…" : "Хадгалах"}</Button>
      </div>
    </Dialog>
  );
}

export default function AdjustmentsClient() {
  const token = useToken();
  const { locations, nameOf, error: locationError } = useLocations(token);
  const [locationId, setLocationId] = useState(null);
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const nameFor = useVariantNames((rows ?? []).flatMap((a) => a.lines.map((l) => l.variantId)), token);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      setRows(await listAdjustments(token, locationId ?? undefined));
    } catch (e) {
      setError(e.message);
    }
  }, [token, locationId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="wg-box">
      <Toolbar>
        <LocationSelect locations={locations} value={locationId} onChange={setLocationId} allowAll />
        <div style={{ flex: 1 }} />
        <Button onClick={() => setCreating(true)} disabled={locations.length === 0}>Шинэ залруулга</Button>
      </Toolbar>
      <ErrorText>{error || locationError}</ErrorText>
      <Table
        cols={[
          { key: "at", label: "Хэзээ", width: 130 },
          { key: "location", label: "Салбар", width: 180 },
          { key: "reason", label: "Шалтгаан", width: 160 },
          { key: "items", label: "Бараа" },
        ]}
        rows={(rows ?? []).map((a) => ({
          key: a.id,
          at: ago(a.createdAt),
          location: nameOf(a.locationId),
          reason: <Pill tone={a.reason === "FOUND" ? "green" : a.reason === "TESTER" ? "blue" : "amber"}>{ADJUSTMENT_LABEL[a.reason] ?? a.reason}</Pill>,
          items: (
            <div>
              {a.lines.map((l) => (
                <div key={l.variantId}>
                  {nameFor(l.variantId)} <strong style={{ color: l.qty < 0 ? C.red : C.green }}>{signed(l.qty)}</strong>
                </div>
              ))}
              {a.note && <div style={{ color: C.muted, fontSize: 12 }}>{a.note}</div>}
            </div>
          ),
        }))}
        empty={rows === null && !error ? "Ачаалж байна…" : "Залруулга алга."}
      />
      {creating && <NewAdjustment token={token} locations={locations} onClose={() => setCreating(false)} onSaved={load} />}
    </div>
  );
}
