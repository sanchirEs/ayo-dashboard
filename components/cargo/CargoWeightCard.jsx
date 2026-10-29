"use client";

/**
 * Cargo card for an import product's edit page: effective weight, the cargo
 * inside the price, and a box to weigh the product. Lives outside the product
 * form (its own save, its own endpoint), so it works from its own state.
 *
 * The product JSON carries only `cargoMnt`, not the measured weight, so the card
 * reads its row from the Карго page's product list (searched by SKU, which is
 * unique) to prefill the box and show where the weight comes from.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCargoProducts, setProductWeight } from "@/lib/api/cargo";
import { SOURCE_LABEL, formatMnt, formatWeight } from "@/lib/cargo/format";
import { WEIGHT_INPUT_ERROR, resolveWeightInput } from "@/lib/cargo/screens";

const TONES = {
  ok: { bg: "#dcfce7", fg: "#166534" },
  warn: { bg: "#fef3c7", fg: "#92400e" },
  info: { bg: "#e0f2fe", fg: "#075985" },
  muted: { bg: "#f3f4f6", fg: "#4b5563" },
};

const SOURCE_TONE = { MEASURED: "ok", CATEGORY: "info", DEFAULT: "warn" };

const INPUT_STYLE = {
  border: "1.5px solid #d1d5db",
  borderRadius: "8px",
  padding: "7px 10px",
  fontSize: "13px",
  outline: "none",
  background: "#fff",
  height: "36px",
  boxSizing: "border-box",
};

// .tf-button is tall by template default; size it to sit level with the input.
const BUTTON_STYLE = { height: 36, padding: "0 16px", fontSize: 14, lineHeight: "20px" };

/** "Жинлэсэн" / "Ангиллын" / "Анхдагч" — where an effective weight comes from. */
export function WeightSourceChip({ source }) {
  if (!source) return null;
  const t = TONES[SOURCE_TONE[source]] ?? TONES.muted;
  return (
    <span
      style={{
        background: t.bg,
        color: t.fg,
        borderRadius: "999px",
        padding: "2px 9px",
        fontSize: "11px",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {SOURCE_LABEL[source] ?? source}
    </span>
  );
}

function Stat({ label, children, sub }) {
  return (
    <div>
      <div className="text-tiny" style={{ color: "#9ca3af" }}>
        {label}
      </div>
      <div style={{ marginTop: 2, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {children}
      </div>
      {sub && (
        <div className="text-tiny" style={{ color: "#6b7280", marginTop: 2 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

/**
 * @param productId  the product being edited
 * @param sku        its SKU, used to find its cargo row
 * @param token      session access token
 * @param onSaved    called after a weight was saved; saving reprices the product,
 *                   so the page reloads the form rather than let it write the old
 *                   price back
 */
export default function CargoWeightCard({ productId, sku, token, onSaved }) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [row, setRow] = useState(null);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      // A blank SKU would list every import product, so only look when there is one.
      const res = sku ? await getCargoProducts({ q: sku, take: 200 }, token) : null;
      if (cancelled) return;
      if (res && !res.success) {
        setLoadError(res.error || "Жингийн мэдээлэл ачаалагдсангүй");
      } else {
        const found = res?.data?.rows?.find((r) => r.id === productId) ?? null;
        setRow(found);
        setInput(found?.cargoWeightG != null ? String(found.cargoWeightG) : "");
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, sku, token]);

  async function save() {
    const parsed = resolveWeightInput(input, row?.cargoWeightG);
    if (!parsed.ok) {
      setError(WEIGHT_INPUT_ERROR);
      return;
    }
    if (!parsed.changed) return;

    setSaving(true);
    setError(null);
    setSaved(null);
    const res = await setProductWeight(productId, parsed.weightG, token);
    setSaving(false);
    if (!res.success || !res.data) {
      setError(res.error || "Жин хадгалж чадсангүй");
      return;
    }

    const d = res.data;
    setRow((prev) => ({
      ...(prev ?? {}),
      id: productId,
      cargoWeightG: parsed.weightG,
      weightG: d.weightG,
      source: d.source,
      cargoMnt: d.cargoMnt,
      price: d.price,
    }));
    setInput(parsed.weightG === null ? "" : String(parsed.weightG));
    setSaved(parsed.weightG === null ? "Жин устгалаа." : "Жин хадгаллаа.");
    onSaved?.(d);
  }

  const cargoMnt = Number(row?.cargoMnt) || 0;
  // null = a house import product; undefined = not known (row built from a save)
  const isHouse = row?.retailerSlug === null;

  return (
    <div className="wg-box" style={{ marginBottom: 20 }}>
      <div className="flex items-center justify-between gap10 flex-wrap">
        <div className="body-title" style={{ fontSize: 15 }}>
          Карго
        </div>
        <Link href="/cargo" className="text-tiny" style={{ color: "#495D35", fontWeight: 600 }}>
          Карго хуудас →
        </Link>
      </div>

      {loading ? (
        <div className="text-tiny" style={{ color: "#9ca3af", marginTop: 12 }}>
          Уншиж байна...
        </div>
      ) : (
        <>
          {loadError && (
            <div className="text-tiny" style={{ color: "#991b1b", marginTop: 12 }}>
              {loadError}
            </div>
          )}

          {row && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "14px",
                marginTop: 14,
              }}
            >
              <Stat label="Жин">
                <span className="body-title-2" style={{ color: "#111827" }}>
                  {formatWeight(row.weightG)}
                </span>
                <WeightSourceChip source={row.source} />
              </Stat>
              {cargoMnt > 0 && (
                <Stat label="Карго" sub={isHouse ? "Үнэд автоматаар нэмэгдэхгүй" : "Үнэд карго багтсан"}>
                  <span className="body-title-2" style={{ color: "#111827" }}>
                    {formatMnt(cargoMnt)}
                  </span>
                </Stat>
              )}
              <Stat label="Үнэ">
                <span className="body-title-2" style={{ color: "#111827" }}>
                  {formatMnt(row.price)}
                </span>
              </Stat>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <label className="body-title" style={{ fontSize: 13 }} htmlFor="cargo-weight-input">
              Жин (гр)
            </label>
            <input
              id="cargo-weight-input"
              type="text"
              inputMode="numeric"
              value={input}
              placeholder={row?.weightG != null ? String(row.weightG) : ""}
              disabled={saving}
              onChange={(e) => {
                setInput(e.target.value);
                setError(null);
                setSaved(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  save();
                }
              }}
              style={{ ...INPUT_STYLE, width: 120 }}
            />
            <button type="button" className="tf-button style-3" style={BUTTON_STYLE} disabled={saving} onClick={save}>
              {saving ? "Хадгалж байна..." : "Жин хадгалах"}
            </button>
            {saved && (
              <span className="text-tiny" style={{ color: "#166534", fontWeight: 600 }}>
                ✓ {saved}
              </span>
            )}
          </div>
          {error && (
            <div className="text-tiny" style={{ color: "#991b1b", marginTop: 8 }}>
              {error}
            </div>
          )}
        </>
      )}
    </div>
  );
}
