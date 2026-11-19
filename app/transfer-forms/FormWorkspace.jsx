"use client";

/**
 * One request from ayo.mn/form, worked from top to bottom: what the customer wrote, the real
 * products for it, the bank transfer that paid for it, the totals, then the order.
 *
 * Inline px styles on purpose (Remos sets html{font-size:62.5%}, which shrinks rem sizes to
 * two thirds). No <form> element either: the template restyles every input inside one.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button, C, Dialog, ErrorText, inputStyle, labelStyle } from "@/components/pos/ui";
import { cancelForm, createOrderFromForm, getForm, reopenForm, searchFormVariants, searchTransfers } from "@/lib/api/transferForms";
import { basketProblem, differenceLabel, money, parseMoney, shortLines, suggestedShipping, totals, transferKey } from "@/lib/transferForms/totals";

const SMALL = { padding: "0 14px", height: 36, fontSize: 14, lineHeight: "20px" };
const cell = { padding: "10px 8px", border: "none", borderBottom: `1px solid ${C.line}`, verticalAlign: "middle" };
const head = { ...cell, padding: "8px", color: C.muted, fontWeight: 600, fontSize: 13, textAlign: "left", whiteSpace: "nowrap" };
const TONE = { even: [C.greenBg, C.green], short: [C.amberBg, C.amber], over: ["#dbeafe", "#1d4ed8"] };

const when = (iso) => {
  const d = new Date(iso);
  const two = (n) => String(n).padStart(2, "0");
  return `${d.getMonth() + 1}/${d.getDate()} ${two(d.getHours())}:${two(d.getMinutes())}`;
};

function Block({ title, aside, children }) {
  return (
    <section style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: 18, marginBottom: 14, backgroundColor: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: C.text }}>{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Fact({ label, children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 10, fontSize: 14, lineHeight: 1.5, padding: "4px 0" }}>
      <div style={{ color: C.muted }}>{label}</div>
      <div style={{ color: C.text, overflowWrap: "anywhere", whiteSpace: "pre-wrap" }}>{children}</div>
    </div>
  );
}

function Notice({ tone = "amber", children }) {
  const [bg, fg] = tone === "red" ? [C.redBg, "#b91c1c"] : tone === "green" ? [C.greenBg, C.green] : [C.amberBg, C.amber];
  return (
    <div role="status" style={{ backgroundColor: bg, color: fg, borderRadius: 8, padding: "10px 12px", fontSize: 14, marginTop: 10 }}>
      {children}
    </div>
  );
}

/** Search box that looks products up as staff type what the customer wrote. */
function ProductSearch({ token, onPick }) {
  const [text, setText] = useState("");
  const [hits, setHits] = useState([]);
  const [state, setState] = useState("idle"); // idle | loading | done | error
  const [message, setMessage] = useState("");
  const latest = useRef(0);

  useEffect(() => {
    const term = text.trim();
    if (term.length < 2) {
      setHits([]);
      setState("idle");
      return;
    }
    const ticket = ++latest.current;
    setState("loading");
    const timer = setTimeout(() => {
      searchFormVariants(token, term)
        .then((found) => {
          if (ticket !== latest.current) return; // an older answer arriving late
          setHits(found);
          setState("done");
        })
        .catch((e) => {
          if (ticket !== latest.current) return;
          setMessage(e.message);
          setState("error");
        });
    }, 250);
    return () => clearTimeout(timer);
  }, [text, token]);

  return (
    <div>
      <label style={{ display: "block", margin: 0 }}>
        <span style={labelStyle}>Бараа хайх (нэр, SKU, баркод)</span>
        <input type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder="Жишээ: маск" style={inputStyle} autoComplete="off" />
      </label>
      {state === "loading" && <div style={{ fontSize: 13, color: C.muted, marginTop: 8 }}>Хайж байна…</div>}
      {state === "error" && <ErrorText>{message}</ErrorText>}
      {state === "done" && hits.length === 0 && (
        <div style={{ fontSize: 14, color: C.muted, marginTop: 8 }}>
          “{text.trim()}” олдсонгүй. Өөр үгээр хайх эсвэл барааг эхлээд <Link href="/add-product" style={{ color: C.blue, textDecoration: "underline" }}>бүртгэнэ үү</Link>.
        </div>
      )}
      {hits.length > 0 && (
        <ul style={{ listStyle: "none", margin: "8px 0 0", padding: 0, border: `1px solid ${C.line}`, borderRadius: 8, maxHeight: 320, overflowY: "auto" }}>
          {hits.map((v) => (
            <li key={v.variantId} style={{ borderBottom: `1px solid ${C.line}` }}>
              <button
                type="button"
                onClick={() => onPick(v)}
                style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "8px 10px", background: "none", border: "none", cursor: "pointer", textAlign: "left", lineHeight: 1.45 }}
              >
                {v.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.imageUrl} alt="" width={44} height={44} style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6, flex: "none", outline: "1px solid rgba(0,0,0,0.1)", outlineOffset: -1 }} />
                ) : (
                  <span style={{ width: 44, height: 44, borderRadius: 6, backgroundColor: C.grayBg, flex: "none" }} />
                )}
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14, color: C.text, fontWeight: 500 }}>
                    {v.name}
                    {v.variantLabel ? ` · ${v.variantLabel}` : ""}
                  </span>
                  <span style={{ display: "block", fontSize: 13, color: C.muted }}>
                    {v.sku}
                    {v.isImported ? " · Захиалгын бараа" : v.available > 0 ? ` · Төвд ${v.available} ш` : " · Төвд үлдэгдэлгүй"}
                    {!v.isActive ? " · Идэвхгүй" : ""}
                  </span>
                </span>
                <span style={{ fontSize: 14, color: C.text, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{money(v.price)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** A number box that keeps what staff typed while typing and reports a whole number. */
function NumberBox({ value, onChange, width = 110, label, min = 0 }) {
  const [text, setText] = useState(String(value));
  useEffect(() => {
    // Follow a value changed from outside (the suggested delivery fee), not our own typing.
    if (parseMoney(text) !== value) setText(String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label={label}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        const n = parseMoney(e.target.value);
        if (n !== null && n >= min) onChange(n);
      }}
      onBlur={() => setText(String(value))}
      style={{ ...inputStyle, width, padding: "8px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}
    />
  );
}

function TransferRowItem({ row, checked, onToggle }) {
  const used = Boolean(row.usedBy);
  const marks = [row.deliveryChecked && "Хүргэлт тэмдэглэсэн", row.pickupChecked && "Ирж авсан"].filter(Boolean);
  return (
    <label
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        padding: "10px 12px",
        borderBottom: `1px solid ${C.line}`,
        cursor: used ? "not-allowed" : "pointer",
        backgroundColor: checked ? "#eff6ff" : "transparent",
        opacity: used ? 0.6 : 1,
        margin: 0,
        lineHeight: 1.45,
      }}
    >
      <input type="checkbox" checked={checked} disabled={used} onChange={() => onToggle(row)} style={{ width: 18, height: 18, marginTop: 2, flex: "none" }} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 14, color: C.text }}>
          <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{money(row.amount)}</span>
          <span style={{ color: C.muted, whiteSpace: "nowrap" }}>{row.timeText}</span>
        </span>
        <span style={{ display: "block", fontSize: 14, color: C.text, overflowWrap: "anywhere" }}>{row.description || "(утгагүй)"}</span>
        <span style={{ display: "block", fontSize: 13, color: C.muted }}>
          {row.accountNumber ? `Данс ${row.accountNumber} · ` : ""}
          {row.tabName}
        </span>
        {used && <span style={{ display: "block", fontSize: 13, color: "#b91c1c", fontWeight: 600 }}>Ашигласан{row.usedBy.orderId ? `: #${row.usedBy.orderId} захиалга` : ": кассын борлуулалт"}</span>}
        {!used && marks.length > 0 && <span style={{ display: "block", fontSize: 13, color: C.amber }}>Анхаар: хуулган дээр “{marks.join(", ")}” гэж тэмдэглэсэн байна</span>}
      </span>
    </label>
  );
}

export default function FormWorkspace({ token, formId, onChanged }) {
  const [detail, setDetail] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [lines, setLines] = useState([]);
  const [shipping, setShipping] = useState(0);
  const [shippingTouched, setShippingTouched] = useState(false);
  const [picked, setPicked] = useState(new Map()); // transferKey -> row
  const [found, setFound] = useState([]); // rows from a manual search
  const [findText, setFindText] = useState("");
  const [findState, setFindState] = useState({ busy: false, error: "", done: false });
  const [note, setNote] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);
  const [closing, setClosing] = useState(false);
  const [closeNote, setCloseNote] = useState("");
  const [closeError, setCloseError] = useState("");

  const load = useCallback(
    async (fresh = false) => {
      setLoadError("");
      fresh ? setRefreshing(true) : setLoading(true);
      try {
        setDetail(await getForm(token, formId, fresh));
      } catch (e) {
        setLoadError(e.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, formId],
  );

  // A different request: start clean.
  useEffect(() => {
    setDetail(null);
    setLines([]);
    setPicked(new Map());
    setFound([]);
    setFindText("");
    setFindState({ busy: false, error: "", done: false });
    setNote("");
    setShippingTouched(false);
    setError("");
    setCreated(null);
    setClosing(false);
    load(false);
  }, [load]);

  const paid = useMemo(() => [...picked.values()].reduce((sum, r) => sum + r.amount, 0), [picked]);
  const sums = useMemo(() => totals(lines, shipping, paid), [lines, shipping, paid]);

  // Until staff type a delivery fee, it follows the district rate and the free-delivery rule.
  useEffect(() => {
    if (!detail || shippingTouched) return;
    setShipping(suggestedShipping(sums.subtotal, detail.shipping.zoneCost, detail.shipping.freeShippingThreshold));
  }, [detail, shippingTouched, sums.subtotal]);

  if (loading) return <div style={{ padding: 24, fontSize: 14, color: C.muted }}>Ачаалж байна…</div>;
  if (loadError)
    return (
      <div style={{ padding: 24 }}>
        <ErrorText>{loadError}</ErrorText>
        <Button kind="secondary" style={{ ...SMALL, marginTop: 12 }} onClick={() => load(false)}>
          Дахин оролдох
        </Button>
      </div>
    );
  if (!detail) return null;

  const { form, customer } = detail;
  const open = form.status === "NEW" && !created;

  const addLine = (v) =>
    setLines((all) => {
      const at = all.findIndex((l) => l.variantId === v.variantId);
      if (at >= 0) return all.map((l, i) => (i === at ? { ...l, quantity: l.quantity + 1 } : l));
      return [
        ...all,
        { variantId: v.variantId, name: v.name, variantLabel: v.variantLabel, sku: v.sku, quantity: 1, unitPrice: v.price, isImported: v.isImported, cargoOnTop: v.cargoOnTop, available: v.available, imageUrl: v.imageUrl },
      ];
    });
  const setLine = (index, patch) => setLines((all) => all.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  const dropLine = (index) => setLines((all) => all.filter((_, i) => i !== index));

  const toggle = (row) =>
    setPicked((old) => {
      const next = new Map(old);
      const key = transferKey(row);
      next.has(key) ? next.delete(key) : next.set(key, row);
      return next;
    });

  const find = async () => {
    if (findText.trim().length < 3) return setFindState({ busy: false, error: "3-аас дээш тэмдэгт бичнэ үү", done: false });
    setFindState({ busy: true, error: "", done: false });
    try {
      setFound(await searchTransfers(token, findText));
      setFindState({ busy: false, error: "", done: true });
    } catch (e) {
      setFindState({ busy: false, error: e.message, done: false });
    }
  };

  // Suggested rows first, then whatever the manual search added, without repeats.
  const suggestedKeys = new Set(detail.suggestions.map(transferKey));
  const extra = found.filter((r) => !suggestedKeys.has(transferKey(r)));

  const mixed = basketProblem(lines);
  const short = shortLines(lines);
  const gap = differenceLabel(sums.difference);
  const missing = lines.length === 0 ? "Бараа сонгоно уу" : picked.size === 0 ? "Шилжүүлгээ сонгоно уу" : mixed;

  const create = async () => {
    setError("");
    if (missing) return setError(missing);
    setBusy(true);
    try {
      const result = await createOrderFromForm(token, form.id, {
        lines: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity, unitPrice: l.unitPrice })),
        shippingCost: shipping,
        picks: [...picked.values()].map((r) => ({ tabId: r.tabId, rowIndex: r.rowIndex, fingerprint: r.fingerprint })),
        note: note.trim() || undefined,
      });
      setCreated(result);
      onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const close = async () => {
    setCloseError("");
    if (!closeNote.trim()) return setCloseError("Шалтгаанаа бичнэ үү");
    setBusy(true);
    try {
      await cancelForm(token, form.id, closeNote.trim());
      setClosing(false);
      setCloseNote("");
      onChanged();
      await load(false);
    } catch (e) {
      setCloseError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const reopen = async () => {
    setError("");
    setBusy(true);
    try {
      await reopenForm(token, form.id);
      onChanged();
      await load(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const orderId = created?.orderId ?? form.orderId;

  return (
    <div>
      {created && (
        <Notice tone="green">
          <strong>#{created.orderId} захиалга үүслээ.</strong> Нийт {money(created.total)}, шилжүүлсэн {money(created.paid)} ({differenceLabel(created.difference).text}). Одоо “Хүргэлт” хуудсанд савлахыг хүлээж байна.{" "}
          <Link href={`/order-detail/${created.orderId}`} style={{ textDecoration: "underline", color: "inherit", fontWeight: 600 }}>
            Захиалгыг нээх
          </Link>
          {created.sheet.failed > 0 && (
            <div style={{ marginTop: 6 }}>
              Анхаар: хуулган дээр {created.sheet.failed} мөрийг тэмдэглэж чадсангүй. Захиалга хэвийн үүссэн, шилжүүлэг түгжигдсэн. “ДАНС CHECK” хуудсанд “Хүргэлт”-ийг гараар тэмдэглэнэ үү.
            </div>
          )}
        </Notice>
      )}
      {!created && form.status === "ORDERED" && (
        <Notice tone="green">
          Энэ хүсэлтээс <strong>#{form.orderId}</strong> захиалга үүссэн.{" "}
          <Link href={`/order-detail/${form.orderId}`} style={{ textDecoration: "underline", color: "inherit", fontWeight: 600 }}>
            Захиалгыг нээх
          </Link>
        </Notice>
      )}
      {form.status === "CANCELLED" && (
        <Notice tone="red">
          Хаагдсан хүсэлт. Шалтгаан: {form.staffNote || "бичээгүй"}
          <div style={{ marginTop: 8 }}>
            <Button kind="secondary" style={SMALL} onClick={reopen} disabled={busy}>
              Сэргээх
            </Button>
          </div>
        </Notice>
      )}

      <div style={{ height: 14 }} />

      <Block title="Хэрэглэгчийн бичсэн" aside={<span style={{ fontSize: 13, color: C.muted }}>#{form.id} · {when(form.createdAt)}</span>}>
        <div style={{ fontSize: 16, lineHeight: 1.5, color: C.text, whiteSpace: "pre-wrap", overflowWrap: "anywhere", backgroundColor: "#f9fafb", borderRadius: 8, padding: "12px 14px", marginBottom: 12 }}>
          {form.productsText}
        </div>
        <Fact label="Хүлээн авагч">
          {form.recipientName}, {form.phone}
          {customer ? ` · өмнө нь ${customer.orderCount} захиалга` : ""}
        </Fact>
        <Fact label="Хаяг">
          {form.district}, {form.address}
        </Fact>
        <Fact label="Төлбөрийн тайлбар">{form.paymentNote}</Fact>
        <Fact label="Шилжүүлсэн данс / хаяг">{form.senderAccount}</Fact>
        <Fact label="Чат бичсэн пэйж">{form.chatPages.join(", ")}</Fact>
      </Block>

      {form.status === "ORDERED" && detail.transfers.length > 0 && (
        <Block title="Төлсөн шилжүүлэг">
          {detail.transfers.map((t, i) => (
            <Fact key={i} label={money(t.amount)}>
              {t.paidAtText} · {t.description}
              {t.accountNumber ? ` · данс ${t.accountNumber}` : ""}
            </Fact>
          ))}
        </Block>
      )}

      {open && (
        <>
          <Block title="1. Бараа">
            <ProductSearch token={token} onPick={addLine} />
            {lines.length > 0 && (
              <div style={{ overflowX: "auto", marginTop: 14 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, border: "none", margin: 0, tableLayout: "auto" }}>
                  <thead>
                    <tr>
                      <th style={head}>Бараа</th>
                      <th style={{ ...head, textAlign: "right" }}>Тоо</th>
                      <th style={{ ...head, textAlign: "right" }}>Нэгж үнэ</th>
                      <th style={{ ...head, textAlign: "right" }}>Дүн</th>
                      <th style={head} />
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l, i) => (
                      <tr key={l.variantId}>
                        <td style={cell}>
                          <div style={{ color: C.text, fontWeight: 500 }}>
                            {l.name}
                            {l.variantLabel ? ` · ${l.variantLabel}` : ""}
                          </div>
                          <div style={{ fontSize: 13, color: C.muted }}>
                            {l.sku}
                            {l.isImported ? " · Захиалгын бараа" : ` · Төвд ${l.available} ш`}
                            {l.cargoOnTop > 0 ? ` · карго ${money(l.cargoOnTop)}/ш` : ""}
                          </div>
                        </td>
                        <td style={{ ...cell, textAlign: "right" }}>
                          <NumberBox label={`${l.name}: тоо ширхэг`} value={l.quantity} min={1} width={70} onChange={(n) => setLine(i, { quantity: Math.min(n, 999) })} />
                        </td>
                        <td style={{ ...cell, textAlign: "right" }}>
                          <NumberBox label={`${l.name}: нэгж үнэ`} value={l.unitPrice} onChange={(n) => setLine(i, { unitPrice: n })} />
                        </td>
                        <td style={{ ...cell, textAlign: "right", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{money(l.unitPrice * l.quantity)}</td>
                        <td style={{ ...cell, textAlign: "right" }}>
                          <button type="button" onClick={() => dropLine(i)} aria-label={`${l.name} хасах`} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 22, lineHeight: 1, width: 36, height: 36 }}>
                            &times;
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {mixed && <Notice tone="red">{mixed}</Notice>}
            {short.length > 0 && <Notice>Төвийн үлдэгдлээс их: {short.map((l) => `${l.name} (үлдэгдэл ${l.available})`).join(", ")}. Захиалга үүсэхэд саад болохгүй, гэхдээ бараа байгаа эсэхийг шалгана уу.</Notice>}
          </Block>

          <Block
            title="2. Шилжүүлэг"
            aside={
              <Button kind="secondary" style={SMALL} onClick={() => load(true)} disabled={refreshing}>
                {refreshing ? "Шинэчилж байна…" : "Хуулга шинэчлэх"}
              </Button>
            }
          >
            {detail.sheetError && <Notice tone="red">{detail.sheetError}</Notice>}
            {detail.suggestions.length === 0 && !detail.sheetError && (
              <div style={{ fontSize: 14, color: C.muted, marginBottom: 10 }}>
                Утас ({form.phone}) болон бичсэн дансаар тохирох шилжүүлэг олдсонгүй. Доор дүн, нэр эсвэл дансаар хайна уу. Хуулгаа дөнгөж оруулсан бол “Хуулга шинэчлэх” дарна уу.
              </div>
            )}
            {detail.suggestions.length > 0 && (
              <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, overflow: "hidden", marginBottom: 12 }}>
                {detail.suggestions.map((row) => (
                  <TransferRowItem key={transferKey(row)} row={row} checked={picked.has(transferKey(row))} onToggle={toggle} />
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <label style={{ flex: 1, margin: 0 }}>
                <span style={labelStyle}>Хуулгаас хайх (дүн, утас, нэр, данс)</span>
                <input
                  type="search"
                  value={findText}
                  onChange={(e) => setFindText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") find();
                  }}
                  placeholder="Жишээ: 52500"
                  style={inputStyle}
                  autoComplete="off"
                />
              </label>
              <Button kind="secondary" style={{ ...SMALL, height: 44 }} onClick={find} disabled={findState.busy}>
                {findState.busy ? "Хайж байна…" : "Хайх"}
              </Button>
            </div>
            <ErrorText>{findState.error}</ErrorText>
            {findState.done && extra.length === 0 && <div style={{ fontSize: 14, color: C.muted, marginTop: 8 }}>Өөр шилжүүлэг олдсонгүй.</div>}
            {extra.length > 0 && (
              <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, overflow: "hidden", marginTop: 10, maxHeight: 360, overflowY: "auto" }}>
                {extra.map((row) => (
                  <TransferRowItem key={transferKey(row)} row={row} checked={picked.has(transferKey(row))} onToggle={toggle} />
                ))}
              </div>
            )}
          </Block>

          <Block title="3. Дүн">
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", rowGap: 8, columnGap: 16, fontSize: 15, alignItems: "center", maxWidth: 460 }}>
              <span style={{ color: C.muted }}>Барааны дүн</span>
              <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{money(sums.subtotal)}</span>
              {sums.cargo > 0 && (
                <>
                  <span style={{ color: C.muted }}>Карго</span>
                  <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{money(sums.cargo)}</span>
                </>
              )}
              <span style={{ color: C.muted }}>Хүргэлт ({form.district})</span>
              <span style={{ textAlign: "right" }}>
                <NumberBox
                  label="Хүргэлтийн төлбөр"
                  value={shipping}
                  onChange={(n) => {
                    setShippingTouched(true);
                    setShipping(n);
                  }}
                />
              </span>
              <span style={{ fontWeight: 600, color: C.text, borderTop: `1px solid ${C.line}`, paddingTop: 8 }}>Захиалгын нийт дүн</span>
              <span style={{ textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums", borderTop: `1px solid ${C.line}`, paddingTop: 8 }}>{money(sums.total)}</span>
              <span style={{ color: C.muted }}>Сонгосон шилжүүлэг ({picked.size})</span>
              <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{money(sums.paid)}</span>
              <span style={{ color: C.muted }}>Зөрүү</span>
              <span style={{ textAlign: "right" }}>
                {picked.size > 0 && lines.length > 0 ? (
                  <span style={{ padding: "3px 10px", borderRadius: 999, backgroundColor: TONE[gap.tone][0], color: TONE[gap.tone][1], fontSize: 14, fontWeight: 600, whiteSpace: "nowrap" }}>{gap.text}</span>
                ) : (
                  <span style={{ color: C.faint }}>—</span>
                )}
              </span>
            </div>
            {picked.size > 0 && lines.length > 0 && sums.difference !== 0 && (
              <div style={{ fontSize: 13, color: C.muted, marginTop: 10 }}>
                Зөрүү захиалга үүсгэхэд саад болохгүй. Хуучин хямдралаар авсан бол нэгж үнээ засаж, тайлбартаа бичнэ үү.
              </div>
            )}

            <label style={{ display: "block", marginTop: 14 }}>
              <span style={labelStyle}>Тайлбар (заавал биш)</span>
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Жишээ: хуучин хямдралын үнээр" style={inputStyle} />
            </label>

            <ErrorText>{error}</ErrorText>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
              <Button kind="danger" onClick={() => setClosing(true)} disabled={busy}>
                Хүсэлтийг хаах
              </Button>
              <Button onClick={create} disabled={busy}>
                {busy ? "Үүсгэж байна…" : "Захиалга үүсгэх"}
              </Button>
            </div>
          </Block>
        </>
      )}

      {!open && form.status !== "NEW" && orderId == null && <ErrorText>{error}</ErrorText>}

      {closing && (
        <Dialog title="Хүсэлтийг хаах" onClose={() => setClosing(false)} width={460}>
          <div style={{ fontSize: 14, color: C.muted, marginBottom: 12 }}>Захиалга үүсгэхгүй хүсэлтийг хаана: давхардсан, буруу дугаар, асуулт гэх мэт. Дараа нь сэргээж болно.</div>
          <label style={{ display: "block", margin: 0 }}>
            <span style={labelStyle}>Шалтгаан</span>
            <input data-autofocus type="text" value={closeNote} onChange={(e) => setCloseNote(e.target.value)} maxLength={500} style={inputStyle} />
          </label>
          <ErrorText>{closeError}</ErrorText>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
            <Button kind="secondary" onClick={() => setClosing(false)}>
              Болих
            </Button>
            <Button kind="danger" onClick={close} disabled={busy}>
              {busy ? "Хааж байна…" : "Хүсэлтийг хаах"}
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
