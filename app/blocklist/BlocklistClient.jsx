"use client";

/**
 * Customer blocklist.
 *
 * Entries are contact values rather than accounts, so an admin can block a
 * number before that person has ever registered. One input box takes either an
 * email or a phone — the backend infers which from the "@" and normalizes the
 * value, so "+976 9457-6068" and "94576068" cannot end up as two entries.
 *
 * Sizes are in px on purpose — the Remos template sets html{font-size:62.5%},
 * which shrinks every rem-based utility in this app to two thirds.
 */

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  listBlockedContacts,
  addBlockedContact,
  removeBlockedContact,
} from "@/lib/api/blocklist";

const PAGE_SIZE = 50;

const COL = {
  value: { flex: 1, minWidth: 0 },
  type: { width: "110px", flexShrink: 0 },
  reason: { flex: 1, minWidth: 0 },
  by: { width: "150px", flexShrink: 0 },
  date: { width: "150px", flexShrink: 0 },
  action: { width: "96px", flexShrink: 0 },
};

const TABS = [
  { key: "", label: "Бүгд" },
  { key: "PHONE", label: "Утас" },
  { key: "EMAIL", label: "И-мэйл" },
];

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("mn-MN", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export default function BlocklistClient() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    // The token arrives a tick after mount; fetching without it 401s and signs
    // the admin out, so wait for it rather than firing early.
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await listBlockedContacts({ search, type, page, pageSize: PAGE_SIZE }, token);
      setRows(data.rows || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err?.message || "Жагсаалт ачаалахад алдаа гарлаа");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [token, search, type, page]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    setFormError("");
    setNotice("");

    const trimmed = value.trim();
    if (!trimmed) {
      setFormError("Утасны дугаар эсвэл и-мэйл оруулна уу");
      return;
    }
    if (!token) {
      setFormError("Нэвтрэлт олдсонгүй. Хуудсаа сэргээгээд дахин оролдоно уу.");
      return;
    }

    setSaving(true);
    try {
      const created = await addBlockedContact({ value: trimmed, reason }, token);
      setValue("");
      setReason("");
      setNotice(`${created.value} блоклогдлоо.`);
      setPage(1);
      await load();
    } catch (err) {
      setFormError(err?.message || "Блоклоход алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  const unblock = async (row) => {
    if (!token) return;
    if (!window.confirm(`${row.value} — блокоос гаргах уу?`)) return;

    setError("");
    try {
      await removeBlockedContact(row.id, token);
      setNotice(`${row.value} блокоос гарлаа.`);
      await load();
    } catch (err) {
      setError(err?.message || "Блокоос гаргахад алдаа гарлаа");
    }
  };

  return (
    <>
      <div className="wg-box mb-20">
        <h5 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>
          Шинээр блоклох
        </h5>
        <p style={{ fontSize: "13px", color: "#6c757d", marginBottom: "14px" }}>
          Утасны дугаар эсвэл и-мэйл хаяг. Блоклосон хүн нэвтрэх, бүртгүүлэх,
          захиалга хийх боломжгүй болно. Бүртгэлгүй дугаарыг ч урьдчилан блоклож
          болно.
        </p>

        <form onSubmit={submit} className="flex gap10 flex-wrap items-start">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="94576068 эсвэл hello@example.com"
            style={{
              flex: "1 1 260px",
              height: "40px",
              padding: "0 12px",
              fontSize: "14px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          />
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Шалтгаан (заавал биш)"
            style={{
              flex: "1 1 260px",
              height: "40px",
              padding: "0 12px",
              fontSize: "14px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          />
          <button type="submit" className="tf-button style-1" disabled={saving}>
            {saving ? "Хадгалж байна..." : "Блоклох"}
          </button>
        </form>

        {formError && (
          <div style={{ fontSize: "13px", color: "#842029", marginTop: "10px" }}>{formError}</div>
        )}
        {notice && (
          <div style={{ fontSize: "13px", color: "#0f5132", marginTop: "10px" }}>{notice}</div>
        )}
      </div>

      <div className="wg-box">
        <div className="flex items-center justify-between gap10 flex-wrap mb-14">
          <div className="flex gap10 flex-wrap">
            {TABS.map((tab) => (
              <button
                key={tab.key || "all"}
                type="button"
                className={type === tab.key ? "tf-button style-1" : "tf-button"}
                onClick={() => {
                  setType(tab.key);
                  setPage(1);
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Хайх"
            style={{
              height: "40px",
              padding: "0 12px",
              fontSize: "14px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              minWidth: "220px",
            }}
          />
        </div>

        <div className="wg-table table-all-attribute">
          <ul className="table-title flex gap20 mb-14">
            <li style={COL.value}>
              <div className="body-title">Утас / И-мэйл</div>
            </li>
            <li style={COL.type}>
              <div className="body-title">Төрөл</div>
            </li>
            <li style={COL.reason}>
              <div className="body-title">Шалтгаан</div>
            </li>
            <li style={COL.by}>
              <div className="body-title">Блоклосон</div>
            </li>
            <li style={COL.date}>
              <div className="body-title">Огноо</div>
            </li>
            <li style={COL.action}>
              <div className="body-title">Үйлдэл</div>
            </li>
          </ul>

          {loading && (
            <div style={{ padding: "24px 0", fontSize: "14px", color: "#6c757d" }}>
              Ачаалж байна...
            </div>
          )}

          {!loading && error && (
            <div style={{ padding: "24px 0", fontSize: "14px", color: "#842029" }}>{error}</div>
          )}

          {!loading && !error && rows.length === 0 && (
            <div style={{ padding: "24px 0", fontSize: "14px", color: "#6c757d" }}>
              Блоклосон хэрэглэгч алга байна.
            </div>
          )}

          {!loading && !error && rows.length > 0 && (
            <ul className="flex flex-column">
              {rows.map((row) => (
                <li key={row.id} className="attribute-item flex items-center justify-between gap20">
                  <div style={COL.value}>
                    <div className="body-title-2">{row.value}</div>
                  </div>
                  <div style={COL.type}>
                    <div className="body-text">{row.type === "EMAIL" ? "И-мэйл" : "Утас"}</div>
                  </div>
                  <div style={COL.reason}>
                    <div className="body-text">{row.reason || "—"}</div>
                  </div>
                  <div style={COL.by}>
                    <div className="body-text">
                      {row.blockedBy?.username || row.blockedBy?.telephone || "—"}
                    </div>
                  </div>
                  <div style={COL.date}>
                    <div className="body-text">{formatDate(row.createdAt)}</div>
                  </div>
                  <div style={COL.action}>
                    <button type="button" className="tf-button" onClick={() => unblock(row)}>
                      Гаргах
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div
          className="flex items-center justify-between gap10 flex-wrap"
          style={{ marginTop: "16px" }}
        >
          <div style={{ fontSize: "13px", color: "#6c757d" }}>Нийт {total}</div>
          <div className="flex gap10">
            <button
              type="button"
              className="tf-button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Өмнөх
            </button>
            <div style={{ fontSize: "13px", color: "#6c757d", alignSelf: "center" }}>
              {page} / {totalPages}
            </div>
            <button
              type="button"
              className="tf-button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Дараах
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
