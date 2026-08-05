"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  getRetailerCategories,
  updateRetailerCategory,
  regateProducts,
} from "@/lib/api/retailers";

/**
 * The highest-leverage screen in the retailer flow.
 *
 * Two rules drive the whole design, both learned the hard way:
 *  1. The auto-gate reads `categoryId` on the EXACT node a product landed on.
 *     There is no ancestor inheritance — mapping "Skincare" does nothing for
 *     "Skincare > Cleansers > Foam". Hence the "салбар бүхэлд нь" action.
 *  2. Gating happens at ingest, so a new mapping does NOT retroactively unblock
 *     rows already sitting at BLOCKED. Re-gate is mandatory, so it is a
 *     permanent banner rather than a button you have to remember.
 */

const COL = {
  check: { width: "34px", flexShrink: 0 },
  path: { flex: 1, minWidth: 0 },
  count: { width: "92px", flexShrink: 0, textAlign: "right" },
  target: { width: "230px", flexShrink: 0 },
  actions: { width: "150px", flexShrink: 0 },
};

const FILTERS = [
  { key: "unmapped", label: "Холбоогүй" },
  { key: "mapped", label: "Холбосон" },
  { key: "ignored", label: "Алгасах" },
  { key: "all", label: "Бүгд" },
];

function rowMatchesFilter(row, filter) {
  if (filter === "all") return true;
  if (filter === "ignored") return row.isIgnored;
  if (filter === "mapped") return !row.isIgnored && row.categoryId !== null;
  return !row.isIgnored && row.categoryId === null; // unmapped
}

export default function CategoryMapClient({ slug, initialRows, initialError, categories }) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const [rows, setRows] = useState(initialRows ?? []);
  const [error, setError] = useState(initialError);
  const [filter, setFilter] = useState("unmapped");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(() => new Set());
  const [bulkTarget, setBulkTarget] = useState("");
  const [busy, setBusy] = useState(null);
  const [progress, setProgress] = useState(null);
  const [dirty, setDirty] = useState(0);
  const [msg, setMsg] = useState(null);

  const staged = (r) => r._count?.products ?? 0;

  const stats = useMemo(() => {
    let mapped = 0;
    let ignored = 0;
    let coveredRows = 0;
    let totalRows = 0;
    for (const r of rows) {
      totalRows += staged(r);
      if (r.isIgnored) {
        ignored += 1;
        continue;
      }
      if (r.categoryId !== null) {
        mapped += 1;
        coveredRows += staged(r);
      }
    }
    return { mapped, ignored, coveredRows, totalRows, total: rows.length };
  }, [rows]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((r) => rowMatchesFilter(r, filter))
      .filter((r) => !q || r.path.toLowerCase().includes(q))
      .sort((a, b) => staged(b) - staged(a) || a.path.localeCompare(b.path));
  }, [rows, filter, search]);

  function patchLocal(id, patch) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function applyOne(row, patch) {
    setBusy(`row-${row.id}`);
    setMsg(null);
    const res = await updateRetailerCategory(row.id, patch, token);
    setBusy(null);
    if (!res.success) {
      setMsg({ tone: "danger", text: res.error || "Хадгалж чадсангүй" });
      return;
    }
    patchLocal(row.id, { ...patch, category: categories.find((c) => c.id === patch.categoryId) ?? null });
    setDirty((d) => d + 1);
  }

  /** Runs PATCHes sequentially so a 200-node branch can show real progress. */
  async function applyMany(targets, patch, label) {
    if (!targets.length) return;
    setBusy(label);
    setMsg(null);
    let ok = 0;
    for (let i = 0; i < targets.length; i += 1) {
      setProgress({ done: i, total: targets.length });
      // eslint-disable-next-line no-await-in-loop
      const res = await updateRetailerCategory(targets[i].id, patch, token);
      if (res.success) {
        ok += 1;
        patchLocal(targets[i].id, {
          ...patch,
          category: categories.find((c) => c.id === patch.categoryId) ?? null,
        });
      }
    }
    setProgress(null);
    setBusy(null);
    setDirty((d) => d + ok);
    setMsg(
      ok === targets.length
        ? { tone: "ok", text: `${ok} ангилал холбогдлоо.` }
        : { tone: "danger", text: `${ok}/${targets.length} амжилттай — заримд нь алдаа гарлаа.` }
    );
  }

  /** Every descendant of `row`, plus the node itself. */
  function branchOf(row) {
    const prefix = `${row.path} > `;
    return rows.filter((r) => r.id === row.id || r.path.startsWith(prefix));
  }

  async function mapBranch(row) {
    if (row.categoryId === null) {
      setMsg({ tone: "danger", text: "Эхлээд энэ ангилалд зорилтот ангилал сонгоно уу." });
      return;
    }
    const branch = branchOf(row).filter((r) => r.categoryId !== row.categoryId);
    if (!branch.length) {
      setMsg({ tone: "ok", text: "Энэ салбарын бүх ангилал аль хэдийн холбогдсон байна." });
      return;
    }
    await applyMany(branch, { categoryId: row.categoryId }, `branch-${row.id}`);
  }

  async function applyBulk() {
    const targets = rows.filter((r) => selected.has(r.id));
    if (!targets.length || bulkTarget === "") return;
    await applyMany(targets, { categoryId: Number(bulkTarget) }, "bulk");
    setSelected(new Set());
  }

  async function runRegate() {
    setBusy("regate");
    setMsg(null);
    const res = await regateProducts(slug, token);
    setBusy(null);
    if (!res.success) {
      setMsg({ tone: "danger", text: res.error || "Дахин шалгаж чадсангүй" });
      return;
    }
    setDirty(0);
    setMsg({
      tone: "ok",
      text: `${res.data.changed}/${res.data.examined} мөрийн төлөв шинэчлэгдлээ. ${Object.entries(
        res.data.byStatus ?? {}
      )
        .map(([k, v]) => `${k}: ${v}`)
        .join(" · ")}`,
    });
    // Re-read so the staged counts reflect the new gating.
    const fresh = await getRetailerCategories(slug, token);
    if (fresh.success) setRows(fresh.data);
  }

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (error && !rows.length) {
    return (
      <div className="wg-box text-center py-5">
        <div className="body-text" style={{ color: "#991b1b" }}>
          Ангилал ачаалагдсангүй: {error}
        </div>
      </div>
    );
  }

  const coverPct = stats.totalRows ? Math.round((stats.coveredRows / stats.totalRows) * 100) : 0;

  return (
    <>
      {/* summary */}
      <div className="wg-box" style={{ marginBottom: 20 }}>
        <div className="flex items-center justify-between gap10 flex-wrap">
          <div>
            <div className="body-title" style={{ fontSize: 15 }}>
              {slug} — ангилал холбох
            </div>
            <div className="body-text" style={{ color: "#6b7280", marginTop: 6, maxWidth: 720 }}>
              Тэдний ангилал бүрийг манай ангилалтай холбоно. <strong>Дээд ангилал холбоход
              доод ангилал нь холбогдохгүй</strong> — тиймээс &quot;салбар бүхэлд нь&quot; товчийг
              ашиглана уу.
            </div>
          </div>
          <Link href="/retailers" className="tf-button style-3">
            ← Эх сурвалж
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 14,
            marginTop: 18,
          }}
        >
          <Stat label="Нийт ангилал" value={stats.total} />
          <Stat label="Холбосон" value={stats.mapped} />
          <Stat label="Алгасах" value={stats.ignored} />
          <Stat
            label="Хамрагдсан бараа"
            value={`${stats.coveredRows.toLocaleString()} / ${stats.totalRows.toLocaleString()}`}
          />
          <Stat label="Хувь" value={`${coverPct}%`} warn={coverPct < 100} />
        </div>
      </div>

      {/* the mandatory re-gate banner */}
      {dirty > 0 && (
        <div
          className="wg-box"
          style={{ marginBottom: 20, background: "#fef3c7", border: "1px solid #fde68a" }}
        >
          <div className="flex items-center justify-between gap10 flex-wrap">
            <div>
              <div className="body-title-2" style={{ color: "#92400e" }}>
                {dirty} өөрчлөлт хадгалагдсан — гэхдээ бараанууд хараахан задраагүй
              </div>
              <div className="text-tiny" style={{ color: "#92400e", marginTop: 4 }}>
                Ангилал холбосон нь блоклогдсон мөрүүдийг автоматаар задлахгүй. Доорх товчийг
                дарж төлвийг дахин шалгуулна уу.
              </div>
            </div>
            <button
              type="button"
              className="tf-button style-1"
              disabled={busy === "regate"}
              onClick={runRegate}
            >
              {busy === "regate" ? "Шалгаж байна..." : "Төлөв дахин шалгах"}
            </button>
          </div>
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
            placeholder="Замаар хайх..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: 240 }}
          />
        </div>

        {/* bulk bar */}
        {selected.size > 0 && (
          <div
            className="flex items-center gap10 flex-wrap mb-14"
            style={{ padding: "12px 16px", background: "#f9fafb", borderRadius: 8 }}
          >
            <span className="body-title-2">{selected.size} сонгосон →</span>
            <select value={bulkTarget} onChange={(e) => setBulkTarget(e.target.value)}>
              <option value="">— ангилал сонгох —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="tf-button style-1"
              disabled={bulkTarget === "" || busy === "bulk"}
              onClick={applyBulk}
            >
              {busy === "bulk" ? "Холбож байна..." : "Холбох"}
            </button>
            <button type="button" className="tf-button style-3" onClick={() => setSelected(new Set())}>
              Цуцлах
            </button>
          </div>
        )}

        {progress && (
          <div className="text-tiny mb-14" style={{ color: "#6b7280" }}>
            {progress.done} / {progress.total} боловсруулж байна...
          </div>
        )}

        {/* table */}
        <div className="wg-table table-all-attribute">
          <ul className="table-title flex gap20 mb-14" style={{ alignItems: "center" }}>
            <li style={COL.check} />
            <li style={COL.path}>
              <div className="body-title">Тэдний ангилал</div>
            </li>
            <li style={COL.count}>
              <div className="body-title">Бараа</div>
            </li>
            <li style={COL.target}>
              <div className="body-title">Манай ангилал</div>
            </li>
            <li style={COL.actions}>
              <div className="body-title">Үйлдэл</div>
            </li>
          </ul>

          <ul className="flex flex-column">
            {visible.length ? (
              visible.slice(0, 400).map((row) => (
                <li key={row.id} className="attribute-item flex items-center gap20">
                  <div style={COL.check}>
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      onChange={() => toggle(row.id)}
                    />
                  </div>

                  <div style={COL.path}>
                    <div
                      className="body-title-2"
                      style={{
                        wordBreak: "break-word",
                        color: row.isIgnored ? "#9ca3af" : "#111827",
                        textDecoration: row.isIgnored ? "line-through" : "none",
                      }}
                    >
                      {row.path}
                    </div>
                    <div className="text-tiny" style={{ color: "#9ca3af", marginTop: 2 }}>
                      түвшин {row.depth} · тэдний тоо {row.productCount.toLocaleString()}
                    </div>
                  </div>

                  <div style={COL.count}>
                    <span
                      className="body-title-2"
                      style={{ color: staged(row) ? "#111827" : "#d1d5db" }}
                    >
                      {staged(row).toLocaleString()}
                    </span>
                  </div>

                  <div style={COL.target}>
                    <select
                      value={row.categoryId ?? ""}
                      disabled={row.isIgnored || busy === `row-${row.id}`}
                      onChange={(e) =>
                        applyOne(row, {
                          categoryId: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                      style={{ width: "100%" }}
                    >
                      <option value="">— холбоогүй —</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={COL.actions} className="flex gap10 items-center">
                    <button
                      type="button"
                      title="Энэ ангиллын доорх бүх дэд ангилалд ижил холбоос тавих"
                      className="tf-button style-3"
                      style={{ padding: "4px 10px", fontSize: 12 }}
                      disabled={row.categoryId === null || busy === `branch-${row.id}`}
                      onClick={() => mapBranch(row)}
                    >
                      {busy === `branch-${row.id}` ? "..." : "Салбар"}
                    </button>
                    <label
                      className="flex items-center gap10 text-tiny"
                      style={{ cursor: "pointer", whiteSpace: "nowrap" }}
                      title="Энэ ангиллын бараа огт зарагдахгүй"
                    >
                      <input
                        type="checkbox"
                        checked={row.isIgnored}
                        onChange={(e) => applyOne(row, { isIgnored: e.target.checked })}
                      />
                      Алгас
                    </label>
                  </div>
                </li>
              ))
            ) : (
              <li className="text-center py-4">
                <div className="body-text">Тохирох ангилал алга.</div>
              </li>
            )}
          </ul>

          {visible.length > 400 && (
            <div className="text-tiny text-center py-3" style={{ color: "#6b7280" }}>
              {visible.length.toLocaleString()} ангиллаас эхний 400-г харуулж байна — хайлт
              ашиглана уу.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, warn }) {
  return (
    <div>
      <div className="text-tiny" style={{ color: "#9ca3af" }}>
        {label}
      </div>
      <div className="body-title-2" style={{ color: warn ? "#92400e" : "#111827", marginTop: 2 }}>
        {value}
      </div>
    </div>
  );
}
