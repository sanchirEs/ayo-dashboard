"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { StatusPill, PaymentTag, fmtDate, money, providerLabel, opsFetch } from "@/components/orderOps/shared";
import s from "@/components/orderOps/ops.module.css";

const SIGN_IN = { CREDENTIALS: "Нууц үг", GOOGLE: "Google", FACEBOOK: "Facebook" };

function Row({ label, children }) {
  return (
    <div className={s.row}>
      <dt>{label}</dt>
      <dd>{children ?? "—"}</dd>
    </div>
  );
}

export default function CustomerClient({ userId }) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || null;
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!token || !userId) return;
    setError(null);
    try {
      setData(await opsFetch(`/customers/${userId}`, token));
    } catch (e) {
      setError(e.message);
    }
  }, [token, userId]);

  useEffect(() => { load(); }, [load]);

  if (!userId) {
    return <div className={s.page}><div className={s.card}><div className={s.empty}><h2>Хэрэглэгчийн дугаар буруу байна</h2></div></div></div>;
  }
  if (error) {
    return (
      <div className={s.page}>
        <div className={s.card}>
          <div className={s.empty}>
            <h2>Хэрэглэгчийг нээж чадсангүй</h2>
            <p>{error}</p>
            <div className={s.emptyActions}>
              <button type="button" className={s.primaryBtn} onClick={load}>Дахин ачаалах</button>
              <Link href="/all-user" className={s.ghostBtn}>Хэрэглэгчид</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className={s.page} aria-busy="true">
        <div className={`${s.sk}`} style={{ width: 280, height: 30 }} />
        <div className={s.card}>{[1, 2, 3, 4].map((i) => <div key={i} className={`${s.sk} ${s.skRow}`} />)}</div>
      </div>
    );
  }

  const { user, stats, orders, blocks } = data;
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();

  return (
    <div className={s.page}>
      <div className={s.head}>
        <div>
          <h1 className={s.title}>{name || user.telephone || `Хэрэглэгч #${user.id}`}</h1>
          <p className={s.sub}>
            {user.telephone && <a href={`tel:${user.telephone}`} className={s.linkBlue}>{user.telephone}</a>}
            {user.telephone && " · "}
            Бүртгүүлсэн {fmtDate(user.createdAt, false)}
          </p>
          <div className={s.badges}>
            {blocks.length > 0 && <span className={s.tag} style={{ color: "#b42318", background: "#fef3f2" }}>Хаалттай</span>}
            {!user.hasPassword && <span className={s.tag} style={{ color: "#92400e", background: "#fffbeb" }}>Нууц үггүй</span>}
            {user.role !== "CUSTOMER" && <span className={s.tag} style={{ color: "#1e40af", background: "#eff6ff" }}>{user.role}</span>}
          </div>
        </div>
      </div>

      {blocks.length > 0 && (
        <div className={s.alert} role="status">
          <strong>Энэ хэрэглэгч хаалттай.</strong>{" "}
          {blocks.map((b) => `${b.value}${b.reason ? ` — ${b.reason}` : ""} (${fmtDate(b.createdAt, false)})`).join("; ")}
        </div>
      )}

      <section className={s.stats} aria-label="Худалдан авалт">
        <div className={s.stat}>
          <span className={s.statLabel}>Захиалга</span>
          <span className={s.statValue}>{stats.orderCount}{stats.orderCountCapped ? "+" : ""}</span>
        </div>
        <div className={s.stat}>
          <span className={s.statLabel}>Төлсөн захиалга</span>
          <span className={s.statValue}>{stats.paidCount}</span>
        </div>
        <div className={s.stat}>
          <span className={s.statLabel}>Нийт худалдан авалт</span>
          <span className={s.statValue}>{money(stats.paidTotal)}</span>
          <span className={s.statNote}>Цуцалсан, буцаасныг оруулаагүй</span>
        </div>
        <div className={s.stat}>
          <span className={s.statLabel}>Сүүлд захиалсан</span>
          <span className={s.statValue} style={{ fontSize: 20, paddingTop: 3 }}>{stats.lastOrderAt ? fmtDate(stats.lastOrderAt, false) : "—"}</span>
          {stats.firstOrderAt && <span className={s.statNote}>Анх {fmtDate(stats.firstOrderAt, false)}</span>}
        </div>
      </section>

      <div className={s.grid2}>
        <section className={`${s.card} ${s.tableWrap}`}>
          {orders.length === 0 ? (
            <div className={s.empty}>
              <h2>Захиалга алга</h2>
              <p>Энэ хэрэглэгч вэбээр захиалга хийгээгүй байна.</p>
            </div>
          ) : (
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Захиалга</th>
                  <th>Бараа</th>
                  <th>Төлбөр</th>
                  <th>Төлөв</th>
                  <th className={s.num}>Дүн</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className={s.nowrap}>
                      <Link href={`/order-detail/${o.id}`} className={s.link}>#{o.id}</Link>
                      <div className={s.small}>{fmtDate(o.createdAt)}</div>
                    </td>
                    <td>
                      <div className={s.clip}>
                        {o.firstItem || "—"}{o.itemCount > 1 ? ` + ${o.itemCount - 1}` : ""}
                      </div>
                      <div className={`${s.small} ${s.clip}`}>{o.deliveryType === "PICKUP" ? "Ирж авах" : "Хүргэлт"}{o.place ? ` · ${o.place}` : ""}</div>
                    </td>
                    <td className={s.nowrap}>
                      {o.payment ? (
                        <>
                          {providerLabel(o.payment.provider)}
                          {o.payment.status !== "COMPLETED" && <div><PaymentTag status={o.payment.status} /></div>}
                        </>
                      ) : <span className={s.muted}>—</span>}
                    </td>
                    <td><StatusPill status={o.status} /></td>
                    <td className={`${s.num} ${s.strong}`}>{money(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <aside className={s.col}>
          <section className={`${s.card} ${s.cardPad}`}>
            <h2 className={s.cardTitle}>Бүртгэл</h2>
            <dl className={s.rows}>
              <Row label="Нэр">{name || "Нэргүй"}</Row>
              <Row label="Утас">{user.telephone}</Row>
              {user.email && <Row label="И-мэйл">{user.email}</Row>}
              <Row label="Нэвтрэх">
                {[user.hasPassword ? "Нууц үг" : null, ...user.signIn.filter((p) => p !== "CREDENTIALS").map((p) => SIGN_IN[p] || p)]
                  .filter(Boolean).join(", ") || "SMS код"}
              </Row>
              <Row label="ID">{user.id}</Row>
            </dl>
          </section>

          <section className={`${s.card} ${s.cardPad}`}>
            <h2 className={s.cardTitle}>Хадгалсан хаяг</h2>
            {user.addresses.length === 0 ? (
              <p className={s.small} style={{ margin: 0 }}>Хаяг хадгалаагүй. Захиалга бүрийн хаяг тухайн захиалга дээрээ байгаа.</p>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {user.addresses.map((a) => (
                  <li key={a.id} style={{ padding: "10px 12px", borderRadius: 10, background: "#f9fafb" }}>
                    <div>{a.addressLine1}</div>
                    {a.addressLine2 && a.addressLine2 !== a.addressLine1 && <div>{a.addressLine2}</div>}
                    <div className={s.small}>{[a.country, a.city].filter(Boolean).join(", ")}{a.mobile ? ` · ${a.mobile}` : ""}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
