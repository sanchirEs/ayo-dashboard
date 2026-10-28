"use client";

/**
 * Сет: make a new set, change the recipe of an existing one, or turn a product
 * that already exists into a set (spec D5). Staff make the sets in the shop;
 * this page only defines what goes in one.
 */

import { useEffect, useState } from "react";
import { listSets } from "@/lib/api/stock";
import { formatMnt } from "@/lib/partners/format";
import { C, ErrorText, Section, inputStyle } from "@/components/pos/ui";
import { Tabs, VariantPicker, useToken, variantTitle } from "@/components/stock/shared";
import NewSetForm from "./NewSetForm";
import RecipeEditor from "./RecipeEditor";

const TABS = [
  ["new", "Шинэ сет"],
  ["edit", "Одоо байгаа сетүүд"],
  ["convert", "Барааг сет болгох"],
];

function ExistingSets({ token, onPick }) {
  const [sets, setSets] = useState(null);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    listSets(token).then(setSets).catch((e) => setError(e.message));
  }, [token]);

  const term = filter.trim().toLowerCase();
  const shown = (sets ?? []).filter((s) => !term || s.name.toLowerCase().includes(term) || s.sku.toLowerCase().includes(term));

  return (
    <Section title="Одоо байгаа сетүүд" description="Сетээ сонгож найрлагыг нь засна.">
      {sets && sets.length > 0 && (
        <input type="search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Нэр эсвэл SKU-гаар шүүх…" aria-label="Сет шүүх" style={{ ...inputStyle, marginBottom: 12 }} />
      )}
      <ErrorText>{error}</ErrorText>
      {!sets && !error && <p style={{ color: C.muted, margin: 0 }}>Ачаалж байна…</p>}
      {sets && sets.length === 0 && <p style={{ color: C.faint, margin: 0 }}>Сет алга байна. «Шинэ сет» хэсгээс үүсгэх, эсвэл хуучин «сет» барааг «Барааг сет болгох» хэсгээс сет болгоно уу.</p>}
      {shown.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onPick(s)}
          style={{ display: "flex", justifyContent: "space-between", gap: 16, width: "100%", textAlign: "left", padding: "10px 12px", border: "none", borderBottom: `1px solid ${C.grayBg}`, background: "none", cursor: "pointer", fontSize: 15 }}
        >
          <span>
            <span style={{ color: C.text }}>{variantTitle(s)}</span>
            <span style={{ display: "block", color: C.muted, fontSize: 12 }}>{s.sku}</span>
          </span>
          <span style={{ color: C.muted, fontSize: 13, whiteSpace: "nowrap" }}>{s.componentCount} бараа · {formatMnt(s.price)}</span>
        </button>
      ))}
      {sets && sets.length > 0 && shown.length === 0 && <p style={{ color: C.faint, margin: 0 }}>Олдсонгүй</p>}
    </Section>
  );
}

export default function SetsClient() {
  const token = useToken();
  const [tab, setTab] = useState("new");
  const [picked, setPicked] = useState(null);

  const switchTab = (next) => {
    setTab(next);
    setPicked(null);
  };

  return (
    <div className="wg-box">
      <Tabs tabs={TABS} value={tab} onChange={switchTab} />

      {tab === "new" && <NewSetForm token={token} />}

      {tab === "edit" &&
        (picked ? (
          <RecipeEditor token={token} variant={picked} onBack={() => setPicked(null)} backLabel="Өөр сет сонгох" />
        ) : (
          <ExistingSets token={token} onPick={setPicked} />
        ))}

      {tab === "convert" &&
        (picked ? (
          <RecipeEditor token={token} variant={picked} onBack={() => setPicked(null)} backLabel="Өөр бараа сонгох" />
        ) : (
          <Section
            title="Одоо байгаа барааг сет болгох"
            description="Нэр, үнэ, зураг нь аль хэдийн байгаа барааг (жишээ нь хуучин «сет» бараа) сет болгоно. Шинэ сет бол «Шинэ сет» хэсгээс үүсгэнэ."
          >
            <VariantPicker token={token} onPick={setPicked} placeholder="Сет болгох барааг хайх…" autoFocus />
          </Section>
        ))}
    </div>
  );
}
