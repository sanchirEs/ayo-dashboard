"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { updateSettingClient } from "@/lib/api/settings";

const TYPE_LABELS = { NUMBER: "Тоо (MNT)", STRING: "Текст", BOOLEAN: "Тийм/Үгүй" };
const ACCENT = "#495D35";

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "14px",
        padding: "18px 24px",
        borderBottom: "1px solid #ecf0f4",
        background: "#f9fafb",
      }}
    >
      <div
        style={{
          width: "38px",
          height: "38px",
          borderRadius: "10px",
          background: "rgba(73, 93, 53, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <i className={icon} style={{ fontSize: "18px", color: ACCENT }} />
      </div>
      <div>
        <h6 style={{ margin: 0, fontWeight: 600, color: "#111827", fontSize: "15px" }}>{title}</h6>
        <p style={{ margin: "3px 0 0", fontSize: "13px", color: "#6b7280" }}>{subtitle}</p>
      </div>
    </div>
  );
}

// Icon-only edit trigger, matching the .list-icon-function pattern used for
// row actions across the dashboard (store-locations, coupons, etc.)
function EditTrigger({ onClick, title = "Засах" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="list-icon-function"
      style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer" }}
    >
      <span className="item edit" style={{ color: ACCENT }}>
        <i className="icon-edit-3" />
      </span>
    </button>
  );
}

function SaveCancelTriggers({ onSave, onCancel, saving }) {
  return (
    <div className="list-icon-function" style={{ gap: "10px" }}>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        title="Хадгалах"
        style={{
          border: "none",
          background: "transparent",
          padding: 0,
          cursor: saving ? "not-allowed" : "pointer",
          opacity: saving ? 0.5 : 1,
        }}
      >
        <span className="item edit" style={{ color: ACCENT }}>
          <i className="icon-check" />
        </span>
      </button>
      <button
        type="button"
        onClick={onCancel}
        title="Болих"
        style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer" }}
      >
        <span className="item trash">
          <i className="icon-x" />
        </span>
      </button>
    </div>
  );
}

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

      <div style={{ display: "flex", alignItems: "center", gap: "14px", flexShrink: 0 }}>
        {editing ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                type={setting.type === "NUMBER" ? "number" : "text"}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                style={{
                  border: "1.5px solid #495D35",
                  borderRadius: "8px",
                  padding: "7px 12px",
                  fontSize: "14px",
                  width: "140px",
                  outline: "none",
                  background: "#f9fafb",
                }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") handleCancel();
                }}
              />
              <SaveCancelTriggers onSave={handleSave} onCancel={handleCancel} saving={saving} />
            </div>
            {error && <span style={{ fontSize: "12px", color: "#dc2626" }}>{error}</span>}
          </div>
        ) : (
          <>
            <span
              style={{
                fontSize: "17px",
                fontWeight: 700,
                color: "#111827",
                minWidth: "80px",
                textAlign: "right",
              }}
            >
              {displayValue}
            </span>
            <EditTrigger
              onClick={() => {
                setDraft(setting.value);
                setEditing(true);
              }}
            />
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

const ZONE_COL = {
  name: { flex: 1, minWidth: 0 },
  price: { width: "200px", flexShrink: 0, textAlign: "right" },
};

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
    <li className="attribute-item flex items-center gap20">
      <div style={ZONE_COL.name}>
        <span className="body-title-2">{setting.label}</span>
      </div>
      <div style={ZONE_COL.price}>
        {editing ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "flex-end" }}>
              <input
                type="number"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                style={{
                  border: "1.5px solid #495D35",
                  borderRadius: "8px",
                  padding: "5px 10px",
                  fontSize: "13px",
                  width: "100px",
                  outline: "none",
                  background: "#fff",
                }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") handleCancel();
                }}
              />
              <SaveCancelTriggers onSave={handleSave} onCancel={handleCancel} saving={saving} />
            </div>
            {error && <span style={{ fontSize: "11px", color: "#dc2626" }}>{error}</span>}
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "16px" }}>
            <span className="body-title-2" style={{ fontSize: "15px" }}>
              ₮{Number(setting.value).toLocaleString()}
            </span>
            <EditTrigger
              onClick={() => {
                setDraft(setting.value);
                setEditing(true);
              }}
            />
          </div>
        )}
      </div>
    </li>
  );
}

function DeliveryZoneTable({ settings, onSaved }) {
  const sorted = [...settings].sort(
    (a, b) => ZONE_DISPLAY_ORDER.indexOf(a.label) - ZONE_DISPLAY_ORDER.indexOf(b.label)
  );

  return (
    <div className="wg-box" style={{ padding: 0, overflow: "hidden", marginTop: "20px" }}>
      <SectionHeader
        icon="icon-truck"
        title="Хүргэлтийн үнэ дүүргээр"
        subtitle="Улаанбаатарын дүүрэг тус бүр болон орон нутгийн хүргэлтийн үнийг тусад нь тохируулна."
      />
      <div style={{ padding: "16px 24px 20px" }}>
        <div className="wg-table table-all-attribute">
          <ul className="table-title flex gap20 mb-14" style={{ alignItems: "center" }}>
            <li style={ZONE_COL.name}><div className="body-title">Чиглэл</div></li>
            <li style={ZONE_COL.price}><div className="body-title" style={{ textAlign: "right" }}>Хүргэлтийн үнэ</div></li>
          </ul>
          <ul className="flex flex-column">
            {sorted.map((s) => (
              <DeliveryZoneRow key={s.key} setting={s} onSaved={onSaved} />
            ))}
          </ul>
        </div>
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
      <div className="wg-box" style={{ padding: 0, overflow: "hidden" }}>
        <SectionHeader
          icon="icon-settings"
          title="Дэлгүүрийн тохиргоо"
          subtitle="Энэ хуудсанд өөрчилсөн утга нь шууд хэрэглэгдэнэ."
        />
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
