"use client";

/**
 * Бүх гүйлгээ: every POS row for a date range, all branches or some, one tab per kind of
 * row, and one Excel workbook with all of it (spec 2026-11-15-pos-all-transactions §5).
 * The toolbar (dates, branches, cashier, search) narrows every tab and every sheet; the
 * filters under a column narrow only that tab.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchLedger } from "@/lib/api/reports";
import { LEDGER_TABS, METHOD_LABELS, METHODS } from "@/lib/reports/ledgerColumns";
import { applyColumnFilters, branchSummary, searchRows, SUMMARY_COLUMNS } from "@/lib/reports/ledgerTable";
import { downloadBlob, exportWorkbook } from "@/lib/reports/exportXlsx";
import { Button, C, ErrorText, inputStyle, labelStyle } from "@/components/pos/ui";
import { SMALL, useLocations, useToken } from "@/components/stock/shared";
import LedgerTable from "@/components/reports/LedgerTable";
import ReceiptPanel from "@/components/reports/ReceiptPanel";

const DAY_MS = 24 * 3600 * 1000;
const UB_MS = 8 * 3600 * 1000;
const ubToday = () => new Date(Date.now() + UB_MS).toISOString().slice(0, 10);
const shift = (date, days) => new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
const monthStart = (date) => `${date.slice(0, 8)}01`;
const fmt = (n) => Math.round(Number(n) || 0).toLocaleString("en-US");

function quickRanges() {
  const today = ubToday();
  const prevEnd = shift(monthStart(today), -1);
  return [
    ["Өнөөдөр", today, today],
    ["Өчигдөр", shift(today, -1), shift(today, -1)],
    ["7 хоног", shift(today, -6), today],
    ["Энэ сар", monthStart(today), today],
    ["Өмнөх сар", monthStart(prevEnd), prevEnd],
  ];
}

const sum = (rows, key, pred = () => true) => rows.reduce((a, r) => (pred(r) ? a + (Number(r[key]) || 0) : a), 0);

/** The figures above each tab's table, from the rows the filters left. */
function strip(tab, rows) {
  const done = (r) => r.status === "COMPLETED";
  switch (tab) {
    case "receipts":
      return [
        ["Баримт", rows.filter(done).length],
        ["Хүчингүй", rows.filter((r) => r.status === "VOIDED").length],
        ["Борлуулалт", fmt(sum(rows, "total", done))],
        ["Хөнгөлөлт", fmt(sum(rows, "allDiscount", done))],
        ["Буцаалт", fmt(sum(rows, "refunded", done))],
        ["Цэвэр", fmt(sum(rows, "netAfterReturns", done))],
        ["НӨАТ (баримтад)", fmt(sum(rows, "vatCharged", done))],
        ["Ашиг", fmt(sum(rows, "profit", (r) => done(r) && r.profit !== null))],
      ];
    case "lines": {
      const ok = (r) => r.saleStatus === "COMPLETED";
      return [
        ["Ширхэг", fmt(sum(rows, "qty", ok))],
        ["Дүн", fmt(sum(rows, "lineTotal", ok))],
        ["Буцаасан ширхэг", fmt(sum(rows, "qtyReturned", ok))],
        ["Цэвэр дүн", fmt(sum(rows, "netAmount", ok))],
        ["Ашиг", fmt(sum(rows, "lineProfit", (r) => ok(r) && r.lineProfit !== null))],
      ];
    }
    case "payments": {
      const counted = rows.filter((r) => r.counted);
      const out = METHODS.map((m) => [METHOD_LABELS[m], sum(counted, "amount", (r) => r.method === m)]).filter(([, v]) => v !== 0).map(([k, v]) => [k, fmt(v)]);
      out.push(["Нийт", fmt(sum(counted, "amount"))]);
      const unmatched = rows.filter((r) => r.kind === "QPAY_UNMATCHED");
      if (unmatched.length) out.push(["Баримтгүй QPay", `${unmatched.length} ш, ${fmt(sum(unmatched, "amount"))}`, C.amber]);
      return out;
    }
    case "returns": {
      const once = new Map(rows.map((r) => [r.returnId, r]));
      const list = [...once.values()];
      return [
        ["Буцаалт", list.filter((r) => r.kind === "REFUND").length],
        ["Буцаасан дүн", fmt(sum(list, "returnTotal", (r) => r.kind === "REFUND"))],
        ["Хүчингүй", list.filter((r) => r.kind === "VOID").length],
        ["Хүчингүйн дүн", fmt(sum(list, "returnTotal", (r) => r.kind === "VOID"))],
      ];
    }
    case "shifts": {
      const variance = sum(rows, "variance");
      return [
        ["Ээлж", rows.length],
        ["Нийт зөрүү", fmt(variance), variance < 0 ? C.red : variance > 0 ? C.green : undefined],
        ["Дутсан", rows.filter((r) => r.variance < 0).length],
        ["Илүүдсэн", rows.filter((r) => r.variance > 0).length],
      ];
    }
    case "cash":
      return [
        ["Орлого", fmt(sum(rows, "amount", (r) => r.type === "IN"))],
        ["Зарлага", fmt(sum(rows, "amount", (r) => r.type === "OUT"))],
        ["Касс нээсэн", rows.filter((r) => r.type === "NO_SALE").length],
      ];
    case "handovers":
      return [["Олгосон", rows.length], ["Дүн", fmt(sum(rows, "orderTotal"))]];
    default:
      return [];
  }
}

function BranchPicker({ locations, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);
  const label = value.length === 0 ? "Бүх салбар" : locations.filter((l) => value.includes(l.id)).map((l) => l.name).join(", ");
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <span style={labelStyle}>Салбар</span>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} style={{ ...inputStyle, minWidth: 200, maxWidth: 320, textAlign: "left", cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {label}
      </button>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 4, zIndex: 40, minWidth: 240, backgroundColor: "#fff", border: `1px solid ${C.line}`, borderRadius: 8, boxShadow: "0 8px 24px rgba(17,24,39,.12)", padding: 6 }}>
          <label style={pickRow}>
            <input type="checkbox" checked={value.length === 0} onChange={() => onChange([])} /> Бүх салбар
          </label>
          {locations.map((l) => (
            <label key={l.id} style={pickRow}>
              <input
                type="checkbox"
                checked={value.includes(l.id)}
                onChange={(e) => onChange(e.target.checked ? [...value, l.id] : value.filter((id) => id !== l.id))}
              />
              {l.name}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

const pickRow = { display: "flex", gap: 8, alignItems: "center", padding: "7px 8px", fontSize: 14, color: C.text, cursor: "pointer" };

export default function AllTransactionsClient() {
  const token = useToken();
  const { locations, error: locationError } = useLocations(token);
  const [from, setFrom] = useState(() => monthStart(ubToday()));
  const [to, setTo] = useState(() => ubToday());
  const [locationIds, setLocationIds] = useState([]);
  const [cashierId, setCashierId] = useState("");
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("receipts");
  const [data, setData] = useState({}); // tab -> { rows, totals, truncated, notes, error, loading }
  const [filters, setFilters] = useState({}); // tab -> { colKey: text }
  const [openSale, setOpenSale] = useState(null);
  const [staff, setStaff] = useState([]); // [{ id, name }] seen in any loaded tab
  const generation = useRef(0);

  const load = useCallback(() => {
    if (!token || !from || !to || from > to) return;
    const run = ++generation.current;
    setData(Object.fromEntries(LEDGER_TABS.map((t) => [t.key, { rows: [], loading: true }])));
    for (const t of LEDGER_TABS) {
      fetchLedger(t.key, { from, to, locationIds, cashierId: cashierId || null }, token)
        .then((result) => run === generation.current && setData((d) => ({ ...d, [t.key]: { ...result, loading: false } })))
        .catch((e) => run === generation.current && setData((d) => ({ ...d, [t.key]: { rows: [], error: e.message, loading: false } })));
    }
  }, [token, from, to, locationIds, cashierId]);

  useEffect(() => {
    load();
  }, [load]);

  // Cashier choices come from the rows, and survive narrowing to one cashier.
  useEffect(() => {
    const seen = new Map(staff.map((s) => [s.id, s.name]));
    for (const t of LEDGER_TABS) {
      for (const r of data[t.key]?.rows ?? []) {
        const name = r.cashierName ?? r.staffName ?? r.openedByName;
        if (r.cashierId && name && !seen.has(r.cashierId)) seen.set(r.cashierId, name);
      }
    }
    if (seen.size !== staff.length) setStaff([...seen].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name)));
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  // Toolbar search, then each tab's own column filters.
  const searched = useMemo(
    () => Object.fromEntries(LEDGER_TABS.map((t) => [t.key, searchRows(data[t.key]?.rows ?? [], t.columns, search)])),
    [data, search],
  );
  const filtered = useMemo(
    () => Object.fromEntries(LEDGER_TABS.map((t) => [t.key, applyColumnFilters(searched[t.key], t.columns, filters[t.key] ?? {})])),
    [searched, filters],
  );

  const anyLoading = LEDGER_TABS.some((t) => data[t.key]?.loading);
  const tab = LEDGER_TABS.find((t) => t.key === active);
  const current = data[active] ?? {};
  const rangeEnd = useMemo(() => new Date(Date.parse(`${to}T00:00:00Z`) + DAY_MS - UB_MS), [to]);

  const download = () => {
    const branchNames = locationIds.length ? locations.filter((l) => locationIds.includes(l.id)).map((l) => l.name) : [];
    const cashierName = cashierId ? staff.find((s) => s.id === cashierId)?.name : null;
    const summary = branchSummary(Object.fromEntries(LEDGER_TABS.map((t) => [t.key, searched[t.key]])));
    const notes = [
      ["Хугацаа", `${from} – ${to} (Улаанбаатарын цагаар)`],
      ["Салбар", branchNames.length ? branchNames.join(", ") : "Бүх салбар"],
      ["Кассчин", cashierName || "Бүгд"],
      ["Хайлт", search || "—"],
      ["Татсан", new Date(Date.now() + UB_MS).toISOString().slice(0, 16).replace("T", " ")],
      ["Шүүлтүүр", "Хугацаа, салбар, кассчин, хайлт бүх хуудсанд үйлчилнэ. Баганын шүүлтүүр зөвхөн тухайн хуудсанд үйлчилнэ. Салбараар хуудас баганын шүүлтүүрийг тооцохгүй."],
      ["НӨАТ", "«НӨАТ (баримтад)» бол бодит нэхэмжилсэн НӨАТ: и-баримт гарсан бол, эс бөгөөс 0 (касс 0.00 хэвлэдэг). «НӨАТ (тооцоолсон 1/11)» бол систем бодсон дүн."],
      ["Буцаалт", "Баримт, бараа хуудсанд зөвхөн сонгосон хугацааны төгсгөл хүртэл хийсэн буцаалтыг хасна. Буцаалт хуудас буцаалтыг өөрийн огноогоор жагсаана."],
      ["Хүчингүй баримт", "Жагсаалтад байгаа ч нийт дүнд орохгүй."],
      ["Баримтгүй QPay", "QPay төлөгдсөн ч касс баримтаа илгээгээгүй. Нийт дүнд орохгүй, шалгах хэрэгтэй."],
      ...LEDGER_TABS.filter((t) => data[t.key]?.truncated).map((t) => ["АНХААР", `${t.title}: 50,000-аас олон мөр байсан тул зөвхөн эхний 50,000 орсон. Хугацааг богиносгоно уу.`]),
      ...LEDGER_TABS.filter((t) => data[t.key]?.error).map((t) => ["АНХААР", `${t.title}: татаж чадсангүй (${data[t.key].error}).`]),
    ];
    const explainRows = [
      ...notes.map(([a, b]) => ({ sheet: a, column: "", explain: b })),
      { sheet: "", column: "", explain: "" },
      ...SUMMARY_COLUMNS.map((c) => ({ sheet: "Салбараар", column: c.header, explain: c.explain })),
      ...LEDGER_TABS.flatMap((t) => t.columns.map((c) => ({ sheet: t.sheet, column: c.header, explain: c.explain }))),
    ];
    const explainCols = [
      { key: "sheet", header: "Хуудас", type: "text", explain: "" },
      { key: "column", header: "Багана", type: "text", explain: "" },
      { key: "explain", header: "Тайлбар", type: "text", explain: "" },
    ];
    const blob = exportWorkbook([
      { name: "Салбараар", columns: SUMMARY_COLUMNS, rows: summary },
      ...LEDGER_TABS.map((t) => ({ name: t.sheet, columns: t.columns, rows: filtered[t.key] })),
      { name: "Тайлбар", columns: explainCols, rows: explainRows },
    ]);
    const suffix = [branchNames.join(", "), cashierName].filter(Boolean).join(" ");
    downloadBlob(blob, `POS бүх гүйлгээ ${from}_${to}${suffix ? ` ${suffix}` : ""}.xlsx`.replace(/[\\/:*?"<>|]/g, " "));
  };

  return (
    <div className="wg-box" style={{ fontSize: 14 }}>
      <p style={{ margin: "0 0 16px", color: C.muted, fontSize: 15, maxWidth: 760 }}>
        Кассын бүх гүйлгээ мөр мөрөөр: баримт, бараа, төлбөр, буцаалт, ээлж, кассын орлого зарлага, олгосон онлайн захиалга.
        Мөр дээр дарж баримтыг бүтнээр нь харна. Excel файлд бүх хуудас, бүх багана орно.
      </p>

      <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 10 }}>
        <label>
          <span style={labelStyle}>Эхлэх</span>
          <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} style={{ ...inputStyle, minWidth: 150 }} />
        </label>
        <label>
          <span style={labelStyle}>Дуусах</span>
          <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} style={{ ...inputStyle, minWidth: 150 }} />
        </label>
        <BranchPicker locations={locations} value={locationIds} onChange={setLocationIds} />
        <label>
          <span style={labelStyle}>Кассчин</span>
          <select value={cashierId} onChange={(e) => setCashierId(e.target.value)} style={{ ...inputStyle, minWidth: 160 }}>
            <option value="">Бүгд</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
        <label style={{ flex: "1 1 220px" }}>
          <span style={labelStyle}>Хайх</span>
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Баримт №, бараа, SKU, баркод, утас…" style={inputStyle} />
        </label>
        <Button kind="secondary" style={SMALL} onClick={load} disabled={anyLoading || !token}>{anyLoading ? "Ачаалж байна…" : "Шинэчлэх"}</Button>
        <Button style={{ ...SMALL, height: 40 }} onClick={download} disabled={anyLoading || !token}>Excel татах</Button>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
        {quickRanges().map(([label, a, b]) => {
          const on = from === a && to === b;
          return (
            <button
              key={label}
              type="button"
              onClick={() => { setFrom(a); setTo(b); }}
              style={{ height: 28, padding: "0 12px", fontSize: 13, borderRadius: 14, border: `1px solid ${on ? C.blue : C.line}`, backgroundColor: on ? "#eff6ff" : "#fff", color: on ? C.blue : C.text, cursor: "pointer" }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <ErrorText>{locationError}</ErrorText>

      <div role="tablist" aria-label="Гүйлгээний төрөл" style={{ display: "flex", gap: 2, borderBottom: `1px solid ${C.line}`, marginBottom: 14, overflowX: "auto" }}>
        {LEDGER_TABS.map((t) => {
          const on = t.key === active;
          const d = data[t.key];
          return (
            <button
              key={t.key}
              role="tab"
              type="button"
              aria-selected={on}
              onClick={() => setActive(t.key)}
              style={{
                padding: "10px 14px", fontSize: 14, border: "none", background: "none", cursor: "pointer", whiteSpace: "nowrap",
                color: on ? C.text : C.muted, fontWeight: on ? 600 : 400, borderBottom: `2px solid ${on ? C.blue : "transparent"}`, marginBottom: -1,
              }}
            >
              {t.title}{" "}
              <span style={{ color: d?.error ? C.red : C.faint, fontVariantNumeric: "tabular-nums" }}>
                {d?.loading ? "…" : d?.error ? "!" : (filtered[t.key]?.length ?? 0).toLocaleString("en-US")}
              </span>
            </button>
          );
        })}
      </div>

      {current.error && <ErrorText>{current.error}</ErrorText>}
      {(current.notes ?? []).map((note) => (
        <p key={note} role="note" style={{ margin: "0 0 10px", padding: "8px 12px", borderRadius: 8, backgroundColor: C.amberBg, color: C.amber, fontSize: 14 }}>{note}</p>
      ))}

      <dl style={{ display: "flex", flexWrap: "wrap", gap: "6px 28px", margin: "0 0 14px", fontVariantNumeric: "tabular-nums" }}>
        {strip(active, filtered[active] ?? []).map(([k, v, color]) => (
          <div key={k}>
            <dt style={{ fontSize: 12, color: C.muted, margin: 0 }}>{k}</dt>
            <dd style={{ fontSize: 17, fontWeight: 600, margin: "3px 0 0", color: color || C.text }}>{v}</dd>
          </div>
        ))}
      </dl>

      <LedgerTable
        key={active}
        tab={active}
        columns={tab.columns}
        rows={filtered[active] ?? []}
        allRows={searched[active] ?? []}
        filters={filters[active] ?? {}}
        onFilters={(f) => setFilters((all) => ({ ...all, [active]: f }))}
        onOpenSale={setOpenSale}
        loading={current.loading}
        empty={search || Object.values(filters[active] ?? {}).some(Boolean) ? "Шүүлтүүрт тохирох мөр алга." : "Энэ хугацаанд гүйлгээ алга."}
      />

      {openSale && token && <ReceiptPanel saleId={openSale} token={token} rangeEnd={rangeEnd} onClose={() => setOpenSale(null)} />}
    </div>
  );
}
