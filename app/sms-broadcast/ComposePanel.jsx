"use client";
import { useState } from "react";

const SMS_MAX = 160;

export default function ComposePanel({
  title, onTitleChange, message, onMessageChange,
  templates, selectedCount, onSend, sendState, sendResult, onSaveTemplate,
}) {
  const [showTemplateName, setShowTemplateName] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const canSend = title.trim() && message.trim() && selectedCount > 0 && sendState === "idle";
  const charPct = Math.min((message.length / SMS_MAX) * 100, 100);
  const charColor = message.length > 140 ? "#ef4444" : message.length > 120 ? "#f59e0b" : "#10b981";

  const inputStyle = {
    width: "100%", padding: "9px 12px",
    border: "1px solid #e5e7eb", borderRadius: "8px",
    fontSize: "14px", color: "#111827", outline: "none",
    boxSizing: "border-box", background: "#fff",
  };

  async function handleSaveTemplate() {
    if (!templateName.trim() || !message.trim()) return;
    setSavingTemplate(true);
    await onSaveTemplate(templateName.trim());
    setSavingTemplate(false);
    setTemplateName("");
    setShowTemplateName(false);
  }

  if (sendState === "done" && sendResult) {
    return (
      <div className="wg-box" style={{ width: 360, minWidth: 300, flexShrink: 0, padding: "28px" }}>
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
          <div style={{ fontWeight: 800, fontSize: "18px", color: "#15803d", marginBottom: "8px" }}>
            Амжилттай илгээгдлээ!
          </div>
          <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "24px" }}>
            Мессежийг дарааллаа
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
            <div style={{ padding: "16px", background: "#f0fdf4", borderRadius: "10px", border: "1px solid #bbf7d0" }}>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#15803d" }}>{sendResult.queued}</div>
              <div style={{ fontSize: "12px", color: "#16a34a", marginTop: "2px" }}>Дарагдсан</div>
            </div>
            {sendResult.skipped > 0 && (
              <div style={{ padding: "16px", background: "#f9fafb", borderRadius: "10px", border: "1px solid #e5e7eb" }}>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#6b7280" }}>{sendResult.skipped}</div>
                <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>Орхигдсон</div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => onSend("reset")}
            style={{ width: "100%", padding: "11px", borderRadius: "10px", background: "#2563eb", color: "#fff", fontWeight: 600, fontSize: "14px", border: "none", cursor: "pointer" }}
          >
            Шинэ мессеж бичих
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wg-box" style={{ width: 360, minWidth: 300, flexShrink: 0, padding: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "13px" }}>✉️</span>
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "15px", color: "#111827" }}>Мессеж бичих</div>
          <div style={{ fontSize: "12px", color: "#9ca3af" }}>SMS агуулгаа оруулна уу</div>
        </div>
      </div>

      {/* Campaign title */}
      <div style={{ marginBottom: "16px" }}>
        <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>
          Кампанийн нэр
          <span style={{ color: "#ef4444", marginLeft: "2px" }}>*</span>
          <span style={{ color: "#9ca3af", fontWeight: 400, marginLeft: "6px" }}>— түүхэнд харагдана</span>
        </label>
        <input
          type="text"
          placeholder="Flash Sale 22:00"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Template picker */}
      {templates.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600,
              border: "1px solid #e5e7eb", background: showTemplates ? "#eff6ff" : "#fff",
              color: showTemplates ? "#2563eb" : "#374151", cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <span>📋</span>
            Загвараас сонгох ({templates.length})
            <span style={{ marginLeft: "auto", fontSize: "10px" }}>{showTemplates ? "▲" : "▼"}</span>
          </button>
          {showTemplates && (
            <div style={{ marginTop: "8px", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { onMessageChange(t.template); setShowTemplates(false); }}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    padding: "10px 14px", fontSize: "13px", border: "none",
                    borderBottom: "1px solid #f5f5f5", background: "#fff",
                    cursor: "pointer", color: "#374151",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
                >
                  <div style={{ fontWeight: 600, marginBottom: "2px" }}>{t.name}</div>
                  <div style={{ fontSize: "12px", color: "#9ca3af", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {t.template}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Message textarea */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>
            Мессеж <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <span style={{ fontSize: "12px", fontWeight: 600, color: charColor }}>
            {message.length} / {SMS_MAX}
          </span>
        </div>
        <textarea
          rows={5}
          maxLength={SMS_MAX}
          placeholder="Хямдрал 22:00т эхэлнэ! Бэлэн үү? 🛍️"
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          style={{ ...inputStyle, resize: "vertical", lineHeight: "1.5", fontFamily: "inherit" }}
        />
        {/* Char bar */}
        <div style={{ height: "3px", background: "#f3f4f6", borderRadius: "2px", marginTop: "6px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${charPct}%`, background: charColor, borderRadius: "2px", transition: "width 0.1s, background 0.2s" }} />
        </div>
        {message.length >= SMS_MAX && (
          <div style={{ fontSize: "11px", color: "#ef4444", marginTop: "4px" }}>160 тэмдэгтийн хязгаарт хүрлээ</div>
        )}
      </div>

      {/* Save as template */}
      <div style={{ marginBottom: "20px" }}>
        {!showTemplateName ? (
          <button
            type="button"
            disabled={!message.trim()}
            onClick={() => setShowTemplateName(true)}
            style={{
              display: "flex", alignItems: "center", gap: "6px", fontSize: "12px",
              color: message.trim() ? "#2563eb" : "#9ca3af", background: "none",
              border: "none", cursor: message.trim() ? "pointer" : "not-allowed", padding: 0, fontWeight: 500,
            }}
          >
            <span>＋</span> Загвар болгон хадгалах
          </button>
        ) : (
          <div style={{ display: "flex", gap: "6px" }}>
            <input
              type="text"
              placeholder="Загварын нэр..."
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveTemplate();
                if (e.key === "Escape") { setShowTemplateName(false); setTemplateName(""); }
              }}
              style={{ ...inputStyle, flex: 1 }}
              autoFocus
            />
            <button type="button" onClick={handleSaveTemplate} disabled={savingTemplate || !templateName.trim()}
              style={{ padding: "8px 12px", borderRadius: "8px", background: "#2563eb", color: "#fff", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>
              {savingTemplate ? "..." : "Хадгалах"}
            </button>
            <button type="button" onClick={() => { setShowTemplateName(false); setTemplateName(""); }}
              style={{ padding: "8px 10px", borderRadius: "8px", background: "#f3f4f6", color: "#374151", border: "none", cursor: "pointer", fontSize: "12px" }}>✕</button>
          </div>
        )}
      </div>

      {/* Send button */}
      <button
        type="button"
        disabled={!canSend || sendState === "sending"}
        onClick={() => setShowConfirm(true)}
        style={{
          width: "100%", padding: "12px", borderRadius: "10px",
          background: canSend ? "#2563eb" : "#e5e7eb",
          color: canSend ? "#fff" : "#9ca3af",
          fontWeight: 700, fontSize: "14px", border: "none",
          cursor: canSend ? "pointer" : "not-allowed",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          transition: "all 0.15s",
        }}
      >
        {sendState === "sending" ? (
          <><svg style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
          </svg> Илгээж байна...</>
        ) : (
          <><span>📤</span> {selectedCount > 0 ? `${selectedCount} хэрэглэгчид илгээх` : "Хэрэглэгч сонгоно уу"}</>
        )}
      </button>

      {!canSend && sendState === "idle" && (
        <div style={{ marginTop: "8px", fontSize: "11px", color: "#9ca3af", textAlign: "center" }}>
          {!title.trim() && !message.trim() && "Нэр болон мессежийг оруулна уу"}
          {title.trim() && !message.trim() && "Мессежийг оруулна уу"}
          {!title.trim() && message.trim() && "Кампанийн нэрийг оруулна уу"}
          {title.trim() && message.trim() && selectedCount === 0 && "Мессеж хүлээн авах хэрэглэгч сонгоно уу"}
        </div>
      )}

      {/* Confirm modal */}
      {showConfirm && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
          onClick={() => setShowConfirm(false)}
        >
          <div className="wg-box" style={{ width: "100%", maxWidth: "400px", margin: 0, padding: "28px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>📲</div>
              <div style={{ fontWeight: 700, fontSize: "17px", color: "#111827", marginBottom: "6px" }}>Мессеж илгээхдээ итгэлтэй байна уу?</div>
              <div style={{ fontSize: "13px", color: "#6b7280" }}>
                <strong style={{ color: "#111827" }}>{selectedCount}</strong> хэрэглэгчид SMS илгээнэ
              </div>
            </div>
            <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "12px 16px", marginBottom: "20px" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Мессежийн агуулга</div>
              <div style={{ fontSize: "13px", color: "#374151", lineHeight: "1.5" }}>
                {message.substring(0, 120)}{message.length > 120 ? "..." : ""}
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="button" onClick={() => setShowConfirm(false)}
                style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>
                Болих
              </button>
              <button type="button" onClick={() => { setShowConfirm(false); onSend(); }}
                style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", background: "#2563eb", color: "#fff", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>
                Илгээх
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
