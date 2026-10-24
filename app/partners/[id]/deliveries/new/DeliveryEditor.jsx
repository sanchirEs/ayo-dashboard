"use client";

/**
 * New падаан at Төв. Built around a handheld scanner: the scanner types a
 * barcode and presses Enter, which adds the line (or bumps its quantity).
 * Prices fill from the partner's price, then the wholesale price; a line with
 * neither has to be priced here before the падаан can be sent (spec §9).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  createDraft,
  getDelivery,
  getPartner,
  saveDraftLines,
  searchVariants,
  sendDelivery,
} from "@/lib/api/partners";
import { formatMnt } from "@/lib/partners/format";
import { Button, C, ErrorText, Modal, inputStyle } from "@/components/partners/ui";

const toInt = (value) => {
  const n = Number(String(value).replace(/[,\s₮]/g, ""));
  return Number.isInteger(n) && n >= 0 ? n : null;
};

// A line as the editor holds it. `needsPrice` marks a line that arrived with no
// price, so it keeps its amber price box and the "save as wholesale" choice.
function lineFromHit(hit) {
  return {
    key: `${hit.variantId}-${Date.now()}`,
    variantId: hit.variantId,
    name: hit.name,
    sku: hit.sku,
    unitsPerBox: hit.unitsPerBox,
    boxes: null,
    qty: 1,
    unitPrice: hit.unitPrice,
    needsPrice: hit.unitPrice == null,
    setWholesale: true,
  };
}

function lineFromSaved(l) {
  return {
    key: l.id,
    variantId: l.variantId,
    name: l.nameSnapshot,
    sku: l.variant?.sku,
    unitsPerBox: l.variant?.unitsPerBox ?? null,
    boxes: l.boxes,
    qty: l.qty,
    unitPrice: l.unitPrice,
    needsPrice: l.unitPrice == null,
    setWholesale: true,
  };
}

function SendConfirm({ delivery, onCancel, onConfirm, busy, error }) {
  const ayo = delivery.fromLocation?.stockMode === "AYO";
  return (
    <Modal title="Падаан илгээх" onClose={onCancel}>
      <div style={{ fontSize: 15, color: C.text, display: "grid", gap: 10 }}>
        <div>
          <strong>{delivery.partner?.name}</strong>-д {delivery.lines.length} мөр,{" "}
          <strong>{formatMnt(delivery.total)}</strong>.
        </div>
        <div style={{ padding: 12, borderRadius: 8, backgroundColor: ayo ? C.amberBg : C.grayBg, color: ayo ? C.amber : C.muted }}>
          {ayo ? "Төв салбарын нөөцөөс хасагдана." : "Төв Dayansoft дээр байгаа тул нөөц хөдлөхгүй."}
        </div>
        <div style={{ color: C.muted, fontSize: 14 }}>Илгээсний дараа засах боломжгүй. Харилцагчийн үлдэгдэл нэмэгдэнэ.</div>
      </div>
      <ErrorText>{error}</ErrorText>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18 }}>
        <Button kind="secondary" onClick={onCancel}>Болих</Button>
        <Button onClick={onConfirm} disabled={busy}>Илгээх</Button>
      </div>
    </Modal>
  );
}

export default function DeliveryEditor({ partnerId, draftId: initialDraftId }) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const router = useRouter();
  const searchRef = useRef(null);

  const [partner, setPartner] = useState(null);
  const [draftId, setDraftId] = useState(initialDraftId);
  const [lines, setLines] = useState([]);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirming, setConfirming] = useState(null);
  const [sendError, setSendError] = useState(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        setPartner(await getPartner(partnerId, token));
        if (initialDraftId) {
          const d = await getDelivery(initialDraftId, token);
          if (d.status !== "DRAFT") {
            router.replace(`/partner-deliveries/${d.id}`);
            return;
          }
          setLines(d.lines.map(lineFromSaved));
        }
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [token, partnerId, initialDraftId, router]);

  // Typed searches are debounced; a scan (Enter) searches at once.
  useEffect(() => {
    if (!token || query.trim().length < 2) {
      setHits([]);
      return;
    }
    const id = setTimeout(async () => {
      try {
        setHits(await searchVariants(partnerId, query.trim(), token));
      } catch {
        setHits([]);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [query, token, partnerId]);

  const addHit = useCallback((hit) => {
    setLines((current) => {
      const i = current.findIndex((l) => l.variantId === hit.variantId);
      if (i >= 0) {
        const next = [...current];
        next[i] = { ...next[i], qty: next[i].qty + 1, boxes: null };
        return next;
      }
      return [...current, lineFromHit(hit)];
    });
    setDirty(true);
    setQuery("");
    setHits([]);
    setMessage(null);
    searchRef.current?.focus();
  }, []);

  const onSearchEnter = async (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const term = query.trim();
    if (!term) return;
    setSearching(true);
    try {
      const found = await searchVariants(partnerId, term, token);
      const exact = found.find((h) => h.barcode === term || h.sku === term);
      if (exact) addHit(exact);
      else if (found.length === 1) addHit(found[0]);
      else if (found.length === 0) setMessage(`"${term}" олдсонгүй`);
      else setHits(found);
    } catch (e) {
      setMessage(e.message);
    }
    setSearching(false);
  };

  const update = (key, patch) => {
    setLines((current) => current.map((l) => (l.key === key ? { ...l, ...patch } : l)));
    setDirty(true);
  };

  const total = useMemo(() => lines.reduce((sum, l) => sum + (l.unitPrice ?? 0) * l.qty, 0), [lines]);
  const unpriced = lines.filter((l) => l.unitPrice == null);
  const badQty = lines.some((l) => !Number.isInteger(l.qty) || l.qty <= 0);

  // Creates the draft on first save, then replaces its lines.
  const save = async () => {
    let id = draftId;
    if (!id) {
      id = (await createDraft(partnerId, token)).id;
      setDraftId(id);
      window.history.replaceState(null, "", `/partners/${partnerId}/deliveries/new?draft=${id}`);
    }
    const saved = await saveDraftLines(
      id,
      lines.map((l) => ({
        variantId: l.variantId,
        qty: l.qty,
        boxes: l.boxes || null,
        unitPrice: l.unitPrice,
        setWholesale: l.needsPrice && l.unitPrice != null && l.setWholesale ? true : undefined,
      })),
      token
    );
    setDirty(false);
    return saved;
  };

  const onSaveDraft = async () => {
    setBusy(true);
    setError(null);
    try {
      await save();
      setMessage("Ноорог хадгаллаа");
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  const onSendClick = async () => {
    setBusy(true);
    setError(null);
    try {
      const saved = await save();
      setConfirming(await getDelivery(saved.id, token));
      setSendError(null);
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  const onConfirmSend = async () => {
    setBusy(true);
    setSendError(null);
    try {
      const sent = await sendDelivery(confirming.id, token);
      router.push(`/partner-deliveries/${sent.id}`);
    } catch (e) {
      setSendError(e.message);
      setBusy(false);
    }
  };

  if (!token || !partner) {
    return (
      <div className="wg-box">
        {error ? <ErrorText>{error}</ErrorText> : <div className="body-text">Ачаалж байна…</div>}
      </div>
    );
  }

  const cell = { padding: "10px 8px", verticalAlign: "top", fontSize: 14, color: C.text, border: "none" };
  const head = { ...cell, color: C.muted, fontWeight: 600, borderBottom: `1px solid ${C.line}`, whiteSpace: "nowrap" };

  return (
    <div className="wg-box">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>
          Шинэ падаан · {partner.name}
        </div>
        <div style={{ fontSize: 14, color: C.muted }}>{draftId ? (dirty ? "Хадгалаагүй өөрчлөлттэй" : "Ноорог хадгалагдсан") : "Хадгалаагүй"}</div>
      </div>

      <div style={{ position: "relative", marginTop: 16 }}>
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setMessage(null);
          }}
          onKeyDown={onSearchEnter}
          autoFocus
          autoComplete="off"
          placeholder="Штрих код уншуулах эсвэл нэр, SKU бичих…"
          style={{ ...inputStyle, fontSize: 17, padding: "13px 15px" }}
        />
        {searching && <div style={{ position: "absolute", right: 14, top: 14, fontSize: 13, color: C.faint }}>Хайж байна…</div>}
        {hits.length > 0 && (
          <div
            style={{
              position: "absolute",
              zIndex: 20,
              left: 0,
              right: 0,
              top: "100%",
              marginTop: 4,
              backgroundColor: "#fff",
              border: `1px solid ${C.line}`,
              borderRadius: 8,
              boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
              maxHeight: 340,
              overflowY: "auto",
            }}
          >
            {hits.map((h) => (
              <button
                key={h.variantId}
                type="button"
                onClick={() => addHit(h)}
                style={{
                  display: "flex",
                  width: "100%",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "10px 14px",
                  background: "none",
                  border: "none",
                  borderBottom: `1px solid ${C.grayBg}`,
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                <span>
                  <span style={{ color: C.text }}>{h.name}</span>
                  <span style={{ color: C.faint }}> · {h.sku}</span>
                </span>
                <span style={{ color: h.unitPrice == null ? C.amber : C.muted, whiteSpace: "nowrap" }}>
                  {h.unitPrice == null ? "үнэгүй" : formatMnt(h.unitPrice)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      {message && <div style={{ fontSize: 14, color: C.muted, marginTop: 8 }}>{message}</div>}

      <div style={{ overflowX: "auto", marginTop: 18 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: "none" }}>
          <thead>
            <tr>
              <th style={{ ...head, width: 36 }}>№</th>
              <th style={{ ...head, textAlign: "left" }}>Бараа</th>
              <th style={{ ...head, width: 90 }}>Хайрцаг</th>
              <th style={{ ...head, width: 100 }}>Тоо</th>
              <th style={{ ...head, width: 190 }}>Нэгж үнэ</th>
              <th style={{ ...head, width: 130, textAlign: "right" }}>Дүн</th>
              <th style={{ ...head, width: 36 }} />
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ ...cell, textAlign: "center", color: C.faint, padding: 28 }}>
                  Бараа уншуулж эхэлнэ үү.
                </td>
              </tr>
            ) : (
              lines.map((l, i) => (
                <tr key={l.key} style={{ boxShadow: `inset 0 -1px 0 ${C.grayBg}` }}>
                  <td style={{ ...cell, color: C.faint }}>{i + 1}</td>
                  <td style={cell}>
                    <div>{l.name}</div>
                    <div style={{ fontSize: 12, color: C.faint }}>{l.sku}</div>
                  </td>
                  <td style={cell}>
                    {l.unitsPerBox ? (
                      <>
                        <input
                          value={l.boxes ?? ""}
                          inputMode="numeric"
                          onChange={(e) => {
                            const boxes = toInt(e.target.value);
                            update(l.key, boxes ? { boxes, qty: boxes * l.unitsPerBox } : { boxes: null });
                          }}
                          style={{ ...inputStyle, padding: "7px 8px" }}
                        />
                        <div style={{ fontSize: 12, color: C.faint, marginTop: 2 }}>× {l.unitsPerBox}</div>
                      </>
                    ) : (
                      <span style={{ color: C.faint }}>—</span>
                    )}
                  </td>
                  <td style={cell}>
                    <input
                      value={l.qty || ""}
                      inputMode="numeric"
                      onChange={(e) => update(l.key, { qty: toInt(e.target.value) ?? 0, boxes: null })}
                      style={{ ...inputStyle, padding: "7px 8px", borderColor: l.qty > 0 ? C.line : C.red }}
                    />
                  </td>
                  <td style={cell}>
                    <input
                      value={l.unitPrice ?? ""}
                      inputMode="numeric"
                      placeholder="Үнэ"
                      onChange={(e) => update(l.key, { unitPrice: e.target.value.trim() === "" ? null : toInt(e.target.value) })}
                      style={{
                        ...inputStyle,
                        padding: "7px 8px",
                        backgroundColor: l.needsPrice ? C.amberBg : "#fff",
                        borderColor: l.unitPrice == null ? C.amber : C.line,
                      }}
                    />
                    {l.needsPrice && (
                      <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, color: C.amber, marginTop: 4, cursor: "pointer" }}>
                        <input type="checkbox" checked={l.setWholesale} onChange={(e) => update(l.key, { setWholesale: e.target.checked })} />
                        Бөөний үнэ болгож хадгалах
                      </label>
                    )}
                  </td>
                  <td style={{ ...cell, textAlign: "right", fontWeight: 600 }}>
                    {l.unitPrice == null ? <span style={{ color: C.faint }}>—</span> : formatMnt(l.unitPrice * l.qty)}
                  </td>
                  <td style={cell}>
                    <button
                      type="button"
                      aria-label="Мөр устгах"
                      onClick={() => {
                        setLines((current) => current.filter((x) => x.key !== l.key));
                        setDirty(true);
                      }}
                      // The template gives every button overflow-y:auto; × would show a scrollbar.
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.faint, overflow: "hidden" }}
                    >
                      &times;
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginTop: 18, paddingTop: 16, borderTop: `1px solid ${C.line}` }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14, color: C.muted }}>
            Нийт {lines.length} мөр, {lines.reduce((s, l) => s + (l.qty || 0), 0)} ш
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.text }}>{formatMnt(total)}</div>
          {unpriced.length > 0 && (
            <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, backgroundColor: C.redBg, color: "#b91c1c", fontSize: 14 }}>
              Үнэгүй мөр ({unpriced.length}): {unpriced.map((l) => l.name).join(", ")}
            </div>
          )}
          <ErrorText>{error}</ErrorText>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Button kind="secondary" onClick={onSaveDraft} disabled={busy || lines.length === 0 || badQty}>
            Ноорог хадгалах
          </Button>
          <Button onClick={onSendClick} disabled={busy || lines.length === 0 || unpriced.length > 0 || badQty}>
            Илгээх
          </Button>
        </div>
      </div>

      {confirming && (
        <SendConfirm
          delivery={confirming}
          busy={busy}
          error={sendError}
          onCancel={() => setConfirming(null)}
          onConfirm={onConfirmSend}
        />
      )}
    </div>
  );
}
