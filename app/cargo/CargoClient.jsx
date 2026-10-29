"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  getCargoOverview,
  getCargoProducts,
  getCargoCategories,
  setProductWeight,
  setCategoryWeight,
  startReprice,
  getRepriceStatus,
} from "@/lib/api/cargo";
import { updateSettingClient } from "@/lib/api/settings";
import { formatUB } from "@/lib/ubTime";
import {
  MAX_WEIGHT_G,
  SOURCE_LABEL,
  formatMnt,
  formatWeight,
  parseGrams,
} from "@/lib/cargo/format";

const ACCENT = "#495D35";
const PAGE_SIZE = 50;
const POLL_MS = 3000;

const TONES = {
  ok: { bg: "#dcfce7", fg: "#166534" },
  warn: { bg: "#fef3c7", fg: "#92400e" },
  danger: { bg: "#fee2e2", fg: "#991b1b" },
  info: { bg: "#e0f2fe", fg: "#075985" },
  muted: { bg: "#f3f4f6", fg: "#4b5563" },
};

const SOURCE_TONE = { MEASURED: "ok", CATEGORY: "info", DEFAULT: "warn" };

// Coverage bar segments, keyed like the stat labels above it.
const COVERAGE_COLOR = { MEASURED: "#16a34a", CATEGORY: "#0ea5e9", DEFAULT: "#f59e0b" };

// What the reprice job is doing (ayo-back cargoRepriceJob PHASE). An unknown
// phase falls back to its raw name rather than hiding progress.
const PHASE_LABEL = {
  STAGING: "Эх сурвалжийн үнэ бодож байна",
  PUBLISHED: "Нийтлэгдсэн барааны үнэ шинэчилж байна",
  HOUSE: "Өөрийн импорт барааны карго шинэчилж байна",
  CACHE: "Дэлгүүрийн кэш цэвэрлэж байна",
};

const GRAMS_ERROR = `1–${MAX_WEIGHT_G.toLocaleString("en-US")} гр хооронд бүхэл тоо оруулна уу (0 боломжгүй)`;

const INPUT_STYLE = {
  border: "1.5px solid #d1d5db",
  borderRadius: "8px",
  padding: "7px 10px",
  fontSize: "13px",
  outline: "none",
  background: "#fff",
  height: "auto",
};

// ==================== SHARED PIECES ====================

function Chip({ tone = "muted", children, title }) {
  const t = TONES[tone] ?? TONES.muted;
  return (
    <span
      title={title}
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

function Notice({ tone = "ok", children, style }) {
  const t = TONES[tone] ?? TONES.ok;
  return (
    <div
      className="text-tiny"
      style={{
        padding: "10px 14px",
        borderRadius: "8px",
        background: t.bg,
        color: t.fg,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Stat({ label, value, sub, tone, dot }) {
  const color = tone === "danger" ? "#991b1b" : tone === "warn" ? "#92400e" : "#111827";
  return (
    <div>
      <div className="text-tiny" style={{ color: "#9ca3af", display: "flex", alignItems: "center", gap: 6 }}>
        {dot && (
          <span
            aria-hidden="true"
            style={{ width: 8, height: 8, borderRadius: 999, background: dot, flexShrink: 0 }}
          />
        )}
        {label}
      </div>
      <div className="body-title-2" style={{ color, marginTop: 2 }}>
        {value}
      </div>
      {sub && (
        <div className="text-tiny" style={{ color: "#6b7280", marginTop: 2 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function CardTitle({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="body-title" style={{ fontSize: 16 }}>
        {title}
      </div>
      {subtitle && (
        <div className="body-text" style={{ color: "#6b7280", marginTop: 4 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

/**
 * Whole-gram input shared by the product rows and the category tree.
 *
 * Enter (or the tick) saves; Escape reverts. A blank input clears the weight
 * (null); 0 and anything that is not 1..200,000 whole grams is refused here, so
 * the backend never sees a 0 it would silently read as "not set".
 *
 * `onSave(grams|null)` resolves to `{ error }` on failure. `onAdvance` runs on
 * an Enter-save (as soon as the value is valid) so the owner can weigh a whole
 * list from the keyboard.
 */
function GramsField({ saved, placeholder, onSave, onAdvance, inputRef, width = 110, label }) {
  const savedText = saved ? String(saved) : "";
  const [text, setText] = useState(savedText);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [justSaved, setJustSaved] = useState(false);

  // The value can change from outside (a refetch after a category weight moved
  // many rows) — follow it.
  useEffect(() => {
    setText(savedText);
    setError(null);
  }, [savedText]);

  useEffect(() => {
    if (!justSaved) return undefined;
    const t = setTimeout(() => setJustSaved(false), 1800);
    return () => clearTimeout(t);
  }, [justSaved]);

  const dirty = text.trim() !== savedText;

  async function submit(advance) {
    if (busy) return;
    const grams = parseGrams(text);
    if (Number.isNaN(grams)) {
      setError(GRAMS_ERROR);
      return;
    }
    // Nothing changed ("250 гр" typed over 250, or blank over blank): just tidy
    // the text and move on without a request.
    if (grams === (saved || null)) {
      setText(savedText);
      setError(null);
      if (advance) onAdvance?.();
      return;
    }
    setBusy(true);
    setError(null);
    // Move to the next row at once — the save finishes in the background and
    // reports any failure on this row, so entering a list is not paced by the
    // round trip.
    if (advance) onAdvance?.();
    const res = await onSave(grams);
    setBusy(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setJustSaved(true);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          aria-label={label ?? "Жин (гр)"}
          value={text}
          placeholder={placeholder}
          readOnly={busy}
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
          }}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;
            if (e.key === "Enter") {
              e.preventDefault();
              submit(true);
            } else if (e.key === "Escape") {
              setText(savedText);
              setError(null);
            }
          }}
          style={{
            ...INPUT_STYLE,
            width,
            borderColor: error ? "#dc2626" : dirty ? ACCENT : "#d1d5db",
            opacity: busy ? 0.6 : 1,
          }}
        />
        {/* Fixed-width slot so the input does not jump when the tick or the
            "saved" note appears. */}
        <span style={{ display: "inline-flex", alignItems: "center", width: 64, flexShrink: 0 }}>
          {busy ? (
            <span className="text-tiny" style={{ color: "#6b7280" }}>
              ...
            </span>
          ) : dirty ? (
            <button
              type="button"
              title="Хадгалах"
              onClick={() => submit(false)}
              style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer" }}
            >
              <span className="item edit" style={{ color: ACCENT }}>
                <i className="icon-check" />
              </span>
            </button>
          ) : justSaved ? (
            <span className="text-tiny" style={{ color: "#166534", fontWeight: 600 }}>
              Хадгалсан
            </span>
          ) : null}
        </span>
      </div>
      {error && (
        <div className="text-tiny" style={{ color: "#dc2626", marginTop: 4, maxWidth: 220 }}>
          {error}
        </div>
      )}
    </div>
  );
}

// ==================== 1. ТАРИФ ====================

function parseRate(text) {
  const t = text.trim();
  if (!/^\d{1,9}$/.test(t)) return { error: "0 буюу түүнээс их бүхэл тоо оруулна уу" };
  return { value: Number(t) };
}

function parseDefaultWeight(text) {
  const g = parseGrams(text);
  if (g === null || Number.isNaN(g)) return { error: GRAMS_ERROR };
  return { value: g };
}

function SettingField({ label, hint, value, display, parse, settingKey, token, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function startEdit() {
    setDraft(String(value ?? ""));
    setError(null);
    setEditing(true);
  }

  async function save() {
    if (!token || saving) return;
    const parsed = parse(draft);
    if (parsed.error) {
      setError(parsed.error);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateSettingClient(settingKey, String(parsed.value), token);
      setEditing(false);
      onSaved();
    } catch (e) {
      // The backend answers a bad value with a Mongolian message — show it as is.
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ minWidth: 220 }}>
      <div className="body-title" style={{ fontSize: 13 }}>
        {label}
      </div>
      {editing ? (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="text"
              inputMode="numeric"
              aria-label={label}
              autoFocus
              value={draft}
              disabled={saving}
              onChange={(e) => {
                setDraft(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing) return;
                if (e.key === "Enter") save();
                if (e.key === "Escape") setEditing(false);
              }}
              style={{ ...INPUT_STYLE, width: 140, borderColor: error ? "#dc2626" : ACCENT }}
            />
            <button type="button" className="tf-button style-3" disabled={saving} onClick={save}>
              {saving ? "Хадгалж байна..." : "Хадгалах"}
            </button>
            <button type="button" className="tf-button style-1" onClick={() => setEditing(false)}>
              Болих
            </button>
          </div>
          {error && (
            <div className="text-tiny" style={{ color: "#dc2626", marginTop: 6 }}>
              {error}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
          <span className="body-title-2" style={{ fontSize: 20 }}>
            {display}
          </span>
          <button
            type="button"
            title="Засах"
            className="list-icon-function"
            onClick={startEdit}
            style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer" }}
          >
            <span className="item edit" style={{ color: ACCENT }}>
              <i className="icon-edit-3" />
            </span>
          </button>
        </div>
      )}
      <div className="text-tiny" style={{ color: "#9ca3af", marginTop: 4 }}>
        {hint}
      </div>
    </div>
  );
}

function RateCard({ overview, token, onSettingsChanged }) {
  const settings = overview.settings ?? {};
  const rate = Number(settings.ratePerKg ?? 0);
  const defaultWeight = Number(settings.defaultWeightG ?? 0);

  return (
    <div className="wg-box" style={{ marginBottom: 20 }}>
      <CardTitle
        title="Тариф"
        subtitle="Карго = жин × тариф. Тариф эсвэл анхдагч жин өөрчилсний дараа “Бүх үнийг шинэчлэх” дарснаар үнэнд тусна."
      />
      <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
        <SettingField
          label="Карго тариф (₮/кг, НӨАТ-гүй)"
          hint="Нэг килограммын карго."
          value={rate}
          display={`${formatMnt(rate)} / кг`}
          parse={parseRate}
          settingKey="CARGO_RATE_PER_KG"
          token={token}
          onSaved={onSettingsChanged}
        />
        <SettingField
          label="Анхдагч жин (гр)"
          hint="Бараа болон түүний ангилалд жин байхгүй үед тооцох жин."
          value={defaultWeight}
          display={defaultWeight > 0 ? formatWeight(defaultWeight) : "—"}
          parse={parseDefaultWeight}
          settingKey="CARGO_DEFAULT_WEIGHT_G"
          token={token}
          onSaved={onSettingsChanged}
        />
      </div>
    </div>
  );
}

// ==================== 2. БАЙДАЛ ====================

function CoverageBar({ measured, category, fallback }) {
  const total = measured + category + fallback;
  if (total <= 0) return null;
  const seg = (n, color, name) =>
    n > 0 ? (
      <div
        key={name}
        title={`${name}: ${n}`}
        style={{ width: `${(n / total) * 100}%`, background: color, height: "100%" }}
      />
    ) : null;
  return (
    <div
      style={{
        display: "flex",
        height: 10,
        borderRadius: 999,
        overflow: "hidden",
        background: "#f3f4f6",
        margin: "14px 0 4px",
      }}
    >
      {seg(measured, COVERAGE_COLOR.MEASURED, SOURCE_LABEL.MEASURED)}
      {seg(category, COVERAGE_COLOR.CATEGORY, SOURCE_LABEL.CATEGORY)}
      {seg(fallback, COVERAGE_COLOR.DEFAULT, SOURCE_LABEL.DEFAULT)}
    </div>
  );
}

function JobProgress({ job, pollFailed }) {
  if (!job || job.status === "IDLE") return null;

  if (job.status === "RUNNING") {
    const pct = job.total > 0 ? Math.min(100, Math.round((job.done / job.total) * 100)) : 0;
    return (
      <div style={{ marginTop: 16 }}>
        <div className="body-text" style={{ marginBottom: 6 }}>
          {PHASE_LABEL[job.phase] ?? job.phase ?? "Шинэчилж байна"}... {job.done} / {job.total} ({pct}%)
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          style={{ height: 12, borderRadius: 999, background: "#f3f4f6", overflow: "hidden" }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              background: ACCENT,
              transition: "width 0.4s ease",
            }}
          />
        </div>
        <div className="text-tiny" style={{ color: "#6b7280", marginTop: 6 }}>
          {job.changed} үнэ өөрчлөгдсөн{job.failed ? `, ${job.failed} алдаатай` : ""}. Хуудсыг орхиж болно —
          шинэчлэлт цаана үргэлжилнэ.
          {pollFailed && " Төлөв шалгаж чадсангүй, дахин оролдож байна..."}
        </div>
      </div>
    );
  }

  const failedRun = job.status === "FAILED";
  const finished = job.finishedAt ? formatUB(job.finishedAt) : null;
  return (
    <div style={{ marginTop: 16 }}>
      <Notice tone={failedRun ? "danger" : job.failed ? "warn" : "ok"}>
        {failedRun ? "Шинэчлэлт амжилтгүй боллоо" : "Шинэчлэлт дууслаа"}
        {finished ? ` (${finished})` : ""}: {job.done}/{job.total} мөр шалгаж, {job.changed} үнэ
        өөрчилсөн{job.failed ? `, ${job.failed} алдаатай` : ""}.
      </Notice>
      {job.errors?.length > 0 && (
        <details style={{ marginTop: 8 }}>
          <summary className="text-tiny" style={{ cursor: "pointer", color: "#991b1b" }}>
            Алдаануудыг харах ({job.errors.length})
          </summary>
          <ul className="text-tiny" style={{ color: "#6b7280", margin: "6px 0 0 18px", listStyle: "disc" }}>
            {job.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function StatusCard({ overview, job, onJobChange, token, onFinished }) {
  const [confirming, setConfirming] = useState(false);
  const [starting, setStarting] = useState(false);
  const [msg, setMsg] = useState(null);
  const [pollFailed, setPollFailed] = useState(false);

  const counts = overview.counts ?? {};
  const total = Number(counts.importProducts ?? 0);
  const measured = Number(counts.measured ?? 0);
  const category = Number(counts.category ?? 0);
  const fallback = Number(counts.default ?? 0);
  const stale = Number(overview.staleCount ?? 0);
  const cargo30d = overview.cargo30d ?? {};
  const running = job?.status === "RUNNING";

  // Poll the job every 3 s while it runs. A chain of timeouts, not an interval,
  // so a slow answer can never overlap the next request.
  useEffect(() => {
    if (!running || !token) return undefined;
    let cancelled = false;
    let timer;
    const tick = async () => {
      const res = await getRepriceStatus(token);
      if (cancelled) return;
      if (res.success && res.data) {
        setPollFailed(false);
        onJobChange(res.data);
        if (res.data.status !== "RUNNING") return;
      } else {
        setPollFailed(true);
      }
      timer = setTimeout(tick, POLL_MS);
    };
    timer = setTimeout(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [running, token, onJobChange]);

  // RUNNING -> anything else: the prices moved, so reload what depends on them.
  const prevStatus = useRef(job?.status);
  useEffect(() => {
    if (prevStatus.current === "RUNNING" && job?.status !== "RUNNING") onFinished();
    prevStatus.current = job?.status;
  }, [job?.status, onFinished]);

  async function start() {
    if (!token) return;
    setStarting(true);
    setMsg(null);
    const res = await startReprice(token);
    if (res.success && res.data) {
      onJobChange(res.data);
    } else {
      // A job someone else started is not a failure here — show its progress.
      const current = await getRepriceStatus(token);
      if (current.success && current.data?.status === "RUNNING") {
        onJobChange(current.data);
        setMsg({ tone: "warn", text: res.error || "Үнэ шинэчлэлт аль хэдийн явагдаж байна" });
      } else {
        setMsg({ tone: "danger", text: res.error || "Шинэчлэлт эхлүүлж чадсангүй" });
      }
    }
    setStarting(false);
    setConfirming(false);
  }

  return (
    <div className="wg-box" style={{ marginBottom: 20 }}>
      <CardTitle title="Байдал" subtitle="Импортын бараа бүрийн жин хаанаас ирж байгаа." />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "14px",
        }}
      >
        <Stat label="Импортын бараа" value={total} />
        <Stat label={SOURCE_LABEL.MEASURED} value={measured} sub="өөрийн жинтэй" dot={COVERAGE_COLOR.MEASURED} />
        <Stat label={SOURCE_LABEL.CATEGORY} value={category} sub="ангиллын жингээр" dot={COVERAGE_COLOR.CATEGORY} />
        <Stat
          label={SOURCE_LABEL.DEFAULT}
          value={fallback}
          sub="анхдагч жингээр"
          tone={fallback > 0 ? "warn" : undefined}
          dot={COVERAGE_COLOR.DEFAULT}
        />
        <Stat
          label="Карго төлөгдсөн (30 хоног)"
          value={formatMnt(cargo30d.mnt)}
          sub={`${Number(cargo30d.units ?? 0)} ширхэг`}
        />
      </div>
      <CoverageBar measured={measured} category={category} fallback={fallback} />

      {stale > 0 && (
        <Notice tone="warn" style={{ marginTop: 14 }}>
          {stale} барааны үнэ карго тооцоогүй байна
        </Notice>
      )}

      {msg && <Notice tone={msg.tone} style={{ marginTop: 14 }}>{msg.text}</Notice>}

      {confirming ? (
        <div
          style={{
            marginTop: 14,
            padding: "14px 16px",
            borderRadius: 8,
            border: "1px solid #fcd34d",
            background: "#fffbeb",
          }}
        >
          <div className="body-text" style={{ color: "#92400e" }}>
            Бүх үнийг шинэчлэхэд ойролцоогоор 25 минут болно. Одоогийн ханш, ашгийн хувь, каргоор бүх
            импортын барааны үнийг дахин бодож хадгална. Үргэлжлүүлэх үү?
          </div>
          <div className="flex gap10" style={{ marginTop: 12 }}>
            <button type="button" className="tf-button style-3" disabled={starting} onClick={start}>
              {starting ? "Эхлүүлж байна..." : "Тийм, шинэчлэх"}
            </button>
            <button
              type="button"
              className="tf-button style-1"
              disabled={starting}
              onClick={() => setConfirming(false)}
            >
              Болих
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap10 flex-wrap" style={{ marginTop: 14 }}>
          <button
            type="button"
            className="tf-button style-1"
            disabled={running || !token}
            onClick={() => {
              setMsg(null);
              setConfirming(true);
            }}
          >
            <i className="icon-refresh-cw" /> Бүх үнийг шинэчлэх
          </button>
        </div>
      )}

      <JobProgress job={job} pollFailed={pollFailed} />
    </div>
  );
}

// ==================== 3. ЖИНЛЭХ ЖАГСААЛТ ====================

const FILTERS = [
  { key: "unmeasured", label: "Жинлээгүй" },
  { key: "measured", label: "Жинлэсэн" },
  { key: "all", label: "Бүгд" },
];

// image | name | retailer | pending | weight | cargo | price | input
const ROW_COLUMNS = "56px minmax(180px, 2fr) 100px 90px 150px 80px 90px 180px";
const ROW_GAP = 12;
const LIST_MIN_WIDTH = 1010;

function WeighRow({ row, index, token, onSaved, inputRef, onAdvance }) {
  const source = row.source ?? "DEFAULT";

  async function save(grams) {
    const res = await setProductWeight(row.id, grams, token);
    if (!res.success || !res.data) return { error: res.error || "Хадгалж чадсангүй" };
    onSaved(row.id, grams, res.data);
    return {};
  }

  return (
    <div
      data-weigh-row={index}
      style={{
        display: "grid",
        gridTemplateColumns: ROW_COLUMNS,
        gap: ROW_GAP,
        alignItems: "center",
        padding: "10px 0",
        borderBottom: "1px solid #f3f4f6",
      }}
    >
      {row.imageUrl ? (
        // Retailer product images are arbitrary external URLs — plain <img>, and
        // deliberately no crossOrigin (those CDNs send no CORS headers).
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={row.imageUrl}
          alt=""
          loading="lazy"
          style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8, background: "#f9fafb" }}
        />
      ) : (
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            background: "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <i className="icon-package" style={{ color: "#9ca3af" }} />
        </div>
      )}

      <div style={{ minWidth: 0 }}>
        <div className="body-title-2" style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
          {row.name}
        </div>
        {row.sku && (
          <div className="text-tiny" style={{ color: "#9ca3af" }}>
            {row.sku}
          </div>
        )}
      </div>

      <div className="body-text">{row.retailerSlug || "Ayo"}</div>

      <div>
        {row.pendingUnits > 0 ? (
          <Chip tone="warn" title="Захиалгаар ирэхийг хүлээж буй ширхэг">
            {row.pendingUnits} ш
          </Chip>
        ) : (
          <span className="body-text" style={{ color: "#9ca3af" }}>
            —
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span className="body-text">{formatWeight(row.weightG)}</span>
        <Chip tone={SOURCE_TONE[source] ?? "muted"}>{SOURCE_LABEL[source] ?? source}</Chip>
      </div>

      <div className="body-text">{row.cargoMnt > 0 ? formatMnt(row.cargoMnt) : "—"}</div>

      <div className="body-text">{formatMnt(row.price)}</div>

      <GramsField
        saved={row.cargoWeightG}
        placeholder={row.weightG ? String(row.weightG) : "гр"}
        onSave={save}
        onAdvance={onAdvance}
        inputRef={inputRef}
        width={100}
        label={`Жин (гр) — ${row.name}`}
      />
    </div>
  );
}

function WeighList({ token, version, onWeightChanged }) {
  const [filter, setFilter] = useState("unmeasured");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ rows: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const requestId = useRef(0);
  const inputRefs = useRef([]);

  // Debounce the search box; a new term starts again from the first page.
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!token) return;
    const id = ++requestId.current;
    setLoading(true);
    getCargoProducts(
      { filter, q: query || undefined, take: PAGE_SIZE, skip: page * PAGE_SIZE },
      token
    ).then((res) => {
      if (id !== requestId.current) return; // a newer request superseded this one
      setLoading(false);
      if (res.success) {
        setData(res.data ?? { rows: [], total: 0 });
        setError(null);
      } else {
        setError(res.error || "Жагсаалт ачаалагдсангүй");
      }
    });
  }, [token, filter, query, page, version, reloadKey]);

  // A saved row stays in place (even in "Жинлээгүй") so the owner sees the new
  // price; it drops out on the next refetch.
  const handleSaved = useCallback(
    (id, grams, result) => {
      setData((prev) => ({
        ...prev,
        rows: prev.rows.map((r) =>
          r.id === id
            ? {
                ...r,
                cargoWeightG: grams,
                weightG: result.weightG ?? r.weightG,
                source: result.source ?? r.source,
                cargoMnt: result.cargoMnt ?? r.cargoMnt,
                price: result.price ?? r.price,
              }
            : r
        ),
      }));
      onWeightChanged();
    },
    [onWeightChanged]
  );

  const rows = data.rows ?? [];
  const total = data.total ?? 0;
  const from = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min(total, (page + 1) * PAGE_SIZE);

  function changeFilter(next) {
    setFilter(next);
    setPage(0);
  }

  return (
    <div className="wg-box" style={{ marginBottom: 20 }}>
      <CardTitle
        title="Жинлэх жагсаалт"
        subtitle="Жинг оруулаад Enter дарахад хадгалагдаж, барааны үнэ тэр дороо шинэчлэгдэнэ. Дараагийн мөр рүү автоматаар шилжинэ. Хоосон хадгалбал жин арилна."
      />

      <div className="flex items-center justify-between gap10 flex-wrap" style={{ marginBottom: 14 }}>
        <div className="flex gap10 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => changeFilter(f.key)}
              aria-pressed={filter === f.key}
              style={{
                border: `1px solid ${filter === f.key ? ACCENT : "#d1d5db"}`,
                background: filter === f.key ? ACCENT : "#fff",
                color: filter === f.key ? "#fff" : "#374151",
                borderRadius: 999,
                padding: "6px 16px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap10 items-center">
          <input
            type="search"
            placeholder="Нэр эсвэл SKU хайх..."
            aria-label="Хайх"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...INPUT_STYLE, width: 240 }}
          />
          <button
            type="button"
            className="tf-button style-1"
            disabled={loading}
            onClick={() => setReloadKey((k) => k + 1)}
          >
            Сэргээх
          </button>
        </div>
      </div>

      {error && (
        <Notice tone="danger" style={{ marginBottom: 12 }}>
          {error}
        </Notice>
      )}

      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: LIST_MIN_WIDTH, opacity: loading ? 0.6 : 1, transition: "opacity 0.15s" }}>
          <div
            className="text-tiny"
            style={{
              display: "grid",
              gridTemplateColumns: ROW_COLUMNS,
              gap: ROW_GAP,
              padding: "0 0 8px",
              color: "#9ca3af",
              fontWeight: 600,
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <div />
            <div>Бараа</div>
            <div>Эх сурвалж</div>
            <div>Хүлээгдэж буй</div>
            <div>Тооцох жин</div>
            <div>Карго</div>
            <div>Үнэ</div>
            <div>Жин (гр)</div>
          </div>

          {rows.map((row, i) => (
            <WeighRow
              key={row.id}
              row={row}
              index={i}
              token={token}
              onSaved={handleSaved}
              inputRef={(el) => {
                inputRefs.current[i] = el;
              }}
              onAdvance={() => inputRefs.current[i + 1]?.focus()}
            />
          ))}

          {!rows.length && !loading && !error && (
            <div className="body-text text-center" style={{ padding: "28px 0", color: "#6b7280" }}>
              {filter === "unmeasured" && !query
                ? "Жинлэх бараа үлдсэнгүй."
                : "Тохирох бараа олдсонгүй."}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap10 flex-wrap" style={{ marginTop: 14 }}>
        <div className="text-tiny" style={{ color: "#6b7280" }}>
          {total > 0 ? `${from}–${to} / ${total}` : "0"}
        </div>
        <div className="flex gap10">
          <button
            type="button"
            className="tf-button style-1"
            disabled={page === 0 || loading}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Өмнөх
          </button>
          <button
            type="button"
            className="tf-button style-1"
            disabled={to >= total || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Дараах
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== 4. АНГИЛЛЫН ЖИН ====================

// Import categories first (they are the ones cargo applies to), then by name.
function byImportThenName(a, b) {
  if (a.isImportCategory !== b.isImportCategory) return a.isImportCategory ? -1 : 1;
  return String(a.name).localeCompare(String(b.name), "mn");
}

function buildTree(rows) {
  const nodes = new Map(rows.map((r) => [r.id, { ...r, children: [] }]));
  const roots = [];
  for (const node of nodes.values()) {
    // A parent missing from the list (filtered out upstream) makes the node a root.
    const parent = node.parentId != null ? nodes.get(node.parentId) : null;
    (parent ? parent.children : roots).push(node);
  }
  const sortLevel = (list) => {
    list.sort(byImportThenName);
    list.forEach((n) => sortLevel(n.children));
  };
  sortLevel(roots);
  return roots;
}

function CategoryNode({ node, depth, token, onSaved }) {
  const [open, setOpen] = useState(false);
  const hasChildren = node.children.length > 0;

  async function save(grams) {
    const res = await setCategoryWeight(node.id, grams, token);
    if (!res.success || !res.data) return { error: res.error || "Хадгалж чадсангүй" };
    onSaved();
    return {};
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 0",
          paddingLeft: depth * 22,
          borderBottom: "1px solid #f3f4f6",
        }}
      >
        <button
          type="button"
          onClick={() => hasChildren && setOpen((o) => !o)}
          aria-label={open ? "Хаах" : "Нээх"}
          aria-expanded={hasChildren ? open : undefined}
          disabled={!hasChildren}
          style={{
            border: "none",
            background: "transparent",
            padding: 0,
            width: 20,
            cursor: hasChildren ? "pointer" : "default",
            color: "#6b7280",
            visibility: hasChildren ? "visible" : "hidden",
          }}
        >
          <i className={open ? "icon-chevron-down" : "icon-chevron-right"} />
        </button>

        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span className="body-title-2">{node.name}</span>
          {node.isImportCategory && <Chip tone="info">Импорт</Chip>}
          <span className="text-tiny" style={{ color: "#9ca3af" }}>
            {node.productCount ?? 0} бараа
          </span>
        </div>

        <GramsField
          saved={node.cargoWeightG}
          placeholder={node.inheritedWeightG ? `${node.inheritedWeightG} (өвлөсөн)` : "—"}
          onSave={save}
          width={150}
          label={`Ангиллын жин (гр) — ${node.name}`}
        />
      </div>
      {open &&
        node.children.map((child) => (
          <CategoryNode key={child.id} node={child} depth={depth + 1} token={token} onSaved={onSaved} />
        ))}
    </>
  );
}

function CategoryWeights({ token, onWeightsChanged }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    getCargoCategories(token).then((res) => {
      if (cancelled) return;
      if (res.success) {
        setRows(res.data ?? []);
        setError(null);
      } else {
        setError(res.error || "Ангилал ачаалагдсангүй");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [token, reloadKey]);

  const tree = useMemo(() => (rows ? buildTree(rows) : []), [rows]);

  // A category weight moves the inherited placeholders of its whole subtree and
  // the effective weight of every product under it — reload both lists.
  const handleSaved = useCallback(() => {
    setReloadKey((k) => k + 1);
    onWeightsChanged();
  }, [onWeightsChanged]);

  return (
    <div className="wg-box" style={{ marginBottom: 20 }}>
      <CardTitle
        title="Ангиллын жин"
        subtitle="Ангилалд жин өгвөл дотор нь байгаа, өөрийн жингүй бүх бараа тэр жингээр бодогдоно. Хоосон талбарт саарал тоо нь дээд ангиллаас өвлөсөн жин."
      />
      {error && (
        <Notice tone="danger" style={{ marginBottom: 12 }}>
          {error}
        </Notice>
      )}
      {rows === null && !error && (
        <div className="body-text" style={{ color: "#6b7280" }}>
          Уншиж байна...
        </div>
      )}
      {rows !== null && !tree.length && (
        <div className="body-text" style={{ color: "#6b7280" }}>
          Ангилал олдсонгүй.
        </div>
      )}
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 520 }}>
          {tree.map((node) => (
            <CategoryNode key={node.id} node={node} depth={0} token={token} onSaved={handleSaved} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== PAGE ====================

export default function CargoClient({ initialOverview, initialError }) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const [overview, setOverview] = useState(initialOverview ?? null);
  const [error, setError] = useState(initialError ?? null);
  const [job, setJob] = useState(initialOverview?.job ?? null);
  // Bumped whenever prices or weights moved, so the to-weigh list refetches.
  const [listVersion, setListVersion] = useState(0);

  const refreshOverview = useCallback(async () => {
    if (!token) return;
    const res = await getCargoOverview(token);
    if (res.success && res.data) {
      setOverview(res.data);
      if (res.data.job) setJob(res.data.job);
      setError(null);
    } else {
      setError(res.error || "Карго мэдээлэл ачаалагдсангүй");
    }
  }, [token]);

  // The server render may have failed (no token yet, backend restarting).
  useEffect(() => {
    if (token && !overview) refreshOverview();
  }, [token, overview, refreshOverview]);

  // A rate or default-weight change re-prices everything: coverage, the stale
  // count and every row's cargo all move.
  const handleSettingsChanged = useCallback(() => {
    refreshOverview();
    setListVersion((v) => v + 1);
  }, [refreshOverview]);

  // One weight saved: only the coverage numbers and stale count need a refresh
  // (the row already carries its new values). Weighing a list is a burst of
  // saves and the overview is not cheap, so refresh once the burst settles.
  const overviewTimer = useRef(null);
  useEffect(() => () => clearTimeout(overviewTimer.current), []);
  const handleProductWeighed = useCallback(() => {
    clearTimeout(overviewTimer.current);
    overviewTimer.current = setTimeout(refreshOverview, 1500);
  }, [refreshOverview]);

  // A category weight or a finished reprice job changes many rows at once.
  const handleBulkChange = useCallback(() => {
    refreshOverview();
    setListVersion((v) => v + 1);
  }, [refreshOverview]);

  if (!overview) {
    return (
      <div className="wg-box text-center py-5">
        <div className="body-text" style={{ color: error ? "#991b1b" : "#6b7280" }}>
          {error ? `Карго мэдээлэл ачаалагдсангүй: ${error}` : "Уншиж байна..."}
        </div>
        {error && (
          <button
            type="button"
            className="tf-button style-1"
            style={{ margin: "14px auto 0" }}
            onClick={refreshOverview}
          >
            Дахин оролдох
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <RateCard overview={overview} token={token} onSettingsChanged={handleSettingsChanged} />
      <StatusCard
        overview={overview}
        job={job}
        onJobChange={setJob}
        token={token}
        onFinished={handleBulkChange}
      />
      <WeighList token={token} version={listVersion} onWeightChanged={handleProductWeighed} />
      <CategoryWeights token={token} onWeightsChanged={handleBulkChange} />
    </>
  );
}
