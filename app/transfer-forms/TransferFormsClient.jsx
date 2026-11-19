"use client";

/**
 * "Хүргэлтийн хүсэлт": the requests customers send from ayo.mn/form after a bank transfer.
 * The list is on the left, oldest waiting request first; the chosen one is worked on the right.
 *
 * Inline px styles on purpose (Remos sets html{font-size:62.5%}).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, C, ErrorText, inputStyle } from "@/components/pos/ui";
import { useToken } from "@/components/stock/shared";
import { listForms } from "@/lib/api/transferForms";
import FormWorkspace from "./FormWorkspace";

const SMALL = { padding: "0 14px", height: 36, fontSize: 14, lineHeight: "20px" };
const TABS = [
  ["NEW", "Шинэ"],
  ["ORDERED", "Захиалсан"],
  ["CANCELLED", "Хаагдсан"],
];
const EMPTY = {
  NEW: "Хүлээгдэж буй хүсэлт алга. Шинэ хүсэлт ирэхэд энд гарна.",
  ORDERED: "Захиалга болсон хүсэлт алга.",
  CANCELLED: "Хаагдсан хүсэлт алга.",
};

const two = (n) => String(n).padStart(2, "0");
const when = (iso) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${two(d.getHours())}:${two(d.getMinutes())}`;
};

export default function TransferFormsClient() {
  const token = useToken();
  const [status, setStatus] = useState("NEW");
  const [search, setSearch] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const latest = useRef(0);

  const load = useCallback(
    async ({ quiet = false } = {}) => {
      if (!token) return;
      const ticket = ++latest.current;
      if (!quiet) setLoading(true);
      try {
        const next = await listForms(token, { status, q: search.trim() || undefined });
        if (ticket !== latest.current) return;
        setData(next);
        setError("");
        // Open the first request by itself, so staff start working without a click.
        setSelected((current) => (current && next.forms.some((f) => f.id === current) ? current : quiet ? current : next.forms[0]?.id ?? null));
      } catch (e) {
        if (ticket === latest.current) setError(e.message);
      } finally {
        if (ticket === latest.current) setLoading(false);
      }
    },
    [token, status, search],
  );

  useEffect(() => {
    const timer = setTimeout(() => load(), search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  // New requests arrive all day. Check quietly once a minute while the page is open.
  useEffect(() => {
    if (!token) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load({ quiet: true });
    }, 60000);
    return () => clearInterval(timer);
  }, [token, load]);

  const counts = data?.counts || { NEW: 0, ORDERED: 0, CANCELLED: 0 };
  const forms = data?.forms || [];

  return (
    // The template's line-height is tight; every text block here inherits this one.
    <div className="wg-box" style={{ fontSize: 14, lineHeight: 1.5 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
        {/* ---------- the list ---------- */}
        <div style={{ flex: "0 0 320px", maxWidth: "100%", minWidth: 0 }}>
          <div role="tablist" aria-label="Хүсэлтийн төлөв" style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
            {TABS.map(([key, label]) => {
              const active = status === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setStatus(key);
                    setSelected(null);
                  }}
                  style={{
                    padding: "6px 12px",
                    lineHeight: "20px",
                    borderRadius: 999,
                    border: `1px solid ${active ? C.blue : C.line}`,
                    backgroundColor: active ? C.blue : "#fff",
                    color: active ? "#fff" : C.text,
                    fontSize: 14,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label} <span style={{ fontVariantNumeric: "tabular-nums", opacity: 0.85 }}>{counts[key]}</span>
                </button>
              );
            })}
          </div>

          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Утас, нэр, бараа" aria-label="Хүсэлт хайх" style={{ ...inputStyle, marginBottom: 10 }} />

          <ErrorText>{error}</ErrorText>
          {error && (
            <Button kind="secondary" style={{ ...SMALL, marginTop: 8 }} onClick={() => load()}>
              Дахин оролдох
            </Button>
          )}

          {loading && !data && <div style={{ color: C.muted, padding: "12px 4px" }}>Ачаалж байна…</div>}
          {!loading && !error && forms.length === 0 && <div style={{ color: C.muted, padding: "12px 4px" }}>{search.trim() ? `“${search.trim()}” олдсонгүй.` : EMPTY[status]}</div>}

          <ul style={{ listStyle: "none", margin: 0, padding: 0, border: forms.length ? `1px solid ${C.line}` : "none", borderRadius: 10, overflow: "hidden", maxHeight: "calc(100vh - 260px)", overflowY: "auto" }}>
            {forms.map((f) => {
              const active = f.id === selected;
              return (
                <li key={f.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                  <button
                    type="button"
                    onClick={() => setSelected(f.id)}
                    aria-current={active ? "true" : undefined}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 12px",
                      border: "none",
                      cursor: "pointer",
                      lineHeight: 1.45,
                      backgroundColor: active ? "#eff6ff" : "#fff",
                      boxShadow: active ? `inset 3px 0 0 ${C.blue}` : "none",
                    }}
                  >
                    <span style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.recipientName}</span>
                      <span style={{ color: C.muted, fontSize: 13, whiteSpace: "nowrap" }}>{when(f.createdAt)}</span>
                    </span>
                    <span style={{ display: "block", color: C.muted, fontSize: 13 }}>
                      {f.phone}
                      {f.orderId ? `, #${f.orderId}` : ""}
                    </span>
                    <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", color: C.text, fontSize: 14, marginTop: 2, overflowWrap: "anywhere" }}>{f.productsText}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {data && data.total > forms.length && <div style={{ color: C.muted, fontSize: 13, marginTop: 8 }}>Эхний {forms.length}-г харуулж байна (нийт {data.total}). Хайлтаар нарийсгана уу.</div>}
        </div>

        {/* ---------- the chosen request ---------- */}
        <div style={{ flex: "1 1 520px", minWidth: 0 }}>
          {selected && token ? (
            <FormWorkspace key={selected} token={token} formId={selected} onChanged={() => load({ quiet: true })} />
          ) : (
            !loading && forms.length > 0 && <div style={{ color: C.muted, padding: 24 }}>Зүүн талын жагсаалтаас хүсэлт сонгоно уу.</div>
          )}
        </div>
      </div>
    </div>
  );
}
