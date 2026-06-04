"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  uploadStatement,
  getImports,
  getRecords,
  sendPin,
  verifyPin,
  updateRecordPhone,
  cancelRecord,
} from "@/lib/api/pickupPins";

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:        "#F7F6F3",
  surface:   "#FFFFFF",
  border:    "#E8E6E1",
  text:      "#1C1B18",
  muted:     "#8C8880",
  accent:    "#D4720A",        // amber
  accentBg:  "#FEF3E2",
  green:     "#0C7A4A",
  greenBg:   "#E6F7EF",
  blue:      "#1A56DB",
  blueBg:    "#EEF3FF",
  red:       "#B91C1C",
  redBg:     "#FEF2F2",
  mono:      "'DM Mono', 'Fira Mono', monospace",
  sans:      "'DM Sans', system-ui, sans-serif",
  radius:    "10px",
  radiusSm:  "6px",
  shadow:    "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
  shadowMd:  "0 4px 16px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)",
  shadowLg:  "0 20px 40px rgba(0,0,0,0.16), 0 8px 16px rgba(0,0,0,0.08)",
};

// ─── Font loader ──────────────────────────────────────────────────────────────
function FontLoader() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&display=swap');
      * { box-sizing: border-box; }
      /* Row states */
      .pp-row-verified td { background: ${T.greenBg}; }
      .pp-row-delivery td { color: #B0AEA8 !important; }
      .pp-row-delivery .pp-amount { color: #C8C4BC !important; }
      tbody tr { border-bottom: 1px solid ${T.border}; transition: background 0.12s; }
      tbody tr:last-child { border-bottom: none; }
      tbody tr:hover td { background: #F7F5F0; }
      .pp-row-verified:hover td { background: #DCF4E8 !important; }
      /* Phone edit pencil: hide until row hover */
      .pp-edit-btn { opacity: 0; transition: opacity 0.15s; }
      tr:hover .pp-edit-btn { opacity: 1; }
      /* Pin input */
      .pp-pin-box:focus { border-color: ${T.accent} !important; background: ${T.accentBg} !important; }
      /* Buttons */
      .pp-btn-primary:hover:not(:disabled) { background: #B85E06 !important; }
      .pp-btn-ghost:hover { background: ${T.border} !important; }
      .pp-tab-active { background: ${T.surface} !important; color: ${T.text} !important; box-shadow: ${T.shadow} !important; }
      /* Animations */
      @keyframes pp-fade-in { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
      @keyframes pp-scale-in { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
      @keyframes pp-spin { to { transform: rotate(360deg); } }
      @keyframes pp-pop { 0%{transform:scale(1)} 50%{transform:scale(1.18)} 100%{transform:scale(1)} }
      .pp-verified-pop { animation: pp-pop 0.35s ease; }
    `}</style>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status, verifiedAt }) {
  const cfg = {
    PENDING:   { label: "Хүлээгдэж буй", dot: "#9CA3AF", bg: "#F3F4F6", color: "#6B7280" },
    PIN_SENT:  { label: "PIN илгээсэн",  dot: T.accent,  bg: T.accentBg, color: T.accent },
    VERIFIED:  { label: "Авсан",         dot: T.green,   bg: T.greenBg,  color: T.green  },
    CANCELLED: { label: "Цуцлагдсан",   dot: T.red,     bg: T.redBg,    color: T.red    },
  };
  const s = cfg[status] || cfg.PENDING;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 10px", borderRadius: 99,
      background: s.bg, color: s.color,
      fontFamily: T.sans, fontSize: 11, fontWeight: 600, letterSpacing: "0.02em",
      whiteSpace: "nowrap",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {s.label}
      {status === "VERIFIED" && verifiedAt && (
        <span style={{ fontWeight: 400, opacity: 0.7, fontFamily: T.mono, fontSize: 10 }}>
          {new Date(verifiedAt).toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" })}
        </span>
      )}
    </span>
  );
}

// ─── 4-box PIN input ──────────────────────────────────────────────────────────
function PinInput({ onComplete, disabled }) {
  const [digits, setDigits] = useState(["", "", "", ""]);
  const refs = [useRef(), useRef(), useRef(), useRef()];

  const reset = () => {
    setDigits(["", "", "", ""]);
    refs[0].current?.focus();
  };

  // expose reset via a stable ref trick — parent can call via the returned component
  const handleChange = (i, val) => {
    const d = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < 3) refs[i + 1].current?.focus();
    if (next.every(Boolean)) onComplete(next.join(""), reset);
  };

  const handleKey = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs[i - 1].current?.focus();
    }
    if (e.key === "ArrowLeft" && i > 0) refs[i - 1].current?.focus();
    if (e.key === "ArrowRight" && i < 3) refs[i + 1].current?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!pasted) return;
    const next = [...digits];
    pasted.split("").forEach((ch, i) => { if (i < 4) next[i] = ch; });
    setDigits(next);
    const focusIdx = Math.min(pasted.length, 3);
    refs[focusIdx].current?.focus();
    if (next.every(Boolean)) onComplete(next.join(""), () => {
      setDigits(["", "", "", ""]);
      refs[0].current?.focus();
    });
  };

  return (
    <div style={{ display: "flex", gap: 5 }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={refs[i]}
          value={d}
          maxLength={1}
          inputMode="numeric"
          disabled={disabled}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          className="pp-pin-box"
          style={{
            width: 38, height: 42, textAlign: "center",
            fontFamily: T.mono, fontSize: 20, fontWeight: 500,
            border: `2px solid ${d ? T.accent : T.border}`,
            borderRadius: T.radiusSm,
            background: d ? T.accentBg : T.surface,
            color: T.accent,
            outline: "none",
            transition: "border-color 0.15s, background 0.15s",
            cursor: disabled ? "not-allowed" : "text",
            opacity: disabled ? 0.5 : 1,
          }}
        />
      ))}
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, accentColor }) {
  const isZero = value === 0;
  return (
    <div style={{
      padding: "14px 20px 16px",
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderTop: `3px solid ${isZero ? T.border : (accentColor || T.border)}`,
      borderRadius: T.radius,
      boxShadow: T.shadow,
      minWidth: 120,
      animation: "pp-fade-in 0.3s ease both",
    }}>
      <div style={{
        fontFamily: T.mono, fontSize: 30, fontWeight: 500, lineHeight: 1,
        color: isZero ? "#D1CEC8" : (color || T.text),
        transition: "color 0.3s",
      }}>
        {value}
      </div>
      <div style={{
        fontFamily: T.sans, fontSize: 11, marginTop: 6,
        color: isZero ? "#C4C0B8" : T.muted,
        letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 500,
      }}>
        {label}
      </div>
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ size = 14, color = T.muted }) {
  return (
    <span style={{
      display: "inline-block",
      width: size, height: size,
      border: `2px solid ${color}30`,
      borderTopColor: color,
      borderRadius: "50%",
      animation: "pp-spin 0.7s linear infinite",
      flexShrink: 0,
    }} />
  );
}

// ─── Table row ────────────────────────────────────────────────────────────────
function PickupRow({ record: init, token, onUpdate }) {
  const [record, setRecord] = useState(init);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editPhone, setEditPhone] = useState(false);
  const [phoneVal, setPhoneVal] = useState(init.customerPhone || "");
  const [verified, setVerified] = useState(false);

  const update = useCallback((r) => { setRecord(r); onUpdate?.(r); }, [onUpdate]);

  const doSendPin = async () => {
    setLoading(true); setError(null);
    try { update(await sendPin(record.id, token)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const doVerify = async (pin, reset) => {
    setLoading(true); setError(null);
    try {
      const updated = await verifyPin(record.id, pin, token);
      setVerified(true);
      setTimeout(() => setVerified(false), 800);
      update(updated);
    } catch (e) {
      setError(e.message);
      reset?.();
    } finally { setLoading(false); }
  };

  const doSavePhone = async () => {
    setLoading(true); setError(null);
    try {
      update(await updateRecordPhone(record.id, phoneVal, token));
      setEditPhone(false);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const doCancel = async () => {
    if (!confirm("Цуцлах уу?")) return;
    setLoading(true);
    try { update(await cancelRecord(record.id, token)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const isDelivery = record.isDelivery;
  const time = new Date(record.transactionDate).toLocaleTimeString("mn-MN", {
    hour: "2-digit", minute: "2-digit",
  });
  const amount = Number(record.amount).toLocaleString("mn-MN");

  return (
    <tr
      className={[
        isDelivery ? "pp-row-delivery" : "",
        record.status === "VERIFIED" ? "pp-row-verified" : "",
        verified ? "pp-verified-pop" : "",
      ].filter(Boolean).join(" ")}
    >
      {/* Time */}
      <td style={{ padding: "10px 14px", fontFamily: T.mono, fontSize: 12, color: T.muted, whiteSpace: "nowrap" }}>
        {time}
      </td>

      {/* Phone */}
      <td style={{ padding: "10px 14px", minWidth: 130 }}>
        {isDelivery ? (
          <span style={{
            fontFamily: T.sans, fontSize: 10, fontWeight: 600, letterSpacing: "0.06em",
            color: "#B0AEA8", textTransform: "uppercase",
          }}>хүргэлт</span>
        ) : editPhone ? (
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <input
              value={phoneVal}
              onChange={e => setPhoneVal(e.target.value)}
              placeholder="9xxxxxxx"
              maxLength={8}
              autoFocus
              onKeyDown={e => { if (e.key === "Enter") doSavePhone(); if (e.key === "Escape") setEditPhone(false); }}
              style={{
                width: 88, padding: "4px 8px", fontFamily: T.mono, fontSize: 13,
                border: `1.5px solid ${T.accent}`, borderRadius: T.radiusSm, outline: "none",
              }}
            />
            <button onClick={doSavePhone} disabled={loading} title="Хадгалах" style={iconBtnStyle(T.green)}>
              {loading ? <Spinner size={10} color={T.green} /> : "✓"}
            </button>
            <button onClick={() => setEditPhone(false)} title="Болих" style={iconBtnStyle(T.muted)}>✕</button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {record.customerPhone ? (
              <>
                <span style={{
                  fontFamily: T.mono, fontSize: 13, fontWeight: 500,
                  color: record.phoneEnteredManually ? T.accent : T.text,
                }}>
                  {record.customerPhone}
                </span>
                {record.status === "PENDING" && (
                  <button
                    onClick={() => { setPhoneVal(record.customerPhone || ""); setEditPhone(true); }}
                    className="pp-edit-btn"
                    style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, fontSize: 11, padding: 0, lineHeight: 1 }}
                    title="Засах"
                  >✎</button>
                )}
              </>
            ) : (
              <button
                onClick={() => setEditPhone(true)}
                style={{
                  background: "none", border: `1px dashed ${T.border}`, cursor: "pointer",
                  color: T.muted, fontSize: 11, padding: "2px 8px", borderRadius: T.radiusSm,
                  fontFamily: T.sans,
                }}
              >
                + Утас нэмэх
              </button>
            )}
          </div>
        )}
      </td>

      {/* Description */}
      <td style={{ padding: "10px 14px", maxWidth: 260 }}>
        <span
          title={record.description}
          style={{
            display: "block", fontFamily: T.sans, fontSize: 13, color: T.text,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}
        >
          {record.description}
        </span>
      </td>

      {/* Amount */}
      <td style={{ padding: "10px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
        <span className="pp-amount" style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 500, color: T.green }}>
          {amount}₮
        </span>
      </td>

      {/* Status */}
      <td style={{ padding: "10px 14px" }}>
        <StatusBadge status={record.status} verifiedAt={record.verifiedAt} />
      </td>

      {/* Actions */}
      <td style={{ padding: "10px 14px", minWidth: 220 }}>
        {error && (
          <div style={{
            fontSize: 11, color: T.red, fontFamily: T.sans, marginBottom: 6,
            padding: "3px 8px", background: T.redBg, borderRadius: T.radiusSm,
          }}>{error}</div>
        )}

        {!isDelivery && record.status === "PENDING" && (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              onClick={doSendPin}
              disabled={loading || !record.customerPhone}
              className="pp-btn-primary"
              style={primaryBtnStyle(!record.customerPhone || loading)}
            >
              {loading ? <><Spinner size={11} color="#fff" /> илгээж байна</> : "PIN илгээх"}
            </button>
            <button onClick={doCancel} className="pp-btn-ghost" style={ghostBtnStyle()}>
              Цуцлах
            </button>
          </div>
        )}

        {!isDelivery && record.status === "PIN_SENT" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <PinInput onComplete={doVerify} disabled={loading} />
              {loading && <Spinner size={16} color={T.accent} />}
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontFamily: T.mono, fontSize: 10, color: T.muted }}>
                {new Date(record.pinSentAt).toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" })} илгээсэн
              </span>
              <button
                onClick={doSendPin}
                disabled={loading}
                style={{ fontFamily: T.sans, fontSize: 11, color: T.blue, background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                Дахин илгээх
              </button>
            </div>
          </div>
        )}
      </td>
    </tr>
  );
}

function primaryBtnStyle(disabled) {
  return {
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "6px 14px", fontFamily: T.sans, fontSize: 12, fontWeight: 600,
    background: disabled ? "#D1D5DB" : T.accent, color: "white",
    border: "none", borderRadius: T.radiusSm, cursor: disabled ? "not-allowed" : "pointer",
    transition: "background 0.15s", whiteSpace: "nowrap",
  };
}

function ghostBtnStyle() {
  return {
    padding: "6px 12px", fontFamily: T.sans, fontSize: 11, fontWeight: 500,
    background: "transparent", color: T.muted,
    border: `1px solid ${T.border}`, borderRadius: T.radiusSm, cursor: "pointer",
    transition: "background 0.15s",
  };
}

function iconBtnStyle(color) {
  return {
    width: 24, height: 24, display: "inline-flex", alignItems: "center", justifyContent: "center",
    background: "none", border: `1px solid ${color}40`, borderRadius: 4, cursor: "pointer",
    color, fontSize: 12, fontWeight: 700,
  };
}

// ─── Import modal ─────────────────────────────────────────────────────────────
function ImportModal({ token, onImported, onClose }) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef();

  const setFileValidated = (f) => {
    if (!f) return;
    if (!f.name.endsWith(".xlsx")) { setError("Зөвхөн .xlsx файл оруулна уу"); return; }
    setFile(f); setError(null); setResult(null);
  };

  const handleUpload = async () => {
    if (!file || !token) return;
    setLoading(true); setError(null);
    try { setResult(await uploadStatement(file, token)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(15,15,15,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        animation: "pp-fade-in 0.2s ease",
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: T.surface, borderRadius: 16, padding: 32, width: 460,
        boxShadow: T.shadowLg, animation: "pp-scale-in 0.22s ease",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: T.sans, fontSize: 18, fontWeight: 700, color: T.text }}>
              Банкны хуулга оруулах
            </h2>
            <p style={{ margin: "4px 0 0", fontFamily: T.sans, fontSize: 12, color: T.muted }}>
              Хаан банкны .xlsx файл
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: T.muted, lineHeight: 1 }}>✕</button>
        </div>

        {!result ? (
          <>
            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); setFileValidated(e.dataTransfer.files[0]); }}
              onClick={() => inputRef.current.click()}
              style={{
                border: `2px dashed ${dragging ? T.accent : T.border}`,
                borderRadius: 12, padding: "36px 24px", textAlign: "center",
                cursor: "pointer", transition: "all 0.2s",
                background: dragging ? T.accentBg : "#FAFAF8",
              }}
            >
              <div style={{ marginBottom: 12 }}>
                {file ? (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="16 13 12 17 8 13"/><line x1="12" y1="17" x2="12" y2="9"/>
                  </svg>
                ) : (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={dragging ? T.accent : T.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 17 12 21 8 17"/><line x1="12" y1="21" x2="12" y2="3"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/>
                  </svg>
                )}
              </div>
              {file ? (
                <>
                  <div style={{ fontFamily: T.sans, fontWeight: 600, color: T.text }}>{file.name}</div>
                  <div style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, marginTop: 4 }}>
                    {(file.size / 1024).toFixed(1)} KB
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontFamily: T.sans, fontWeight: 500, color: T.text }}>Файлаа чирж оруулна уу</div>
                  <div style={{ fontFamily: T.sans, fontSize: 12, color: T.muted, marginTop: 4 }}>
                    эсвэл дарж сонгоно уу (.xlsx)
                  </div>
                </>
              )}
              <input ref={inputRef} type="file" accept=".xlsx" style={{ display: "none" }}
                onChange={e => setFileValidated(e.target.files[0])} />
            </div>

            {error && (
              <div style={{
                marginTop: 12, padding: "8px 12px", background: T.redBg,
                borderRadius: T.radiusSm, fontFamily: T.sans, fontSize: 12, color: T.red,
              }}>
                {error}
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || loading || !token}
              className="pp-btn-primary"
              style={{ ...primaryBtnStyle(!file || loading || !token), width: "100%", justifyContent: "center", marginTop: 16, padding: "11px 0", fontSize: 14 }}
            >
              {loading ? <><Spinner size={14} color="#fff" /> Уншиж байна</> : "Оруулах"}
            </button>
          </>
        ) : (
          /* Success state */
          <div style={{ textAlign: "center", animation: "pp-scale-in 0.25s ease" }}>
            <div style={{ marginBottom: 16 }}>
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div style={{ fontFamily: T.sans, fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 20 }}>
              Амжилттай оруулав!
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 28 }}>
              {[
                { v: result.created,     l: "шинэ мөр",   c: T.text   },
                { v: result.pickupCount, l: "pickup",     c: T.accent },
                { v: result.skipped,     l: "давхардсан", c: T.muted  },
              ].map(s => (
                <div key={s.l} style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: T.mono, fontSize: 32, fontWeight: 500, color: s.c }}>{s.v}</div>
                  <div style={{ fontFamily: T.sans, fontSize: 11, color: T.muted, marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>
            <button
              onClick={() => { onImported(result.importId); onClose(); }}
              className="pp-btn-primary"
              style={{ ...primaryBtnStyle(false), padding: "10px 32px", fontSize: 14 }}
            >
              Хүснэгт харах →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function PickupPinsClient() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken ?? null;

  const [imports, setImports]           = useState([]);
  const [selectedId, setSelectedId]     = useState(null);
  const [records, setRecords]           = useState([]);
  const [loadingImports, setLI]         = useState(false);
  const [loadingRecords, setLR]         = useState(false);
  const [showModal, setShowModal]       = useState(false);
  const [filter, setFilter]             = useState("all");
  const didLoad                         = useRef(false);

  const loadImports = useCallback(async (selectId) => {
    if (!token) return;
    setLI(true);
    try {
      const { imports: list } = await getImports(token);
      setImports(list);
      const target = selectId ?? list[0]?.id ?? null;
      if (target) { setSelectedId(target); loadRecordsFor(target); }
    } finally { setLI(false); }
  }, [token]); // eslint-disable-line

  const loadRecordsFor = useCallback(async (id) => {
    if (!token || !id) return;
    setLR(true);
    try {
      const { records: list } = await getRecords(id, token);
      setRecords(list);
    } finally { setLR(false); }
  }, [token]);

  useEffect(() => {
    if (token && !didLoad.current) { didLoad.current = true; loadImports(); }
  }, [token, loadImports]);

  const handleImported = (importId) => loadImports(importId);

  const handleSelect = (id) => {
    setSelectedId(id);
    loadRecordsFor(id);
  };

  const handleUpdate = useCallback((updated) => {
    setRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
  }, []);

  const filtered = records.filter(r => {
    if (filter === "pickup")   return !r.isDelivery;
    if (filter === "delivery") return r.isDelivery;
    return true;
  });

  const stats = {
    total:   records.filter(r => !r.isDelivery).length,
    pending: records.filter(r => !r.isDelivery && r.status === "PENDING").length,
    pinSent: records.filter(r => !r.isDelivery && r.status === "PIN_SENT").length,
    verified:records.filter(r => !r.isDelivery && r.status === "VERIFIED").length,
  };

  const selImport = imports.find(i => i.id === selectedId);

  return (
    <div style={{ fontFamily: T.sans, minHeight: "100vh", background: T.bg }}>
      <FontLoader />

      {/* Page header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontFamily: T.sans, fontSize: 24, fontWeight: 700, color: T.text, letterSpacing: "-0.02em" }}>
            Pickup PIN
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: T.muted }}>
            Банкны хуулга оруулж, pickup захиалгад PIN код илгээнэ
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="pp-btn-primary"
          style={{
            ...primaryBtnStyle(false),
            padding: "10px 18px", fontSize: 13,
            background: T.text, gap: 8,
          }}
        >
          <span style={{ fontSize: 16 }}>+</span> Excel оруулах
        </button>
      </div>

      {/* Stats */}
      {selectedId && (
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          <StatCard label="Нийт pickup"   value={stats.total}    color={T.text}   accentColor={T.text}   />
          <StatCard label="Хүлээгдэж буй" value={stats.pending}  color={T.muted}  accentColor="#9CA3AF"  />
          <StatCard label="PIN илгээсэн"  value={stats.pinSent}  color={T.accent} accentColor={T.accent} />
          <StatCard label="Баталгаажсан"  value={stats.verified} color={T.green}  accentColor={T.green}  />
        </div>
      )}

      {/* Controls row */}
      {imports.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, color: T.muted, fontWeight: 500 }}>Хуулга:</span>
            <select
              value={selectedId || ""}
              onChange={e => handleSelect(Number(e.target.value))}
              style={{
                padding: "7px 12px", border: `1.5px solid ${T.border}`, borderRadius: T.radiusSm,
                fontFamily: T.sans, fontSize: 13, color: T.text, background: T.surface,
                outline: "none", cursor: "pointer", boxShadow: T.shadow,
              }}
            >
              {imports.map(imp => (
                <option key={imp.id} value={imp.id}>
                  {new Date(imp.importedAt).toLocaleDateString("mn-MN")} — {imp.filename} ({imp.pickupCount} pickup)
                </option>
              ))}
            </select>
            {loadingRecords && <Spinner size={14} />}
          </div>

          {/* Filter tabs */}
          <div style={{
            display: "flex", gap: 3, background: "#EEE", borderRadius: 8, padding: 3,
          }}>
            {[["all","Бүгд"], ["pickup","Pickup"], ["delivery","Хүргэлт"]].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className={filter === val ? "pp-tab-active" : ""}
                style={{
                  padding: "5px 14px", fontFamily: T.sans, fontSize: 12, fontWeight: 500,
                  borderRadius: 6, border: "none", cursor: "pointer",
                  background: "transparent", color: T.muted, transition: "all 0.15s",
                }}
              >
                {label}
                {val !== "all" && (
                  <span style={{ marginLeft: 5, fontSize: 10, fontFamily: T.mono }}>
                    ({val === "pickup" ? records.filter(r => !r.isDelivery).length : records.filter(r => r.isDelivery).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{
        background: T.surface, borderRadius: T.radius,
        border: `1px solid ${T.border}`, boxShadow: T.shadow,
        overflow: "hidden",
      }}>
        {loadingImports ? (
          <div style={{ padding: 60, textAlign: "center", color: T.muted }}>
            <Spinner size={28} /><br />
            <span style={{ fontFamily: T.sans, fontSize: 13, marginTop: 12, display: "block" }}>Уншиж байна...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "60px 24px", textAlign: "center" }}>
            <div style={{ marginBottom: 16, opacity: 0.3 }}>
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
            <div style={{ fontFamily: T.sans, fontWeight: 600, color: T.text, marginBottom: 6 }}>
              {imports.length === 0 ? "Excel файл оруулаагүй байна" : "Мөр олдсонгүй"}
            </div>
            <div style={{ fontFamily: T.sans, fontSize: 13, color: T.muted, marginBottom: 16 }}>
              {imports.length === 0
                ? "Банкны хуулгын .xlsx файлаа оруулж эхлэнэ үү"
                : "Сонгосон фильтрт тохирох мөр байхгүй байна"}
            </div>
            {imports.length === 0 && (
              <button onClick={() => setShowModal(true)} className="pp-btn-primary" style={primaryBtnStyle(false)}>
                Excel оруулах
              </button>
            )}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F7F6F3", borderBottom: `1px solid ${T.border}` }}>
                {[
                  { label: "Цаг",     align: "left"  },
                  { label: "Утас",    align: "left"  },
                  { label: "Тайлбар", align: "left"  },
                  { label: "Дүн",     align: "right" },
                  { label: "Статус",  align: "left"  },
                  { label: "Үйлдэл",  align: "left"  },
                ].map(h => (
                  <th key={h.label} style={{
                    padding: "10px 14px", textAlign: h.align,
                    fontFamily: T.sans, fontSize: 10, fontWeight: 700,
                    color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em",
                    borderLeft: h.label === "Цаг" ? "3px solid transparent" : undefined,
                  }}>
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((record, i) => (
                <PickupRow
                  key={record.id}
                  record={record}
                  token={token}
                  onUpdate={handleUpdate}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer info */}
      {selImport && (
        <div style={{ marginTop: 12, fontSize: 11, color: T.muted, fontFamily: T.sans }}>
          Оруулсан: {selImport.importer.firstName || ""} {selImport.importer.lastName || ""} · {new Date(selImport.importedAt).toLocaleString("mn-MN")} · {selImport.rowCount} нийт мөр
        </div>
      )}

      {/* Import modal */}
      {showModal && (
        <ImportModal
          token={token}
          onImported={handleImported}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
