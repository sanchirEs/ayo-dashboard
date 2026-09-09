"use client";

import { useState, useRef, useEffect } from "react";
import { sendTabPin, verifyTabPin, updateTabPhone } from "@/lib/api/sheetPayments";

const MAX_ATTEMPTS = 3;

export default function PinModal({ row, token, tabId, onSuccess, onClose, onPhoneUpdate }) {
  const [phase, setPhase] = useState(row.phone ? "ready" : "no-phone"); // no-phone | ready | sent | verifying
  const [phone, setPhone] = useState(row.phone || "");
  const [phoneInput, setPhoneInput] = useState("");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];

  // Focus first PIN box when entering sent phase
  useEffect(() => {
    if (phase === "sent") {
      setTimeout(() => inputRefs[0].current?.focus(), 50);
    }
  }, [phase]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSavePhone = async () => {
    const digits = phoneInput.replace(/\D/g, "");
    if (!/^[6-9]\d{7}$/.test(digits)) {
      setError("8 оронтой Монгол утасны дугаар оруулна уу");
      return;
    }
    setSending(true);
    setError("");
    try {
      await updateTabPhone(tabId, row.rowIndex, digits, token);
      setPhone(digits);
      onPhoneUpdate(digits);
      setPhase("ready");
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const handleSendPin = async () => {
    setSending(true);
    setError("");
    try {
      await sendTabPin(tabId, row.rowIndex, phone, token);
      setPin(["", "", "", ""]);
      setAttemptsLeft(MAX_ATTEMPTS);
      setPhase("sent");
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const handlePinInput = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...pin];
    next[index] = digit;
    setPin(next);
    setError("");
    if (digit && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handlePinKeyDown = (index, e) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleVerify = async () => {
    const code = pin.join("");
    if (code.length !== 4) { setError("4 оронтой код оруулна уу"); return; }
    setVerifying(true);
    setError("");
    try {
      await verifyTabPin(tabId, row.rowIndex, code, token);
      onSuccess();
    } catch (e) {
      const msg = e.message || "Буруу код";
      // Parse remaining attempts from backend message
      const match = msg.match(/(\d+) оролдлого үлдсэн/);
      if (match) setAttemptsLeft(parseInt(match[1]));
      if (msg.includes("Оролдлогын тоо дууссан")) setAttemptsLeft(0);
      setError(msg);
      setPin(["", "", "", ""]);
      setTimeout(() => inputRefs[0].current?.focus(), 50);
    } finally {
      setVerifying(false);
    }
  };

  const boxStyle = (filled) => ({
    width: "52px", height: "60px", fontSize: "24px", fontWeight: 700,
    textAlign: "center", borderRadius: "8px",
    border: `2px solid ${filled ? "#3730a3" : "#d1d5db"}`,
    outline: "none", caretColor: "transparent", color: "#1f2937",
    transition: "border-color 0.15s",
  });

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "white", borderRadius: "12px", padding: "28px", width: "340px", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <span style={{ fontWeight: 700, fontSize: "15px", color: "#111827" }}>
            {phase === "no-phone" ? "Утас оруулах" : phase === "sent" ? "PIN баталгаажуулах" : "PIN илгээх"}
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#9ca3af", lineHeight: 1 }}>×</button>
        </div>

        {/* Description truncated */}
        <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "16px", padding: "8px 10px", background: "#f9fafb", borderRadius: "6px", wordBreak: "break-all" }}>
          {row.description?.slice(0, 80)}{row.description?.length > 80 ? "…" : ""}
        </div>

        {/* PHASE: no-phone — enter phone manually */}
        {phase === "no-phone" && (
          <div>
            <p style={{ fontSize: "13px", color: "#374151", marginBottom: "12px" }}>
              Энэ гүйлгээнд утасны дугаар олдсонгүй. Дугаар оруулна уу:
            </p>
            <input
              type="tel"
              placeholder="9911xxxx"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSavePhone()}
              style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", marginBottom: "12px" }}
              onFocus={(e) => (e.target.style.borderColor = "#3730a3")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />
            {error && <p style={{ fontSize: "12px", color: "#dc2626", marginBottom: "10px" }}>{error}</p>}
            <button
              onClick={handleSavePhone}
              disabled={sending}
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "none", background: "#3730a3", color: "white", fontSize: "14px", fontWeight: 600, cursor: sending ? "not-allowed" : "pointer", opacity: sending ? 0.7 : 1 }}
            >
              {sending ? "Хадгалж байна..." : "Хадгалах"}
            </button>
          </div>
        )}

        {/* PHASE: ready — confirm phone and send PIN */}
        {phase === "ready" && (
          <div>
            <p style={{ fontSize: "13px", color: "#374151", marginBottom: "16px" }}>
              <strong>{phone}</strong> дугаарт 4 оронтой баталгаажуулах код илгээх үү?
            </p>
            {error && <p style={{ fontSize: "12px", color: "#dc2626", marginBottom: "10px" }}>{error}</p>}
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => { setPhase("no-phone"); setPhoneInput(phone); }}
                style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #e5e7eb", background: "white", fontSize: "13px", cursor: "pointer", color: "#374151" }}
              >
                Дугаар өөрчлөх
              </button>
              <button
                onClick={handleSendPin}
                disabled={sending}
                style={{ flex: 2, padding: "10px", borderRadius: "6px", border: "none", background: "#3730a3", color: "white", fontSize: "13px", fontWeight: 600, cursor: sending ? "not-allowed" : "pointer", opacity: sending ? 0.7 : 1 }}
              >
                {sending ? "Илгээж байна..." : "📱 PIN илгээх"}
              </button>
            </div>
          </div>
        )}

        {/* PHASE: sent — enter 4-digit PIN */}
        {phase === "sent" && (
          <div>
            <p style={{ fontSize: "13px", color: "#374151", marginBottom: "20px" }}>
              <strong>{phone}</strong> дугаарт код илгээлээ. Харилцагчаас авч оруулна уу:
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "16px" }}>
              {pin.map((digit, i) => (
                <input
                  key={i}
                  ref={inputRefs[i]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinInput(i, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(i, e)}
                  onFocus={(e) => (e.target.style.borderColor = "#3730a3")}
                  onBlur={(e) => (e.target.style.borderColor = digit ? "#3730a3" : "#d1d5db")}
                  style={boxStyle(!!digit)}
                />
              ))}
            </div>

            {error && (
              <p style={{ fontSize: "12px", color: "#dc2626", textAlign: "center", marginBottom: "12px" }}>
                {error}
              </p>
            )}

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handleSendPin}
                disabled={sending || attemptsLeft === 0}
                style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #e5e7eb", background: "white", fontSize: "12px", cursor: (sending || attemptsLeft === 0) ? "not-allowed" : "pointer", color: "#374151", opacity: attemptsLeft === 0 ? 0.45 : 1 }}
              >
                {sending ? "..." : "Дахин илгээх"}
              </button>
              <button
                onClick={handleVerify}
                disabled={verifying || pin.join("").length !== 4 || attemptsLeft === 0}
                style={{ flex: 2, padding: "10px", borderRadius: "6px", border: "none", background: "#3730a3", color: "white", fontSize: "13px", fontWeight: 600, cursor: verifying ? "not-allowed" : "pointer", opacity: (pin.join("").length !== 4 || verifying || attemptsLeft === 0) ? 0.6 : 1 }}
              >
                {verifying ? "Шалгаж байна..." : "Баталгаажуулах"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
