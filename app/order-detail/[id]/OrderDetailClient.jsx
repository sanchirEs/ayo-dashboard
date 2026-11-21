"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { getOrderDetailsClient, formatPrice } from "@/lib/api/orders";
import { updateOrderStatusClient, cancelOrderClient } from "@/lib/api/orders-client";
import { resolveImageUrl } from "@/lib/api/env";
import { orderCargoTotal } from "@/lib/cargo/screens";
import s from "./order-detail.module.css";

// Same labels and colours as the order-list quick view, so a status reads the
// same on both screens.
const STATUS = {
  PENDING:          { label: "Хүлээгдэж байна",   dot: "#f59e0b", bg: "#fffbeb", text: "#92400e" },
  PROCESSING:       { label: "Баталгаажсан",      dot: "#3b82f6", bg: "#eff6ff", text: "#1e40af" },
  SHIPPED:          { label: "Илгээгдсэн",        dot: "#8b5cf6", bg: "#f5f3ff", text: "#5b21b6" },
  OUT_FOR_DELIVERY: { label: "Хүргэлтэд гарсан",  dot: "#f97316", bg: "#fff7ed", text: "#9a3412" },
  DELIVERED:        { label: "Хүргэгдсэн",        dot: "#10b981", bg: "#ecfdf5", text: "#065f46" },
  CANCELLED:        { label: "Цуцлагдсан",        dot: "#ef4444", bg: "#fef2f2", text: "#991b1b" },
  RETURNED:         { label: "Буцаалт",           dot: "#8b5cf6", bg: "#f5f3ff", text: "#5b21b6" },
  PICKED_UP:        { label: "Ирж авсан",         dot: "#06b6d4", bg: "#ecfeff", text: "#0e7490" },
};
const STATUS_ORDER = ["PENDING", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "PICKED_UP", "RETURNED", "CANCELLED"];

const PAYMENT_STATUS = {
  COMPLETED: { label: "Төлөгдсөн",        color: "#065f46", bg: "#ecfdf5" },
  PENDING:   { label: "Хүлээгдэж байна",  color: "#92400e", bg: "#fffbeb" },
  FAILED:    { label: "Амжилтгүй",        color: "#991b1b", bg: "#fef2f2" },
  EXPIRED:   { label: "Хугацаа дууссан",  color: "#4b5563", bg: "#f3f4f6" },
  CANCELLED: { label: "Цуцлагдсан",       color: "#991b1b", bg: "#fef2f2" },
};

const PROVIDER = {
  BANK_TRANSFER: "Дансны шилжүүлэг",
  QPAY: "QPay",
  STOREPAY: "StorePay",
  POCKET: "Pocket",
  STRIPE: "Карт (Stripe)",
};

const TIMELINE_LABEL = {
  ORDER_CREATED: "Захиалга үүссэн",
  PAYMENT_INITIATED: "Төлбөр эхэлсэн",
  PAYMENT_COMPLETED: "Төлбөр төлөгдсөн",
  PAYMENT_FAILED: "Төлбөр амжилтгүй",
  ORDER_SHIPPED: "Илгээсэн",
  ORDER_DELIVERED: "Хүргэгдсэн",
  ORDER_CANCELLED: "Цуцалсан",
};

const num = (v) => {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

function fmtDate(value, withTime = true) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const date = d.toLocaleDateString("en-CA", { timeZone: "Asia/Ulaanbaatar" }); // 2026-11-21
  if (!withTime) return date;
  const time = d.toLocaleTimeString("en-GB", { timeZone: "Asia/Ulaanbaatar", hour: "2-digit", minute: "2-digit" });
  return `${date} ${time}`;
}

function StatusPill({ status, large }) {
  const cfg = STATUS[status] || { label: status, dot: "#6b7280", bg: "#f3f4f6", text: "#374151" };
  return (
    <span className={large ? `${s.pill} ${s.pillLarge}` : s.pill} style={{ background: cfg.bg, color: cfg.text }}>
      <span className={s.pillDot} style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function Row({ label, children }) {
  return (
    <div className={s.row}>
      <dt>{label}</dt>
      <dd>{children ?? "—"}</dd>
    </div>
  );
}

// ── Status change ─────────────────────────────────────────────────────────────

function StatusControl({ order, token, onChanged }) {
  const [next, setNext] = useState(order.status);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => setNext(order.status), [order.status]);

  const changed = next !== order.status;

  async function save() {
    if (!changed || !token) return;
    if (next === "CANCELLED" && !window.confirm(`#${order.id} захиалгыг цуцлах уу? Буцаах боломжгүй.`)) return;
    setSaving(true);
    setMessage(null);
    const result = next === "CANCELLED"
      ? await cancelOrderClient(order.id, token)
      : await updateOrderStatusClient(order.id, next, token);
    setSaving(false);
    if (result.success) {
      setMessage({ ok: true, text: `Төлөв "${STATUS[next]?.label || next}" болсон.` });
      onChanged();
    } else {
      setMessage({ ok: false, text: `Төлөв солигдсонгүй: ${result.message || "алдаа гарлаа"}` });
    }
  }

  return (
    <div className={s.statusControl}>
      <label className={s.srOnly} htmlFor="order-status">Төлөв солих</label>
      <select
        id="order-status"
        className={s.select}
        value={next}
        onChange={(e) => { setNext(e.target.value); setMessage(null); }}
        disabled={saving}
      >
        {STATUS_ORDER.map((k) => (
          <option key={k} value={k}>{STATUS[k].label}</option>
        ))}
      </select>
      <button type="button" className={s.primaryBtn} onClick={save} disabled={!changed || saving || !token}>
        {saving ? "Хадгалж байна…" : "Төлөв солих"}
      </button>
      {message && (
        <p role="status" className={message.ok ? s.msgOk : s.msgErr}>{message.text}</p>
      )}
    </div>
  );
}

// ── Skeleton / empty states ──────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className={s.page} aria-busy="true" aria-label="Ачаалж байна">
      <div className={s.head}>
        <div className={`${s.sk} ${s.skTitle}`} />
        <div className={`${s.sk} ${s.skLine}`} />
      </div>
      <div className={s.grid}>
        <div className={s.card}><div className={`${s.sk} ${s.skBlock}`} /></div>
        <div className={s.card}><div className={`${s.sk} ${s.skBlock}`} /></div>
      </div>
    </div>
  );
}

function Notice({ title, body, action }) {
  return (
    <div className={s.notice}>
      <h2>{title}</h2>
      {body && <p>{body}</p>}
      <div className={s.noticeActions}>
        {action}
        <Link href="/order-list" className={s.ghostBtn}>Захиалгын жагсаалт</Link>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function OrderDetailClient({ orderId }) {
  const { data: session, status: sessionStatus } = useSession();
  const token = session?.user?.accessToken || null;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!orderId || !token) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getOrderDetailsClient(orderId, token);
      const order = result?.data?.order || (result?.data?.id ? result.data : null);
      if (result?.success && order) {
        setData({ order, timeline: result.data.timeline || [] });
      } else {
        setError(result?.message || "Захиалга олдсонгүй");
      }
    } catch (e) {
      setError(e?.message || "Захиалга ачааллахад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  }, [orderId, token]);

  useEffect(() => { load(); }, [load]);

  if (!orderId) {
    return <Notice title="Захиалгын дугаар буруу байна" body="Хаягийн төгсгөлд захиалгын дугаар байх ёстой, жишээ нь /order-detail/7017." />;
  }
  if (sessionStatus === "unauthenticated") {
    return <Notice title="Нэвтэрнэ үү" body="Захиалга харахын тулд дахин нэвтэрнэ үү." />;
  }
  if (error && !data) {
    return (
      <Notice
        title={`#${orderId} захиалгыг нээж чадсангүй`}
        body={error}
        action={<button type="button" className={s.primaryBtn} onClick={load}>Дахин ачаалах</button>}
      />
    );
  }
  if (!data) return <Skeleton />;

  return <OrderDetailView order={data.order} timeline={data.timeline} token={token} onChanged={load} />;
}

export function OrderDetailView({ order, timeline = [], token, onChanged }) {
  const items = order.orderItems || [];
  const isPickup = order.deliveryType === "PICKUP";
  const ship = order.shipping || {};
  const pay = order.payment || null;

  // Money. Goods + cargo + delivery − discount = total.
  const goods = items.reduce((sum, i) => sum + num(i.price) * (i.quantity || 0), 0);
  const cargo = orderCargoTotal(items);
  const delivery = num(order.shippingCost);
  const total = num(order.total);
  // Only a coupon explains a gap between the parts and the total; without one,
  // a gap is a data issue and must not be dressed up as a discount.
  const discount = order.couponId ? Math.max(0, Math.round(goods + cargo + delivery - total)) : 0;

  const paid = pay && pay.status === "COMPLETED" ? num(pay.amount) : 0;
  const gap = pay && pay.status === "COMPLETED" ? Math.round(paid - total) : null; // <0 short, >0 over
  const transfers = Array.isArray(pay?.providerData?.transfers) ? pay.providerData.transfers : [];
  const transferFormId = pay?.providerData?.transferFormId || null;

  const customerName = [order.user?.firstName, order.user?.lastName].filter(Boolean).join(" ").trim();
  const customerPhone = order.user?.telephone || null;
  const recipientPhone = ship.recipientPhone || null;

  const reserved = new Set(
    (order.inventoryReservations || [])
      .filter((r) => r.status === "RESERVED")
      .map((r) => `${r.productId}:${r.variantId ?? ""}`)
  );

  const events = [
    ...timeline.map((t) => ({
      at: t.timestamp,
      label: TIMELINE_LABEL[t.event] || t.description || t.event,
      note: t.event === "PAYMENT_INITIATED" && pay ? PROVIDER[pay.provider] || pay.provider : null,
      failed: t.status === "failed",
    })),
    order.packedAt && { at: order.packedAt, label: "Савласан" },
    order.pickupPinSentAt && { at: order.pickupPinSentAt, label: "Авах PIN илгээсэн" },
    order.pickedUpAt && { at: order.pickedUpAt, label: "Хэрэглэгч ирж авсан" },
  ]
    .filter(Boolean)
    .sort((a, b) => new Date(a.at) - new Date(b.at));

  const sagaFailed = order.sagas?.[0]?.status === "FAILED" ? order.sagas[0] : null;

  return (
    <div className={s.page}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className={s.head}>
        <div className={s.headMain}>
          <div>
            <h1 className={s.title}>
              Захиалга #{order.id}
              <StatusPill status={order.status} large />
            </h1>
            <p className={s.sub}>
              {fmtDate(order.createdAt)} · {isPickup ? "Ирж авах" : "Хүргэлт"}
              {!isPickup && ship.district ? ` · ${ship.district}` : ""}
              {isPickup && ship.pickupStoreName ? ` · ${ship.pickupStoreName}` : ""}
            </p>
          </div>
          <StatusControl order={order} token={token} onChanged={onChanged} />
        </div>
      </header>

      {sagaFailed && (
        <div className={s.alert} role="alert">
          <strong>Захиалгын процесс алдаатай зогссон.</strong> {sagaFailed.errorMessage || "Шалтгаан бүртгэгдээгүй."}
        </div>
      )}

      {/* ── Money strip: what is owed vs what came in ──────────── */}
      <section className={s.ledger} aria-label="Төлбөрийн тулгалт">
        <div className={s.ledgerCell}>
          <span className={s.ledgerLabel}>Захиалгын дүн</span>
          <span className={s.ledgerValue}>{formatPrice(total)}</span>
        </div>
        <div className={s.ledgerCell}>
          <span className={s.ledgerLabel}>Төлсөн</span>
          <span className={s.ledgerValue}>{pay ? formatPrice(paid) : "—"}</span>
          {pay && (
            <span className={s.ledgerNote}>
              {PROVIDER[pay.provider] || pay.provider}
              {pay.status !== "COMPLETED" && (
                <span
                  className={s.tag}
                  style={{ color: PAYMENT_STATUS[pay.status]?.color, background: PAYMENT_STATUS[pay.status]?.bg }}
                >
                  {PAYMENT_STATUS[pay.status]?.label || pay.status}
                </span>
              )}
            </span>
          )}
        </div>
        <div
          className={`${s.ledgerCell} ${gap === null ? "" : gap < 0 ? s.short : gap > 0 ? s.over : s.even}`}
        >
          <span className={s.ledgerLabel}>
            {gap === null ? "Үлдэгдэл" : gap < 0 ? "Дутуу төлсөн" : gap > 0 ? "Илүү төлсөн" : "Тулгалт"}
          </span>
          <span className={s.ledgerValue}>
            {gap === null ? formatPrice(total) : gap === 0 ? "Зөрүүгүй" : formatPrice(Math.abs(gap))}
          </span>
          {gap === null && <span className={s.ledgerNote}>Төлбөр төлөгдөөгүй</span>}
        </div>
      </section>

      <div className={s.grid}>
        {/* ── Left column ─────────────────────────────────────── */}
        <div className={s.col}>
          <section className={s.card}>
            <h2 className={s.cardTitle}>Бүтээгдэхүүн <span className={s.count}>{items.length}</span></h2>
            <ul className={s.items}>
              {items.map((item) => {
                const img = item.product?.ProductImages?.[0]?.imageUrl;
                const attrs = item.variant?.attributes || [];
                const sku = item.variant?.sku || item.product?.sku;
                const line = num(item.price) * (item.quantity || 0);
                const cargoLine = item.cargoOnTop ? num(item.cargoMnt) * (item.quantity || 0) : 0;
                const isReserved = reserved.has(`${item.productId}:${item.variantId ?? ""}`);
                return (
                  <li key={item.id} className={s.item}>
                    <img
                      className={s.thumb}
                      src={img ? resolveImageUrl(img) : "/images/products/1.png"}
                      alt=""
                      loading="lazy"
                      onError={(e) => { e.currentTarget.src = "/images/products/1.png"; }}
                    />
                    <div className={s.itemMain}>
                      <Link href={`/edit-product/${item.productId}`} className={s.itemName}>
                        {item.product?.name || "Бүтээгдэхүүн"}
                      </Link>
                      <div className={s.itemMeta}>
                        {attrs.map((a, i) => (
                          <span key={i}>{a.option?.attribute?.name}: {a.option?.value}</span>
                        ))}
                        {sku && <span className={s.sku}>{sku}</span>}
                        {isReserved && <span className={s.tag} style={{ color: "#1e40af", background: "#eff6ff" }}>Нөөцөлсөн</span>}
                        {item.importNote && <span>{item.importNote}</span>}
                      </div>
                    </div>
                    <div className={s.itemQty}>
                      {item.quantity} × {formatPrice(item.price)}
                      {cargoLine > 0 && <div className={s.itemCargo}>+ карго {formatPrice(cargoLine)}</div>}
                    </div>
                    <div className={s.itemTotal}>{formatPrice(line + cargoLine)}</div>
                  </li>
                );
              })}
            </ul>

            <dl className={s.totals}>
              <Row label="Бүтээгдэхүүн">{formatPrice(goods)}</Row>
              {cargo > 0 && <Row label="Карго">{formatPrice(cargo)}</Row>}
              {discount > 0 && <Row label="Хөнгөлөлт">−{formatPrice(discount)}</Row>}
              <Row label={isPickup ? "Хүргэлт (ирж авах)" : "Хүргэлт"}>{formatPrice(delivery)}</Row>
              <div className={s.grand}>
                <dt>Нийт</dt>
                <dd>{formatPrice(total)}</dd>
              </div>
            </dl>
          </section>

          <section className={s.card}>
            <h2 className={s.cardTitle}>Түүх</h2>
            {events.length === 0 ? (
              <p className={s.muted}>Бүртгэгдсэн үйлдэл алга.</p>
            ) : (
              <ol className={s.timeline}>
                {events.map((e, i) => (
                  <li key={i} className={e.failed ? s.tlFailed : undefined}>
                    <span className={s.tlDot} aria-hidden="true" />
                    <span className={s.tlLabel}>{e.label}{e.note ? ` — ${e.note}` : ""}</span>
                    <time className={s.tlTime} dateTime={e.at}>{fmtDate(e.at)}</time>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        {/* ── Right column ────────────────────────────────────── */}
        <aside className={s.col}>
          <section className={s.card}>
            <h2 className={s.cardTitle}>Хэрэглэгч</h2>
            <dl className={s.rows}>
              <Row label="Нэр">{customerName || "Нэргүй"}</Row>
              <Row label="Утас">
                {customerPhone ? <a href={`tel:${customerPhone}`} className={s.link}>{customerPhone}</a> : null}
              </Row>
              {order.user?.email && <Row label="И-мэйл">{order.user.email}</Row>}
              {order.userId && <Row label="Хэрэглэгчийн ID">{order.userId}</Row>}
            </dl>
          </section>

          <section className={s.card}>
            <h2 className={s.cardTitle}>{isPickup ? "Ирж авах" : "Хүргэлт"}</h2>
            <dl className={s.rows}>
              {isPickup ? (
                <>
                  <Row label="Салбар">{ship.pickupStoreName || "Сонгоогүй"}</Row>
                  {ship.addressLine1 && <Row label="Хаяг">{ship.addressLine1}</Row>}
                  <Row label="Авсан">{order.pickedUpAt ? fmtDate(order.pickedUpAt) : "Аваагүй"}</Row>
                </>
              ) : (
                <>
                  <Row label="Хаяг">
                    {ship.addressLine1 || ship.addressLine2 ? (
                      <>
                        {ship.addressLine1}
                        {ship.addressLine2 && ship.addressLine2 !== ship.addressLine1 && <><br />{ship.addressLine2}</>}
                      </>
                    ) : null}
                  </Row>
                  <Row label="Дүүрэг">{ship.district}</Row>
                  <Row label="Хүргэх огноо">{ship.estimatedDelivery ? fmtDate(ship.estimatedDelivery, false) : null}</Row>
                  {ship.trackingNumber && <Row label="Tracking">{ship.trackingNumber}</Row>}
                </>
              )}
              {recipientPhone && (
                <Row label="Хүлээн авагч">
                  <a href={`tel:${recipientPhone}`} className={s.link}>{recipientPhone}</a>
                </Row>
              )}
              <Row label="Савласан">{order.packedAt ? fmtDate(order.packedAt) : "Савлаагүй"}</Row>
            </dl>
          </section>

          <section className={s.card}>
            <h2 className={s.cardTitle}>Төлбөр</h2>
            {pay ? (
              <dl className={s.rows}>
                <Row label="Арга">{PROVIDER[pay.provider] || pay.provider}</Row>
                <Row label="Төлөв">
                  <span
                    className={s.tag}
                    style={{ color: PAYMENT_STATUS[pay.status]?.color, background: PAYMENT_STATUS[pay.status]?.bg }}
                  >
                    {PAYMENT_STATUS[pay.status]?.label || pay.status}
                  </span>
                </Row>
                <Row label="Дүн">{formatPrice(pay.amount)}</Row>
                <Row label="Огноо">{fmtDate(pay.createdAt)}</Row>
                {pay.failureReason && <Row label="Шалтгаан">{pay.failureReason}</Row>}
                {transferFormId && (
                  <Row label="Хүсэлт">
                    <Link href="/transfer-forms" className={s.link}>Шилжүүлгийн хүсэлт #{transferFormId}</Link>
                  </Row>
                )}
              </dl>
            ) : (
              <p className={s.muted}>Төлбөрийн бүртгэл алга.</p>
            )}

            {transfers.length > 0 && (
              <div className={s.transfers}>
                <h3 className={s.subTitle}>Шилжүүлгүүд</h3>
                <ul>
                  {transfers.map((t, i) => (
                    <li key={t.rowKey || i}>
                      <div className={s.transferTop}>
                        <span>{t.accountNumber || "Данс тодорхойгүй"}</span>
                        <strong>{formatPrice(t.amount)}</strong>
                      </div>
                      {t.description && <div className={s.transferDesc}>{t.description}</div>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
