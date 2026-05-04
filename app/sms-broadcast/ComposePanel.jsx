"use client";
import { useState } from "react";

export default function ComposePanel({
  title,
  onTitleChange,
  message,
  onMessageChange,
  templates,
  selectedCount,
  onSend,
  sendState,
  sendResult,
  onSaveTemplate,
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showTemplateName, setShowTemplateName] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  const canSend = title.trim() && message.trim() && selectedCount > 0 && sendState === 'idle';

  async function handleSaveTemplate() {
    if (!templateName.trim() || !message.trim()) return;
    setSavingTemplate(true);
    await onSaveTemplate(templateName.trim());
    setSavingTemplate(false);
    setTemplateName('');
    setShowTemplateName(false);
  }

  function handleConfirmSend() {
    setShowConfirm(false);
    onSend();
  }

  return (
    <div className="wg-box" style={{ width: 360, minWidth: 300, flexShrink: 0 }}>
      <h6 className="mb-16">Мессеж бичих</h6>

      <div className="mb-12">
        <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Гарчиг (түүхэнд харагдана)</label>
        <input
          type="text"
          className="flex-grow"
          placeholder="Flash Sale 22:00"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          style={{ display: 'block', width: '100%' }}
        />
      </div>

      {templates.length > 0 && (
        <div className="mb-12">
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Загвараас сонгох</label>
          <select
            defaultValue=""
            onChange={(e) => {
              const t = templates.find((t) => String(t.id) === e.target.value);
              if (t) onMessageChange(t.template);
            }}
            style={{ display: 'block', width: '100%', fontSize: 13, padding: '4px 8px' }}
          >
            <option value="" disabled>— Загвар сонгох —</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center justify-between">
          <label style={{ fontSize: 12, fontWeight: 600 }}>Мессеж</label>
          <span style={{ fontSize: 12, color: message.length > 140 ? '#ef4444' : '#9ca3af' }}>
            {message.length} / 160
          </span>
        </div>
        <textarea
          rows={5}
          maxLength={160}
          placeholder="Хямдрал 22:00т эхэлнэ! Бэлэн үү? 🛍️"
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          style={{ marginTop: 4, display: 'block', width: '100%', resize: 'vertical', padding: '8px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13 }}
        />
      </div>

      <div className="mb-16">
        {!showTemplateName ? (
          <button
            type="button"
            className="tf-button style-2 btn-sm"
            disabled={!message.trim()}
            onClick={() => setShowTemplateName(true)}
            style={{ fontSize: 12 }}
          >
            + Загвар болгон хадгалах
          </button>
        ) : (
          <div className="flex gap-8">
            <input
              type="text"
              placeholder="Загварын нэр"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTemplate();
                if (e.key === 'Escape') { setShowTemplateName(false); setTemplateName(''); }
              }}
              style={{ fontSize: 13, flex: 1, padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: 4 }}
              autoFocus
            />
            <button type="button" className="tf-button style-1 btn-sm" onClick={handleSaveTemplate} disabled={savingTemplate || !templateName.trim()}>
              {savingTemplate ? '...' : 'Хадгалах'}
            </button>
            <button type="button" className="tf-button style-2 btn-sm" onClick={() => { setShowTemplateName(false); setTemplateName(''); }}>
              ✕
            </button>
          </div>
        )}
      </div>

      {sendState === 'done' && sendResult && (
        <div className="mb-16" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 16 }}>
          <div style={{ fontWeight: 700, color: '#15803d', marginBottom: 8 }}>✓ Амжилттай дарагдлаа</div>
          <div style={{ fontSize: 14 }}>
            <div>📤 Дарагдсан: <strong>{sendResult.queued}</strong></div>
            {sendResult.skipped > 0 && (
              <div style={{ color: '#6b7280' }}>⏭ Орхигдсон: {sendResult.skipped} (утасгүй)</div>
            )}
          </div>
          <button type="button" className="tf-button style-2 btn-sm" style={{ marginTop: 12 }} onClick={() => onSend('reset')}>
            Шинэ мессеж бичих
          </button>
        </div>
      )}

      {sendState !== 'done' && (
        <button
          type="button"
          className="tf-button w-full"
          disabled={!canSend || sendState === 'sending'}
          onClick={() => setShowConfirm(true)}
        >
          {sendState === 'sending' ? 'Илгээж байна...' : `${selectedCount} хэрэглэгчид илгээх`}
        </button>
      )}

      {showConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowConfirm(false)}
        >
          <div className="wg-box" style={{ width: 380, margin: 0 }} onClick={(e) => e.stopPropagation()}>
            <h6 className="mb-12">Мессеж илгээх</h6>
            <p style={{ fontSize: 14, marginBottom: 8 }}>
              <strong>{selectedCount}</strong> хэрэглэгчид мессеж илгээх гэж байна.
            </p>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16, background: '#f9fafb', padding: 10, borderRadius: 6 }}>
              "{message.substring(0, 80)}{message.length > 80 ? '...' : ''}"
            </p>
            <div className="flex gap-8">
              <button type="button" className="tf-button w-full" onClick={handleConfirmSend}>
                Тийм, илгээх
              </button>
              <button type="button" className="tf-button style-2 w-full" onClick={() => setShowConfirm(false)}>
                Болих
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
