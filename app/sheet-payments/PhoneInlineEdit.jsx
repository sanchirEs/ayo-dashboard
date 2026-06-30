"use client";

import { useState } from "react";
import { updateSheetPhone } from "@/lib/api/sheetPayments";

export default function PhoneInlineEdit({ rowIndex, phone, token, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(phone || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    const digits = value.replace(/\D/g, "");
    if (!/^[6-9]\d{7}$/.test(digits)) {
      setError("8 оронтой дугаар");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await updateSheetPhone(rowIndex, digits, token);
      onUpdate(digits);
      setEditing(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") { setEditing(false); setValue(phone || ""); setError(""); }
  };

  if (!editing) {
    return phone ? (
      <span
        onClick={() => { setEditing(true); setValue(phone); }}
        title="Дугаар өөрчлөх"
        style={{ cursor: "pointer", fontSize: "13px", color: "#374151", borderBottom: "1px dashed #d1d5db" }}
      >
        {phone}
      </span>
    ) : (
      <button
        onClick={() => setEditing(true)}
        style={{ background: "none", border: "1px dashed #d1d5db", borderRadius: "4px", padding: "2px 8px", fontSize: "12px", color: "#9ca3af", cursor: "pointer" }}
      >
        + Дугаар нэмэх
      </button>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <div style={{ display: "flex", gap: "4px" }}>
        <input
          autoFocus
          type="tel"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(""); }}
          onKeyDown={handleKeyDown}
          style={{ width: "100px", padding: "4px 6px", borderRadius: "4px", border: `1px solid ${error ? "#dc2626" : "#3730a3"}`, fontSize: "12px", outline: "none" }}
        />
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ padding: "4px 8px", borderRadius: "4px", border: "none", background: "#3730a3", color: "white", fontSize: "12px", cursor: saving ? "not-allowed" : "pointer" }}
        >
          {saving ? "..." : "✓"}
        </button>
        <button
          onClick={() => { setEditing(false); setValue(phone || ""); setError(""); }}
          style={{ padding: "4px 6px", borderRadius: "4px", border: "1px solid #e5e7eb", background: "white", fontSize: "12px", cursor: "pointer", color: "#6b7280" }}
        >
          ✕
        </button>
      </div>
      {error && <span style={{ fontSize: "11px", color: "#dc2626" }}>{error}</span>}
    </div>
  );
}
