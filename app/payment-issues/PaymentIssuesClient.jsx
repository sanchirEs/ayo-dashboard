"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { StatusPill, PaymentTag, fmtDate, money, providerLabel, opsFetch } from "@/components/orderOps/shared";
import s from "@/components/orderOps/ops.module.css";

const ISSUES = [
  { key: "UNDERPAID", label: "Дутуу төлсөн", hint: "Төлсөн дүн захиалгын дүнгээс бага. Ихэвчлэн шилжүүлэгт хүргэлтийн төлбөр ороогүй байдаг." },
  { key: "OVERPAID", label: "Илүү төлсөн", hint: "Төлсөн дүн захиалгын дүнгээс их. Илүүг буцаах эсвэл дараагийн захиалгад тооцох хэрэгтэй." },
  { key: "NOT_PAID", label: "Төлбөргүй баталгаажсан", hint: "Захиалга баталгаажсан эсвэл илгээгдсэн ч төлбөр нь төлөгдөөгүй байна." },
  { key: "PAID_NOT_REFUNDED", label: "Цуцалсан ч мөнгө буцаагаагүй", hint: "Захиалга цуцлагдсан эсвэл буцаагдсан ч төлбөр төлөгдсөн хэвээр. Мөнгийг буцаан олгосон бол захиалга дээр буцаалтаа бүртгэнэ үү." },
  { key: "PROCESS_FAILED", label: "Процесс алдаатай", hint: "Захиалгын автомат процесс алдаатай зогссон. Захиалгыг нээж алдааг шалгана уу." },
];
const ISSUE_LABEL = Object.fromEntries(ISSUES.map((i) => [i.key, i.label]));
const PERIODS = [30, 90, 180, 365];

export default function PaymentIssuesClient() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || null;
  const [days, setDays] = useState(90);
  const [filter, setFilter] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setData(await opsFetch(`/backoffice/order-ops/payment-issues?days=${days}`, token));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, days]);

  useEffect(() => { load(); }, [load]);

  const rows = useMemo(
    () => (data?.items || []).filter((r) => !filter || r.issues.includes(filter)),
    [data, filter]
  );
  const total = data?.items?.length || 0;
  const active = ISSUES.find((i) => i.key === filter);

  return (
    <div className={s.page}>
      <div className={s.head}>
        <div>
          <h1 className={s.title}>Төлбөрийн зөрүү</h1>
          <p className={s.sub}>Мөнгө нь захиалгатайгаа таарахгүй захиалгууд. Захиалгын дугаар дээр дарж дэлгэрэнгүйг нээнэ.</p>
        </div>
        <label className={s.check} style={{ gap: 10 }}>
          <span className={s.small}>Хугацаа</span>
          <select className={s.select} value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {PERIODS.map((d) => <option key={d} value={d}>Сүүлийн {d} хоног</option>)}
          </select>
        </label>
      </div>

      <div className={s.chips} role="group" aria-label="Асуудлын төрөл">
        <button type="button" className={`${s.chip} ${!filter ? s.chipOn : ""}`} onClick={() => setFilter(null)} aria-pressed={!filter}>
          Бүгд <span className={s.chipCount}>{total}</span>
        </button>
        {ISSUES.map((i) => {
          const n = data?.counts?.[i.key] || 0;
          return (
            <button
              key={i.key}
              type="button"
              className={`${s.chip} ${filter === i.key ? s.chipOn : ""} ${n === 0 && filter !== i.key ? s.chipOff : ""}`}
              onClick={() => setFilter(filter === i.key ? null : i.key)}
              aria-pressed={filter === i.key}
            >
              {i.label} <span className={s.chipCount}>{n}</span>
            </button>
          );
        })}
      </div>
      {active && <p className={s.hint}>{active.hint}</p>}

      {error ? (
        <div className={s.card}>
          <div className={s.empty}>
            <h2>Жагсаалтыг ачаалж чадсангүй</h2>
            <p>{error}</p>
            <div className={s.emptyActions}><button type="button" className={s.primaryBtn} onClick={load}>Дахин ачаалах</button></div>
          </div>
        </div>
      ) : loading && !data ? (
        <div className={s.card} aria-busy="true">{[1, 2, 3, 4, 5].map((i) => <div key={i} className={`${s.sk} ${s.skRow}`} />)}</div>
      ) : rows.length === 0 ? (
        <div className={s.card}>
          <div className={s.empty}>
            <h2>{filter ? `"${active?.label}" алга` : "Зөрүүтэй захиалга алга"}</h2>
            <p>Сүүлийн {days} хоногийн захиалгуудын мөнгө бүгд таарч байна.</p>
          </div>
        </div>
      ) : (
        <div className={`${s.card} ${s.tableWrap}`}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Захиалга</th>
                <th>Хэрэглэгч</th>
                <th>Төлөв</th>
                <th className={s.num}>Захиалгын дүн</th>
                <th className={s.num}>Төлсөн</th>
                <th className={s.num}>Зөрүү</th>
                <th>Асуудал</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.orderId}>
                  <td className={s.nowrap}>
                    <Link href={`/order-detail/${r.orderId}`} className={s.link}>#{r.orderId}</Link>
                    <div className={s.small}>{fmtDate(r.createdAt)}</div>
                  </td>
                  <td>
                    <Link href={`/customer/${r.customer.id}`} className={s.link}>{r.customer.name || r.customer.phone || `#${r.customer.id}`}</Link>
                    {r.customer.name && r.customer.phone && <div className={s.small}>{r.customer.phone}</div>}
                  </td>
                  <td><StatusPill status={r.status} /></td>
                  <td className={s.num}>{money(r.total)}</td>
                  <td className={s.num}>
                    {r.paid != null ? money(r.paid) : <span className={s.muted}>—</span>}
                    <div className={s.small}>
                      {providerLabel(r.provider)}
                      {r.paymentStatus && r.paymentStatus !== "COMPLETED" && <> <PaymentTag status={r.paymentStatus} /></>}
                    </div>
                  </td>
                  <td className={s.num}>
                    {r.gap == null || r.gap === 0
                      ? <span className={s.muted}>—</span>
                      : <span className={r.gap < 0 ? s.negative : s.positive}>{r.gap < 0 ? "−" : "+"}{money(Math.abs(r.gap))}</span>}
                  </td>
                  <td>
                    <div className={s.tags}>
                      {r.issues.map((k) => (
                        <span key={k} className={s.tag} style={k === "UNDERPAID" || k === "PAID_NOT_REFUNDED" ? { color: "#b42318", background: "#fef3f2" } : { color: "#374151", background: "#f3f4f6" }}>
                          {ISSUE_LABEL[k] || k}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data?.truncated && <p className={s.small}>Эхний 500 захиалгыг харуулж байна. Хугацааг богиносгоно уу.</p>}
    </div>
  );
}
