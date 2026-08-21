"use client";

/**
 * Barcode entry for the whole catalogue.
 *
 * Built around a handheld scanner, not a mouse: the scanner behaves as a
 * keyboard that types digits and presses Enter, so the modal keeps an
 * autofocused input and submits on Enter. After a save it advances to the
 * next row without closing, which is what makes a few hundred rows tractable.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import {
  listBarcodeVariants,
  getBarcodeStats,
  saveBarcode,
  clearBarcode,
} from "@/lib/api/barcodes";
import { resolveImageUrl } from "@/lib/api/env";

const PAGE_SIZE = 50;

const COL = {
  image: { width: "52px", flexShrink: 0 },
  name: { flex: 1, minWidth: 0 },
  category: { width: "150px", flexShrink: 0 },
  barcode: { width: "165px", flexShrink: 0 },
  status: { width: "90px", flexShrink: 0 },
  action: { width: "104px", flexShrink: 0 },
};

const TABS = [
  { key: "missing", label: "Дутуу" },
  { key: "filled", label: "Бүртгэсэн" },
  { key: "all", label: "Бүгд" },
];

function Thumb({ url, alt, size = 44 }) {
  if (!url) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 8,
          backgroundColor: "#f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <i className="icon-image" style={{ color: "#9ca3af" }} />
      </div>
    );
  }
  return (
    <Image
      src={resolveImageUrl(url)}
      alt={alt || ""}
      width={size}
      height={size}
      unoptimized
      style={{ objectFit: "cover", borderRadius: 8, width: size, height: size, display: "block" }}
    />
  );
}

/**
 * The scan target. Kept mounted across rows so focus is never lost between
 * saves — remounting would drop the next scan on the floor.
 */
function ScanModal({ row, position, total, onSave, onClear, onSkip, onClose }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  // New row: clear the field and take focus back from whatever was clicked.
  useEffect(() => {
    setValue(row?.barcode || "");
    setError(null);
    setSaved(false);
    const id = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(id);
  }, [row?.id]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!row) return null;

  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    const code = value.trim();
    if (!code) {
      setError("Штрих код уншуулна уу");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await onSave(row.id, code);
      setSaved(true);
      // Brief confirmation, then straight to the next row.
      setTimeout(() => onSkip(), 450);
    } catch (saveError) {
      setError(saveError.message);
      setBusy(false);
      // Leave the bad value visible and selected so a re-scan replaces it.
      setTimeout(() => inputRef.current?.select(), 20);
      return;
    }
    setBusy(false);
  };

  const removeCode = async () => {
    setBusy(true);
    setError(null);
    try {
      await onClear(row.id);
      setValue("");
      inputRef.current?.focus();
    } catch (clearError) {
      setError(clearError.message);
    }
    setBusy(false);
  };

  return (
    <div
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15,23,42,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 16,
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          width: "100%",
          maxWidth: 520,
          boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 18px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <div className="body-title">Штрих код бүртгэх</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="text-tiny" style={{ color: "#6b7280" }}>
              {position} / {total}
            </span>
            <button
              type="button"
              onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, lineHeight: 1, color: "#6b7280" }}
              aria-label="Хаах"
            >
              &times;
            </button>
          </div>
        </div>

        <div style={{ padding: 18 }}>
          <div style={{ display: "flex", gap: 14, marginBottom: 18 }}>
            <Thumb url={row.imageUrl} alt={row.productName} size={64} />
            <div style={{ minWidth: 0 }}>
              <div className="body-title-2" style={{ wordBreak: "break-word" }}>
                {row.productName}
              </div>
              {row.variantLabel && (
                <div className="text-tiny" style={{ color: "#2563eb", marginTop: 3 }}>
                  {row.variantLabel}
                </div>
              )}
              <div className="text-tiny" style={{ color: "#6b7280", marginTop: 3 }}>
                SKU: {row.sku}
              </div>
              {row.categoryName && (
                <div className="text-tiny" style={{ color: "#9ca3af", marginTop: 2 }}>
                  {row.categoryName}
                </div>
              )}
            </div>
          </div>

          <form onSubmit={submit}>
            <input
              ref={inputRef}
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                setError(null);
              }}
              // Not type="number": it strips leading zeros, and plenty of
              // real EAN-13s start with one.
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Уншуулах эсвэл гараар бичих…"
              disabled={busy && saved}
              style={{
                width: "100%",
                padding: "13px 15px",
                fontSize: 18,
                letterSpacing: "0.06em",
                borderRadius: 8,
                border: `1px solid ${error ? "#dc2626" : saved ? "#16a34a" : "#d1d5db"}`,
                outline: "none",
                fontFamily: "monospace",
              }}
            />

            {error && (
              <div className="text-tiny" style={{ color: "#dc2626", marginTop: 8 }}>
                {error}
              </div>
            )}
            {saved && (
              <div className="text-tiny" style={{ color: "#16a34a", marginTop: 8 }}>
                Хадгаллаа
              </div>
            )}
            {!error && !saved && (
              <div className="text-tiny" style={{ color: "#9ca3af", marginTop: 8 }}>
                Enter дарж хадгална. 8, 12, 13 эсвэл 14 оронтой байх ёстой.
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
              <button type="submit" className="tf-button style-1" disabled={busy}>
                Хадгалах
              </button>
              <button
                type="button"
                onClick={onSkip}
                className="tf-button"
                style={{ backgroundColor: "#f3f4f6", color: "#374151" }}
                disabled={busy}
              >
                Алгасах
              </button>
              {row.barcode && (
                <button
                  type="button"
                  onClick={removeCode}
                  className="tf-button"
                  style={{ backgroundColor: "#fee2e2", color: "#b91c1c", marginLeft: "auto" }}
                  disabled={busy}
                >
                  Устгах
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function BarcodeClient() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("missing");
  const [page, setPage] = useState(1);

  const [data, setData] = useState({ rows: [], total: 0, totalPages: 1, page: 1 });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);

  // Debounce so a typed search does not fire a request per keystroke.
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setLoadError(null);
    try {
      const [pageData, statsData] = await Promise.all([
        listBarcodeVariants({ search, status, page, pageSize: PAGE_SIZE }, token),
        getBarcodeStats(token),
      ]);
      setData(pageData);
      setStats(statsData);
    } catch (error) {
      setLoadError(error.message);
    }
    setLoading(false);
  }, [token, search, status, page]);

  // token is in the deps on purpose: useSession returns undefined on the
  // first render, and without it the page would sit empty forever.
  useEffect(() => {
    load();
  }, [load]);

  const rows = data.rows;
  const activeRow = activeIndex === null ? null : rows[activeIndex] || null;

  const handleSave = async (variantId, code) => {
    const updated = await saveBarcode(variantId, code, token);
    setData((prev) => ({
      ...prev,
      rows: prev.rows.map((row) => (row.id === variantId ? updated : row)),
    }));
    setStats((prev) => (prev ? { ...prev, withBarcode: prev.withBarcode + 1, missing: prev.missing - 1 } : prev));
  };

  const handleClear = async (variantId) => {
    const updated = await clearBarcode(variantId, token);
    setData((prev) => ({
      ...prev,
      rows: prev.rows.map((row) => (row.id === variantId ? updated : row)),
    }));
    setStats((prev) => (prev ? { ...prev, withBarcode: prev.withBarcode - 1, missing: prev.missing + 1 } : prev));
  };

  // Advance to the next row still needing a code, so a run of already-filled
  // rows does not force the operator to click through them one at a time.
  const advance = () => {
    setActiveIndex((current) => {
      if (current === null) return null;
      for (let i = current + 1; i < rows.length; i += 1) {
        if (!rows[i].barcode) return i;
      }
      return null;
    });
  };

  const remainingHere = useMemo(() => rows.filter((row) => !row.barcode).length, [rows]);

  if (!token) {
    return (
      <div className="wg-box">
        <div className="body-text">Ачаалж байна…</div>
      </div>
    );
  }

  return (
    <div className="wg-box">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setStatus(tab.key);
                setPage(1);
                setActiveIndex(null);
              }}
              className="tf-button"
              style={{
                backgroundColor: status === tab.key ? "#2563eb" : "#f3f4f6",
                color: status === tab.key ? "#fff" : "#374151",
                padding: "8px 18px",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {stats && (
          <div className="text-tiny" style={{ color: "#6b7280" }}>
            Нийт <strong>{stats.total}</strong> · Бүртгэсэн{" "}
            <strong style={{ color: "#16a34a" }}>{stats.withBarcode}</strong> · Дутуу{" "}
            <strong style={{ color: "#dc2626" }}>{stats.missing}</strong>
          </div>
        )}
      </div>

      <div style={{ margin: "16px 0" }}>
        <input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Нэр, SKU эсвэл штрих кодоор хайх…"
          style={{
            width: "100%",
            padding: "11px 15px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            outline: "none",
          }}
        />
      </div>

      {remainingHere > 0 && (
        <button
          type="button"
          className="tf-button style-1"
          style={{ marginBottom: 16 }}
          onClick={() => setActiveIndex(rows.findIndex((row) => !row.barcode))}
        >
          <i className="icon-play" /> Уншуулж эхлэх ({remainingHere})
        </button>
      )}

      {loadError && (
        <div className="text-tiny" style={{ color: "#dc2626", marginBottom: 12 }}>
          {loadError}
        </div>
      )}

      <div className="wg-table table-all-attribute">
        <ul className="table-title flex gap20 mb-14" style={{ alignItems: "center" }}>
          <li style={COL.image}><div className="body-title">Зураг</div></li>
          <li style={COL.name}><div className="body-title">Бүтээгдэхүүн</div></li>
          <li style={COL.category}><div className="body-title">Ангилал</div></li>
          <li style={COL.barcode}><div className="body-title">Штрих код</div></li>
          <li style={COL.status}><div className="body-title">Төлөв</div></li>
          <li style={COL.action}><div className="body-title">Үйлдэл</div></li>
        </ul>

        <ul className="flex flex-column">
          {loading ? (
            <li className="text-center py-4">
              <div className="body-text">Ачаалж байна…</div>
            </li>
          ) : rows.length === 0 ? (
            <li className="text-center py-4">
              <div className="body-text">
                {status === "missing"
                  ? "Бүх бүтээгдэхүүн штрих кодтой боллоо."
                  : "Илэрц олдсонгүй."}
              </div>
            </li>
          ) : (
            rows.map((row, index) => (
              <li
                key={row.id}
                className="attribute-item flex items-center gap20"
                onClick={() => setActiveIndex(index)}
                style={{ cursor: "pointer" }}
              >
                <div style={COL.image}>
                  <Thumb url={row.imageUrl} alt={row.productName} />
                </div>

                <div style={COL.name}>
                  <div className="body-title-2" style={{ wordBreak: "break-word" }}>
                    {row.productName}
                  </div>
                  <div className="text-tiny" style={{ color: "#6b7280", marginTop: 2 }}>
                    {row.variantLabel ? `${row.variantLabel} · ` : ""}
                    {row.sku}
                  </div>
                </div>

                <div style={COL.category}>
                  <div className="text-tiny" style={{ color: "#374151" }}>
                    {row.categoryName || "—"}
                  </div>
                </div>

                <div style={COL.barcode}>
                  {row.barcode ? (
                    <span className="text-tiny" style={{ fontFamily: "monospace", color: "#111827" }}>
                      {row.barcode}
                    </span>
                  ) : (
                    <span className="text-tiny" style={{ color: "#d1d5db" }}>—</span>
                  )}
                </div>

                <div style={COL.status}>
                  <span
                    className="text-tiny"
                    style={{
                      padding: "3px 9px",
                      borderRadius: 999,
                      backgroundColor: row.isActive ? "#dcfce7" : "#f3f4f6",
                      color: row.isActive ? "#15803d" : "#6b7280",
                    }}
                  >
                    {row.isActive ? "Идэвхтэй" : "Идэвхгүй"}
                  </span>
                </div>

                <div style={COL.action}>
                  <button
                    type="button"
                    className="tf-button"
                    style={{
                      padding: "6px 14px",
                      backgroundColor: row.barcode ? "#f3f4f6" : "#2563eb",
                      color: row.barcode ? "#374151" : "#fff",
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      setActiveIndex(index);
                    }}
                  >
                    {row.barcode ? "Засах" : "Уншуулах"}
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {data.totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 18 }}>
          <button
            type="button"
            className="tf-button"
            style={{ backgroundColor: "#f3f4f6", color: "#374151" }}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Өмнөх
          </button>
          <span className="text-tiny" style={{ color: "#6b7280" }}>
            {data.page} / {data.totalPages} ({data.total})
          </span>
          <button
            type="button"
            className="tf-button"
            style={{ backgroundColor: "#f3f4f6", color: "#374151" }}
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
          >
            Дараах
          </button>
        </div>
      )}

      <ScanModal
        row={activeRow}
        position={activeIndex === null ? 0 : activeIndex + 1}
        total={rows.length}
        onSave={handleSave}
        onClear={handleClear}
        onSkip={advance}
        onClose={() => setActiveIndex(null)}
      />
    </div>
  );
}
