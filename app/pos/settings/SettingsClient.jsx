"use client";

/**
 * Till settings (Кассын тохиргоо). "Бүх салбар" holds the defaults; a branch can
 * take over a group of settings and later hand it back (spec §13.2, §16.2).
 * Each group saves on its own, so a half-filled receipt form never blocks a
 * discount limit change.
 */

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { clearSetting, getSettings, listLocations, saveSettings, searchVariants, variantsByIds } from "@/lib/api/pos";
import { discountLimitError, rangeError, roleLabel } from "@/lib/pos/validation";
import { Button, C, ErrorText, Field, Pill, Section } from "@/components/pos/ui";
import { formatMnt } from "@/lib/partners/format";

const MAX_FAVOURITES = 60;
// The template gives .tf-button its own height; pin it so these stay compact.
const SMALL_BUTTON = { padding: "0 14px", fontSize: 14, height: 36, lineHeight: "20px" };

/**
 * The frame every group shares: heading, who owns the value (default or this
 * branch), and one Save. The fields sit in a disabled fieldset until editing is
 * allowed, so they show the inherited value without inviting a change.
 */
function SettingsSection({ title, description, keys, locationId, layers, token, reload, dirty, save, children }) {
  const overridden = locationId !== null && keys.some((k) => k in layers.location);
  const [starting, setStarting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const editable = locationId === null || overridden || starting;

  const guarded = (action) => async () => {
    setBusy(true);
    setError(null);
    try {
      if ((await action()) !== false) setSavedAt(Date.now());
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  const revert = guarded(async () => {
    for (const key of keys) if (key in layers.location) await clearSetting(locationId, key, token);
    setStarting(false);
    await reload();
  });

  let actions = null;
  if (locationId !== null) {
    if (overridden) {
      actions = (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <Pill tone="blue">Салбарт тусгайлсан</Pill>
          <Button kind="secondary" onClick={revert} disabled={busy} style={SMALL_BUTTON}>
            Үндсэн рүү буцаах
          </Button>
        </span>
      );
    } else if (starting) {
      actions = (
        <Button kind="secondary" onClick={() => setStarting(false)} style={SMALL_BUTTON}>
          Болих
        </Button>
      );
    } else {
      actions = (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <Pill>Үндсэн тохиргоог дагана</Pill>
          <Button kind="secondary" onClick={() => setStarting(true)} style={SMALL_BUTTON}>
            Энэ салбарт тусгайлах
          </Button>
        </span>
      );
    }
  }

  return (
    <Section title={title} description={description} actions={actions}>
      <fieldset disabled={!editable} style={{ border: "none", padding: 0, margin: 0, minWidth: 0, opacity: editable ? 1 : 0.6 }}>
        {children}
      </fieldset>
      {editable && (
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16 }}>
          <Button onClick={guarded(save)} disabled={busy || !dirty}>
            Хадгалах
          </Button>
          <span role="status" style={{ fontSize: 14, color: C.green }}>
            {savedAt && !dirty ? "Хадгаллаа" : ""}
          </span>
        </div>
      )}
      <ErrorText>{error}</ErrorText>
    </Section>
  );
}

const asText = (value) => (value === undefined || value === null ? "" : String(value));

function DiscountSection({ common }) {
  const current = common.layers.merged.discountLimitPct ?? { CASHIER: 10, MANAGER: 30, OWNER: 100 };
  const [draft, setDraft] = useState(() => Object.fromEntries(["CASHIER", "MANAGER", "OWNER"].map((r) => [r, asText(current[r])])));
  const [errors, setErrors] = useState({});
  const dirty = Object.keys(draft).some((r) => draft[r] !== asText(current[r]));

  const save = async () => {
    const found = {};
    for (const role of Object.keys(draft)) {
      const problem = discountLimitError(draft[role]);
      if (problem) found[role] = problem;
    }
    setErrors(found);
    if (Object.keys(found).length) return false;
    await saveSettings(common.locationId, { discountLimitPct: Object.fromEntries(Object.entries(draft).map(([r, v]) => [r, Number(v)])) }, common.token);
    await common.reload();
    return true;
  };

  return (
    <SettingsSection
      {...common}
      title="Хөнгөлөлтийн дээд хэмжээ"
      description="Хүн бүр өөрөө өгч болох хөнгөлөлтийн хувь. Үүнээс их бол менежерийн PIN шаардана."
      keys={["discountLimitPct"]}
      dirty={dirty}
      save={save}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, maxWidth: 560 }}>
        {["CASHIER", "MANAGER", "OWNER"].map((role) => (
          <Field key={role} label={`${roleLabel(role)} (%)`} error={errors[role]}>
            {(props) => (
              <input
                {...props}
                inputMode="numeric"
                value={draft[role]}
                onChange={(e) => setDraft((d) => ({ ...d, [role]: e.target.value.replace(/[^\d]/g, "") }))}
              />
            )}
          </Field>
        ))}
      </div>
    </SettingsSection>
  );
}

function LockSection({ common }) {
  const { merged } = common.layers;
  const [draft, setDraft] = useState({ idleLockMinutes: asText(merged.idleLockMinutes ?? 3), refundWindowDays: asText(merged.refundWindowDays ?? 14) });
  const [errors, setErrors] = useState({});
  const dirty = draft.idleLockMinutes !== asText(merged.idleLockMinutes ?? 3) || draft.refundWindowDays !== asText(merged.refundWindowDays ?? 14);

  const save = async () => {
    const found = {};
    const idle = rangeError(draft.idleLockMinutes, 1, 60, "минут");
    const refund = rangeError(draft.refundWindowDays, 0, 365, "өдөр");
    if (idle) found.idleLockMinutes = idle;
    if (refund) found.refundWindowDays = refund;
    setErrors(found);
    if (Object.keys(found).length) return false;
    await saveSettings(
      common.locationId,
      { idleLockMinutes: Number(draft.idleLockMinutes), refundWindowDays: Number(draft.refundWindowDays) },
      common.token
    );
    await common.reload();
    return true;
  };

  const numeric = (key) => (e) => setDraft((d) => ({ ...d, [key]: e.target.value.replace(/[^\d]/g, "") }));

  return (
    <SettingsSection
      {...common}
      title="Түгжих ба буцаалт"
      description="Касс хэдэн минут идэвхгүй байвал PIN асуух, борлуулалтыг хэдэн хоногийн дотор буцааж болох."
      keys={["idleLockMinutes", "refundWindowDays"]}
      dirty={dirty}
      save={save}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, maxWidth: 560 }}>
        <Field label="Идэвхгүй үед түгжих (минут)" error={errors.idleLockMinutes}>
          {(props) => <input {...props} inputMode="numeric" value={draft.idleLockMinutes} onChange={numeric("idleLockMinutes")} />}
        </Field>
        <Field label="Буцаалтын хугацаа (өдөр)" error={errors.refundWindowDays}>
          {(props) => <input {...props} inputMode="numeric" value={draft.refundWindowDays} onChange={numeric("refundWindowDays")} />}
        </Field>
      </div>
    </SettingsSection>
  );
}

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Opening hours (the "till not seen" alert) and the count approval limit (spec 10.4). */
function StockSection({ common }) {
  const { merged } = common.layers;
  const hours = merged.openingHours ?? { from: "10:00", to: "21:00" };
  const limit = merged.countApproveLimitMnt ?? 500000;
  const [draft, setDraft] = useState({ from: hours.from, to: hours.to, limit: asText(limit) });
  const [errors, setErrors] = useState({});
  const dirty = draft.from !== hours.from || draft.to !== hours.to || draft.limit !== asText(limit);

  const save = async () => {
    const found = {};
    if (!TIME.test(draft.from) || !TIME.test(draft.to) || draft.from >= draft.to) found.hours = "Эхлэх цаг нь дуусахаас өмнө байх ёстой (жишээ нь 10:00 – 21:00)";
    const limitProblem = rangeError(draft.limit, 0, 1000000000, "₮");
    if (limitProblem) found.limit = limitProblem;
    setErrors(found);
    if (Object.keys(found).length) return false;
    await saveSettings(common.locationId, { openingHours: { from: draft.from, to: draft.to }, countApproveLimitMnt: Number(draft.limit) }, common.token);
    await common.reload();
    return true;
  };

  return (
    <SettingsSection
      {...common}
      title="Ажиллах цаг ба тооллогын хязгаар"
      description="Ажиллах цагт касс 30 минутаас дээш харагдахгүй бол анхааруулна. Тооллогын зөрүүний үнэ энэ хязгаараас хэтэрвэл зөвхөн эзэмшигч батална."
      keys={["openingHours", "countApproveLimitMnt"]}
      dirty={dirty}
      save={save}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, maxWidth: 640 }}>
        <Field label="Нээх цаг" error={errors.hours}>
          {(props) => <input {...props} type="time" value={draft.from} onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))} />}
        </Field>
        <Field label="Хаах цаг">
          {(props) => <input {...props} type="time" value={draft.to} onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))} />}
        </Field>
        <Field label="Тооллого батлах хязгаар (₮)" error={errors.limit} hint="0 бол бүх тооллогыг эзэмшигч батална">
          {(props) => <input {...props} inputMode="numeric" value={draft.limit} onChange={(e) => setDraft((d) => ({ ...d, limit: e.target.value.replace(/[^\d]/g, "") }))} />}
        </Field>
      </div>
    </SettingsSection>
  );
}

/** What the paper will look like, at the chosen width. Enough to judge wrapping, not a pixel match. */
function ReceiptPreview({ header, footer, widthMm }) {
  const width = widthMm === 58 ? 214 : 296;
  return (
    <div
      aria-hidden="true"
      style={{
        width,
        maxWidth: "100%",
        boxSizing: "border-box",
        padding: "14px 12px",
        backgroundColor: "#fff",
        border: `1px solid ${C.line}`,
        boxShadow: "0 1px 2px rgba(0,0,0,0.06), 0 4px 10px rgba(0,0,0,0.05)",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
        fontSize: 12,
        lineHeight: 1.5,
        color: "#1f2937",
      }}
    >
      <div style={{ textAlign: "center", fontWeight: 700, overflowWrap: "anywhere" }}>{header || "—"}</div>
      <div style={{ borderTop: "1px dashed #9ca3af", margin: "8px 0" }} />
      {[
        ["Anua toner 250ml", "2 x 45,000", "90,000"],
        ["Хямдрал -5%", "", "-4,500"],
      ].map(([name, qty, total], i) => (
        <div key={i}>
          <div style={{ overflowWrap: "anywhere" }}>{name}</div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{qty}</span>
            <span>{total}</span>
          </div>
        </div>
      ))}
      <div style={{ borderTop: "1px dashed #9ca3af", margin: "8px 0" }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
        <span>Нийт</span>
        <span>{formatMnt(85500)}</span>
      </div>
      <div style={{ borderTop: "1px dashed #9ca3af", margin: "8px 0" }} />
      <div style={{ textAlign: "center", overflowWrap: "anywhere", whiteSpace: "pre-wrap" }}>{footer || "—"}</div>
    </div>
  );
}

function ReceiptSection({ common }) {
  const saved = common.layers.merged.receipt ?? { header: "", footer: "", widthMm: 80 };
  const [draft, setDraft] = useState({ header: saved.header, footer: saved.footer, widthMm: saved.widthMm });
  const [errors, setErrors] = useState({});
  const dirty = draft.header !== saved.header || draft.footer !== saved.footer || draft.widthMm !== saved.widthMm;

  const save = async () => {
    const found = {};
    if (draft.header.length > 80) found.header = "80 тэмдэгтээс хэтрэхгүй байна";
    if (draft.footer.length > 200) found.footer = "200 тэмдэгтээс хэтрэхгүй байна";
    setErrors(found);
    if (Object.keys(found).length) return false;
    await saveSettings(common.locationId, { receipt: { header: draft.header.trim(), footer: draft.footer.trim(), widthMm: draft.widthMm } }, common.token);
    await common.reload();
    return true;
  };

  return (
    <SettingsSection
      {...common}
      title="Баримт"
      description="Хэвлэх баримтын толгой, хөл болон цаасны өргөн."
      keys={["receipt"]}
      dirty={dirty}
      save={save}
    >
      <div style={{ display: "flex", gap: 28, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ display: "grid", gap: 16, flex: "1 1 320px", maxWidth: 480 }}>
          <Field label="Толгой" error={errors.header}>
            {(props) => <input {...props} value={draft.header} onChange={(e) => setDraft((d) => ({ ...d, header: e.target.value }))} />}
          </Field>
          <Field label="Хөл" error={errors.footer}>
            {(props) => (
              <textarea {...props} rows={3} value={draft.footer} onChange={(e) => setDraft((d) => ({ ...d, footer: e.target.value }))} />
            )}
          </Field>
          <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
            <legend style={{ fontSize: 13, color: C.muted, marginBottom: 6, padding: 0 }}>Цаасны өргөн</legend>
            <div style={{ display: "flex", gap: 20 }}>
              {[80, 58].map((mm) => (
                <label key={mm} style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 40, fontSize: 15, color: C.text, cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="receipt-width"
                    checked={draft.widthMm === mm}
                    onChange={() => setDraft((d) => ({ ...d, widthMm: mm }))}
                    style={{ width: 18, height: 18 }}
                  />
                  {mm} мм
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <ReceiptPreview header={draft.header} footer={draft.footer} widthMm={draft.widthMm} />
      </div>
    </SettingsSection>
  );
}

function FavouritesSection({ common }) {
  const savedIds = common.layers.merged.favourites ?? [];
  const [items, setItems] = useState(null); // null while the names load
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const dirty = items !== null && JSON.stringify(items.map((i) => i.id)) !== JSON.stringify(savedIds);

  useEffect(() => {
    let live = true;
    variantsByIds(savedIds, common.token)
      .then((found) => live && setItems(found))
      .catch((e) => live && (setSearchError(e.message), setItems([])));
    return () => {
      live = false;
    };
    // The parent remounts this section whenever the saved values change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Search as you type, but not on every keystroke.
  useEffect(() => {
    const text = query.trim();
    if (text.length < 2) {
      setHits([]);
      setSearching(false);
      return undefined;
    }
    let live = true;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const found = await searchVariants(text, common.token);
        if (live) {
          setHits(found);
          setSearchError(null);
        }
      } catch (e) {
        if (live) setSearchError(e.message);
      }
      if (live) setSearching(false);
    }, 300);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [query, common.token]);

  const add = (hit) => setItems((list) => (list.some((i) => i.id === hit.id) || list.length >= MAX_FAVOURITES ? list : [...list, hit]));
  const remove = (id) => setItems((list) => list.filter((i) => i.id !== id));
  const move = (index, by) =>
    setItems((list) => {
      const next = [...list];
      const to = index + by;
      if (to < 0 || to >= next.length) return list;
      [next[index], next[to]] = [next[to], next[index]];
      return next;
    });

  const save = async () => {
    await saveSettings(common.locationId, { favourites: items.map((i) => i.id) }, common.token);
    await common.reload();
    return true;
  };

  const label = (v) => `${v.name}${v.variantLabel ? ` ${v.variantLabel}` : ""}`;
  const small = { padding: 0, fontSize: 16, width: 40, height: 40, lineHeight: "20px" };

  return (
    <SettingsSection
      {...common}
      title="Түгээмэл бараа"
      description="Борлуулалтын дэлгэц дээр нэг товшилтоор нэмэгдэх бараанууд. Энд байгаа дарааллаар харагдана."
      keys={["favourites"]}
      dirty={dirty}
      save={save}
    >
      <div style={{ maxWidth: 560 }}>
        <Field label="Бараа хайх" hint="Нэр, SKU эсвэл баркодоор. Хамгийн багадаа 2 тэмдэгт.">
          {(props) => <input {...props} type="search" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />}
        </Field>

        {query.trim().length >= 2 && (
          <ul aria-label="Хайлтын үр дүн" style={{ listStyle: "none", margin: "8px 0 0", padding: 0, border: `1px solid ${C.line}`, borderRadius: 8 }}>
            {hits.length === 0 && (
              <li style={{ padding: "12px", color: C.faint, fontSize: 14 }}>{searching ? "Хайж байна…" : "Тохирох бараа олдсонгүй."}</li>
            )}
            {hits.map((hit) => {
              const taken = (items ?? []).some((i) => i.id === hit.id);
              return (
                <li key={hit.id} style={{ borderBottom: `1px solid ${C.grayBg}` }}>
                  <button
                    type="button"
                    onClick={() => add(hit)}
                    disabled={taken}
                    style={{
                      display: "flex",
                      width: "100%",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "10px 12px",
                      minHeight: 44,
                      background: "none",
                      border: "none",
                      textAlign: "left",
                      cursor: taken ? "default" : "pointer",
                      color: taken ? C.faint : C.text,
                      fontSize: 14,
                    }}
                  >
                    <span>
                      {label(hit)} <span style={{ color: C.faint }}>{hit.sku}</span>
                    </span>
                    <span style={{ whiteSpace: "nowrap" }}>{taken ? "Нэмсэн" : formatMnt(hit.listPrice)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <ErrorText>{searchError}</ErrorText>

        <h4 style={{ fontSize: 15, fontWeight: 600, color: C.text, margin: "20px 0 8px" }}>
          Сонгосон бараа{items ? ` (${items.length}/${MAX_FAVOURITES})` : ""}
        </h4>
        {items === null ? (
          <div style={{ color: C.faint, fontSize: 14 }}>Ачаалж байна…</div>
        ) : items.length === 0 ? (
          <div style={{ color: C.faint, fontSize: 14 }}>Түгээмэл бараа сонгоогүй байна. Дээрх хайлтаас нэмнэ үү.</div>
        ) : (
          <ol style={{ margin: 0, padding: 0, listStyle: "none", border: `1px solid ${C.line}`, borderRadius: 8 }}>
            {items.map((item, index) => (
              <li
                key={item.id}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px 6px 12px", borderBottom: index === items.length - 1 ? "none" : `1px solid ${C.grayBg}` }}
              >
                <span style={{ width: 24, color: C.faint, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>{index + 1}</span>
                <span style={{ flex: 1, fontSize: 14, color: C.text }}>
                  {label(item)} <span style={{ color: C.faint }}>{item.sku}</span>
                </span>
                <Button kind="secondary" style={small} onClick={() => move(index, -1)} disabled={index === 0} aria-label={`${label(item)}: дээш зөөх`}>
                  &uarr;
                </Button>
                <Button kind="secondary" style={small} onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label={`${label(item)}: доош зөөх`}>
                  &darr;
                </Button>
                <Button kind="danger" style={small} onClick={() => remove(item.id)} aria-label={`${label(item)}: хасах`}>
                  &times;
                </Button>
              </li>
            ))}
          </ol>
        )}
      </div>
    </SettingsSection>
  );
}

export default function SettingsClient() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [locations, setLocations] = useState([]);
  const [scope, setScope] = useState("all");
  const [layers, setLayers] = useState(null);
  // Bumped after every load so each group re-reads its saved values into its draft.
  const [version, setVersion] = useState(0);
  const [error, setError] = useState(null);

  const locationId = scope === "all" ? null : Number(scope);

  const reload = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      setLayers(await getSettings(locationId, token));
      setVersion((v) => v + 1);
    } catch (e) {
      setError(e.message);
    }
  }, [token, locationId]);

  // token is a dependency on purpose: useSession is undefined on first render.
  useEffect(() => {
    if (!token) return;
    listLocations(token)
      .then(setLocations)
      .catch((e) => setError(e.message));
  }, [token]);

  useEffect(() => {
    setLayers(null);
    reload();
  }, [reload]);

  const common = { locationId, layers, token, reload };

  return (
    <div className="wg-box">
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <Field label="Салбар" style={{ minWidth: 280 }}>
          {(props) => (
            <select {...props} value={scope} onChange={(e) => setScope(e.target.value)}>
              <option value="all">Бүх салбар (үндсэн тохиргоо)</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <p style={{ margin: 0, color: C.muted, fontSize: 15, maxWidth: 520 }}>
          {locationId === null
            ? "Энд тавьсан утга бүх салбарт үйлчилнэ. Салбар тусдаа утга авахыг хүсвэл дээрээс салбараа сонгоно уу."
            : "Салбар өөрийн утгыг тавиагүй бол үндсэн тохиргоог дагана."}
        </p>
      </div>

      <ErrorText>{error}</ErrorText>

      {!layers ? (
        <div style={{ color: C.faint, padding: "20px 0" }}>Ачаалж байна…</div>
      ) : (
        <>
          <DiscountSection key={`discount-${scope}-${version}`} common={common} />
          <LockSection key={`lock-${scope}-${version}`} common={common} />
          <StockSection key={`stock-${scope}-${version}`} common={common} />
          <ReceiptSection key={`receipt-${scope}-${version}`} common={common} />
          <FavouritesSection key={`fav-${scope}-${version}`} common={common} />
        </>
      )}
    </div>
  );
}
