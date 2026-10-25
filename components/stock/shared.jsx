"use client";

/**
 * Pieces every stock page needs: the session token, the branch list, a branch
 * picker, a variant search and an editable list of lines. Inline px styles on
 * purpose (Remos sets html{font-size:62.5%}, which shrinks rem sizes to two thirds).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { listLocations, searchVariants, variantsByIds } from "@/lib/api/pos";
import { Button, C, inputStyle, labelStyle } from "@/components/pos/ui";

/** The session token. It is undefined on the first render, so effects depend on it. */
export function useToken() {
  const { data: session } = useSession();
  return session?.user?.accessToken;
}

/** Branches that hold stock (real branches and the TST test location). */
export function useLocations(token) {
  const [locations, setLocations] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    listLocations(token)
      .then((all) => setLocations(all.filter((l) => l.kind === "BRANCH" || l.kind === "TEST")))
      .catch((e) => setError(e.message));
  }, [token]);

  const nameOf = useCallback((id) => locations.find((l) => l.id === id)?.name ?? `#${id}`, [locations]);
  return { locations, nameOf, error };
}

export function LocationSelect({ locations, value, onChange, label = "Салбар", allowAll = false, style }) {
  return (
    <label style={{ display: "inline-block", ...style }}>
      <span style={labelStyle}>{label}</span>
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))} style={{ ...inputStyle, minWidth: 200 }}>
        {allowAll && <option value="">Бүх салбар</option>}
        {!allowAll && value == null && <option value="">Сонгох…</option>}
        {locations.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
            {l.stockMode === "DAYANSOFT" ? " (Dayansoft)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

export const variantTitle = (v) => (v?.variantLabel ? `${v.name} · ${v.variantLabel}` : v?.name ?? "");

/** id -> variant, fetched once per id. Lines in documents carry only variantId. */
export function useVariantNames(ids, token) {
  const [byId, setById] = useState({});
  const key = useMemo(() => [...new Set(ids)].sort((a, b) => a - b).join(","), [ids]);

  useEffect(() => {
    if (!token || !key) return;
    const missing = key.split(",").map(Number).filter((id) => !byId[id]);
    if (missing.length === 0) return;
    variantsByIds(missing, token)
      .then((found) => setById((prev) => ({ ...prev, ...Object.fromEntries(found.map((v) => [v.id, v])) })))
      .catch(() => {});
    // byId is deliberately not a dependency: it would refetch after every answer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, token]);

  return useCallback((id) => (byId[id] ? variantTitle(byId[id]) : `Бараа #${id}`), [byId]);
}

/** Type to search products; click a result to pick it. */
export function VariantPicker({ token, onPick, placeholder = "Нэр, SKU эсвэл баркодоор хайх…", autoFocus }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const latest = useRef(0);

  useEffect(() => {
    const term = q.trim();
    if (!token || term.length < 2) {
      setHits([]);
      return undefined;
    }
    const mine = ++latest.current;
    const timer = setTimeout(async () => {
      setBusy(true);
      setError(null);
      try {
        const found = await searchVariants(term, token);
        if (mine === latest.current) setHits(found);
      } catch (e) {
        if (mine === latest.current) setError(e.message);
      }
      if (mine === latest.current) setBusy(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [q, token]);

  return (
    <div style={{ position: "relative" }}>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        aria-label="Бараа хайх"
        autoFocus={autoFocus}
        style={inputStyle}
      />
      {(hits.length > 0 || busy || error) && (
        <div
          style={{
            position: "absolute", zIndex: 20, left: 0, right: 0, top: "100%", marginTop: 4, maxHeight: 280, overflowY: "auto",
            backgroundColor: "#fff", border: `1px solid ${C.line}`, borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          }}
        >
          {busy && <div style={{ padding: 10, color: C.muted, fontSize: 14 }}>Хайж байна…</div>}
          {error && <div style={{ padding: 10, color: C.red, fontSize: 14 }}>{error}</div>}
          {hits.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => {
                onPick(v);
                setQ("");
                setHits([]);
              }}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 12px", border: "none", background: "none", cursor: "pointer", fontSize: 14 }}
            >
              <div style={{ color: C.text }}>{variantTitle(v)}</div>
              <div style={{ color: C.muted, fontSize: 12 }}>
                {v.sku}
                {v.barcode ? ` · ${v.barcode}` : ""}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Compact button: the template gives .tf-button a tall fixed height, so size it explicitly (as the sync-issues page does). */
export const SMALL = { padding: "0 14px", height: 36, fontSize: 14, lineHeight: "20px" };

const numberInput = { ...inputStyle, width: 110, textAlign: "right", padding: "7px 10px" };

/**
 * Lines of a document: [{ variant, qty, unitCost? }]. `withCost` adds a unit-cost
 * column (goods in). `signedQty` lets a quantity go negative (adjustments).
 */
export function LinesEditor({ token, lines, onChange, withCost = false, qtyLabel = "Тоо", min = 1 }) {
  const add = (variant) => {
    if (lines.some((l) => l.variant.id === variant.id)) return;
    onChange([...lines, { variant, qty: min > 0 ? 1 : -1, ...(withCost ? { unitCost: 0 } : {}) }]);
  };
  const patch = (id, change) => onChange(lines.map((l) => (l.variant.id === id ? { ...l, ...change } : l)));
  const toInt = (raw) => (raw === "" || raw === "-" ? raw : Math.trunc(Number(raw)));

  return (
    <div>
      <VariantPicker token={token} onPick={add} />
      <div style={{ marginTop: 12 }}>
        {lines.length === 0 ? (
          <div style={{ color: C.faint, fontSize: 14, padding: "14px 0", textAlign: "center" }}>Бараа нэмээгүй байна</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, border: "none" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 8px", color: C.muted, border: "none", borderBottom: `1px solid ${C.line}` }}>Бараа</th>
                <th style={{ textAlign: "right", padding: "6px 8px", color: C.muted, border: "none", borderBottom: `1px solid ${C.line}` }}>{qtyLabel}</th>
                {withCost && <th style={{ textAlign: "right", padding: "6px 8px", color: C.muted, border: "none", borderBottom: `1px solid ${C.line}` }}>Нэгж өртөг (₮)</th>}
                <th style={{ border: "none", borderBottom: `1px solid ${C.line}`, width: 44 }} />
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.variant.id}>
                  <td style={{ padding: "6px 8px", border: "none", borderBottom: `1px solid ${C.grayBg}` }}>
                    <div>{variantTitle(l.variant)}</div>
                    <div style={{ color: C.muted, fontSize: 12 }}>{l.variant.sku}</div>
                  </td>
                  <td style={{ padding: "6px 8px", textAlign: "right", border: "none", borderBottom: `1px solid ${C.grayBg}` }}>
                    <input
                      type="number"
                      inputMode="numeric"
                      step={1}
                      value={l.qty}
                      onChange={(e) => patch(l.variant.id, { qty: toInt(e.target.value) })}
                      aria-label={`${qtyLabel}: ${variantTitle(l.variant)}`}
                      style={numberInput}
                    />
                  </td>
                  {withCost && (
                    <td style={{ padding: "6px 8px", textAlign: "right", border: "none", borderBottom: `1px solid ${C.grayBg}` }}>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        step={1}
                        value={l.unitCost}
                        onChange={(e) => patch(l.variant.id, { unitCost: toInt(e.target.value) })}
                        aria-label={`Нэгж өртөг: ${variantTitle(l.variant)}`}
                        style={numberInput}
                      />
                    </td>
                  )}
                  <td style={{ padding: "6px 0", border: "none", borderBottom: `1px solid ${C.grayBg}`, textAlign: "center" }}>
                    <button
                      type="button"
                      onClick={() => onChange(lines.filter((x) => x.variant.id !== l.variant.id))}
                      aria-label={`Хасах: ${variantTitle(l.variant)}`}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.muted, width: 36, height: 36 }}
                    >
                      &times;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/** A row of controls above a table. */
export function Toolbar({ children }) {
  return <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 16 }}>{children}</div>;
}

/** Page tabs that behave like tabs: one is selected, arrow keys are not needed for two or three. */
export function Tabs({ tabs, value, onChange }) {
  return (
    <div role="tablist" style={{ display: "flex", gap: 8, marginBottom: 16 }}>
      {tabs.map(([key, label]) => (
        <Button key={key} kind={value === key ? "primary" : "secondary"} role="tab" aria-selected={value === key} onClick={() => onChange(key)} style={SMALL}>
          {label}
        </Button>
      ))}
    </div>
  );
}
