"use client";

/**
 * The recipe of one set (spec D5): what goes into it and how many. A new recipe
 * applies to sets made after the change. Saving an empty recipe turns a set back
 * into a plain item, so that button only reads "Сетээс гаргах" for a real set.
 */

import { useEffect, useState } from "react";
import { getRecipe, saveRecipe } from "@/lib/api/stock";
import { variantsByIds } from "@/lib/api/pos";
import { Button, C, ErrorText, Section } from "@/components/pos/ui";
import { SMALL, LinesEditor, variantTitle } from "@/components/stock/shared";

export default function RecipeEditor({ token, variant, onBack, backLabel }) {
  const [lines, setLines] = useState(null);
  const [wasSet, setWasSet] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    let stale = false;
    setLines(null);
    setSaved(false);
    setError(null);
    (async () => {
      try {
        const recipe = await getRecipe(variant.id, token);
        const details = await variantsByIds(recipe.map((c) => c.componentVariantId), token);
        const byId = new Map(details.map((v) => [v.id, v]));
        if (stale) return;
        setWasSet(recipe.length > 0);
        setLines(recipe.map((c) => ({ variant: byId.get(c.componentVariantId) ?? { id: c.componentVariantId, name: `Бараа #${c.componentVariantId}`, sku: "" }, qty: c.qty })));
      } catch (e) {
        if (!stale) setError(e.message);
      }
    })();
    return () => {
      stale = true;
    };
  }, [variant.id, token]);

  const save = async () => {
    if (lines.some((l) => !Number.isInteger(l.qty) || l.qty <= 0)) return setError("Тоо ширхэг эерэг бүхэл тоо байх ёстой");
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await saveRecipe(variant.id, lines.map((l) => ({ componentVariantId: l.variant.id, qty: l.qty })), token);
      setWasSet(lines.length > 0);
      setSaved(true);
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  const removing = wasSet && lines?.length === 0;

  return (
    <>
      <Section title={wasSet ? "Сет" : "Сет болгох бараа"}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <strong style={{ fontSize: 16 }}>{variantTitle(variant)}</strong>
          <span style={{ color: C.muted, fontSize: 13 }}>{variant.sku}</span>
          <Button kind="secondary" onClick={onBack} style={SMALL}>{backLabel}</Button>
        </div>
      </Section>

      {lines && (
        <Section title="Найрлага" description="Нэг сетэд орох бараа ба тоо ширхэг. Өөрчилсөн найрлага зөвхөн дараа хийгдэх сетэд үйлчилнэ.">
          {!wasSet && (
            <p role="note" style={{ margin: "0 0 14px", padding: "10px 14px", borderRadius: 10, backgroundColor: C.amberBg, color: C.amber, fontSize: 14 }}>
              Энэ бараа одоо энгийн бараа. Сет болгоход түүний одоогийн нөөц (байвал) бэлэн болсон сет гэж тооцогдож, үлдсэн хэсгийг нь зарахад найрлагын бараанаас авна.
            </p>
          )}
          <LinesEditor token={token} lines={lines} onChange={(next) => { setLines(next); setSaved(false); }} qtyLabel="Нэг сетэд" />
          <ErrorText>{error}</ErrorText>
          {saved && (
            <p role="status" style={{ margin: "14px 0 0", padding: "10px 14px", borderRadius: 10, backgroundColor: C.greenBg, color: C.green, fontSize: 15 }}>
              {lines.length === 0 ? "Найрлага арилгагдлаа. Энэ бараа энгийн бараа боллоо." : "Найрлага хадгалагдлаа."}
            </p>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
            <Button onClick={save} disabled={busy || (!wasSet && lines.length === 0)} kind={removing ? "danger" : "primary"}>
              {busy ? "Хадгалж байна…" : removing ? "Сетээс гаргах" : "Найрлага хадгалах"}
            </Button>
          </div>
        </Section>
      )}
      {!lines && !error && <p style={{ color: C.muted }}>Ачаалж байна…</p>}
      {!lines && <ErrorText>{error}</ErrorText>}
    </>
  );
}
