"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { setUserPassword } from "@/lib/api/adminUsers";

/**
 * Support unlock for customers who can't self-serve a password.
 *
 * The storefront's claim flow deliberately refuses accounts with order
 * history, and SMS-based password reset is down, so this is how those
 * customers get back in: they call in, staff sets a password here.
 *
 * Sizes are in px on purpose — the Remos template sets html{font-size:62.5%},
 * which shrinks every rem-based utility in this app.
 */
export default function SetPasswordAction({ userId, username, telephone }) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const close = () => {
    setOpen(false);
    setPassword("");
    setError("");
    setDone(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 4) {
      setError("Нууц үг дор хаяж 4 тэмдэгт байна");
      return;
    }
    if (!token) {
      setError("Нэвтрэлт олдсонгүй. Хуудсаа сэргээгээд дахин оролдоно уу.");
      return;
    }

    setSaving(true);
    const res = await setUserPassword(userId, password, token);
    setSaving(false);

    if (!res.success) {
      setError(res.message || "Нууц үг тохируулахад алдаа гарлаа");
      return;
    }
    setDone(true);
  };

  return (
    <>
      <div
        className="item"
        onClick={() => setOpen(true)}
        title="Нууц үг тохируулах"
        style={{ cursor: "pointer" }}
      >
        <i className="icon-lock" />
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
              width: "380px",
              maxWidth: "calc(100vw - 32px)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
            }}
          >
            <h5 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>
              Нууц үг тохируулах
            </h5>
            <p style={{ fontSize: "13px", color: "#6c757d", marginBottom: "16px" }}>
              {username || telephone || `#${userId}`}
            </p>

            {done ? (
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
                  Нууц үг тохирлоо. Хэрэглэгчид шинэ нууц үгээ мэдэгдэнэ үү.
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
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Шинэ нууц үг"
                  autoFocus
                  style={{
                    width: "100%",
                    height: "40px",
                    borderRadius: "8px",
                    border: "1px solid #dee2e6",
                    padding: "0 12px",
                    fontSize: "14px",
                    marginBottom: "12px",
                  }}
                />

                {error && (
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#842029",
                      background: "#f8d7da",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      marginBottom: "12px",
                    }}
                  >
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
                      border: "1px solid #dee2e6",
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
                      background: "#212529",
                      color: "#fff",
                      fontSize: "14px",
                      cursor: saving ? "default" : "pointer",
                      opacity: saving ? 0.6 : 1,
                    }}
                  >
                    {saving ? "Хадгалж байна..." : "Тохируулах"}
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
