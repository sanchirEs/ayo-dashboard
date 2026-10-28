"use client";

/**
 * Шинэ сет: a name, a price and what goes in it. One request creates the product,
 * its variant and the recipe. The set starts hidden from the website (it has no
 * photo or category yet); the till sells it straight away.
 */

import { useState } from "react";
import { createSet } from "@/lib/api/stock";
import { formatMnt } from "@/lib/partners/format";
import { Button, C, ErrorText, Field, Section } from "@/components/pos/ui";
import { LinesEditor } from "@/components/stock/shared";

export default function NewSetForm({ token }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [lines, setLines] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);

  const separately = lines.reduce((sum, l) => sum + (Number(l.variant.listPrice) || 0) * (Number(l.qty) || 0), 0);

  const save = async () => {
    const trimmed = name.trim();
    const amount = Number(price);
    if (!trimmed) return setError("Сетийн нэрийг оруулна уу");
    if (price.trim() === "" || !Number.isFinite(amount) || amount <= 0) return setError("Сетийн үнийг зөв оруулна уу");
    if (lines.length === 0) return setError("Сетэд дор хаяж нэг бараа нэмнэ үү");
    if (lines.some((l) => !Number.isInteger(l.qty) || l.qty <= 0)) return setError("Тоо ширхэг эерэг бүхэл тоо байх ёстой");
    setBusy(true);
    setError(null);
    try {
      setCreated(await createSet({ name: trimmed, price: amount, components: lines.map((l) => ({ componentVariantId: l.variant.id, qty: l.qty })) }, token));
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  const again = () => {
    setCreated(null);
    setName("");
    setPrice("");
    setLines([]);
    setError(null);
  };

  if (created) {
    return (
      <Section title="Сет үүслээ" description={`${created.name} · ${created.sku} · ${formatMnt(created.price)}`}>
        <p role="status" style={{ margin: "0 0 14px", padding: "10px 14px", borderRadius: 10, backgroundColor: C.greenBg, color: C.green, fontSize: 15 }}>
          Сет кассанд зарагдахад бэлэн боллоо. Вэбсайт дээр одоохондоо харагдахгүй: зураг, ангилал нэмж, бүтээгдэхүүний хуудаснаас идэвхжүүлнэ.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a className="tf-button" href={`/edit-product/${created.productId}`} style={{ padding: "9px 18px", fontSize: 15, backgroundColor: C.blue, color: "#fff" }}>
            Зураг, ангилал нэмэх
          </a>
          <Button kind="secondary" onClick={again}>Өөр сет үүсгэх</Button>
        </div>
      </Section>
    );
  }

  return (
    <>
      <Section title="Шинэ сет" description="Нэр, үнээ оруулаад, дотор нь орох бараануудыг нэмнэ. Сет бүр өөрийн SKU-тэй, энгийн бараа шиг зарагдана.">
        <div style={{ display: "grid", gridTemplateColumns: "minmax(240px, 2fr) minmax(160px, 1fr)", gap: 16 }}>
          <Field label="Сетийн нэр">
            {(props) => <input {...props} value={name} onChange={(e) => setName(e.target.value)} placeholder="Жишээ: Anua Elt сет" autoFocus />}
          </Field>
          <Field label="Үнэ (₮)" hint={separately > 0 ? `Тусад нь авбал ${formatMnt(separately)}` : undefined}>
            {(props) => <input {...props} type="number" inputMode="numeric" min={0} step={1} value={price} onChange={(e) => setPrice(e.target.value)} />}
          </Field>
        </div>
      </Section>
      <Section title="Найрлага" description="Нэг сетэд орох бараа ба тоо ширхэг.">
        <LinesEditor token={token} lines={lines} onChange={setLines} qtyLabel="Нэг сетэд" />
        <ErrorText>{error}</ErrorText>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
          <Button onClick={save} disabled={busy}>{busy ? "Үүсгэж байна…" : "Сет үүсгэх"}</Button>
        </div>
      </Section>
    </>
  );
}
