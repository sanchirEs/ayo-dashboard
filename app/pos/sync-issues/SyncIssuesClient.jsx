"use client";

/**
 * Синк асуудал: what the tills' sync refused, and sales/returns accepted with a
 * flag (spec 8.5, 14.2). Also the way in for a till's "unsent sales" file when
 * a till could not reach the server for good.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { importUnsentFile, listSyncIssues } from "@/lib/api/pos";
import { Button, C, ErrorText, Pill, Table, ago } from "@/components/pos/ui";

const DAY_CHOICES = [1, 7, 30];
const ROW_BUTTON = { padding: "0 14px", fontSize: 14, height: 36, lineHeight: "20px" };

const KIND = { REJECTED: ["red", "Татгалзсан"], FLAGGED: ["amber", "Тэмдэглэсэн"] };
const EVENT_LABEL = {
  "sale.completed": "Борлуулалт",
  "return.completed": "Буцаалт",
  "shift.opened": "Ээлж нээсэн",
  "shift.closed": "Ээлж хаасан",
  "cash.moved": "Бэлэн мөнгө",
  "barcode.linked": "Баркод холбосон",
};

export default function SyncIssuesClient() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [days, setDays] = useState(7);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(null);
  const fileInput = useRef(null);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      setIssues((await listSyncIssues(days, token)).issues);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [token, days]);

  // token is a dependency on purpose: useSession is undefined on first render.
  useEffect(() => {
    load();
  }, [load]);

  const onFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !token) return;
    setImporting(true);
    setError(null);
    setImported(null);
    try {
      setImported(await importUnsentFile(file, token));
      await load();
    } catch (e) {
      setError(e.message);
    }
    setImporting(false);
  };

  const rows = issues.map((issue) => {
    const [tone, text] = KIND[issue.kind] || ["gray", issue.kind];
    return {
      key: `${issue.kind}-${issue.eventId}`,
      kind: <Pill tone={tone}>{text}</Pill>,
      event: EVENT_LABEL[issue.eventType] || issue.eventType,
      code: <span style={{ fontVariantNumeric: "tabular-nums" }}>{issue.code || issue.flags.join(", ") || "—"}</span>,
      register: issue.registerName ? `${issue.locationName || ""} · ${issue.registerName}` : "—",
      time: ago(issue.at),
      sale: issue.saleNumber || "—",
    };
  });

  return (
    <div className="wg-box">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <p style={{ margin: 0, color: C.muted, fontSize: 15, maxWidth: 620 }}>
          Кассаас ирсэн боловч хүлээж аваагүй, эсвэл тэмдэглэгээтэй хүлээж авсан үйл явдлууд. Касс интернэтгүй удаан байсан бол «Илгээгээгүй файл оруулах»-аар
          борлуулалтыг оруулна.
        </p>
        <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
          <input ref={fileInput} type="file" accept="application/json,.json" onChange={onFile} style={{ display: "none" }} aria-label="Илгээгээгүй файл" />
          <Button onClick={() => fileInput.current?.click()} disabled={!token || importing}>
            {importing ? "Оруулж байна…" : "Илгээгээгүй файл оруулах"}
          </Button>
        </span>
      </div>

      <ErrorText>{error}</ErrorText>
      {imported && (
        <p role="status" style={{ margin: "14px 0 0", padding: "10px 14px", borderRadius: 10, backgroundColor: C.greenBg, color: C.green, fontSize: 15 }}>
          Оруулсан: {imported.counts.ACCEPTED} шинэ · {imported.counts.DUPLICATE} давхардсан · {imported.counts.REJECTED} татгалзсан · {imported.counts.RETRY} дахин оролдох
        </p>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 18 }} role="group" aria-label="Хугацаа">
        {DAY_CHOICES.map((d) => (
          <Button key={d} kind={days === d ? "primary" : "secondary"} style={ROW_BUTTON} onClick={() => setDays(d)} aria-pressed={days === d}>
            {d === 1 ? "Өнөөдөр" : `${d} хоног`}
          </Button>
        ))}
      </div>

      <div style={{ marginTop: 14 }}>
        <Table
          cols={[
            { key: "kind", label: "Төлөв", width: 140 },
            { key: "event", label: "Үйл явдал", width: 160 },
            { key: "code", label: "Код / тэмдэглэгээ" },
            { key: "register", label: "Касс", width: 240 },
            { key: "time", label: "Хэзээ", width: 120 },
            { key: "sale", label: "Баримт", width: 150 },
          ]}
          rows={loading ? [] : rows}
          empty={loading || !token ? "Ачаалж байна…" : "Асуудал алга."}
        />
      </div>
    </div>
  );
}
