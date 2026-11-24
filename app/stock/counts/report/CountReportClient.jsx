"use client";

/**
 * Тооллогын тайлан: every item a branch counted, with where its system number came
 * from (the previous count, goods in, sales, transfers, other) and the difference
 * at selling price. Opens on the branch's latest count day; ?countId= opens one count.
 *
 * The table header reads as the equation it checks:
 *   Эхний + Орлого − Зарлага + Ирсэн − Явсан ± Бусад = Систем,  Тоолсон − Систем = Зөрүү.
 * Inline px styles on purpose (Remos sets html{font-size:62.5%}).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getCountDays, getCountReport } from "@/lib/api/stock";
import { formatMnt } from "@/lib/partners/format";
import { COUNT_STATUS } from "@/lib/stock/labels";
import { COUNT_EXPORT_COLUMNS, COUNT_REPORT_FILTERS, exportRows, filterCountRows, rowTitle, ubTime, ubToday } from "@/lib/stock/countReport";
import { downloadBlob, exportXlsx } from "@/lib/reports/exportXlsx";
import { Button, C, ErrorText, Pill, inputStyle, labelStyle } from "@/components/pos/ui";
import { LocationSelect, SMALL, Toolbar, useLocations, useToken } from "@/components/stock/shared";

const TAB = { fontVariantNumeric: "tabular-nums" };
const RESULT_BG = "#f8fafc"; // the computed columns: a whisper of tint, not a card
const fmt = (n) => n.toLocaleString("en-US");
const plus = (n) => (n > 0 ? `+${fmt(n)}` : fmt(n));
// Narrow equation columns: a million or more shrinks to "1.2 сая"; the full number is in the tooltip.
const fit = (n, signed = false) => {
  const text = Math.abs(n) >= 1e6 ? `${(n / 1e6).toFixed(1)} сая` : fmt(n);
  return signed && n > 0 ? `+${text}` : text;
};
const shortMnt = (n) => {
  const a = Math.abs(n);
  const s = a >= 1e9 ? `${(a / 1e9).toFixed(1)} тэрбум` : a >= 1e6 ? `${(a / 1e6).toFixed(1)} сая` : fmt(a);
  return `${n < 0 ? "−" : n > 0 ? "+" : ""}${s}₮`;
};

/** Shortage against surplus, from one zero line. Net value rides on top. */
function Balance({ t }) {
  const short = Math.abs(t.shortValue);
  const over = t.overValue;
  const max = Math.max(short, over, 1);
  const netColor = t.netValue < 0 ? C.red : t.netValue > 0 ? C.green : C.text;
  if (short === 0 && over === 0) {
    return <p style={{ margin: "6px 0 18px", fontSize: 16 }}>Зөрүү алга: тоолсон бүх бараа системтэй таарсан.</p>;
  }
  return (
    <section aria-label="Зөрүүний тэнцэл" style={{ margin: "6px 0 18px" }}>
      <div style={{ textAlign: "center", fontSize: 13, color: C.muted }}>Цэвэр зөрүү</div>
      <div style={{ textAlign: "center", fontSize: 26, fontWeight: 700, color: netColor, ...TAB }} title={formatMnt(t.netValue)}>
        {formatMnt(t.netValue)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2px 1fr", alignItems: "center", gap: 0, marginTop: 10 }}>
        <div style={{ display: "flex", justifyContent: "flex-end", height: 14 }}>
          <div style={{ width: `${(short / max) * 100}%`, minWidth: short ? 3 : 0, background: C.red, borderRadius: "7px 0 0 7px" }} />
        </div>
        <div style={{ height: 26, background: C.text }} aria-hidden="true" />
        <div style={{ display: "flex", height: 14 }}>
          <div style={{ width: `${(over / max) * 100}%`, minWidth: over ? 3 : 0, background: C.green, borderRadius: "0 7px 7px 0" }} />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginTop: 8, flexWrap: "wrap", ...TAB }}>
        <div style={{ flex: "1 1 180px" }}>
          <div style={{ color: C.red, fontWeight: 600, fontSize: 16 }}>Дутуу {formatMnt(t.shortValue)}</div>
          <div style={{ color: C.muted, fontSize: 13 }}>{fmt(t.shortUnits)} ширхэг</div>
        </div>
        <div style={{ textAlign: "right", flex: "1 1 180px" }}>
          <div style={{ color: C.green, fontWeight: 600, fontSize: 16 }}>Илүү {formatMnt(t.overValue)}</div>
          <div style={{ color: C.muted, fontSize: 13 }}>{plus(t.overUnits)} ширхэг</div>
        </div>
      </div>
    </section>
  );
}

/** The counts in view, folded to one line. */
function CountsLine({ counts }) {
  if (counts.length === 0) {
    return (
      <p style={{ color: C.muted, margin: "8px 0 14px", fontSize: 15 }}>
        Энэ хугацаанд тооллого алга. Дээрээс тоолсон өдрөө сонгох эсвэл огноогоо өргөтгөнө үү.
      </p>
    );
  }
  const first = ubTime(counts[0].startedAt);
  const last = ubTime(counts[counts.length - 1].startedAt);
  const span = first.slice(0, 10) === last.slice(0, 10) ? `${first}–${last.slice(11)}` : `${first} – ${last}`;
  const pending = counts.filter((c) => c.status !== "APPROVED").length;
  return (
    <details style={{ margin: "4px 0 10px", fontSize: 14 }}>
      <summary style={{ cursor: "pointer", color: C.text }}>
        <strong>{counts.length === 1 ? counts[0].number : `${counts.length} тооллого`}</strong>
        <span style={{ color: C.muted }}>, {counts.length === 1 ? first : span}</span>
        {pending > 0 && <span style={{ color: C.amber }}>, {pending} нь батлагдаагүй</span>}
      </summary>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 8 }}>
        {counts.map((c) => {
          const [tone, text] = COUNT_STATUS[c.status] ?? ["gray", c.status];
          return (
            <span key={c.id} style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
              <strong>{c.number}</strong> <Pill tone={tone}>{text}</Pill> <span style={{ color: C.muted, fontSize: 13 }}>{ubTime(c.startedAt)}</span>
            </span>
          );
        })}
      </div>
    </details>
  );
}

// Column plan. `op` is the sign the column carries in the equation.
const FLOW = [
  { key: "opening", label: "Эхний", op: "", title: "Өмнөх тооллогын тоолсон тоо, эсвэл нээлтийн үлдэгдэл" },
  { key: "received", label: "Орлого", op: "+" },
  { key: "sold", label: "Зарлага", op: "−", title: "Касс, онлайн борлуулалт (буцаалтыг хассан)" },
  { key: "transferIn", label: "Ирсэн", op: "+", title: "Өөр салбараас шилжиж ирсэн" },
  { key: "transferOut", label: "Явсан", op: "−", title: "Өөр салбар руу шилжүүлсэн" },
  { key: "other", label: "Бусад", op: "±", title: "Залруулга, сет угсралт" },
];
const UNEXPLAINED = { key: "unexplained", label: "Тайлбаргүй", op: "±", title: "Хөдөлгөөнөөр тайлбарлагдахгүй өөрчлөлт" };

const th = { padding: "8px 10px", color: C.muted, fontWeight: 600, fontSize: 13, border: "none", whiteSpace: "nowrap", background: "#fff" };
const td = { padding: "10px", border: "none", borderBottom: `1px solid ${C.line}`, verticalAlign: "top", fontSize: 14, ...TAB };
const right = { textAlign: "right" };
// The product stays in view while the equation scrolls sideways.
const stick = { position: "sticky", left: 0, zIndex: 1, background: "#fff", boxShadow: `1px 0 0 ${C.line}` };
const zero = <span style={{ color: C.faint }}>0</span>;
const cell = (n) => (n === 0 ? zero : <span title={fmt(n)}>{fit(n)}</span>);

function ReportTable({ rows, showUnexplained, busy }) {
  const flow = showUnexplained ? [...FLOW, UNEXPLAINED] : FLOW;
  const groupBorder = `2px solid ${C.line}`;
  return (
    <div style={{ overflowX: "auto", border: `1px solid ${C.line}`, borderRadius: 8 }}>
      <table style={{ width: "100%", minWidth: showUnexplained ? 1200 : 1110, borderCollapse: "separate", borderSpacing: 0, tableLayout: "fixed", border: "none" }}>
        <colgroup>
          <col style={{ width: 240 }} />
          <col style={{ width: 80 }} />
          {flow.map((c) => <col key={c.key} style={{ width: c.key === "opening" ? 80 : c.key === "unexplained" ? 100 : 74 }} />)}
          <col style={{ width: 80 }} />
          <col style={{ width: 82 }} />
          <col style={{ width: 76 }} />
          <col style={{ width: 124 }} />
        </colgroup>
        <thead>
          <tr>
            <th style={{ ...th, ...stick, borderBottom: "none" }} />
            <th style={{ ...th, borderBottom: "none" }} />
            <th style={{ ...th, ...right, color: C.text, borderBottom: groupBorder, borderLeft: groupBorder }} colSpan={flow.length + 1}>
              Системийн тоо хэрхэн гарсан
            </th>
            <th style={{ ...th, ...right, color: C.text, borderBottom: groupBorder, borderLeft: groupBorder }} colSpan={3}>Тооллого</th>
          </tr>
          <tr>
            <th style={{ ...th, ...stick, borderBottom: `1px solid ${C.line}` }}>Бараа</th>
            <th style={{ ...th, ...right, borderBottom: `1px solid ${C.line}` }}>Үнэ</th>
            {flow.map((c, i) => (
              <th key={c.key} title={c.title} style={{ ...th, ...right, borderBottom: `1px solid ${C.line}`, ...(i === 0 ? { borderLeft: groupBorder } : {}) }}>
                {c.op && <span style={{ color: C.faint, marginRight: 4 }}>{c.op}</span>}
                {c.label}
              </th>
            ))}
            <th style={{ ...th, ...right, color: C.text, background: RESULT_BG, borderBottom: `1px solid ${C.line}` }}>
              <span style={{ color: C.faint, marginRight: 4 }}>=</span>Систем
            </th>
            <th style={{ ...th, ...right, color: C.text, borderBottom: `1px solid ${C.line}`, borderLeft: groupBorder }}>Тоолсон</th>
            <th style={{ ...th, ...right, borderBottom: `1px solid ${C.line}` }}>Зөрүү</th>
            <th style={{ ...th, ...right, borderBottom: `1px solid ${C.line}` }}>Зөрүү дүн</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={flow.length + 7} style={{ ...td, textAlign: "center", color: C.faint, padding: "28px 10px", borderBottom: "none" }}>
                {busy ? "Ачаалж байна…" : "Энэ шүүлтэд тохирох бараа алга."}
              </td>
            </tr>
          )}
          {rows.map((r) => {
            const tone = r.diff < 0 ? C.red : r.diff > 0 ? C.green : C.faint;
            return (
              <tr key={`${r.countId}:${r.variantId}`}>
                <td style={{ ...td, ...stick, overflowWrap: "anywhere" }}>
                  <div style={{ fontWeight: 500 }}>{rowTitle(r)}</div>
                  <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>
                    {[r.barcode, r.countNumber].filter(Boolean).join(", ")}
                    {r.previousCountNumber ? `, өмнө ${r.previousCountNumber} (${ubTime(r.previousCountedAt).slice(0, 10)})` : ", анхны тооллого"}
                  </div>
                </td>
                <td style={{ ...td, ...right, color: C.muted }} title={fmt(r.price)}>{fit(r.price)}</td>
                {flow.map((c, i) => {
                  const v = r[c.key];
                  const warn = c.key === "unexplained" && v !== 0;
                  return (
                    <td key={c.key} style={{ ...td, ...right, ...(i === 0 ? { borderLeft: groupBorder } : {}), ...(warn ? { color: C.amber, fontWeight: 600 } : {}) }}>
                      {warn ? <span title={plus(v)}>{fit(v, true)}</span> : cell(v)}
                    </td>
                  );
                })}
                <td style={{ ...td, ...right, background: RESULT_BG, fontWeight: 600 }} title={fmt(r.expected)}>{fit(r.expected)}</td>
                <td style={{ ...td, ...right, fontWeight: 600, borderLeft: groupBorder }} title={fmt(r.counted)}>{fit(r.counted)}</td>
                <td style={{ ...td, ...right, color: tone, fontWeight: r.diff ? 700 : 400 }}>{r.diff ? <span title={plus(r.diff)}>{fit(r.diff, true)}</span> : "0"}</td>
                <td style={{ ...td, ...right, color: tone }} title={formatMnt(r.diffValue)}>{r.diffValue ? (Math.abs(r.diffValue) >= 1e9 ? shortMnt(r.diffValue) : formatMnt(r.diffValue)) : zero}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function CountReportClient() {
  const token = useToken();
  const params = useSearchParams();
  const countId = params.get("countId");
  const { locations, nameOf, error: locationError } = useLocations(token);
  const [locationId, setLocationId] = useState(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [days, setDays] = useState([]);
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [single, setSingle] = useState(countId);

  // Only the latest request may land: a slow report for the previous branch must not
  // replace the one the person is now looking at.
  const latest = useRef(0);
  const load = useCallback(async (query) => {
    if (!token) return;
    const ticket = ++latest.current;
    setBusy(true);
    setError(null);
    try {
      const r = await getCountReport(token, query);
      if (ticket !== latest.current) return;
      setReport(r);
      if (query.countId) setLocationId(r.locationId);
    } catch (e) {
      if (ticket !== latest.current) return;
      setError(e.message);
      setReport(null);
    } finally {
      if (ticket === latest.current) setBusy(false);
    }
  }, [token]);

  // One count from the Тооллого page.
  useEffect(() => {
    if (single) load({ countId: single });
  }, [single, load]);

  // Pick the branch's latest count day, then load it.
  useEffect(() => {
    if (!token || locationId == null || single) return;
    let live = true;
    getCountDays(token, locationId)
      .then((d) => {
        if (!live) return;
        setDays(d);
        const day = d[0]?.day ?? ubToday();
        setFrom(day);
        setTo(day);
        load({ locationId, from: day, to: day });
      })
      .catch((e) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [token, locationId, single, load]);

  const all = report?.rows ?? [];
  const rows = useMemo(() => filterCountRows(all, filter, search), [all, filter, search]);
  const counts = useMemo(
    () => Object.fromEntries(COUNT_REPORT_FILTERS.map(([key]) => [key, filterCountRows(all, key, "").length])),
    [all],
  );
  const t = report?.totals;
  const showUnexplained = all.some((r) => r.unexplained !== 0);

  const exportFile = () => {
    const columns = COUNT_EXPORT_COLUMNS.filter((c) => c.key !== "unexplained" || showUnexplained);
    const name = report?.counts?.length === 1 ? report.counts[0].number : `${from}_${to}`;
    downloadBlob(exportXlsx({ sheetName: "Тооллого", columns, rows: exportRows(rows) }), `Тооллого_${nameOf(report.locationId)}_${name}.xlsx`);
  };

  const pickDay = (day) => {
    if (!day) return;
    setFrom(day);
    setTo(day);
    load({ locationId, from: day, to: day });
  };

  return (
    <div className="wg-box">
      <Toolbar>
        {single ? (
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 16 }}>
              <strong>{report?.counts?.[0]?.number ?? "Тооллого"}</strong>
              {report && <span style={{ color: C.muted }}>, {nameOf(report.locationId)}</span>}
            </span>
            <Button kind="secondary" style={SMALL} onClick={() => setSingle(null)}>Салбарын бүх тооллогыг харах</Button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
            <LocationSelect locations={locations} value={locationId} onChange={setLocationId} />
            {days.length > 0 && (
              <label>
                <span style={labelStyle}>Тоолсон өдөр</span>
                <select value={from === to ? from : ""} onChange={(e) => pickDay(e.target.value)} style={{ ...inputStyle, width: 190 }}>
                  {from !== to && <option value="">Олон өдөр</option>}
                  {!days.some((d) => d.day === from) && from === to && <option value={from}>{from}</option>}
                  {days.map((d) => (
                    <option key={d.day} value={d.day}>{d.day} ({d.counts})</option>
                  ))}
                </select>
              </label>
            )}
            <label>
              <span style={labelStyle}>Эхлэх</span>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ ...inputStyle, width: 160 }} />
            </label>
            <label>
              <span style={labelStyle}>Дуусах</span>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ ...inputStyle, width: 160 }} />
            </label>
            <Button disabled={busy || locationId == null || !from || !to} onClick={() => load({ locationId, from, to })}>
              {busy ? "Ачаалж байна…" : "Харах"}
            </Button>
          </div>
        )}
      </Toolbar>

      <ErrorText>{error || locationError}</ErrorText>
      {locations.find((l) => l.id === locationId)?.stockMode === "DAYANSOFT" && (
        <p style={{ background: C.amberBg, color: C.amber, padding: "10px 12px", borderRadius: 8, fontSize: 14, maxWidth: 720 }}>
          Энэ салбар Dayansoft-оор үлдэгдлээ хөтөлдөг тул манай системийн тоо бодит биш. Тайлангийн зөрүүг итгэж болохгүй.
        </p>
      )}
      {!single && locationId == null && (
        <p style={{ color: C.muted, fontSize: 15, maxWidth: 640 }}>
          Салбараа сонгоно уу. Тухайн салбарын хамгийн сүүлд тоолсон өдөр нээгдэнэ.
        </p>
      )}

      {report && t && (
        <>
          <CountsLine counts={report.counts} />
        </>
      )}

      {report && t && report.counts.length > 0 && (
        <>
          <Balance t={t} />

          <p style={{ margin: "0 0 14px", fontSize: 14, color: C.muted, ...TAB }}>
            {fmt(t.items)} бараа тоолсон, {fmt(t.matched)} нь системтэй таарсан.
            {t.unexplainedRows > 0 && (
              <span style={{ color: C.amber }}>
                {" "}{t.unexplainedRows} барааны системийн тоо хөдөлгөөнөөр тайлбарлагдахгүй (ихэвчлэн нээлтийн үеийн гар засвар).
              </span>
            )}
          </p>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
            <div role="group" aria-label="Шүүлт" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {COUNT_REPORT_FILTERS.map(([key, label]) => (
                <Button key={key} kind={filter === key ? "primary" : "secondary"} onClick={() => setFilter(key)} aria-pressed={filter === key} style={SMALL}>
                  {label} <span style={{ opacity: 0.7, ...TAB }}>{fmt(counts[key])}</span>
                </Button>
              ))}
            </div>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Нэр, баркод, SKU"
              aria-label="Бараа хайх"
              style={{ ...inputStyle, width: 220, flex: "0 1 220px" }}
            />
            <span style={{ flex: 1 }} />
            <Button kind="secondary" style={SMALL} disabled={rows.length === 0} onClick={exportFile}>
              Excel татах ({fmt(rows.length)})
            </Button>
          </div>

          <ReportTable rows={rows} showUnexplained={showUnexplained} busy={busy} />

          <p style={{ margin: "12px 0 0", fontSize: 13, color: C.muted, maxWidth: 720 }}>
            Эхний = өмнөх баталсан тооллогын тоолсон тоо (анхны тооллого бол нээлтийн үлдэгдэл). Систем нь бараа уншуулах үеийн үлдэгдэл.
            Зөрүүг зарах үнээр бодсон ({shortMnt(t.netValue)} цэвэр).
          </p>
        </>
      )}
    </div>
  );
}
