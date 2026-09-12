"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { blockUserById } from "@/lib/api/blocklist";

/**
 * Block a customer from the user table.
 *
 * One click writes an entry for both their phone and their email, because
 * blocking only one leaves the other as a way back in. The backend refuses
 * non-CUSTOMER accounts, so this cannot be used to lock out a colleague.
 *
 * Sizes are in px on purpose — the Remos template sets html{font-size:62.5%},
 * which shrinks every rem-based utility in this app.
 */
export default function BlockUserAction({ userId, username, telephone, email, role }) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState([]);

  // Staff and admin accounts are refused by the backend anyway; hiding the
  // button keeps the table from offering an action that always fails.
  if (role && role !== "CUSTOMER") return null;

  const close = () => {
    setOpen(false);
    setReason("");
    setError("");
    setBlocked([]);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Нэвтрэлт олдсонгүй. Хуудсаа сэргээгээд дахин оролдоно уу.");
      return;
    }

    setSaving(true);
    try {
      const rows = await blockUserById(userId, reason.trim() || undefined, token);
      setBlocked(rows.map((r) => r.value));
    } catch (err) {
      setError(err?.message || "Блоклоход алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        className="item"
        onClick={() => setOpen(true)}
        title="Блоклох"
        style={{ cursor: "pointer" }}
      >
        <i className="icon-slash" />
      </div>

      {open && (
        <div
          onClick={close}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "24px",
              width: "400px",
              maxWidth: "calc(100vw - 32px)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
            }}
          >
            <h5 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>
              Хэрэглэгчийг блоклох
            </h5>
            <p style={{ fontSize: "13px", color: "#6c757d", marginBottom: "16px" }}>
              {username || telephone || `#${userId}`}
              {email ? ` · ${email}` : ""}
            </p>

            {blocked.length > 0 ? (
              <>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#0f5132",
                    background: "#d1e7dd",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    marginBottom: "16px",
                  }}
                >
                  Блоклолоо: {blocked.join(", ")}. Энэ хүн нэвтрэх, захиалга хийх
                  боломжгүй боллоо.
                </div>
                <button
                  type="button"
                  onClick={close}
                  style={{
                    width: "100%",
                    height: "40px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#212529",
                    color: "#fff",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  Хаах
                </button>
              </>
            ) : (
              <form onSubmit={submit}>
                <p style={{ fontSize: "13px", color: "#6c757d", marginBottom: "12px" }}>
                  Энэ хэрэглэгчийн утас болон и-мэйл хоёуланг нь блоклоно.
                  Блокоос гаргах бол “Блоклосон жагсаалт” хуудсаар орно уу.
                </p>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Шалтгаан (заавал биш)"
                  autoFocus
                  style={{
                    width: "100%",
                    height: "40px",
                    padding: "0 12px",
                    fontSize: "14px",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    marginBottom: "12px",
                  }}
                />

                {error && (
                  <div style={{ fontSize: "13px", color: "#842029", marginBottom: "12px" }}>
                    {error}
                  </div>
                )}

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={close}
                    style={{
                      flex: 1,
                      height: "40px",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      background: "#fff",
                      fontSize: "14px",
                      cursor: "pointer",
                    }}
                  >
                    Болих
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      flex: 1,
                      height: "40px",
                      borderRadius: "8px",
                      border: "none",
                      background: "#dc3545",
                      color: "#fff",
                      fontSize: "14px",
                      cursor: saving ? "default" : "pointer",
                      opacity: saving ? 0.7 : 1,
                    }}
                  >
                    {saving ? "Блоклож байна..." : "Блоклох"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
