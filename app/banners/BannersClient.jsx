"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import ImageUpload from "@/components/upload/ImageUpload";
import {
  createBannerClient,
  updateBannerClient,
  deleteBannerClient,
  reorderBannersClient,
} from "@/lib/api/banners";

const ACCENT = "#495D35";

const SLOTS = [
  {
    slot: "hero",
    title: "Нүүр хуудасны слайдшоу",
    subtitle: "Дэлгүүрийн нүүр хуудасны хамгийн дээд том зурган слайдууд. Эрэмбийг сум ашиглан өөрчилнө.",
    allowMobileImage: true,
    allowReorder: true,
  },
  {
    slot: "brand",
    title: "Брэндийн баннер",
    subtitle: "Онцлох брэндийн зурган баннер.",
    allowMobileImage: false,
    allowReorder: false,
  },
  {
    slot: "payment",
    title: "Төлбөрийн баннер",
    subtitle: "Төлбөрийн нөхцөлийн зурган баннер.",
    allowMobileImage: false,
    allowReorder: false,
  },
  {
    slot: "flash-sale",
    title: "Flash Sale дэвсгэр зураг",
    subtitle: "Flash Sale хэсгийн дэвсгэр зураг.",
    allowMobileImage: false,
    allowReorder: false,
  },
];

function SectionHeader({ title, subtitle }) {
  return (
    <div
      style={{
        padding: "18px 24px",
        borderBottom: "1px solid #ecf0f4",
        background: "#f9fafb",
      }}
    >
      <h6 style={{ margin: 0, fontWeight: 600, color: "#111827", fontSize: "15px" }}>{title}</h6>
      <p style={{ margin: "3px 0 0", fontSize: "13px", color: "#6b7280" }}>{subtitle}</p>
    </div>
  );
}

function BannerCard({ banner, allowMobileImage, allowReorder, isFirst, isLast, onToggleActive, onMove, onDelete, onEdit, busy }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "16px",
        padding: "16px 24px",
        borderBottom: "1px solid #f3f4f6",
        alignItems: "center",
        opacity: banner.isActive ? 1 : 0.5,
      }}
    >
      <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
        <img
          src={banner.imageUrl}
          alt={banner.altText}
          style={{ width: "110px", height: "60px", objectFit: "cover", borderRadius: "6px", border: "1px solid #e5e7eb" }}
        />
        {allowMobileImage && banner.mobileImageUrl && (
          <img
            src={banner.mobileImageUrl}
            alt={`${banner.altText} (mobile)`}
            style={{ width: "40px", height: "60px", objectFit: "cover", borderRadius: "6px", border: "1px solid #e5e7eb" }}
          />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: "14px", color: "#111827" }}>{banner.altText}</div>
        <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
          {banner.linkUrl ? `Холбоос: ${banner.linkUrl}` : "Холбоосгүй"}
        </div>
        <button
          type="button"
          onClick={() => onEdit(banner)}
          style={{ border: "none", background: "transparent", color: ACCENT, fontSize: "12px", padding: 0, marginTop: "4px", cursor: "pointer" }}
        >
          Засах
        </button>
      </div>

      {allowReorder && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <button
            type="button"
            disabled={isFirst || busy}
            onClick={() => onMove(banner, -1)}
            title="Дээш"
            style={{ border: "1px solid #e5e7eb", background: "#fff", borderRadius: "4px", cursor: isFirst ? "not-allowed" : "pointer", opacity: isFirst ? 0.4 : 1 }}
          >
            <i className="icon-chevron-up" style={{ fontSize: "12px" }} />
          </button>
          <button
            type="button"
            disabled={isLast || busy}
            onClick={() => onMove(banner, 1)}
            title="Доош"
            style={{ border: "1px solid #e5e7eb", background: "#fff", borderRadius: "4px", cursor: isLast ? "not-allowed" : "pointer", opacity: isLast ? 0.4 : 1 }}
          >
            <i className="icon-chevron-down" style={{ fontSize: "12px" }} />
          </button>
        </div>
      )}

      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#6b7280", cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={banner.isActive}
          disabled={busy}
          onChange={(e) => onToggleActive(banner, e.target.checked)}
        />
        Идэвхтэй
      </label>

      <button
        type="button"
        disabled={busy}
        onClick={() => onDelete(banner)}
        title="Устгах"
        style={{ border: "none", background: "transparent", cursor: "pointer", color: "#dc2626" }}
      >
        <i className="icon-trash-2" />
      </button>
    </div>
  );
}

function BannerForm({ slot, allowMobileImage, editingBanner, onCancel, onSaved, token }) {
  const [imageUrl, setImageUrl] = useState(editingBanner?.imageUrl ?? "");
  const [mobileImageUrl, setMobileImageUrl] = useState(editingBanner?.mobileImageUrl ?? "");
  const [altText, setAltText] = useState(editingBanner?.altText ?? "");
  const [linkUrl, setLinkUrl] = useState(editingBanner?.linkUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isEditing = Boolean(editingBanner);
  const canSave = imageUrl && altText.trim() && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        slot,
        imageUrl,
        mobileImageUrl: mobileImageUrl || null,
        altText: altText.trim(),
        linkUrl: linkUrl.trim() || null,
      };
      const saved = isEditing
        ? await updateBannerClient(editingBanner.id, payload, token)
        : await createBannerClient(payload, token);
      onSaved(saved, isEditing);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "20px 24px", background: "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
      <div style={{ display: "grid", gridTemplateColumns: allowMobileImage ? "1fr 1fr" : "1fr", gap: "16px", marginBottom: "16px" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "#111827" }}>
            {allowMobileImage ? "Компьютерийн зураг" : "Зураг"}
          </div>
          {imageUrl && (
            <img src={imageUrl} alt="preview" style={{ width: "100%", maxWidth: "260px", borderRadius: "6px", marginBottom: "8px" }} />
          )}
          <ImageUpload
            folder="banners"
            type="banners"
            maxFiles={1}
            autoUpload
            showPreview={false}
            onUploadComplete={(images) => images[0] && setImageUrl(images[0].url)}
            onUploadError={(err) => setError(err)}
          />
        </div>

        {allowMobileImage && (
          <div>
            <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "#111827" }}>
              Мобайл зураг
            </div>
            {mobileImageUrl && (
              <img src={mobileImageUrl} alt="preview" style={{ width: "100%", maxWidth: "160px", borderRadius: "6px", marginBottom: "8px" }} />
            )}
            <ImageUpload
              folder="banners"
              type="banners"
              maxFiles={1}
              autoUpload
              showPreview={false}
              onUploadComplete={(images) => images[0] && setMobileImageUrl(images[0].url)}
              onUploadError={(err) => setError(err)}
            />
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
        <div style={{ flex: "1 1 240px" }}>
          <label style={{ fontSize: "12px", color: "#6b7280", display: "block", marginBottom: "4px" }}>
            Alt текст (заавал)
          </label>
          <input
            type="text"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            style={{ width: "100%", border: "1.5px solid #e5e7eb", borderRadius: "8px", padding: "8px 12px", fontSize: "14px" }}
          />
        </div>
        <div style={{ flex: "1 1 240px" }}>
          <label style={{ fontSize: "12px", color: "#6b7280", display: "block", marginBottom: "4px" }}>
            Холбоос (заавал биш)
          </label>
          <input
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="/shop-1"
            style={{ width: "100%", border: "1.5px solid #e5e7eb", borderRadius: "8px", padding: "8px 12px", fontSize: "14px" }}
          />
        </div>
      </div>

      {error && <div style={{ color: "#dc2626", fontSize: "13px", marginBottom: "10px" }}>{error}</div>}

      <div style={{ display: "flex", gap: "10px" }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          style={{
            background: canSave ? ACCENT : "#d1d5db",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "8px 18px",
            fontSize: "14px",
            cursor: canSave ? "pointer" : "not-allowed",
          }}
        >
          {saving ? "Хадгалж байна..." : "Хадгалах"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{ background: "transparent", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "8px 18px", fontSize: "14px", cursor: "pointer" }}
        >
          Болих
        </button>
      </div>
    </div>
  );
}

function SlotSection({ slot, title, subtitle, allowMobileImage, allowReorder, banners, token, onChange }) {
  const [adding, setAdding] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [busy, setBusy] = useState(false);

  const sorted = [...banners].sort((a, b) => a.order - b.order);

  const handleSaved = (saved, wasEditing) => {
    if (wasEditing) {
      onChange((prev) => prev.map((b) => (b.id === saved.id ? saved : b)));
    } else {
      onChange((prev) => [...prev, saved]);
    }
    setAdding(false);
    setEditingBanner(null);
  };

  const handleToggleActive = async (banner, isActive) => {
    setBusy(true);
    try {
      const updated = await updateBannerClient(banner.id, { isActive }, token);
      onChange((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (banner) => {
    if (!confirm(`"${banner.altText}" баннерыг устгах уу?`)) return;
    setBusy(true);
    try {
      await deleteBannerClient(banner.id, token);
      onChange((prev) => prev.filter((b) => b.id !== banner.id));
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleMove = async (banner, direction) => {
    const idx = sorted.findIndex((b) => b.id === banner.id);
    const swapWith = sorted[idx + direction];
    if (!swapWith) return;

    const reordered = [...sorted];
    [reordered[idx], reordered[idx + direction]] = [reordered[idx + direction], reordered[idx]];
    const orderedIds = reordered.map((b) => b.id);

    setBusy(true);
    try {
      const updatedSlotBanners = await reorderBannersClient(slot, orderedIds, token);
      onChange((prev) => [
        ...prev.filter((b) => b.slot !== slot),
        ...updatedSlotBanners,
      ]);
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wg-box" style={{ padding: 0, overflow: "hidden", marginTop: "20px" }}>
      <SectionHeader title={title} subtitle={subtitle} />

      {sorted.length === 0 && !adding && (
        <div style={{ padding: "20px 24px", color: "#9ca3af", fontSize: "13px" }}>Баннер алга.</div>
      )}

      {sorted.map((banner, i) => (
        <BannerCard
          key={banner.id}
          banner={banner}
          allowMobileImage={allowMobileImage}
          allowReorder={allowReorder}
          isFirst={i === 0}
          isLast={i === sorted.length - 1}
          busy={busy}
          onToggleActive={handleToggleActive}
          onMove={handleMove}
          onDelete={handleDelete}
          onEdit={(b) => {
            setEditingBanner(b);
            setAdding(false);
          }}
        />
      ))}

      {editingBanner && (
        <BannerForm
          slot={slot}
          allowMobileImage={allowMobileImage}
          editingBanner={editingBanner}
          token={token}
          onCancel={() => setEditingBanner(null)}
          onSaved={handleSaved}
        />
      )}

      {adding && (
        <BannerForm
          slot={slot}
          allowMobileImage={allowMobileImage}
          editingBanner={null}
          token={token}
          onCancel={() => setAdding(false)}
          onSaved={handleSaved}
        />
      )}

      {!adding && !editingBanner && (
        <div style={{ padding: "14px 24px" }}>
          <button
            type="button"
            onClick={() => setAdding(true)}
            style={{ border: `1.5px dashed ${ACCENT}`, background: "transparent", color: ACCENT, borderRadius: "8px", padding: "8px 16px", fontSize: "13px", cursor: "pointer" }}
          >
            + Шинэ баннер нэмэх
          </button>
        </div>
      )}
    </div>
  );
}

export default function BannersClient({ initialBanners }) {
  const { data: session, status } = useSession();
  const token = session?.user?.accessToken;
  const [banners, setBanners] = useState(initialBanners ?? []);

  if (status === "loading") {
    return (
      <div className="wg-box" style={{ padding: "40px 24px", textAlign: "center", color: "#6b7280" }}>
        Уншиж байна...
      </div>
    );
  }

  if (!token) {
    return (
      <div className="wg-box" style={{ padding: "40px 24px", textAlign: "center", color: "#6b7280" }}>
        Нэвтрэх шаардлагатай.
      </div>
    );
  }

  return (
    <>
      {SLOTS.map(({ slot, title, subtitle, allowMobileImage, allowReorder }) => (
        <SlotSection
          key={slot}
          slot={slot}
          title={title}
          subtitle={subtitle}
          allowMobileImage={allowMobileImage}
          allowReorder={allowReorder}
          banners={banners.filter((b) => b.slot === slot)}
          token={token}
          onChange={(updater) => setBanners((prev) => (typeof updater === "function" ? updater(prev) : updater))}
        />
      ))}
    </>
  );
}
