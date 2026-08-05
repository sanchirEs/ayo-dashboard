"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { updateRetailerBrand } from "@/lib/api/retailers";

/**
 * Brand mapping is optional by design: publishing a product whose retailer
 * brand is unmapped auto-creates a Brand from the retailer's own name and
 * writes the id back here. Mapping first only matters when you already carry
 * that brand under a different spelling and don't want a duplicate.
 *
 * Rows key on `externalId` (OY `brand_no`), not the display name — seven OY
 * names resolve to two ids each, so name is not a safe key.
 */

const COL = {
  name: { flex: 1, minWidth: 0 },
  count: { width: "92px", flexShrink: 0, textAlign: "right" },
  target: { width: "260px", flexShrink: 0 },
};

const FILTERS = [
  { key: "unmapped", label: "Холбоогүй" },
  { key: "mapped", label: "Холбосон" },
  { key: "all", label: "Бүгд" },
];

export default function BrandMapClient({ slug, initialRows, initialError, brands }) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const [rows, setRows] = useState(initialRows ?? []);
  const [filter, setFilter] = useState("unmapped");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState(null);

  const stats = useMemo(() => {
    const mapped = rows.filter((r) => r.brandId !== null).length;
    return { mapped, total: rows.length };
  }, [rows]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((r) => {
        if (filter === "mapped") return r.brandId !== null;
        if (filter === "unmapped") return r.brandId === null;
        return true;
      })
      .filter(
        (r) =>
          !q ||
          r.name.toLowerCase().includes(q) ||
          (r.nameKo ?? "").toLowerCase().includes(q) ||
          r.externalId.toLowerCase().includes(q)
      );
  }, [rows, filter, search]);

  /** Suggest our brand whose name matches case-insensitively — the common case. */
  function suggestion(row) {
    if (row.brandId !== null) return null;
    const target = row.name.trim().toLowerCase();
    return brands.find((b) => b.name.trim().toLowerCase() === target) ?? null;
  }

  async function apply(row, brandId) {
    setBusy(row.id);
    setMsg(null);
    const res = await updateRetailerBrand(row.id, brandId, token);
    setBusy(null);
    if (!res.success) {
      setMsg({ tone: "danger", text: res.error || "Хадгалж чадсангүй" });
      return;
    }
    setRows((prev) =>
      prev.map((r) =>
        r.id === row.id
          ? { ...r, brandId, brand: brands.find((b) => b.id === brandId) ?? null }
          : r
      )
    );
  }

  if (initialError && !rows.length) {
    return (
      <div className="wg-box text-center py-5">
        <div className="body-text" style={{ color: "#991b1b" }}>
          Брэнд ачаалагдсангүй: {initialError}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="wg-box" style={{ marginBottom: 20 }}>
        <div className="flex items-center justify-between gap10 flex-wrap">
          <div>
            <div className="body-title" style={{ fontSize: 15 }}>
              {slug} — брэнд холбох ({stats.mapped}/{stats.total})
            </div>
            <div className="body-text" style={{ color: "#6b7280", marginTop: 6, maxWidth: 720 }}>
              Заавал холбох шаардлагагүй. Холбоогүй үлдээвэл нийтлэх үед тэдний брэндийн
              нэрээр манайд шинэ брэнд автоматаар үүснэ. Зөвхөн тухайн брэнд манайд өөр
              бичлэгтэй бүртгэлтэй бол давхардахаас сэргийлж энд холбоно.
            </div>
          </div>
          <Link href="/retailers" className="tf-button style-3">
            ← Эх сурвалж
          </Link>
        </div>
      </div>

      {msg && (
        <div
          className="wg-box text-tiny"
          style={{
            marginBottom: 20,
            color: msg.tone === "danger" ? "#991b1b" : "#166534",
            background: msg.tone === "danger" ? "#fee2e2" : "#dcfce7",
          }}
        >
          {msg.text}
        </div>
      )}

      <div className="wg-box">
        <div className="flex items-center justify-between gap10 flex-wrap mb-14">
          <div className="flex gap10 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                className={`tf-button ${filter === f.key ? "style-1" : "style-3"}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Брэндээр хайх..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: 240 }}
          />
        </div>

        <div className="wg-table table-all-attribute">
          <ul className="table-title flex gap20 mb-14" style={{ alignItems: "center" }}>
            <li style={COL.name}>
              <div className="body-title">Тэдний брэнд</div>
            </li>
            <li style={COL.count}>
              <div className="body-title">Бараа</div>
            </li>
            <li style={COL.target}>
              <div className="body-title">Манай брэнд</div>
            </li>
          </ul>

          <ul className="flex flex-column">
            {visible.length ? (
              visible.slice(0, 400).map((row) => {
                const hint = suggestion(row);
                return (
                  <li key={row.id} className="attribute-item flex items-center gap20">
                    <div style={COL.name}>
                      <div className="body-title-2" style={{ wordBreak: "break-word" }}>
                        {row.name}
                      </div>
                      <div className="text-tiny" style={{ color: "#9ca3af", marginTop: 2 }}>
                        {row.externalId}
                        {row.nameKo ? ` · ${row.nameKo}` : ""}
                      </div>
                    </div>

                    <div style={COL.count}>
                      <span className="body-title-2">{row.productCount.toLocaleString()}</span>
                    </div>

                    <div style={COL.target}>
                      <select
                        value={row.brandId ?? ""}
                        disabled={busy === row.id}
                        onChange={(e) =>
                          apply(row, e.target.value === "" ? null : Number(e.target.value))
                        }
                        style={{ width: "100%" }}
                      >
                        <option value="">— холбоогүй (автоматаар үүснэ) —</option>
                        {brands.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                      {hint && (
                        <button
                          type="button"
                          className="text-tiny"
                          onClick={() => apply(row, hint.id)}
                          style={{
                            marginTop: 4,
                            border: "none",
                            background: "transparent",
                            color: "#3b82f6",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          Ижил нэртэй брэнд олдлоо — &quot;{hint.name}&quot;-тэй холбох
                        </button>
                      )}
                    </div>
                  </li>
                );
              })
            ) : (
              <li className="text-center py-4">
                <div className="body-text">Тохирох брэнд алга.</div>
              </li>
            )}
          </ul>

          {visible.length > 400 && (
            <div className="text-tiny text-center py-3" style={{ color: "#6b7280" }}>
              {visible.length.toLocaleString()} брэндээс эхний 400-г харуулж байна — хайлт
              ашиглана уу.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
