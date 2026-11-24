"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, C, Dialog, ErrorText, Field } from "@/components/pos/ui";
import { getBrandsClient, mergeBrands } from "@/lib/api/brands";
import { describeMergeResult, mergeCandidates, mergeConfirmText } from "@/lib/brands/merge";

/**
 * Folds one brand (`loser`, the row it was opened from) into another the owner
 * picks. The loser's products, campaign brands and retailer brands move to the
 * survivor and the loser is deleted, which cannot be undone, so the sentence that
 * says exactly that stays on screen next to the button.
 *
 * `onClose(merged)`: the list refreshes only after the dialog closes. Refreshing
 * earlier would drop the loser's row, and this dialog with it, before the owner
 * has read the result.
 */
export default function MergeBrandDialog({ loser, token, onClose }) {
  const [brands, setBrands] = useState(null);
  const [query, setQuery] = useState("");
  const [targetId, setTargetId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    getBrandsClient(token).then((list) => {
      if (!cancelled) setBrands(list);
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const candidates = useMemo(() => mergeCandidates(brands, loser.id, query), [brands, loser.id, query]);
  const target = (brands || []).find((brand) => String(brand.id) === String(targetId));

  const close = () => {
    if (!busy) onClose(Boolean(result));
  };

  const merge = async () => {
    if (!target) return;
    setBusy(true);
    setError(null);
    try {
      setResult(await mergeBrands(target.id, loser.id, token));
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  if (result) {
    return (
      <Dialog title="Нэгтгэж дууслаа" onClose={close} width={460}>
        <p style={{ margin: "0 0 10px", fontSize: 15, color: C.text, lineHeight: 1.5 }}>
          «{loser.name}» → «{target?.name}» руу нэгтгэгдлээ.
        </p>
        <ul style={{ margin: "0 0 16px", paddingLeft: 20, fontSize: 15, color: C.text, lineHeight: 1.6, listStyle: "disc" }}>
          {describeMergeResult(result).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button onClick={close} data-autofocus>
            Хаах
          </Button>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog title="Брэнд нэгтгэх" onClose={close} width={520}>
      <p style={{ margin: "0 0 16px", fontSize: 15, color: C.text, lineHeight: 1.5 }}>
        «{loser.name}» брэндийн бүх бараа, хямдрал, гадаад дэлгүүрийн холбоос доор сонгосон брэнд рүү шилжиж,
        «{loser.name}» устана.
      </p>

      <div style={{ display: "grid", gap: 14 }}>
        <Field label="Брэнд хайх">
          {(props) => (
            <input
              {...props}
              type="search"
              data-autofocus
              value={query}
              placeholder="Нэрээр хайх..."
              autoComplete="off"
              onChange={(e) => setQuery(e.target.value)}
            />
          )}
        </Field>

        <Field label="Аль брэнд рүү нэгтгэх вэ?">
          {(props) => (
            <select
              {...props}
              size={8}
              value={targetId}
              disabled={!brands}
              onChange={(e) => setTargetId(e.target.value)}
            >
              {candidates.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        {brands && candidates.length === 0 && (
          <div style={{ fontSize: 14, color: C.muted, marginTop: -6 }}>Брэнд олдсонгүй</div>
        )}
        {!brands && <div style={{ fontSize: 14, color: C.muted, marginTop: -6 }}>Брэндүүдийг ачаалж байна…</div>}

        {target && (
          <div
            role="status"
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              backgroundColor: C.redBg,
              color: "#b91c1c",
              fontSize: 15,
              lineHeight: 1.5,
            }}
          >
            {mergeConfirmText(loser.name, target.name)}
          </div>
        )}
      </div>

      <ErrorText>{error}</ErrorText>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
        <Button kind="secondary" onClick={close}>
          Болих
        </Button>
        <Button kind="danger" onClick={merge} disabled={!target || busy}>
          {busy ? "Нэгтгэж байна…" : "Нэгтгэх"}
        </Button>
      </div>
    </Dialog>
  );
}
