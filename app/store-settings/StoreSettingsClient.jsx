"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { updateSettingClient } from "@/lib/api/settings";

const TYPE_LABELS = { NUMBER: "Тоо (MNT)", STRING: "Текст", BOOLEAN: "Тийм/Үгүй" };

function SettingRow({ setting, onSaved }) {
  const { data: session } = useSession();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(setting.value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    const token = session?.user?.accessToken;
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateSettingClient(setting.key, draft, token);
      onSaved(updated);
      setEditing(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(setting.value);
    setEditing(false);
    setError(null);
  };

  const displayValue =
    setting.type === "NUMBER"
      ? `₮${Number(setting.value).toLocaleString()}`
      : setting.value;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        padding: "20px 24px",
        borderBottom: "1px solid #f3f4f6",
        gap: "16px",
        flexWrap: "wrap",
      }}
    >
      <div style={{ flex: 1, minWidth: "200px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <span style={{ fontWeight: 600, fontSize: "14px", color: "#111827" }}>
            {setting.label}
          </span>
          <span
            style={{
              fontSize: "11px",
              color: "#6b7280",
              background: "#f3f4f6",
              padding: "2px 6px",
              borderRadius: "4px",
            }}
          >
            {TYPE_LABELS[setting.type] ?? setting.type}
          </span>
        </div>
        {setting.description && (
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>{setting.description}</p>
        )}
        {setting.updatedByUser && (
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#9ca3af" }}>
            Сүүлд өөрчилсөн: {setting.updatedByUser.email} —{" "}
            {new Date(setting.updatedAt).toLocaleString("mn-MN")}
          </p>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        {editing ? (
          <>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type={setting.type === "NUMBER" ? "number" : "text"}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  style={{
                    border: "1.5px solid #495D35",
                    borderRadius: "6px",
                    padding: "6px 10px",
                    fontSize: "14px",
                    width: "140px",
                    outline: "none",
                  }}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    if (e.key === "Escape") handleCancel();
                  }}
                />
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    background: "#495D35",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "6px 14px",
                    fontSize: "13px",
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? "Хадгалж байна..." : "Хадгалах"}
                </button>
                <button
                  onClick={handleCancel}
                  style={{
                    background: "transparent",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    padding: "6px 12px",
                    fontSize: "13px",
                    cursor: "pointer",
                    color: "#6b7280",
                  }}
                >
                  Болих
                </button>
              </div>
              {error && (
                <span style={{ fontSize: "12px", color: "#dc2626" }}>{error}</span>
              )}
            </div>
          </>
        ) : (
          <>
            <span
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#111827",
                minWidth: "80px",
                textAlign: "right",
              }}
            >
              {displayValue}
            </span>
            <button
              onClick={() => {
                setDraft(setting.value);
                setEditing(true);
              }}
              style={{
                background: "transparent",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "13px",
                cursor: "pointer",
                color: "#374151",
              }}
            >
              Өөрчлөх
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Display order for delivery-zone rows: the 9 Ulaanbaatar districts in the
// same order the storefront checkout dropdown uses, with орон нутаг last.
const ZONE_DISPLAY_ORDER = [
  "Баянгол дүүрэг",
  "Баянзүрх дүүрэг",
  "Сүхбаатар дүүрэг",
  "Хан-Уул дүүрэг",
  "Чингэлтэй дүүрэг",
  "Сонгинохайрхан дүүрэг",
  "Багануур дүүрэг",
  "Багахангай дүүрэг",
  "Налайх дүүрэг",
  "Хөдөө орон нутаг",
];

function DeliveryZoneRow({ setting, onSaved }) {
  const { data: session } = useSession();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(setting.value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    const token = session?.user?.accessToken;
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateSettingClient(setting.key, draft, token);
      onSaved(updated);
      setEditing(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(setting.value);
    setEditing(false);
    setError(null);
  };

  return (
    <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
      <td style={{ padding: "10px 24px", fontSize: "14px", color: "#111827" }}>{setting.label}</td>
      <td style={{ padding: "10px 24px", textAlign: "right" }}>
        {editing ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <input
                type="number"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                style={{
                  border: "1.5px solid #495D35",
                  borderRadius: "6px",
                  padding: "4px 8px",
                  fontSize: "13px",
                  width: "110px",
                  outline: "none",
                }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") handleCancel();
                }}
              />
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  background: "#495D35",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "4px 12px",
                  fontSize: "12px",
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "..." : "Хадгалах"}
              </button>
              <button
                onClick={handleCancel}
                style={{
                  background: "transparent",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  fontSize: "12px",
                  cursor: "pointer",
                  color: "#6b7280",
                }}
              >
                Болих
              </button>
            </div>
            {error && <span style={{ fontSize: "11px", color: "#dc2626" }}>{error}</span>}
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>
              ₮{Number(setting.value).toLocaleString()}
            </span>
            <button
              onClick={() => {
                setDraft(setting.value);
                setEditing(true);
              }}
              style={{
                background: "transparent",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                padding: "4px 10px",
                fontSize: "12px",
                cursor: "pointer",
                color: "#374151",
              }}
            >
              Өөрчлөх
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

function DeliveryZoneTable({ settings, onSaved }) {
  const sorted = [...settings].sort(
    (a, b) => ZONE_DISPLAY_ORDER.indexOf(a.label) - ZONE_DISPLAY_ORDER.indexOf(b.label)
  );

  return (
    <div className="wg-box" style={{ padding: 0, overflow: "hidden", marginTop: "20px" }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
        <h6 style={{ margin: 0, fontWeight: 600, color: "#111827" }}>Хүргэлтийн үнэ дүүргээр</h6>
        <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#6b7280" }}>
          Улаанбаатарын дүүрэг тус бүр болон орон нутгийн хүргэлтийн үнийг тусад нь тохируулна.
        </p>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {sorted.map((s) => (
              <DeliveryZoneRow key={s.key} setting={s} onSaved={onSaved} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function StoreSettingsClient({ initialSettings }) {
  const [settings, setSettings] = useState(initialSettings ?? []);

  const handleSaved = (updated) => {
    setSettings((prev) =>
      prev.map((s) => (s.key === updated.key ? { ...s, ...updated } : s))
    );
  };

  if (settings.length === 0) {
    return (
      <div className="wg-box" style={{ padding: "40px 24px", textAlign: "center", color: "#6b7280" }}>
        Тохиргоо олдсонгүй. Сервер дахин эхлүүлсэн эсэхийг шалгана уу.
      </div>
    );
  }

  const generalSettings = settings.filter((s) => s.group !== "DELIVERY_ZONE");
  const zoneSettings = settings.filter((s) => s.group === "DELIVERY_ZONE");

  return (
    <>
      <div
        className="wg-box"
        style={{ padding: 0, overflow: "hidden" }}
      >
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #e5e7eb",
            background: "#f9fafb",
          }}
        >
          <h6 style={{ margin: 0, fontWeight: 600, color: "#111827" }}>Дэлгүүрийн тохиргоо</h6>
          <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#6b7280" }}>
            Энэ хуудсанд өөрчилсөн утга нь шууд хэрэглэгдэнэ.
          </p>
        </div>

        {generalSettings.map((s) => (
          <SettingRow key={s.key} setting={s} onSaved={handleSaved} />
        ))}
      </div>

      {zoneSettings.length > 0 && (
        <DeliveryZoneTable settings={zoneSettings} onSaved={handleSaved} />
      )}
    </>
  );
}
