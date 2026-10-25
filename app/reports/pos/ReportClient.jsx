"use client";

/**
 * One page for every POS report (spec 16.2): date range, branch filter, a table with a
 * totals row, and "Excel татах". The report's columns, groupings and wording live in
 * lib/reports/definitions.js; Excel is made in the browser from the rows on screen.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchReport } from "@/lib/api/reports";
import { CHANNEL_CHOICES, GROUP_LABELS, REPORTS, displayRow, exportRows, totalsRow } from "@/lib/reports/definitions";
import { downloadBlob, exportXlsx } from "@/lib/reports/exportXlsx";
import { Button, C, ErrorText, Table, inputStyle, labelStyle } from "@/components/pos/ui";
import { LocationSelect, SMALL, Toolbar, useLocations, useToken } from "@/components/stock/shared";

const DAY_MS = 24 * 3600 * 1000;
/** Today's date in Ulaanbaatar (UTC+8), as the reports' business dates see it. */
const ubDate = (offsetDays = 0) => new Date(Date.now() + 8 * 3600 * 1000 - offsetDays * DAY_MS).toISOString().slice(0, 10);

export default function ReportClient({ report: key }) {
  const report = REPORTS[key];
  const token = useToken();
  const { locations, error: locationError } = useLocations(token);
  const [from, setFrom] = useState(() => ubDate(6));
  const [to, setTo] = useState(() => ubDate(0));
  const [locationId, setLocationId] = useState(null);
  const [groupBy, setGroupBy] = useState(report.defaultGroup ?? "");
  const [channel, setChannel] = useState("ALL");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      setResult(
        await fetchReport(
          report.endpoint,
          {
            ...(report.dated ? { from, to } : {}),
            locationIds: locationId ? [locationId] : [],
            ...(report.groups.length > 0 ? { groupBy } : {}),
            ...(report.channel ? { channel } : {}),
          },
          token,
        ),
      );
    } catch (e) {
      setError(e.message);
      setResult(null);
    }
    setBusy(false);
  }, [token, report, from, to, locationId, groupBy, channel]);

  // Loads once the token arrives and again whenever a filter changes.
  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => (result ? result.rows.map((r, i) => ({ key: i, ...displayRow(report, r) })) : []), [result, report]);
  const total = useMemo(() => {
    if (!result || result.rows.length === 0) return null;
    const shown = displayRow(report, totalsRow(report, result.totals));
    return { key: "total", ...Object.fromEntries(Object.entries(shown).map(([k, v]) => [k, <strong key={k}>{v === "—" ? "" : v}</strong>])) };
  }, [result, report]);

  const download = () => {
    const blob = exportXlsx({
      sheetName: report.title,
      columns: report.columns.map((c) => ({ key: c.key, header: c.header })),
      rows: [...exportRows(report, result.rows), ...(result.rows.length > 0 ? [totalsRow(report, result.totals)] : [])],
    });
    downloadBlob(blob, `${report.title} ${report.dated ? `${from}_${to}` : ubDate(0)}.xlsx`);
  };

  const cols = report.columns.map((c) => ({ key: c.key, label: c.header, align: c.align }));

  return (
    <div className="wg-box">
      <p style={{ margin: "0 0 16px", color: C.muted, fontSize: 15, maxWidth: 720 }}>{report.description}</p>
      <Toolbar>
        {report.dated && (
          <>
            <label>
              <span style={labelStyle}>Эхлэх</span>
              <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} style={{ ...inputStyle, minWidth: 160 }} />
            </label>
            <label>
              <span style={labelStyle}>Дуусах</span>
              <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} style={{ ...inputStyle, minWidth: 160 }} />
            </label>
          </>
        )}
        <LocationSelect locations={locations} value={locationId} onChange={setLocationId} allowAll />
        {report.groups.length > 0 && (
          <label>
            <span style={labelStyle}>Бүлэглэх</span>
            <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} style={{ ...inputStyle, minWidth: 150 }}>
              {report.groups.map((g) => (
                <option key={g} value={g}>{GROUP_LABELS[g]}</option>
              ))}
            </select>
          </label>
        )}
        {report.channel && (
          <label>
            <span style={labelStyle}>Суваг</span>
            <select value={channel} onChange={(e) => setChannel(e.target.value)} style={{ ...inputStyle, minWidth: 130 }}>
              {Object.entries(CHANNEL_CHOICES).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        )}
        <div style={{ flex: 1 }} />
        <Button kind="secondary" style={SMALL} onClick={load} disabled={busy || !token}>{busy ? "Ачаалж байна…" : "Шинэчлэх"}</Button>
        <Button onClick={download} disabled={!result || result.rows.length === 0}>Excel татах</Button>
      </Toolbar>

      <ErrorText>{error || locationError}</ErrorText>
      {result?.notes.map((note) => (
        <p key={note} role="note" style={{ margin: "0 0 10px", padding: "8px 12px", borderRadius: 8, backgroundColor: C.amberBg, color: C.amber, fontSize: 14 }}>
          {note}
        </p>
      ))}
      <Table cols={cols} rows={total ? [...rows, total] : rows} empty={busy || !result ? (error ? "—" : "Ачаалж байна…") : "Энэ хугацаанд мэдээлэл алга."} />
    </div>
  );
}
