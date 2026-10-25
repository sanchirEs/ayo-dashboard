"use client";

/**
 * Сет: the fixed recipe of a set product (spec D5). Staff make sets in the shop;
 * this page only defines what goes in one. A new recipe applies to sets made after
 * the change. Saving an empty recipe turns the product back into a plain item.
 */

import { useEffect, useState } from "react";
import { getRecipe, saveRecipe } from "@/lib/api/stock";
import { variantsByIds } from "@/lib/api/pos";
import { Button, C, ErrorText, Section } from "@/components/pos/ui";
import { SMALL, LinesEditor, VariantPicker, useToken, variantTitle } from "@/components/stock/shared";

export default function SetsClient() {
  const token = useToken();
  const [setVariant, setSetVariant] = useState(null);
  const [lines, setLines] = useState(null);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!setVariant || !token) return;
    let stale = false;
    setLines(null);
    setSaved(false);
    setError(null);
    (async () => {
      try {
        const recipe = await getRecipe(setVariant.id, token);
        const details = await variantsByIds(recipe.map((c) => c.componentVariantId), token);
        const byId = new Map(details.map((v) => [v.id, v]));
        if (!stale) setLines(recipe.map((c) => ({ variant: byId.get(c.componentVariantId) ?? { id: c.componentVariantId, name: `Бараа #${c.componentVariantId}`, sku: "" }, qty: c.qty })));
      } catch (e) {
        if (!stale) setError(e.message);
      }
    })();
    return () => {
      stale = true;
    };
  }, [setVariant, token]);

  const save = async () => {
    if (lines.some((l) => !Number.isInteger(l.qty) || l.qty <= 0)) return setError("Тоо ширхэг эерэг бүхэл тоо байх ёстой");
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await saveRecipe(setVariant.id, lines.map((l) => ({ componentVariantId: l.variant.id, qty: l.qty })), token);
      setSaved(true);
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  return (
    <div className="wg-box">
      <Section
        title="Сетийн найрлага"
        description="Сет болгох барааг сонгоод, дотор нь орох барааг нэмнэ. Найрлага өөрчлөгдсөн нь зөвхөн дараа хийгдэх сетэд үйлчилнэ. Сет өөр сетийн найрлагад орж болохгүй."
      >
        {setVariant ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <strong style={{ fontSize: 16 }}>{variantTitle(setVariant)}</strong>
            <span style={{ color: C.muted, fontSize: 13 }}>{setVariant.sku}</span>
            <Button kind="secondary" onClick={() => setSetVariant(null)} style={SMALL}>Өөр сет сонгох</Button>
          </div>
        ) : (
          <VariantPicker token={token} onPick={setSetVariant} placeholder="Сет болгох барааг хайх…" autoFocus />
        )}
      </Section>

      {setVariant && lines && (
        <Section title="Найрлага" description="Нэг сетэд орох бараа ба тоо ширхэг.">
          <LinesEditor token={token} lines={lines} onChange={(next) => { setLines(next); setSaved(false); }} qtyLabel="Нэг сетэд" />
          <ErrorText>{error}</ErrorText>
          {saved && (
            <p role="status" style={{ margin: "14px 0 0", padding: "10px 14px", borderRadius: 10, backgroundColor: C.greenBg, color: C.green, fontSize: 15 }}>
              {lines.length === 0 ? "Найрлага арилгагдлаа. Энэ бараа энгийн бараа боллоо." : "Найрлага хадгалагдлаа."}
            </p>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
            <Button onClick={save} disabled={busy}>{busy ? "Хадгалж байна…" : lines.length === 0 ? "Сетээс гаргах" : "Найрлага хадгалах"}</Button>
          </div>
        </Section>
      )}
      {setVariant && !lines && !error && <p style={{ color: C.muted }}>Ачаалж байна…</p>}
      {!lines && <ErrorText>{error}</ErrorText>}
    </div>
  );
}
