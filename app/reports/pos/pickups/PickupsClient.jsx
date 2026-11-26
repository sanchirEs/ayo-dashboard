"use client";

/**
 * Салбарын захиалга: one branch's website pickups. What is waiting on its shelf now (the same
 * list its till shows on Онлайн захиалга), what was handed over there in the date range, and
 * the prepaid (Урьдчилсан) pickups its till rang up. Read-only.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchPickupReport } from "@/lib/api/pickupReport";
import { ageText, ageTone, itemsText, matches, perDay, ubDate } from "@/lib/reports/pickupReport";
import { downloadBlob, exportWorkbook } from "@/lib/reports/exportXlsx";
import { useLocations, useToken } from "@/components/stock/shared";
import s from "./pickups.module.css";

const DAY_MS = 24 * 3600 * 1000;
const UB_MS = 8 * 3600 * 1000;
const ubToday = () => new Date(Date.now() + UB_MS).toISOString().slice(0, 10);
const shift = (date, days) => new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
const monthStart = (date) => `${date.slice(0, 8)}01`;
const fmt = (n) => Math.round(Number(n) || 0).toLocaleString("en-US");
const ubClock = (iso) => (iso ? new Date(Date.parse(iso) + UB_MS).toISOString().slice(11, 16) : "");
const ubShortDate = (iso) => {
  const d = ubDate(iso);
  return d ? `${d.slice(5, 7)}/${d.slice(8, 10)}` : "";
};

// [button label, from, to, how a sentence starts for that range]
function quickRanges() {
  const today = ubToday();
  const prevEnd = shift(monthStart(today), -1);
  return [
    ["Өнөөдөр", today, today, "Өнөөдөр"],
    ["Өчигдөр", shift(today, -1), shift(today, -1), "Өчигдөр"],
    ["7 хоног", shift(today, -6), today, "Сүүлийн 7 хоногт"],
    ["30 хоног", shift(today, -29), today, "Сүүлийн 30 хоногт"],
    ["Энэ сар", monthStart(today), today, "Энэ сард"],
    ["Өмнөх сар", monthStart(prevEnd), prevEnd, "Өмнөх сард"],
  ];
}

const TABS = [
  { key: "waiting", label: "Хүлээгдэж буй" },
  { key: "handedOver", label: "Олгосон" },
  { key: "prepaid", label: "Урьдчилсан" },
];

/** Counts towards `value` with an ease-out, so a new branch's numbers roll instead of jump. */
function useCountUp(value, ms = 650) {
  const [shown, setShown] = useState(value);
  const current = useRef(value);
  useEffect(() => {
    const target = Number(value) || 0;
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      current.current = target;
      setShown(target);
      return undefined;
    }
    const from = current.current;
    const start = performance.now();
    let raf;
    const step = (t) => {
      const p = Math.min(1, (t - start) / ms);
      const next = Math.round(from + (target - from) * (1 - (1 - p) ** 3));
      current.current = next;
      setShown(next);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return shown;
}

function N({ value }) {
  return <strong>{fmt(useCountUp(value))}</strong>;
}

function readLocationFromUrl() {
  if (typeof window === "undefined") return null;
  const id = Number(new URLSearchParams(window.location.search).get("location"));
  return Number.isInteger(id) && id > 0 ? id : null;
}

export default function PickupsClient() {
  const token = useToken();
  const { locations, error: locationsError } = useLocations(token);
  const branches = useMemo(() => locations.filter((l) => l.kind !== "TEST"), [locations]);

  const ranges = useMemo(quickRanges, []);
  const [locationId, setLocationId] = useState(null);
  const [from, setFrom] = useState(ranges[2][1]);
  const [to, setTo] = useState(ranges[2][2]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("waiting");
  const [direction, setDirection] = useState("fromRight");
  const [q, setQ] = useState("");
  const request = useRef(0);

  // The branch from ?location=, else the first one; kept in the URL so the page can be shared.
  useEffect(() => {
    if (locationId != null || branches.length === 0) return;
    const wanted = readLocationFromUrl();
    setLocationId(branches.some((b) => b.id === wanted) ? wanted : branches[0].id);
  }, [branches, locationId]);

  const pickBranch = (id) => {
    setLocationId(id);
    const url = new URL(window.location.href);
    url.searchParams.set("location", String(id));
    window.history.replaceState(null, "", url);
  };

  const load = useCallback(async () => {
    if (!token || locationId == null || !from || !to) return;
    const mine = ++request.current;
    setLoading(true);
    setError(null);
    try {
      const report = await fetchPickupReport({ locationId, from, to }, token);
      if (mine === request.current) setData(report);
    } catch (e) {
      if (mine === request.current) setError(e.message);
    } finally {
      if (mine === request.current) setLoading(false);
    }
  }, [token, locationId, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const pickTab = (key) => {
    const at = (k) => TABS.findIndex((t) => t.key === k);
    setDirection(at(key) >= at(tab) ? "fromRight" : "fromLeft");
    setTab(key);
  };

  const t = data?.totals;
  const rangeText = ranges.find(([, a, b]) => a === from && b === to)?.[3] ?? `${from} – ${to} хооронд`;
  const showingOther = data && data.location.id !== locationId;
  const branchName = branches.find((b) => b.id === locationId)?.name ?? data?.location.name ?? "";

  const rows = useMemo(() => {
    if (!data) return { waiting: [], handedOver: [], prepaid: [] };
    return {
      waiting: data.waiting.filter((r) => matches({ ...r, orderNo: String(r.orderId) }, q, ["orderNo", "phone", "customerName"])),
      handedOver: data.handedOver.filter((r) => matches({ ...r, orderNo: String(r.orderId) }, q, ["orderNo", "phone", "customerName", "handedBy"])),
      prepaid: data.prepaid.filter((r) => matches(r, q, ["saleNumber", "customerPhone", "transferPhone", "transferDescription", "cashierName"])),
    };
  }, [data, q]);

  const days = useMemo(() => (data ? perDay(from, to, data.handedOver, data.prepaid) : []), [data, from, to]);

  const exportExcel = () => {
    if (!data) return;
    const items = (r) => itemsText(r.items);
    const blob = exportWorkbook([
      {
        name: "Хүлээгдэж буй",
        columns: [
          { key: "orderId", header: "Захиалга" }, { key: "stageText", header: "Төлөв" }, { key: "customerName", header: "Захиалагч" },
          { key: "phone", header: "Утас" }, { key: "itemsText", header: "Бараа" }, { key: "orderTotal", header: "Дүн" },
          { key: "paidDate", header: "Төлсөн" }, { key: "daysWaiting", header: "Хүлээсэн хоног" }, { key: "branchText", header: "Салбар" },
        ],
        rows: data.waiting.map((r) => ({
          ...r, itemsText: items(r), stageText: r.stage === "READY" ? "Олгоход бэлэн" : "Импорт ирээгүй",
          paidDate: ubDate(r.paidAt ?? r.createdAt), branchText: r.noBranch ? "Сонгоогүй" : data.location.name,
        })),
      },
      {
        name: "Олгосон",
        columns: [
          { key: "handedDate", header: "Огноо" }, { key: "handedTime", header: "Цаг" }, { key: "orderId", header: "Захиалга" },
          { key: "customerName", header: "Захиалагч" }, { key: "phone", header: "Утас" }, { key: "itemsText", header: "Бараа" },
          { key: "orderTotal", header: "Дүн" }, { key: "handedBy", header: "Олгосон" }, { key: "viaText", header: "Хаанаас" },
          { key: "orderLocationName", header: "Захиалгын салбар" },
        ],
        rows: data.handedOver.map((r) => ({
          ...r, itemsText: items(r), handedDate: ubDate(r.handedAt), handedTime: ubClock(r.handedAt),
          viaText: r.via === "TILL" ? (r.registerName ?? "Касс") : "Самбар",
        })),
      },
      {
        name: "Урьдчилсан",
        columns: [
          { key: "date", header: "Огноо" }, { key: "time", header: "Цаг" }, { key: "saleNumber", header: "Баримт" },
          { key: "customerPhone", header: "Утас" }, { key: "itemsText", header: "Бараа" }, { key: "total", header: "Баримтын дүн" },
          { key: "prepaidAmount", header: "Урьдчилсан" }, { key: "otherAmount", header: "Бусад төлбөр" },
          { key: "transferDescription", header: "Гүйлгээний утга" }, { key: "transferAmount", header: "Шилжүүлсэн дүн" },
          { key: "cashierName", header: "Кассчин" }, { key: "statusText", header: "Төлөв" },
        ],
        rows: data.prepaid.map((r) => ({
          ...r, itemsText: items(r), date: ubDate(r.occurredAt), time: ubClock(r.occurredAt),
          statusText: r.status === "COMPLETED" ? "" : "Хүчингүй",
        })),
      },
    ]);
    downloadBlob(blob, `Салбарын захиалга ${data.location.name} ${from}_${to}.xlsx`.replace(/[\\/:*?"<>|]/g, " "));
  };

  return (
    <div className={s.page}>
      {(locationsError || error) && <div className={s.error} role="alert">{locationsError || error}</div>}

      <div className={s.branches} role="group" aria-label="Салбар">
        {branches.map((b) => (
          <button
            key={b.id}
            type="button"
            className={`${s.branch} ${b.id === locationId ? s.branchOn : ""}`}
            aria-pressed={b.id === locationId}
            onClick={() => pickBranch(b.id)}
          >
            {b.name}
            {b.kind === "PARTNER" && <span className={s.partnerTag}>харилцагч</span>}
          </button>
        ))}
      </div>

      <div className={s.head}>
        <div>
          <h2 className={s.title}>{branchName || "Салбар"}</h2>
          {t && !showingOther ? (
            <>
              <p className={s.sentence}>
                {t.readyCount === 0 ? (
                  "Авахыг хүлээж буй захиалга алга."
                ) : (
                  <>
                    <N value={t.readyCount} /> захиалга авахыг хүлээж байна
                    {t.overdueCount > 0 && (
                      <span className={s.warn}>, {t.overdueCount} нь 7 хоногоос удсан</span>
                    )}
                    .
                  </>
                )}
              </p>
              <p className={s.sub}>
                {rangeText}{" "}
                <N value={t.handedOverCount} /> захиалга олгож, <N value={t.prepaidCount} /> урьдчилсан захиалга өгсөн
                {t.waitingImportCount > 0 && <>. Импортын {t.waitingImportCount} захиалгын бараа ирээгүй байна</>}.
              </p>
            </>
          ) : (
            <p className={s.sub}>{loading ? "Ачаалж байна…" : "Салбараа сонгоно уу."}</p>
          )}
        </div>

        <div className={s.dates}>
          <div className={s.quick}>
            {ranges.map(([label, a, b]) => (
              <button
                key={label}
                type="button"
                className={`${s.chip} ${a === from && b === to ? s.chipOn : ""}`}
                aria-pressed={a === from && b === to}
                onClick={() => {
                  setFrom(a);
                  setTo(b);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <div className={s.dateInputs}>
            <input className={s.date} type="date" value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} aria-label="Эхлэх огноо" />
            –
            <input className={s.date} type="date" value={to} min={from} onChange={(e) => e.target.value && setTo(e.target.value)} aria-label="Дуусах огноо" />
          </div>
        </div>
      </div>

      {days.length > 1 && days.some((d) => d.handedOver + d.prepaid > 0) && <DayStrip days={days} />}

      <div className={s.tabsRow}>
        <div className={s.tabs} role="tablist" aria-label="Жагсаалт">
          {TABS.map((x) => (
            <button
              key={x.key}
              type="button"
              role="tab"
              aria-selected={tab === x.key}
              className={`${s.tab} ${tab === x.key ? s.tabOn : ""}`}
              onClick={() => pickTab(x.key)}
            >
              {x.label}
              <span className={s.count}>{data ? (q ? rows[x.key].length : data[x.key].length) : "–"}</span>
            </button>
          ))}
        </div>
        <div className={s.tools}>
          <input className={s.search} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Дугаар, утас, нэр" aria-label="Хайх" />
          <button type="button" className={s.ghost} onClick={exportExcel} disabled={!data || showingOther}>
            Excel
          </button>
        </div>
      </div>

      <div key={tab} role="tabpanel" className={`${s.panel} ${s[direction]} ${loading ? s.loading : ""}`} aria-busy={loading}>
        {data && tab === "waiting" && <WaitingList rows={rows.waiting} searching={Boolean(q)} />}
        {data && tab === "handedOver" && <HandedOverList rows={rows.handedOver} searching={Boolean(q)} rangeText={rangeText} />}
        {data && tab === "prepaid" && <PrepaidList rows={rows.prepaid} searching={Boolean(q)} rangeText={rangeText} />}
      </div>

      {data?.notes?.length > 0 && (
        <div className={s.notes}>
          {data.notes.map((n) => (
            <p key={n}>{n}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function DayStrip({ days }) {
  const max = Math.max(1, ...days.map((d) => d.handedOver + d.prepaid));
  const today = ubToday();
  const every = days.length <= 14 ? 1 : days.length <= 31 ? 3 : 7;
  return (
    <div className={s.strip}>
      <div className={s.stripLegend}>
        <span><i className={s.dot} style={{ background: "var(--handed)" }} />Олгосон</span>
        <span><i className={s.dot} style={{ background: "var(--prepaid)" }} />Урьдчилсан</span>
      </div>
      <div className={s.bars}>
        {days.map((d) => {
          const label = `${d.date}: ${d.handedOver} олгосон, ${d.prepaid} урьдчилсан`;
          return (
            <div key={d.date} className={`${s.day} ${d.date === today ? s.dayToday : ""}`} title={label} aria-label={label} role="img">
              <div className={s.dayBar}>
                <div className={s.seg} style={{ height: `${(d.handedOver / max) * 100}%`, background: "var(--handed)" }} />
                <div className={s.seg} style={{ height: `${(d.prepaid / max) * 100}%`, background: "var(--prepaid)" }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className={s.dayLabels} aria-hidden="true">
        {days.map((d, i) => (
          <span key={d.date} className={s.dayLabel}>
            {i % every === 0 || i === days.length - 1 ? `${Number(d.date.slice(5, 7))}/${Number(d.date.slice(8, 10))}` : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

function Empty({ title, children, art = "shelf" }) {
  return (
    <div className={s.empty}>
      <svg className={s.emptyArt} width="72" height="56" viewBox="0 0 72 56" fill="none" aria-hidden="true">
        <rect x="6" y="44" width="60" height="4" rx="2" fill="#e2e8f0" />
        {art === "shelf" ? (
          <>
            <rect x="16" y="22" width="18" height="22" rx="3" fill="#f7ecf3" stroke="#7b2d5e" strokeWidth="1.5" />
            <rect x="38" y="28" width="16" height="16" rx="3" fill="#f5f7fa" stroke="#94a3b8" strokeWidth="1.5" />
            <path d="M44 12l3 3 6-6" stroke="#15803d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </>
        ) : (
          <>
            <rect x="22" y="20" width="28" height="24" rx="3" fill="#f5f7fa" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />
            <path d="M30 32h12" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
          </>
        )}
      </svg>
      <strong>{title}</strong>
      {children && <span>{children}</span>}
    </div>
  );
}

function Who({ name, phone }) {
  const text = [name, phone].filter(Boolean).join(", ");
  return <div className={s.who}>{text || "Нэргүй захиалагч"}</div>;
}

function WaitingList({ rows, searching }) {
  if (rows.length === 0) {
    return searching ? (
      <Empty title="Хайлтад тохирох захиалга алга" art="none" />
    ) : (
      <Empty title="Бүх захиалга олгогдсон">Энэ салбарт авахыг хүлээж буй захиалга одоогоор алга.</Empty>
    );
  }
  const ready = rows.filter((r) => r.stage === "READY");
  const waiting = rows.filter((r) => r.stage === "WAITING");
  return (
    <>
      <div className={s.list}>{ready.map((r) => <WaitingTicket key={r.orderId} r={r} />)}</div>
      {waiting.length > 0 && (
        <>
          <div className={s.groupLabel}>Импортын бараа ирээгүй ({waiting.length})</div>
          <div className={s.list}>{waiting.map((r) => <WaitingTicket key={r.orderId} r={r} />)}</div>
        </>
      )}
    </>
  );
}

function WaitingTicket({ r }) {
  const tone = r.stage === "WAITING" ? "fresh" : ageTone(r.daysWaiting);
  return (
    <div className={s.ticket}>
      <div className={`${s.edge} ${tone === "aging" ? s.edgeAging : tone === "overdue" ? s.edgeOverdue : ""}`} />
      <div className={`${s.cell} ${s.whoCell}`}>
        <div>
          <span className={s.orderNo}>#{r.orderId}</span>
          <span className={s.badges}>
            {r.noBranch && <span className={s.badge} title="Захиалагч салбар сонгоогүй: аль ч салбараас авч болно">Салбар сонгоогүй</span>}
            {r.pinSentAt && <span className={s.badge} title={`PIN илгээсэн ${ubShortDate(r.pinSentAt)} ${ubClock(r.pinSentAt)}`}>PIN илгээсэн</span>}
            {r.stage === "WAITING" && <span className={`${s.badge} ${s.badgeAmber}`}>Ирээгүй</span>}
          </span>
        </div>
        <Who name={r.customerName} phone={r.phone} />
      </div>
      <div className={`${s.cell} ${s.items}`}>{itemsText(r.items)}</div>
      <div className={`${s.cell} ${s.money}`}>{fmt(r.orderTotal)}₮</div>
      <div
        className={`${s.cell} ${s.age} ${tone === "aging" ? s.ageAging : tone === "overdue" ? s.ageOverdue : ""}`}
        title={r.paidAt ? `Төлсөн ${ubDate(r.paidAt)}` : undefined}
      >
        {ageText(r.daysWaiting)}
      </div>
    </div>
  );
}

function HandedOverList({ rows, searching, rangeText }) {
  if (rows.length === 0) {
    return searching ? (
      <Empty title="Хайлтад тохирох захиалга алга" art="none" />
    ) : (
      <Empty title="Олгосон захиалга алга" art="none">
        {rangeText} энэ салбарт вэбсайтын захиалга олгоогүй. Хугацааг уртасгаж үзнэ үү.
      </Empty>
    );
  }
  return (
    <div className={s.list}>
      {rows.map((r) => (
        <div key={r.orderId} className={`${s.ticket} ${s.ticketDone}`}>
          <div className={`${s.edge} ${s.edgeHanded}`} />
          <div className={`${s.cell} ${s.time}`}>
            <b>{ubClock(r.handedAt)}</b>
            {ubShortDate(r.handedAt)}
          </div>
          <div className={`${s.cell} ${s.whoCell}`}>
            <div>
              <span className={s.orderNo}>#{r.orderId}</span>
              {r.otherBranch && (
                <span className={s.badges}>
                  <span className={`${s.badge} ${s.badgePlum}`} title="Захиалагч өөр салбар сонгосон ч энд ирж авсан">
                    {r.orderLocationName} сонгосон
                  </span>
                </span>
              )}
            </div>
            <Who name={r.customerName} phone={r.phone} />
          </div>
          <div className={`${s.cell} ${s.items}`}>{itemsText(r.items)}</div>
          <div className={`${s.cell} ${s.money}`}>{fmt(r.orderTotal)}₮</div>
          <div className={`${s.cell} ${s.byLine} ${s.byCell}`}>
            <b>{r.handedBy || "Тодорхойгүй"}</b>
            <div>{r.via === "TILL" ? (r.registerName ?? "Касс") : "Самбараас"}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PrepaidList({ rows, searching, rangeText }) {
  if (rows.length === 0) {
    return searching ? (
      <Empty title="Хайлтад тохирох баримт алга" art="none" />
    ) : (
      <Empty title="Урьдчилсан захиалга аваагүй" art="none">
        {rangeText} энэ салбарын касс Урьдчилсан төлбөрөөр баримт гаргаагүй.
      </Empty>
    );
  }
  return (
    <div className={s.list}>
      {rows.map((r) => (
        <div key={r.saleId} className={`${s.ticket} ${s.ticketDone}`} style={r.status !== "COMPLETED" ? { opacity: 0.55 } : undefined}>
          <div className={`${s.edge} ${s.edgePrepaid}`} />
          <div className={`${s.cell} ${s.time}`}>
            <b>{ubClock(r.occurredAt)}</b>
            {ubShortDate(r.occurredAt)}
          </div>
          <div className={`${s.cell} ${s.whoCell}`}>
            <div>
              <span className={s.orderNo}>{r.saleNumber}</span>
              <span className={s.badges}>
                {r.status !== "COMPLETED" && <span className={s.badge}>Хүчингүй</span>}
                {r.transferCount === 0 && <span className={`${s.badge} ${s.badgeAmber}`} title="Энэ баримтад холбогдсон дансны гүйлгээ олдсонгүй">Гүйлгээгүй</span>}
              </span>
            </div>
            <Who phone={r.customerPhone || r.transferPhone} />
          </div>
          <div className={`${s.cell} ${s.items}`}>{itemsText(r.items)}</div>
          <div className={`${s.cell} ${s.money}`}>
            {fmt(r.prepaidAmount)}₮
            {r.otherAmount !== 0 && <span className={s.moneySub}>+{fmt(r.otherAmount)}₮ бусад</span>}
          </div>
          <div className={`${s.cell} ${s.byLine} ${s.byCell}`}>
            <b title={r.transferDescription ?? undefined}>{r.transferDescription || "—"}</b>
            <div>{r.cashierName}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
