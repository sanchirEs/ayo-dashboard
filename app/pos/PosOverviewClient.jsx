"use client";

/**
 * POS тойм: today per branch, what is open, what was off, and what needs a person
 * (spec 16.2). An empty alert list means nothing needs the owner; each alert links to
 * the page that deals with it.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { getOverview } from "@/lib/api/reports";
import { formatMnt } from "@/lib/partners/format";
import { C, ErrorText, Pill, Section, Table, ago } from "@/components/pos/ui";
import { useToken } from "@/components/stock/shared";

const ALERT_LABEL = {
  NEGATIVE_STOCK: "Хасах үлдэгдэлтэй бараа",
  TILL_OFFLINE: "Ажиллах цагт харагдахгүй байгаа касс",
  SYNC_ISSUES: "Синк асуудал (7 хоног)",
  BARCODE_REVIEW: "Шалгах шинэ баркод",
  PRICE_MISMATCH: "Үнийн зөрүүтэй борлуулалт (7 хоног)",
  DRAFT_PADAAN: "2 хоногоос дээш хугацаатай ноорог падаан",
  QPAY_PENDING: "30 минутаас дээш хүлээгдэж буй QPay",
  QPAY_PAID_NO_SALE: "QPay-ээр төлөгдсөн боловч борлуулалт үүсээгүй (мөнгө авсан, баримтгүй)",
};

const METHOD = {
  CASH: ["Бэлэн", "#15803d"],
  CARD: ["Карт", "#2563eb"],
  QPAY: ["QPay", "#7c3aed"],
  BANK_TRANSFER: ["Шилжүүлэг", "#0891b2"],
  STOREPAY: ["StorePay", "#c2410c"],
  STOREPAY_MANUAL: ["StorePay", "#c2410c"],
  PREPAID: ["Урьдчилсан", "#475569"],
};

/** A stacked bar of the day's payments plus a legend, so the split is never colour alone. */
function PaymentMix({ byMethod }) {
  const parts = Object.entries(byMethod).filter(([, amount]) => amount > 0);
  const total = parts.reduce((sum, [, amount]) => sum + amount, 0);
  if (total === 0) return null;
  return (
    <div style={{ marginTop: 14 }}>
      <div role="img" aria-label="Төлбөрийн хуваарилалт" style={{ display: "flex", height: 10, borderRadius: 6, overflow: "hidden", backgroundColor: C.grayBg }}>
        {parts.map(([method, amount]) => (
          <span key={method} style={{ width: `${(amount / total) * 100}%`, backgroundColor: (METHOD[method] ?? ["", "#94a3b8"])[1] }} />
        ))}
      </div>
      <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "flex", flexWrap: "wrap", gap: "4px 16px", fontSize: 13, color: C.muted }}>
        {parts.map(([method, amount]) => (
          <li key={method}>
            <span aria-hidden="true" style={{ display: "inline-block", width: 8, height: 8, borderRadius: 4, marginRight: 6, backgroundColor: (METHOD[method] ?? ["", "#94a3b8"])[1] }} />
            {(METHOD[method] ?? [method])[0]}: {formatMnt(amount)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PosOverviewClient() {
  const token = useToken();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    getOverview(token)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [token]);

  const totalNet = (data?.today ?? []).reduce((sum, b) => sum + b.net, 0);

  return (
    <div className="wg-box">
      <ErrorText>{error}</ErrorText>
      {!data && !error && <p style={{ color: C.muted }}>Ачаалж байна…</p>}
      {data && (
        <>
          <Section
            title={`Өнөөдөр · ${data.date}`}
            description="Кассаар хийсэн борлуулалт (буцаалт хассан). Онлайн борлуулалт «Тайлан → Борлуулалт»-д."
            actions={<strong style={{ fontSize: 22 }}>{formatMnt(totalNet)}</strong>}
          >
            {data.today.length === 0 ? (
              <p style={{ color: C.muted, margin: 0 }}>Өнөөдөр борлуулалт хараахан алга.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                {data.today.map((b) => (
                  <div key={b.locationId} style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: 16 }}>
                    <div style={{ color: C.muted, fontSize: 14 }}>{b.label}</div>
                    <div style={{ fontSize: 24, fontWeight: 700, margin: "4px 0" }}>{formatMnt(b.net)}</div>
                    <div style={{ color: C.muted, fontSize: 13 }}>{b.count} борлуулалт</div>
                    <PaymentMix byMethod={b.byMethod} />
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Анхаарах зүйл" description="Хоосон бол одоогоор эзэмшигч хийх зүйл алга.">
            {data.alerts.length === 0 ? (
              <p style={{ margin: 0 }}><Pill tone="green">Бүгд хэвийн</Pill></p>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {data.alerts.map((a) => (
                  <li key={a.code} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 0", fontSize: 15, borderBottom: `1px solid ${C.grayBg}` }}>
                    <span>
                      <Pill tone="amber">{a.count}</Pill> <span style={{ marginLeft: 8 }}>{ALERT_LABEL[a.code] ?? a.code}</span>
                    </span>
                    <Link href={a.link} style={{ color: C.blue, whiteSpace: "nowrap" }}>Харах →</Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Нээлттэй ээлж">
            <Table
              cols={[
                { key: "register", label: "Касс" },
                { key: "cashier", label: "Кассчин", width: 200 },
                { key: "opened", label: "Нээсэн", width: 160 },
              ]}
              rows={data.openShifts.map((s, i) => ({ key: i, register: s.register, cashier: s.cashier, opened: ago(s.openedAt) }))}
              empty="Нээлттэй ээлж алга."
            />
          </Section>

          <Section
            title="Сүүлийн 7 хоногийн кассын зөрүү"
            actions={<Link href="/reports/pos/shifts" style={{ color: C.blue }}>Дэлгэрэнгүй →</Link>}
          >
            <Table
              cols={[
                { key: "z", label: "Z дугаар" },
                { key: "variance", label: "Зөрүү", align: "right", width: 160 },
              ]}
              rows={data.variances7d.map((v) => ({
                key: v.zNumber,
                z: v.zNumber,
                variance: <strong style={{ color: v.variance < 0 ? C.red : C.green }}>{v.variance > 0 ? "+" : ""}{formatMnt(v.variance)}</strong>,
              }))}
              empty="Зөрүүтэй ээлж алга ✓"
            />
          </Section>
        </>
      )}
    </div>
  );
}
