"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  getStagingProducts,
  getStatusSummary,
  updateStagingProduct,
  publishBulk,
  publishStagingProduct,
} from "@/lib/api/retailers";

/**
 * Curation queue: staged rows -> live Products.
 *
 * The publish transaction refuses a row that lacks a Mongolian name, a price or
 * a category, so those three are computed locally and shown per row. Marking
 * 500 rows READY and only then discovering they all fail is the failure mode
 * this screen exists to prevent.
 *
 * Thumbnails hotlink the retailer CDN on purpose — Cloudinary is over quota and
 * only the published subset should ever be uploaded.
 */

const STATUS_META = {
  NEW: { label: "Шинэ", tone: "#2563eb" },
  AWAITING_DETAIL: { label: "Дэлгэрэнгүй хүлээж буй", tone: "#a16207" },
  BLOCKED: { label: "Блоклогдсон", tone: "#b91c1c" },
  SKIPPED: { label: "Алгассан", tone: "#6b7280" },
  READY: { label: "Бэлэн", tone: "#15803d" },
  PUBLISHED: { label: "Нийтэлсэн", tone: "#0f766e" },
  STALE: { label: "Хуучирсан", tone: "#c2410c" },
  ARCHIVED: { label: "Архивласан", tone: "#6b7280" },
};

const STATUS_ORDER = [
  "NEW",
  "AWAITING_DETAIL",
  "READY",
  "PUBLISHED",
  "BLOCKED",
  "STALE",
  "SKIPPED",
  "ARCHIVED",
];

const COL = {
  check: { width: "34px", flexShrink: 0 },
  image: { width: "52px", flexShrink: 0 },
  name: { flex: 1, minWidth: 0 },
  price: { width: "180px", flexShrink: 0 },
  status: { width: "150px", flexShrink: 0 },
  actions: { width: "130px", flexShrink: 0 },
};

/**
 * What still blocks this row from publishing — mirrors `checkPublishable` in
 * retailerPublishService.js exactly, including the retailer-level category
 * fallback. Diverging here would either block rows the server would accept or
 * green-light rows it will reject.
 */
function blockers(row, retailer) {
  const out = [];
  // A Mongolian name is preferred, not required — publish falls back to
  // nameEn/nameOriginal, so only a row with no name at all is blocked.
  if (!row.nameMn?.trim() && !row.nameEn?.trim() && !row.nameOriginal?.trim()) {
    out.push("нэр");
  }
  if (row.priceMnt === null && row.computedPriceMnt === null) out.push("үнэ");
  const categoryId = row.retailerCategory?.categoryId ?? retailer?.defaultCategoryId ?? null;
  if (!categoryId) out.push("ангилал");
  if (row.retailerCategory?.isIgnored) out.push("ангилал алгасагдсан");
  return out;
}

function money(v) {
  if (v === null || v === undefined) return "—";
  return `${Math.round(Number(v)).toLocaleString()} ₮`;
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? { label: status, tone: "#6b7280" };
  return (
    <span
      style={{
        color: meta.tone,
        background: `${meta.tone}14`,
        borderRadius: 999,
        padding: "3px 10px",
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {meta.label}
    </span>
  );
}

/** Inline text/number cell: Enter or blur commits, Escape reverts. */
function InlineEdit({ value, placeholder, type = "text", onCommit }) {
  const [draft, setDraft] = useState(value ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(value ?? "");
  }, [value]);

  async function commit() {
    const next = draft === "" ? null : draft;
    if (String(next ?? "") === String(value ?? "")) return;
    setSaving(true);
    await onCommit(next);
    setSaving(false);
  }

  return (
    <input
      type={type}
      value={draft}
      placeholder={placeholder}
      disabled={saving}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          setDraft(value ?? "");
          e.currentTarget.blur();
        }
      }}
      style={{
        width: "100%",
        fontSize: 13,
        padding: "5px 8px",
        border: "1px solid #e5e7eb",
        borderRadius: 6,
        opacity: saving ? 0.5 : 1,
      }}
    />
  );
}

export default function QueueClient({
  slug,
  retailer,
  initialStatus,
  initialRows,
  initialPagination,
  initialSummary,
  initialError,
  categories,
}) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const [rows, setRows] = useState(initialRows ?? []);
  const [pagination, setPagination] = useState(initialPagination);
  const [summary, setSummary] = useState(initialSummary);
  const [status, setStatus] = useState(initialStatus);
  const [categoryId, setCategoryId] = useState("");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(() => new Set());
  const [expanded, setExpanded] = useState(() => new Set());
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState(initialError ? { tone: "danger", text: initialError } : null);

  const mappedCategories = useMemo(
    () => categories.filter((c) => (c._count?.products ?? 0) > 0),
    [categories]
  );

  const load = useCallback(
    async (overrides = {}) => {
      if (!token) return;
      setLoading(true);
      const params = {
        status,
        page,
        limit: 50,
        ...(categoryId ? { categoryId: Number(categoryId) } : {}),
        ...(appliedSearch ? { search: appliedSearch } : {}),
        ...overrides,
      };
      const res = await getStagingProducts(slug, params, token);
      setLoading(false);
      if (!res.success) {
        setMsg({ tone: "danger", text: res.error || "Ачаалж чадсангүй" });
        return;
      }
      setRows(res.data);
      setPagination(res.pagination ?? null);
      setSelected(new Set());
    },
    [token, slug, status, page, categoryId, appliedSearch]
  );

  // Skip the very first run — the server component already delivered page 1.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (!hydrated) {
      setHydrated(true);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page, categoryId, appliedSearch]);

  async function refreshSummary() {
    if (!token) return;
    const res = await getStatusSummary(slug, token);
    if (res.success) setSummary(res.data);
  }

  function patchLocal(id, patch) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function saveField(row, patch) {
    const res = await updateStagingProduct(row.id, patch, token);
    if (!res.success) {
      setMsg({ tone: "danger", text: res.error || "Хадгалж чадсангүй" });
      return;
    }
    patchLocal(row.id, patch);
  }

  /** READY is never machine-set; this is the explicit human approval step. */
  async function markReady(targets) {
    const eligible = targets.filter(
      (r) => blockers(r, retailer).length === 0 && r.status !== "PUBLISHED"
    );
    const skipped = targets.length - eligible.length;
    if (!eligible.length) {
      setMsg({
        tone: "danger",
        text: "Сонгосон мөрүүд бэлэн болох болзол хангахгүй байна (монгол нэр / үнэ / ангилал).",
      });
      return;
    }
    setBusy("ready");
    let ok = 0;
    for (const r of eligible) {
      // eslint-disable-next-line no-await-in-loop
      const res = await updateStagingProduct(r.id, { status: "READY" }, token);
      if (res.success) {
        ok += 1;
        patchLocal(r.id, { status: "READY" });
      }
    }
    setBusy(null);
    setSelected(new Set());
    await refreshSummary();
    setMsg({
      tone: "ok",
      text: `${ok} мөр БЭЛЭН боллоо.${skipped ? ` ${skipped} мөр болзол хангаагүй тул алгаслаа.` : ""}`,
    });
  }

  async function publishSelected() {
    const ids = rows.filter((r) => selected.has(r.id) && r.status === "READY").map((r) => r.id);
    if (!ids.length) {
      setMsg({ tone: "danger", text: "Зөвхөн БЭЛЭН төлөвтэй мөрийг нийтэлнэ." });
      return;
    }
    setBusy("publish");
    const res = await publishBulk(slug, { ids, limit: ids.length }, token);
    setBusy(null);
    if (!res.success) {
      setMsg({ tone: "danger", text: res.error || "Нийтэлж чадсангүй" });
      return;
    }
    const { published, failed } = res.data;
    setSelected(new Set());
    await Promise.all([load(), refreshSummary()]);
    setMsg({
      tone: failed.length ? "danger" : "ok",
      text: failed.length
        ? `${published.length} нийтлэгдлээ, ${failed.length} амжилтгүй: ${failed[0]?.error ?? ""}`
        : `${published.length} бүтээгдэхүүн дэлгүүрт гарлаа.`,
    });
  }

  async function publishRow(row) {
    setBusy(`pub-${row.id}`);
    const res = await publishStagingProduct(row.id, token);
    setBusy(null);
    if (!res.success) {
      setMsg({ tone: "danger", text: res.error || "Нийтэлж чадсангүй" });
      return;
    }
    patchLocal(row.id, { status: "PUBLISHED", productId: res.data?.productId ?? null });
    await refreshSummary();
    setMsg({ tone: "ok", text: "Дэлгүүрт гарлаа." });
  }

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleExpand(id) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  return (
    <>
      {/* status tiles double as the filter */}
      <div className="wg-box" style={{ marginBottom: 20 }}>
        <div className="flex items-center justify-between gap10 flex-wrap">
          <div className="body-title" style={{ fontSize: 15 }}>
            {slug} — {(summary?.total ?? 0).toLocaleString()} бараа завсрын хүснэгтэд
          </div>
          <div className="flex gap10">
            <Link href={`/retailers/${slug}/categories`} className="tf-button style-3">
              Ангилал холбох
            </Link>
            <Link href="/retailers" className="tf-button style-3">
              ← Эх сурвалж
            </Link>
          </div>
        </div>

        <div className="flex gap10 flex-wrap" style={{ marginTop: 16 }}>
          {STATUS_ORDER.filter((s) => (summary?.byStatus?.[s] ?? 0) > 0 || s === status).map((s) => {
            const meta = STATUS_META[s];
            const active = status === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setStatus(s);
                  setPage(1);
                }}
                style={{
                  border: `1px solid ${active ? meta.tone : "#e5e7eb"}`,
                  background: active ? `${meta.tone}14` : "#fff",
                  borderRadius: 10,
                  padding: "10px 16px",
                  cursor: "pointer",
                  textAlign: "left",
                  minWidth: 130,
                }}
              >
                <div className="text-tiny" style={{ color: meta.tone, fontWeight: 600 }}>
                  {meta.label}
                </div>
                <div className="body-title" style={{ fontSize: 18, marginTop: 2 }}>
                  {(summary?.byStatus?.[s] ?? 0).toLocaleString()}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pre-publish warnings — everything here silently ships to customers. */}
      {retailer && (Number(retailer.markupPct ?? 0) === 0 || !retailer.fxRateToMnt || retailer.defaultCategoryId) && (
        <div
          className="wg-box"
          style={{ marginBottom: 20, background: "#fffbeb", border: "1px solid #fde68a" }}
        >
          <div className="body-title-2" style={{ color: "#92400e" }}>
            Нийтлэхийн өмнө анхаарах
          </div>
          <ul className="text-tiny" style={{ color: "#92400e", marginTop: 8, paddingLeft: 18 }}>
            {!retailer.fxRateToMnt && (
              <li>
                Ханш тохируулаагүй байна — үнэ бодогдохгүй тул бараа нийтлэгдэхгүй.
              </li>
            )}
            {Number(retailer.markupPct ?? 0) === 0 && (
              <li>
                Нэмэгдэл <strong>0%</strong> — бараа өртгөөрөө, ашиггүй зарагдана.{" "}
                <Link href="/retailers" style={{ color: "#b45309", textDecoration: "underline" }}>
                  Тохиргоог өөрчлөх
                </Link>
              </li>
            )}
            {retailer.defaultCategoryId && (
              <li>
                Ангилал холбоогүй бараа бүгд <strong>үндсэн ангилалд</strong> (#
                {retailer.defaultCategoryId}) орно.{" "}
                <Link
                  href={`/retailers/${slug}/categories`}
                  style={{ color: "#b45309", textDecoration: "underline" }}
                >
                  Ангилал холбох
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}

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
        {/* filters */}
        <div className="flex items-center gap10 flex-wrap mb-14">
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPage(1);
            }}
            style={{ minWidth: 260 }}
          >
            <option value="">Бүх ангилал</option>
            {mappedCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.path} ({c._count?.products ?? 0})
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Нэр эсвэл кодоор хайх..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setAppliedSearch(search.trim());
                setPage(1);
              }
            }}
            style={{ minWidth: 240 }}
          />
          <button
            type="button"
            className="tf-button style-3"
            onClick={() => {
              setAppliedSearch(search.trim());
              setPage(1);
            }}
          >
            Хайх
          </button>
        </div>

        {/* bulk bar */}
        {selected.size > 0 && (
          <div
            className="flex items-center gap10 flex-wrap mb-14"
            style={{ padding: "12px 16px", background: "#f9fafb", borderRadius: 8 }}
          >
            <span className="body-title-2">{selected.size} сонгосон →</span>
            <button
              type="button"
              className="tf-button style-1"
              disabled={busy === "ready"}
              onClick={() => markReady(rows.filter((r) => selected.has(r.id)))}
            >
              {busy === "ready" ? "Тэмдэглэж байна..." : "БЭЛЭН болгох"}
            </button>
            <button
              type="button"
              className="tf-button style-1"
              disabled={busy === "publish"}
              onClick={publishSelected}
              title="Зөвхөн БЭЛЭН төлөвтэй мөрүүд нийтлэгдэнэ"
            >
              {busy === "publish" ? "Нийтэлж байна..." : "Дэлгүүрт гаргах"}
            </button>
            <button type="button" className="tf-button style-3" onClick={() => setSelected(new Set())}>
              Цуцлах
            </button>
          </div>
        )}

        {/* table */}
        <div className="wg-table table-all-attribute">
          <ul className="table-title flex gap20 mb-14" style={{ alignItems: "center" }}>
            <li style={COL.check}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() =>
                  setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)))
                }
              />
            </li>
            <li style={COL.image} />
            <li style={COL.name}>
              <div className="body-title">Нэр (монгол нэр заавал биш)</div>
            </li>
            <li style={COL.price}>
              <div className="body-title">Үнэ</div>
            </li>
            <li style={COL.status}>
              <div className="body-title">Төлөв</div>
            </li>
            <li style={COL.actions}>
              <div className="body-title">Үйлдэл</div>
            </li>
          </ul>

          <ul className="flex flex-column">
            {loading ? (
              <li className="text-center py-4">
                <div className="body-text">Уншиж байна...</div>
              </li>
            ) : rows.length ? (
              rows.map((row) => {
                const missing = blockers(row, retailer);
                return (
                  <li key={row.id} className="flex flex-column" style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <div className="attribute-item flex items-center gap20" style={{ border: "none" }}>
                      <div style={COL.check}>
                        <input
                          type="checkbox"
                          checked={selected.has(row.id)}
                          onChange={() => toggle(row.id)}
                        />
                      </div>

                      <div style={COL.image}>
                        {row.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={row.imageUrl}
                            alt=""
                            loading="lazy"
                            style={{
                              width: 48,
                              height: 48,
                              objectFit: "cover",
                              borderRadius: 6,
                              background: "#f9fafb",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 6,
                              background: "#f3f4f6",
                            }}
                          />
                        )}
                      </div>

                      <div style={COL.name}>
                        <div
                          className="text-tiny"
                          style={{ color: "#6b7280", wordBreak: "break-word" }}
                        >
                          {row.nameOriginal}
                        </div>
                        <div style={{ marginTop: 4, maxWidth: 460 }}>
                          <InlineEdit
                            value={row.nameMn}
                            placeholder={
                              row.nameEn
                                ? `Хоосон бол: ${row.nameEn}`
                                : "Монгол нэр бичих..."
                            }
                            onCommit={(v) => saveField(row, { nameMn: v })}
                          />
                        </div>
                        <div className="text-tiny" style={{ color: "#9ca3af", marginTop: 4 }}>
                          {row.retailerCategory?.path ?? "ангилалгүй"}
                          {row.retailerBrand?.name ? ` · ${row.retailerBrand.name}` : ""}
                          {row.hasVariants ? ` · ${row.variants.length} сонголт` : ""}
                        </div>
                        {missing.length > 0 && row.status !== "PUBLISHED" && (
                          <div className="text-tiny" style={{ color: "#b45309", marginTop: 4 }}>
                            Дутуу: {missing.join(", ")}
                          </div>
                        )}
                        {row.blockedReason && (
                          <div className="text-tiny" style={{ color: "#b91c1c", marginTop: 2 }}>
                            {row.blockedReason}
                          </div>
                        )}
                      </div>

                      <div style={COL.price}>
                        <div className="text-tiny" style={{ color: "#9ca3af" }}>
                          эх: {row.priceOriginal ?? "—"} · бодсон: {money(row.computedPriceMnt)}
                        </div>
                        <div style={{ marginTop: 4 }}>
                          <InlineEdit
                            value={row.priceMnt}
                            type="number"
                            placeholder="Гар үнэ (₮)"
                            onCommit={(v) => saveField(row, { priceMnt: v })}
                          />
                        </div>
                        {row.priceDrift && (
                          <div className="text-tiny" style={{ color: "#c2410c", marginTop: 2 }}>
                            Эх үнэ өөрчлөгдсөн
                          </div>
                        )}
                      </div>

                      <div style={COL.status}>
                        <StatusBadge status={row.status} />
                        {row.productId && (
                          <div className="text-tiny" style={{ color: "#9ca3af", marginTop: 4 }}>
                            #{row.productId}
                          </div>
                        )}
                      </div>

                      <div style={COL.actions} className="flex flex-column gap10">
                        {row.status === "READY" && (
                          <button
                            type="button"
                            className="tf-button style-1"
                            style={{ padding: "4px 10px", fontSize: 12 }}
                            disabled={busy === `pub-${row.id}`}
                            onClick={() => publishRow(row)}
                          >
                            {busy === `pub-${row.id}` ? "..." : "Нийтлэх"}
                          </button>
                        )}
                        {row.status !== "READY" && row.status !== "PUBLISHED" && (
                          <button
                            type="button"
                            className="tf-button style-3"
                            style={{ padding: "4px 10px", fontSize: 12 }}
                            disabled={missing.length > 0}
                            title={missing.length ? `Дутуу: ${missing.join(", ")}` : "Бэлэн болгох"}
                            onClick={() => markReady([row])}
                          >
                            Бэлэн
                          </button>
                        )}
                        <div className="flex gap10 items-center">
                          {row.productUrl && (
                            <a
                              href={row.productUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-tiny"
                              style={{ color: "#3b82f6" }}
                            >
                              Эх сурвалж
                            </a>
                          )}
                          {row.hasVariants && (
                            <button
                              type="button"
                              className="text-tiny"
                              onClick={() => toggleExpand(row.id)}
                              style={{
                                border: "none",
                                background: "transparent",
                                color: "#3b82f6",
                                cursor: "pointer",
                                padding: 0,
                              }}
                            >
                              {expanded.has(row.id) ? "Хураах" : "Сонголт"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* variant sub-rows */}
                    {expanded.has(row.id) && (
                      <div style={{ padding: "0 0 14px 120px" }}>
                        {row.variants.length ? (
                          row.variants.map((v) => (
                            <div
                              key={v.id}
                              className="flex items-center gap20 text-tiny"
                              style={{ padding: "6px 0", color: "#4b5563" }}
                            >
                              <span style={{ flex: 1 }}>{v.name}</span>
                              <span style={{ width: 120, textAlign: "right" }}>
                                {v.priceOriginal ?? "—"}
                              </span>
                              <span style={{ width: 80, color: v.inStockAtScrape ? "#166534" : "#b91c1c" }}>
                                {v.inStockAtScrape ? "байгаа" : "дууссан"}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-tiny" style={{ color: "#9ca3af" }}>
                            Сонголтын мэдээлэл татагдаагүй байна (дэлгэрэнгүй дамжлага ажиллаагүй).
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })
            ) : (
              <li className="text-center py-4">
                <div className="body-text">Энэ шүүлтэд тохирох бараа алга.</div>
              </li>
            )}
          </ul>
        </div>

        {/* pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between gap10 flex-wrap" style={{ marginTop: 16 }}>
            <div className="text-tiny" style={{ color: "#6b7280" }}>
              {pagination.total.toLocaleString()} мөр · хуудас {pagination.page}/
              {pagination.totalPages}
            </div>
            <div className="flex gap10">
              <button
                type="button"
                className="tf-button style-3"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← Өмнөх
              </button>
              <button
                type="button"
                className="tf-button style-3"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Дараах →
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
