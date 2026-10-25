"use client";

/**
 * Тооллого: counts the branches submitted, for the owner to approve or reject.
 * Each line's correction uses the stock the system expected when that item was
 * scanned, so a sale during the count is not counted twice (spec 10.4). A count
 * above the branch's approve limit can only be approved here.
 */

import { useCallback, useEffect, useState } from "react";
import { approveCount, getCount, listCounts, rejectCount } from "@/lib/api/stock";
import { formatMnt } from "@/lib/partners/format";
import { COUNT_STATUS, countDiffRows, signed } from "@/lib/stock/labels";
import { Button, C, Dialog, ErrorText, Pill, Table, ago } from "@/components/pos/ui";
import { SMALL, Toolbar, useLocations, useToken, useVariantNames } from "@/components/stock/shared";

const FILTERS = [["SUBMITTED", "Батлах хүлээгдэж буй"], ["APPROVED", "Баталсан"], ["REJECTED", "Татгалзсан"], ["OPEN", "Нээлттэй"]];

function CountPill({ status }) {
  const [tone, text] = COUNT_STATUS[status] ?? ["gray", status];
  return <Pill tone={tone}>{text}</Pill>;
}

function Review({ id, token, nameOf, onClose, onChanged }) {
  const [count, setCount] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const nameFor = useVariantNames((count?.lines ?? []).map((l) => l.variantId), token);

  useEffect(() => {
    getCount(id, token)
      .then(setCount)
      .catch((e) => setError(e.message));
  }, [id, token]);

  const decide = async (action) => {
    setBusy(true);
    setError(null);
    try {
      await action(id, token);
      onChanged();
      onClose();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  const diffs = count ? countDiffRows(count.lines ?? []) : [];
  const same = count ? (count.lines ?? []).length - diffs.length : 0;

  return (
    <Dialog title={count ? `${count.number} · ${nameOf(count.locationId)}` : "Тооллого"} onClose={onClose} width={760}>
      {count && (
        <>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
            <CountPill status={count.status} />
            <span style={{ color: C.muted, fontSize: 14 }}>Хамрах хүрээ: {count.scope}</span>
            {count.valueImpact != null && <span style={{ color: C.muted, fontSize: 14 }}>· Үнийн нөлөө {formatMnt(count.valueImpact)}</span>}
          </div>
          <p style={{ margin: "0 0 12px", color: C.muted, fontSize: 14 }}>
            {(count.lines ?? []).length} бараа тоолсон; {same} нь системтэй таарсан, {diffs.length} нь зөрсөн.
          </p>
          <Table
            cols={[
              { key: "name", label: "Зөрсөн бараа" },
              { key: "expected", label: "Системд", align: "right", width: 100 },
              { key: "counted", label: "Тоолсон", align: "right", width: 100 },
              { key: "diff", label: "Зөрүү", align: "right", width: 90 },
            ]}
            rows={diffs.map((l) => ({
              key: l.id,
              name: nameFor(l.variantId),
              expected: l.expectedAtCount,
              counted: l.counted,
              diff: <strong style={{ color: l.diff < 0 ? C.red : C.green }}>{signed(l.diff)}</strong>,
            }))}
            empty="Зөрүү алга: бүх тоо системтэй таарсан."
          />
        </>
      )}
      <ErrorText>{error}</ErrorText>
      {count?.status === "SUBMITTED" && (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
          <Button kind="danger" disabled={busy} onClick={() => decide(rejectCount)}>Татгалзах</Button>
          <Button disabled={busy} onClick={() => decide(approveCount)}>{busy ? "Хадгалж байна…" : "Батлах, үлдэгдлийг засах"}</Button>
        </div>
      )}
    </Dialog>
  );
}

export default function CountsClient() {
  const token = useToken();
  const { nameOf, error: locationError } = useLocations(token);
  const [status, setStatus] = useState("SUBMITTED");
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    setRows(null);
    try {
      setRows(await listCounts(token, status));
    } catch (e) {
      setError(e.message);
    }
  }, [token, status]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="wg-box">
      <p style={{ margin: "0 0 16px", color: C.muted, fontSize: 15, maxWidth: 680 }}>
        Салбар тооллогоо касснаас илгээнэ. Батлахад үлдэгдэл тоолсон тоогоор засагдана. Татгалзвал үлдэгдэл өөрчлөгдөхгүй.
      </p>
      <Toolbar>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }} role="group" aria-label="Төлөв">
          {FILTERS.map(([key, label]) => (
            <Button key={key} kind={status === key ? "primary" : "secondary"} onClick={() => setStatus(key)} aria-pressed={status === key} style={SMALL}>
              {label}
            </Button>
          ))}
        </div>
      </Toolbar>
      <ErrorText>{error || locationError}</ErrorText>
      <Table
        cols={[
          { key: "number", label: "Дугаар", width: 130 },
          { key: "location", label: "Салбар" },
          { key: "scope", label: "Хамрах хүрээ" },
          { key: "status", label: "Төлөв", width: 190 },
          { key: "impact", label: "Үнийн нөлөө", align: "right", width: 130 },
          { key: "at", label: "Хэзээ", width: 130 },
        ]}
        rows={(rows ?? []).map((c) => ({
          key: c.id,
          number: <strong>{c.number}</strong>,
          location: nameOf(c.locationId),
          scope: c.scope,
          status: <CountPill status={c.status} />,
          impact: c.valueImpact == null ? "—" : formatMnt(c.valueImpact),
          at: ago(c.submittedAt ?? c.startedAt),
          id: c.id,
        }))}
        onRowClick={(row) => setOpen(row.id)}
        empty={rows === null && !error ? "Ачаалж байна…" : "Тооллого алга."}
      />
      {open && <Review id={open} token={token} nameOf={nameOf} onClose={() => setOpen(null)} onChanged={load} />}
    </div>
  );
}
