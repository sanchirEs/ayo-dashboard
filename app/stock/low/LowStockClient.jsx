"use client";

/**
 * Дуусаж буй: items at or below their minimum, the minimums themselves, and a
 * suggested transfer from one branch to the ones running low (spec 10.5).
 * Suggestions skip branches still on Dayansoft: Ayo holds no stock for them.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createTransfer, lowStock, setLevel, suggestTransfers } from "@/lib/api/stock";
import { Button, C, Dialog, ErrorText, Field, Section, Table } from "@/components/pos/ui";
import { LocationSelect, VariantPicker, useLocations, useToken, variantTitle } from "@/components/stock/shared";

function LevelDialog({ token, locationId, locationName, onClose, onSaved }) {
  const [variant, setVariant] = useState(null);
  const [minQty, setMinQty] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const save = async (event) => {
    event.preventDefault();
    if (!variant) return setError("Бараагаа сонгоно уу");
    const n = Number(minQty);
    if (!Number.isInteger(n) || n < 0) return setError("Доод үлдэгдэл 0 буюу түүнээс их бүхэл тоо байна");
    setBusy(true);
    setError(null);
    try {
      await setLevel({ variantId: variant.id, locationId, minQty: n }, token);
      onSaved();
      onClose();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <Dialog title={`Доод үлдэгдэл · ${locationName}`} onClose={onClose}>
      <form onSubmit={save}>
        {variant ? (
          <p style={{ margin: "0 0 14px" }}>
            <strong>{variantTitle(variant)}</strong>{" "}
            <button type="button" onClick={() => setVariant(null)} style={{ background: "none", border: "none", color: C.blue, cursor: "pointer" }}>
              солих
            </button>
          </p>
        ) : (
          <div style={{ marginBottom: 14 }}>
            <VariantPicker token={token} onPick={setVariant} autoFocus />
          </div>
        )}
        <Field label="Доод үлдэгдэл (ширхэг)" hint="0 гэвэл доод үлдэгдлийг устгана">
          {(props) => <input {...props} type="number" min={0} step={1} value={minQty} onChange={(e) => setMinQty(e.target.value)} />}
        </Field>
        <ErrorText>{error}</ErrorText>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
          <Button kind="secondary" onClick={onClose}>Болих</Button>
          <Button type="submit" disabled={busy}>{busy ? "Хадгалж байна…" : "Хадгалах"}</Button>
        </div>
      </form>
    </Dialog>
  );
}

export default function LowStockClient() {
  const token = useToken();
  const { locations, nameOf, error: locationError } = useLocations(token);
  const ayoLocations = locations.filter((l) => l.stockMode === "AYO");
  const [locationId, setLocationId] = useState(null);
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [dialog, setDialog] = useState(false);

  const [fromId, setFromId] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [notice, setNotice] = useState(null);
  const [creating, setCreating] = useState(null);

  useEffect(() => {
    if (locationId == null && ayoLocations.length > 0) setLocationId(ayoLocations[0].id);
    if (fromId == null && ayoLocations.length > 0) setFromId(ayoLocations[0].id);
  }, [ayoLocations, locationId, fromId]);

  const load = useCallback(async () => {
    if (!token || locationId == null) return;
    setError(null);
    try {
      setRows(await lowStock(locationId, token));
    } catch (e) {
      setError(e.message);
    }
  }, [token, locationId]);

  useEffect(() => {
    load();
  }, [load]);

  const suggest = async () => {
    setNotice(null);
    setError(null);
    try {
      setSuggestions(await suggestTransfers(fromId, token));
    } catch (e) {
      setError(e.message);
    }
  };

  const makeDraft = async (s) => {
    setCreating(s.toLocationId);
    setError(null);
    try {
      const lines = s.lines.filter((l) => l.suggest > 0).map((l) => ({ variantId: l.variantId, qty: l.suggest }));
      const transfer = await createTransfer({ fromLocationId: fromId, toLocationId: s.toLocationId, lines, note: "Дуусаж буй барааны санал" }, token);
      setNotice(`${transfer.number} ноорог үүслээ. Шилжүүлэг хэсгээс илгээнэ үү.`);
      setSuggestions((prev) => prev.filter((x) => x.toLocationId !== s.toLocationId));
    } catch (e) {
      setError(e.message);
    }
    setCreating(null);
  };

  const table = (rows ?? []).map((r) => ({
    key: r.variantId,
    name: (
      <div>
        <div>{r.name}</div>
        <div style={{ color: C.muted, fontSize: 12 }}>{r.sku}</div>
      </div>
    ),
    available: <strong style={{ color: r.available <= 0 ? C.red : C.amber }}>{r.available}</strong>,
    minQty: r.minQty,
    onHand: r.onHand,
  }));

  return (
    <div className="wg-box">
      <Section
        title="Доод үлдэгдэлтэй хүрсэн бараа"
        description="Зарж болох тоо (үлдэгдэл − нөөцөлсөн) доод үлдэгдэл рүү хүрсэн бараанууд."
        actions={<Button onClick={() => setDialog(true)} disabled={locationId == null}>Доод үлдэгдэл тохируулах</Button>}
      >
        <div style={{ marginBottom: 14 }}>
          <LocationSelect locations={ayoLocations} value={locationId} onChange={setLocationId} />
        </div>
        <Table
          cols={[
            { key: "name", label: "Бараа" },
            { key: "available", label: "Боломжит", align: "right", width: 110 },
            { key: "minQty", label: "Доод", align: "right", width: 90 },
            { key: "onHand", label: "Үлдэгдэл", align: "right", width: 100 },
          ]}
          rows={table}
          empty={rows === null && !error ? "Ачаалж байна…" : "Дуусаж буй бараа алга."}
        />
      </Section>

      <Section
        title="Шилжүүлэх санал"
        description="Сонгосон салбараас бусад салбарт ямар бараа хэдийг илгээж болохыг тооцно. Зөвхөн Ayo-д нөөцөө хөтөлдөг салбарууд орно."
      >
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <LocationSelect locations={ayoLocations} value={fromId} onChange={setFromId} label="Хаанаас" />
          <Button onClick={suggest} disabled={fromId == null || !token}>Санал гаргах</Button>
        </div>
        {notice && (
          <p role="status" style={{ margin: "14px 0 0", padding: "10px 14px", borderRadius: 10, backgroundColor: C.greenBg, color: C.green, fontSize: 15 }}>
            {notice} <Link href="/stock/transfers" style={{ color: C.green, textDecoration: "underline" }}>Шилжүүлэг →</Link>
          </p>
        )}
        {suggestions && suggestions.length === 0 && <p style={{ color: C.muted, marginTop: 14 }}>Одоогоор шилжүүлэх зүйл алга.</p>}
        {(suggestions ?? []).map((s) => (
          <div key={s.toLocationId} style={{ marginTop: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <strong>{nameOf(s.toLocationId)} руу</strong>
              <Button onClick={() => makeDraft(s)} disabled={creating === s.toLocationId || s.lines.every((l) => l.suggest <= 0)}>
                {creating === s.toLocationId ? "Үүсгэж байна…" : "Шилжүүлэг үүсгэх"}
              </Button>
            </div>
            <Table
              cols={[
                { key: "name", label: "Бараа" },
                { key: "available", label: "Тэнд", align: "right", width: 80 },
                { key: "minQty", label: "Доод", align: "right", width: 80 },
                { key: "source", label: "Эндээс боломжит", align: "right", width: 150 },
                { key: "suggest", label: "Илгээх", align: "right", width: 90 },
              ]}
              rows={s.lines.map((l) => ({
                key: l.variantId,
                name: l.name,
                available: l.available,
                minQty: l.minQty,
                source: l.sourceAvailable,
                suggest: <strong>{l.suggest}</strong>,
              }))}
              empty="—"
            />
          </div>
        ))}
      </Section>

      <ErrorText>{error || locationError}</ErrorText>
      {dialog && <LevelDialog token={token} locationId={locationId} locationName={nameOf(locationId)} onClose={() => setDialog(false)} onSaved={load} />}
    </div>
  );
}
