"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { fmtDate, money, providerLabel, opsFetch } from "@/components/orderOps/shared";
import s from "@/components/orderOps/ops.module.css";

const PERIODS = [30, 90, 180, 365];

export default function ReturnsClient() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || null;
  const [days, setDays] = useState(180);
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      setRows(await opsFetch(`/backoffice/order-ops/returns?days=${days}`, token));
    } catch (e) {
      setError(e.message);
    }
  }, [token, days]);

  useEffect(() => { load(); }, [load]);

  const units = (rows || []).reduce((n, r) => n + r.units, 0);
  const refunded = (rows || []).reduce((n, r) => n + (r.refund?.amount || 0), 0);

  return (
    <div className={s.page}>
      <div className={s.head}>
        <div>
          <h1 className={s.title}>Буцаалт</h1>
          <p className={s.sub}>Вэбийн захиалгаас буцаж ирсэн бараа, буцаан олгосон мөнгө. Шинэ буцаалтыг захиалгын дэлгэрэнгүй хуудаснаас бүртгэнэ.</p>
        </div>
        <label className={s.check} style={{ gap: 10 }}>
          <span className={s.small}>Хугацаа</span>
          <select className={s.select} value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {PERIODS.map((d) => <option key={d} value={d}>Сүүлийн {d} хоног</option>)}
          </select>
        </label>
      </div>

      {rows && rows.length > 0 && (
        <section className={s.stats} style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }} aria-label="Нийт">
          <div className={s.stat}><span className={s.statLabel}>Буцаалт</span><span className={s.statValue}>{rows.length}</span></div>
          <div className={s.stat}><span className={s.statLabel}>Буцсан ширхэг</span><span className={s.statValue}>{units}</span></div>
          <div className={s.stat}><span className={s.statLabel}>Буцаан олгосон</span><span className={s.statValue}>{money(refunded)}</span></div>
        </section>
      )}

      {error ? (
        <div className={s.card}>
          <div className={s.empty}>
            <h2>Буцаалтыг ачаалж чадсангүй</h2>
            <p>{error}</p>
            <div className={s.emptyActions}><button type="button" className={s.primaryBtn} onClick={load}>Дахин ачаалах</button></div>
          </div>
        </div>
      ) : !rows ? (
        <div className={s.card} aria-busy="true">{[1, 2, 3].map((i) => <div key={i} className={`${s.sk} ${s.skRow}`} />)}</div>
      ) : rows.length === 0 ? (
        <div className={s.card}>
          <div className={s.empty}>
            <h2>Сүүлийн {days} хоногт буцаалт бүртгэгдээгүй</h2>
            <p>Хэрэглэгч бараа буцаавал захиалгыг нээгээд "Буцаалт бүртгэх" товчийг дарна. Бараа нөөцөд буцаж орж, мөнгө буцаасан нь энд харагдана.</p>
            <div className={s.emptyActions}><Link href="/order-list" className={s.ghostBtn}>Захиалгын жагсаалт</Link></div>
          </div>
        </div>
      ) : (
        <div className={`${s.card} ${s.tableWrap}`}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Огноо</th>
                <th>Захиалга</th>
                <th>Хэрэглэгч</th>
                <th className={s.num}>Ширхэг</th>
                <th>Нөөцөд</th>
                <th className={s.num}>Буцаан олгосон</th>
                <th>Тэмдэглэл</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className={s.nowrap}>{fmtDate(r.at)}</td>
                  <td className={s.nowrap}>
                    <Link href={`/order-detail/${r.orderId}`} className={s.link}>#{r.orderId}</Link>
                    <div className={s.small}>{money(r.orderTotal)}</div>
                  </td>
                  <td>
                    <Link href={`/customer/${r.customer.id}`} className={s.link}>{r.customer.name || r.customer.phone || `#${r.customer.id}`}</Link>
                    {r.customer.name && r.customer.phone && <div className={s.small}>{r.customer.phone}</div>}
                  </td>
                  <td className={s.num}>{r.units}</td>
                  <td>{r.restockedTo || <span className={s.muted}>Буцаагаагүй</span>}</td>
                  <td className={s.num}>
                    {r.refund ? <>{money(r.refund.amount)}<div className={s.small}>{providerLabel(r.refund.method)}</div></> : <span className={s.muted}>—</span>}
                  </td>
                  <td className={s.small} style={{ maxWidth: 260 }}>{r.note || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
