"use client";

/**
 * Шинэ баркод: barcodes that cashiers linked to a product at the till (spec 8.2).
 * Every link lands here for a look: "Зөв" marks it checked, "Буцаах" takes the
 * barcode back off the product (only if it is still the one the till put there).
 */

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { listBarcodeLinks, revertBarcodeLink, reviewBarcodeLink } from "@/lib/api/pos";
import { Button, C, ErrorText, Pill, Table, ago } from "@/components/pos/ui";

const ROW_BUTTON = { padding: "0 14px", fontSize: 14, height: 36, lineHeight: "20px" };

const STATUS = {
  APPLIED: ["green", "Холбогдсон"],
  PENDING_REVIEW: ["amber", "GTIN биш: шалгана"],
  REJECTED: ["gray", "Татгалзсан"],
  REVERTED: ["gray", "Буцаасан"],
};

const FILTERS = [
  ["unreviewed", "Шалгаагүй"],
  ["all", "Бүгд"],
];

export default function BarcodeLinksClient() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [filter, setFilter] = useState("unreviewed");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const out = await listBarcodeLinks({ reviewed: filter === "unreviewed" ? false : undefined, limit: 100 }, token);
      setItems(out.items);
      setTotal(out.total);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [token, filter]);

  // token is a dependency on purpose: useSession is undefined on first render.
  useEffect(() => {
    load();
  }, [load]);

  const act = async (id, fn) => {
    setBusyId(id);
    setError(null);
    try {
      await fn(id, token);
      await load();
    } catch (e) {
      setError(e.message);
    }
    setBusyId(null);
  };

  const rows = items.map((link) => {
    const [tone, text] = STATUS[link.status] || ["gray", link.status];
    const open = link.status === "APPLIED" || link.status === "PENDING_REVIEW";
    return {
      key: link.id,
      variant: (
        <span style={{ lineHeight: 1.4 }}>
          <span style={{ fontWeight: 600 }}>{link.variant.productName || "—"}</span>
          {link.variant.variantLabel && <span style={{ color: C.muted }}> · {link.variant.variantLabel}</span>}
          {link.variant.sku && <span style={{ display: "block", fontSize: 13, color: C.faint }}>{link.variant.sku}</span>}
        </span>
      ),
      barcode: <span style={{ fontVariantNumeric: "tabular-nums" }}>{link.barcode}</span>,
      staff: link.staff.name || "—",
      branch: link.register.locationName ? `${link.register.locationName} · ${link.register.name || ""}` : "—",
      time: ago(link.createdAt),
      status: <Pill tone={tone}>{text}</Pill>,
      actions: open ? (
        <span style={{ display: "inline-flex", gap: 8 }}>
          {!link.reviewedAt && (
            <Button kind="secondary" style={ROW_BUTTON} disabled={busyId === link.id} onClick={() => act(link.id, reviewBarcodeLink)}>
              Зөв
            </Button>
          )}
          <Button kind="danger" style={ROW_BUTTON} disabled={busyId === link.id} onClick={() => act(link.id, revertBarcodeLink)}>
            Буцаах
          </Button>
        </span>
      ) : null,
    };
  });

  return (
    <div className="wg-box">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <p style={{ margin: 0, color: C.muted, fontSize: 15, maxWidth: 620 }}>
          Кассир танигдаагүй баркодыг барааны хажууд холбоход энд орно. Буруу холбоос бол буруу үнэ гэсэн үг тул нэг нэгээр нь шалгана уу.
        </p>
        <span style={{ display: "inline-flex", gap: 8 }} role="group" aria-label="Шүүлтүүр">
          {FILTERS.map(([key, label]) => (
            <Button key={key} kind={filter === key ? "primary" : "secondary"} style={ROW_BUTTON} onClick={() => setFilter(key)} aria-pressed={filter === key}>
              {label}
            </Button>
          ))}
        </span>
      </div>

      <ErrorText>{error}</ErrorText>

      <div style={{ marginTop: 18 }}>
        <Table
          cols={[
            { key: "variant", label: "Бараа" },
            { key: "barcode", label: "Баркод", width: 160 },
            { key: "staff", label: "Ажилтан", width: 140 },
            { key: "branch", label: "Салбар", width: 200 },
            { key: "time", label: "Хэзээ", width: 120 },
            { key: "status", label: "Төлөв", width: 170 },
            { key: "actions", label: "", align: "right" },
          ]}
          rows={loading ? [] : rows}
          empty={loading || !token ? "Ачаалж байна…" : "Шалгах баркод алга."}
        />
      </div>
      {!loading && total > items.length && (
        <p style={{ color: C.faint, fontSize: 14, marginTop: 10 }}>
          Сүүлийн {items.length} / {total}
        </p>
      )}
    </div>
  );
}
