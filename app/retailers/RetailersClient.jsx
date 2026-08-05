"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  getRetailers,
  updateRetailer,
  recomputePrices,
  regateProducts,
} from "@/lib/api/retailers";

const ACCENT = "#495D35";

/** Editable fields, in render order. Type drives the input + coercion. */
const FIELDS = [
  { key: "displayName", label: "Харагдах нэр", type: "text", hint: "Хэрэглэгчид харагдана" },
  { key: "logoUrl", label: "Лого (URL)", type: "text", hint: "Дэлгүүрийн карт дээрх зураг" },
  { key: "fxRateToMnt", label: "Ханш (1 нэгж → ₮)", type: "decimal", hint: "Хоосон = үнэ бодогдохгүй" },
  { key: "markupPct", label: "Нэмэгдэл (%)", type: "decimal", hint: "Ашгийн хувь" },
  { key: "priceRoundTo", label: "Дугуйлалт (₮)", type: "int", hint: "Дээш нь дугуйлна" },
  { key: "leadTimeDays", label: "Хүргэлт (хоног)", type: "int", hint: "Захиалгын хугацаа" },
  { key: "defaultCategoryId", label: "Үндсэн ангилал", type: "category", hint: "Тохирох ангилал олдоогүй үед" },
  { key: "displayOrder", label: "Эрэмбэ", type: "int", hint: "Бага нь эхэнд" },
];

function coerce(field, raw) {
  if (field.type === "int") {
    const n = Number(raw);
    return Number.isFinite(n) ? Math.trunc(n) : 0;
  }
  if (field.type === "decimal") {
    if (raw === "" || raw === null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? String(n) : null;
  }
  if (field.type === "category") {
    return raw === "" || raw === null ? null : Number(raw);
  }
  return raw === "" ? null : raw;
}

function Badge({ tone, children }) {
  const tones = {
    warn: { bg: "#fef3c7", fg: "#92400e" },
    danger: { bg: "#fee2e2", fg: "#991b1b" },
    ok: { bg: "#dcfce7", fg: "#166534" },
    muted: { bg: "#f3f4f6", fg: "#4b5563" },
  };
  const t = tones[tone] ?? tones.muted;
  return (
    <span
      style={{
        background: t.bg,
        color: t.fg,
        borderRadius: "999px",
        padding: "3px 10px",
        fontSize: "12px",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function RetailerCard({ retailer, categories, token, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState(null);

  const markup = Number(retailer.markupPct ?? 0);
  const fx = retailer.fxRateToMnt;
  const counts = retailer._count ?? {};

  function startEdit() {
    const d = {};
    for (const f of FIELDS) {
      const v = retailer[f.key];
      d[f.key] = v === null || v === undefined ? "" : String(v);
    }
    setDraft(d);
    setMsg(null);
    setEditing(true);
  }

  async function save() {
    setBusy("save");
    setMsg(null);
    const payload = {};
    for (const f of FIELDS) payload[f.key] = coerce(f, draft[f.key]);
    payload.isActive = draft.isActive !== undefined ? draft.isActive : retailer.isActive;

    const res = await updateRetailer(retailer.slug, payload, token);
    setBusy(null);
    if (!res.success) {
      setMsg({ tone: "danger", text: res.error || "Хадгалж чадсангүй" });
      return;
    }
    setEditing(false);
    // FX or markup moves make every staged price stale — say so rather than
    // silently leaving the catalogue priced off the old rate.
    const pricingChanged =
      String(payload.fxRateToMnt) !== String(retailer.fxRateToMnt) ||
      String(payload.markupPct) !== String(retailer.markupPct);
    setMsg(
      pricingChanged
        ? { tone: "warn", text: "Хадгаллаа. Ханш/нэмэгдэл өөрчлөгдсөн — 'Үнэ дахин бодох' дарна уу." }
        : { tone: "ok", text: "Хадгаллаа." }
    );
    onChanged();
  }

  async function runAction(kind) {
    setBusy(kind);
    setMsg(null);
    const res =
      kind === "recompute"
        ? await recomputePrices(retailer.slug, token)
        : await regateProducts(retailer.slug, token);
    setBusy(null);
    if (!res.success) {
      setMsg({ tone: "danger", text: res.error || "Амжилтгүй" });
      return;
    }
    setMsg({
      tone: "ok",
      text:
        kind === "recompute"
          ? `Үнэ дахин бодлоо: ${res.data.updated}/${res.data.examined} мөр шинэчлэгдсэн.`
          : `Дахин шалгалаа: ${res.data.changed}/${res.data.examined} мөр төлөв өөрчлөгдсөн.`,
    });
    onChanged();
  }

  return (
    <div className="wg-box" style={{ marginBottom: "20px" }}>
      {/* header */}
      <div className="flex items-center justify-between gap10 flex-wrap">
        <div className="flex items-center gap10">
          {retailer.logoUrl ? (
            // Retailer logos are arbitrary external URLs — plain <img> avoids
            // adding a remotePattern per retailer and keeps them off Cloudinary.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={retailer.logoUrl}
              alt={retailer.name}
              style={{ width: 44, height: 44, objectFit: "contain", borderRadius: 8, background: "#f9fafb" }}
            />
          ) : (
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                background: "#f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i className="icon-shopping-bag" style={{ color: "#9ca3af" }} />
            </div>
          )}
          <div>
            <div className="body-title" style={{ fontSize: 16 }}>
              {retailer.displayName || retailer.name}
            </div>
            <div className="text-tiny" style={{ color: "#6b7280" }}>
              {retailer.slug} · {retailer.currency} · {retailer.countryCode}
            </div>
          </div>
        </div>

        <div className="flex items-center gap10 flex-wrap">
          {!retailer.isActive && <Badge tone="muted">Идэвхгүй</Badge>}
          {fx === null || fx === undefined ? (
            <Badge tone="danger">Ханш тохируулаагүй</Badge>
          ) : null}
          {markup === 0 && <Badge tone="warn">Нэмэгдэл 0% — өртгөөрөө зарна</Badge>}
        </div>
      </div>

      {/* counts + nav */}
      <div className="flex items-center gap10 flex-wrap" style={{ margin: "16px 0" }}>
        <Link href={`/retailers/${retailer.slug}/queue`} className="tf-button style-1">
          Бүтээгдэхүүн ({counts.retailerProducts ?? 0})
        </Link>
        <Link href={`/retailers/${retailer.slug}/categories`} className="tf-button style-3">
          Ангилал холбох ({counts.categories ?? 0})
        </Link>
        <Link href={`/retailers/${retailer.slug}/brands`} className="tf-button style-3">
          Брэнд холбох ({counts.brands ?? 0})
        </Link>
      </div>

      {/* fields */}
      {editing ? (
        <div className="flex flex-column gap10">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "14px" }}>
            {FIELDS.map((f) => (
              <fieldset key={f.key} className="name">
                <div className="body-title mb-10" style={{ fontSize: 13 }}>
                  {f.label}
                </div>
                {f.type === "category" ? (
                  <select
                    className="flex-grow"
                    value={draft[f.key] ?? ""}
                    onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                  >
                    <option value="">— сонгоогүй —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="flex-grow"
                    type={f.type === "text" ? "text" : "number"}
                    step={f.type === "decimal" ? "0.01" : "1"}
                    value={draft[f.key] ?? ""}
                    onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                  />
                )}
                <div className="text-tiny" style={{ color: "#9ca3af", marginTop: 4 }}>
                  {f.hint}
                </div>
              </fieldset>
            ))}
          </div>

          <label className="flex items-center gap10" style={{ cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={draft.isActive !== undefined ? draft.isActive : retailer.isActive}
              onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
            />
            <span className="body-text">Идэвхтэй (дэлгүүрт харагдана)</span>
          </label>

          <div className="flex gap10">
            <button
              type="button"
              className="tf-button style-1"
              disabled={busy === "save"}
              onClick={save}
            >
              {busy === "save" ? "Хадгалж байна..." : "Хадгалах"}
            </button>
            <button type="button" className="tf-button style-3" onClick={() => setEditing(false)}>
              Болих
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "14px" }}>
          <Stat label="Ханш" value={fx ? `${Number(fx)} ₮` : "—"} danger={!fx} />
          <Stat label="Нэмэгдэл" value={`${markup}%`} warn={markup === 0} />
          <Stat label="Дугуйлалт" value={`${retailer.priceRoundTo} ₮`} />
          <Stat label="Хүргэлт" value={`${retailer.leadTimeDays} хоног`} />
          <Stat
            label="Үндсэн ангилал"
            value={categories.find((c) => c.id === retailer.defaultCategoryId)?.name ?? "—"}
          />
          <Stat
            label="Сүүлд татсан"
            value={retailer.lastSyncedAt ? new Date(retailer.lastSyncedAt).toLocaleDateString("mn-MN") : "—"}
          />
        </div>
      )}

      {msg && (
        <div
          className="text-tiny"
          style={{
            marginTop: 14,
            padding: "10px 14px",
            borderRadius: 8,
            background: msg.tone === "danger" ? "#fee2e2" : msg.tone === "warn" ? "#fef3c7" : "#dcfce7",
            color: msg.tone === "danger" ? "#991b1b" : msg.tone === "warn" ? "#92400e" : "#166534",
          }}
        >
          {msg.text}
        </div>
      )}

      {!editing && (
        <div className="flex gap10 flex-wrap" style={{ marginTop: 16 }}>
          <button type="button" className="tf-button style-1" onClick={startEdit}>
            <i className="icon-edit-3" /> Засах
          </button>
          <button
            type="button"
            className="tf-button style-3"
            disabled={busy === "recompute"}
            onClick={() => runAction("recompute")}
            title="Ханш/нэмэгдэл өөрчилсний дараа заавал ажиллуулна"
          >
            {busy === "recompute" ? "Бодож байна..." : "Үнэ дахин бодох"}
          </button>
          <button
            type="button"
            className="tf-button style-3"
            disabled={busy === "regate"}
            onClick={() => runAction("regate")}
            title="Ангилал холбосны дараа заавал ажиллуулна — эс бөгөөс блоклогдсон мөрүүд задрахгүй"
          >
            {busy === "regate" ? "Шалгаж байна..." : "Төлөв дахин шалгах"}
          </button>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, warn, danger }) {
  return (
    <div>
      <div className="text-tiny" style={{ color: "#9ca3af" }}>
        {label}
      </div>
      <div
        className="body-title-2"
        style={{ color: danger ? "#991b1b" : warn ? "#92400e" : "#111827", marginTop: 2 }}
      >
        {value}
      </div>
    </div>
  );
}

export default function RetailersClient({ initialRetailers, initialError, categories }) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const [retailers, setRetailers] = useState(initialRetailers ?? []);
  const [error, setError] = useState(initialError);

  async function refresh() {
    if (!token) return;
    const res = await getRetailers(token);
    if (res.success) {
      setRetailers(res.data);
      setError(null);
    } else {
      setError(res.error);
    }
  }

  if (error && !retailers.length) {
    return (
      <div className="wg-box text-center py-5">
        <div className="body-text" style={{ color: "#991b1b" }}>
          Эх сурвалжийн жагсаалт ачаалагдсангүй: {error}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="wg-box" style={{ marginBottom: 20 }}>
        <div className="body-title" style={{ fontSize: 15 }}>
          Эх сурвалжаас бараа авах
        </div>
        <div className="body-text" style={{ color: "#6b7280", marginTop: 6 }}>
          Татаж авсан бараа эхлээд <strong>завсрын хүснэгтэд</strong> хадгалагдана — дэлгүүрт
          шууд гарахгүй. Ангилал холбож, монгол нэр өгч, <strong>READY</strong> болгосны дараа
          л <strong>Нийтлэх</strong> товч дарж дэлгүүрт гаргана.
        </div>
      </div>

      {retailers.map((r) => (
        <RetailerCard
          key={r.id}
          retailer={r}
          categories={categories}
          token={token}
          onChanged={refresh}
        />
      ))}

      {!retailers.length && (
        <div className="wg-box text-center py-5">
          <div className="body-text">Эх сурвалж бүртгэгдээгүй байна.</div>
        </div>
      )}
    </>
  );
}
