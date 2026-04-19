"use client";
import { loginSchema } from "@/schemas/userSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { login } from "@/components/auth/actions/login";

export const dynamic = "force-dynamic";

export default function Login() {
  const [mounted, setMounted] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [shake, setShake] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
    mode: "onSubmit",
  });

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  async function onSubmit(values) {
    setError("");
    startTransition(async () => {
      const result = await login(values);
      if (result?.error) {
        setError(result.error);
        setShake(true);
        setTimeout(() => setShake(false), 600);
      } else if (result?.success) {
        window.location.href = result.redirectTo || "/";
      }
    });
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        .scene {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #07070e;
          font-family: 'Outfit', sans-serif;
          -webkit-font-smoothing: antialiased;
          overflow: hidden;
          position: relative;
        }

        /* ── Orbs ── */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
        }
        .orb-a {
          width: 560px; height: 560px;
          background: radial-gradient(circle, rgba(79,70,229,0.18) 0%, transparent 70%);
          top: -15%; left: -10%;
          animation: floatA 18s ease-in-out infinite alternate;
        }
        .orb-b {
          width: 480px; height: 480px;
          background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%);
          bottom: -15%; right: -8%;
          animation: floatB 22s ease-in-out infinite alternate;
        }
        .orb-c {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%);
          top: 50%; left: 60%;
          animation: floatC 15s ease-in-out infinite alternate;
        }
        @keyframes floatA { 0%{transform:translate(0,0)} 100%{transform:translate(50px,60px)} }
        @keyframes floatB { 0%{transform:translate(0,0)} 100%{transform:translate(-40px,-50px)} }
        @keyframes floatC { 0%{transform:translate(0,0)} 100%{transform:translate(-60px,40px)} }

        /* ── Noise ── */
        .noise {
          position: absolute; inset: 0; pointer-events: none; z-index: 1;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
          background-size: 200px 200px;
        }

        /* ── Card ── */
        .card {
          position: relative;
          z-index: 10;
          width: 420px;
          padding: 48px 44px 44px;
          border-radius: 20px;
          background: rgba(255,255,255,0.035);
          backdrop-filter: blur(32px) saturate(140%);
          -webkit-backdrop-filter: blur(32px) saturate(140%);
          border: 1px solid rgba(255,255,255,0.07);
          box-shadow:
            0 0 0 0.5px rgba(255,255,255,0.04) inset,
            0 32px 100px -20px rgba(0,0,0,0.7),
            0 8px 32px rgba(0,0,0,0.4);
          opacity: 0;
          transform: translateY(24px) scale(0.97);
          transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1);
        }
        .card.visible { opacity: 1; transform: translateY(0) scale(1); }
        .card::before {
          content: '';
          position: absolute;
          top: 0; left: 25%; right: 25%; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
        }
        .card.shake { animation: shk 0.5s cubic-bezier(.36,.07,.19,.97); }
        @keyframes shk {
          15%,85%{transform:translateX(-3px)}
          30%,70%{transform:translateX(4px)}
          45%,55%{transform:translateX(-4px)}
          60%{transform:translateX(3px)}
        }

        /* ── Header ── */
        .card-icon {
          width: 44px; height: 44px;
          margin: 0 auto 28px;
          border-radius: 12px;
          background: rgba(99,102,241,0.15);
          border: 1px solid rgba(99,102,241,0.2);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transform: scale(0.6);
          transition: opacity 0.5s ease 0.25s, transform 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.25s;
        }
        .card.visible .card-icon { opacity: 1; transform: scale(1); }
        .card-icon svg { width: 20px; height: 20px; stroke: rgba(99,102,241,0.9); stroke-width: 1.6; fill: none; }

        .card-title {
          text-align: center;
          font-size: 24px;
          font-weight: 600;
          color: rgba(255,255,255,0.92);
          letter-spacing: -0.5px;
          margin-bottom: 6px;
          opacity: 0; transition: opacity 0.5s ease 0.35s;
        }
        .card.visible .card-title { opacity: 1; }

        .card-sub {
          text-align: center;
          font-size: 14px;
          font-weight: 400;
          color: rgba(255,255,255,0.28);
          margin-bottom: 36px;
          opacity: 0; transition: opacity 0.5s ease 0.42s;
        }
        .card.visible .card-sub { opacity: 1; }

        /* ── Fields ── */
        .fields { display: flex; flex-direction: column; gap: 14px; }

        .field-wrap {
          display: flex;
          flex-direction: column;
          gap: 7px;
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 0.45s ease, transform 0.45s ease;
        }
        .card.visible .field-wrap:nth-child(1) { opacity:1; transform:none; transition-delay: 0.5s; }
        .card.visible .field-wrap:nth-child(2) { opacity:1; transform:none; transition-delay: 0.6s; }

        .field-label {
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          padding-left: 2px;
        }

        .field-input-wrap { position: relative; }

        .field-input {
          width: 100%;
          height: 50px;
          padding: 0 16px;
          font-family: 'Outfit', sans-serif;
          font-size: 15px;
          font-weight: 400;
          /* Solid background — autofill can be perfectly matched */
          background: #111120 !important;
          color: #f0f0ff !important;
          -webkit-text-fill-color: #f0f0ff !important;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 12px;
          outline: none;
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
          caret-color: #818cf8;
        }
        .field-input::placeholder {
          color: rgba(255,255,255,0.2);
          -webkit-text-fill-color: rgba(255,255,255,0.2);
        }
        .field-input:hover {
          border-color: rgba(255,255,255,0.15);
        }
        .field-input:focus {
          border-color: rgba(99,102,241,0.55);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }
        .field-input.err {
          border-color: rgba(239,68,68,0.5);
        }
        .field-input.err:focus {
          box-shadow: 0 0 0 3px rgba(239,68,68,0.08);
        }
        /* ── Autofill override ── */
        .field-input:-webkit-autofill,
        .field-input:-webkit-autofill:hover,
        .field-input:-webkit-autofill:focus,
        .field-input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #111120 inset !important;
          -webkit-text-fill-color: #f0f0ff !important;
          caret-color: #818cf8 !important;
          border-color: rgba(99,102,241,0.35) !important;
          transition: background-color 9999s ease 9999s;
        }

        .pass-toggle {
          position: absolute;
          right: 14px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: rgba(255,255,255,0.22);
          display: flex; align-items: center;
          padding: 4px; border-radius: 6px;
          transition: color 0.2s;
        }
        .pass-toggle:hover { color: rgba(255,255,255,0.5); }
        .pass-toggle svg { width: 17px; height: 17px; stroke: currentColor; stroke-width: 1.7; fill: none; stroke-linecap: round; stroke-linejoin: round; }

        .field-err {
          font-size: 12px;
          color: rgba(239,68,68,0.8);
          padding-left: 2px;
          font-weight: 400;
        }

        /* ── Submit ── */
        .submit-wrap {
          margin-top: 26px;
          opacity: 0; transform: translateY(10px);
          transition: opacity 0.45s ease 0.7s, transform 0.45s ease 0.7s;
        }
        .card.visible .submit-wrap { opacity: 1; transform: none; }

        .submit-btn {
          width: 100%; height: 50px;
          font-family: 'Outfit', sans-serif;
          font-size: 15px; font-weight: 600;
          color: #fff; letter-spacing: 0.2px;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 60%, #7c3aed 100%);
          border: none; border-radius: 12px;
          cursor: pointer; position: relative; overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
        }
        .submit-btn::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 60%);
          pointer-events: none;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 36px rgba(99,102,241,0.35), 0 2px 10px rgba(99,102,241,0.2);
        }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.3; cursor: default; }
        .submit-btn.loading { color: transparent; pointer-events: none; }
        .spinner {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%,-50%);
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.25);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin { to { transform: translate(-50%,-50%) rotate(360deg); } }

        /* ── Global error ── */
        .global-err {
          font-size: 13px;
          color: rgba(239,68,68,0.85);
          text-align: center;
          margin-top: 14px;
          font-weight: 400;
          animation: fadeUp 0.3s ease;
        }
        @keyframes fadeUp { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:none; } }

        /* ── Footer ── */
        .foot {
          position: absolute; bottom: 24px; left: 0; right: 0;
          text-align: center;
          font-family: 'Outfit', sans-serif;
          font-size: 11px; color: rgba(255,255,255,0.08);
          letter-spacing: 0.6px; z-index: 5;
        }

        @media (max-width: 460px) {
          .card { width: calc(100% - 28px); padding: 40px 28px 36px; }
        }
      `}</style>

      <div className="scene">
        <div className="orb orb-a" />
        <div className="orb orb-b" />
        <div className="orb orb-c" />
        <div className="noise" />

        <div className={`card ${mounted ? "visible" : ""} ${shake ? "shake" : ""}`}>
          <div className="card-icon">
            <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>

          <div className="card-title">Welcome back</div>
          <div className="card-sub">Sign in to your dashboard</div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="fields">
              <div className="field-wrap">
                <label className="field-label">Email or Username</label>
                <div className="field-input-wrap">
                  <input
                    className={`field-input${errors.identifier ? " err" : ""}`}
                    type="text"
                    placeholder="admin@example.com"
                    autoComplete="username"
                    spellCheck="false"
                    autoFocus
                    {...register("identifier")}
                  />
                </div>
                {errors.identifier && (
                  <span className="field-err">{errors.identifier.message}</span>
                )}
              </div>

              <div className="field-wrap">
                <label className="field-label">Password</label>
                <div className="field-input-wrap">
                  <input
                    className={`field-input${errors.password ? " err" : ""}`}
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    style={{ paddingRight: 44 }}
                    {...register("password")}
                  />
                  <button
                    className="pass-toggle"
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPass(v => !v)}
                  >
                    {showPass ? (
                      <svg viewBox="0 0 24 24">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <span className="field-err">{errors.password.message}</span>
                )}
              </div>
            </div>

            <div className="submit-wrap">
              <button
                type="submit"
                className={`submit-btn${isPending ? " loading" : ""}`}
                disabled={isPending}
              >
                {isPending && <div className="spinner" />}
                Sign In
              </button>
            </div>

            {error && <div className="global-err">{error}</div>}
          </form>
        </div>

        <div className="foot">© 2026 AIM TRENDSETT LLC</div>
      </div>
    </>
  );
}
