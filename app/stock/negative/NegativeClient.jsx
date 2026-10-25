"use client";

/**
 * Хасах үлдэгдэл: every balance below zero, worst first. A sale the till accepted
 * without stock (or a set sold with missing components) lands here for the owner
 * to explain with a count or an adjustment (spec 6.2, 16.2).
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { negativeBalances } from "@/lib/api/stock";
import { C, ErrorText, Table } from "@/components/pos/ui";
import { useToken } from "@/components/stock/shared";

export default function NegativeClient() {
  const token = useToken();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    negativeBalances(token)
      .then(setRows)
      .catch((e) => setError(e.message));
  }, [token]);

  const table = (rows ?? []).map((r) => ({
    key: `${r.locationId}-${r.variantId}`,
    location: r.locationName,
    name: (
      <div>
        <div>{r.name}</div>
        <div style={{ color: C.muted, fontSize: 12 }}>{r.sku}</div>
      </div>
    ),
    onHand: <strong style={{ color: C.red }}>{r.onHand}</strong>,
    reserved: r.reserved,
  }));

  return (
    <div className="wg-box">
      <p style={{ margin: "0 0 16px", color: C.muted, fontSize: 15, maxWidth: 680 }}>
        Үлдэгдэл 0-ээс доош орсон бараанууд. Ихэнхдээ орлого бүртгэгдээгүй, эсвэл тооллого хийгдээгүйгээс болдог.{" "}
        <Link href="/stock/counts" style={{ color: C.blue }}>Тооллого</Link> эсвэл <Link href="/stock/adjustments" style={{ color: C.blue }}>Залруулга</Link>-аар засна.
      </p>
      <ErrorText>{error}</ErrorText>
      <Table
        cols={[
          { key: "location", label: "Салбар", width: 200 },
          { key: "name", label: "Бараа" },
          { key: "onHand", label: "Үлдэгдэл", align: "right", width: 110 },
          { key: "reserved", label: "Нөөцөлсөн", align: "right", width: 110 },
        ]}
        rows={table}
        empty={rows === null && !error ? "Ачаалж байна…" : "Хасах үлдэгдэлтэй бараа алга."}
      />
    </div>
  );
}
