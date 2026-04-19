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

  const { register, handleSubmit, formState: { errors }, watch } =
    useForm({
      resolver: zodResolver(loginSchema),
      defaultValues: { identifier: "", password: "" },
      mode: "onSubmit",
    });

  const identifier = watch("identifier");
  const password = watch("password");

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
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }

        .scene {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0a0a0f;
          font-family: 'Plus Jakarta Sans', sans-serif;
          -webkit-font-smoothing: antialiased;
          overflow: hidden;
          position: relative;
        }

        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.5;
          will-change: transform;
        }
        .orb-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, #1a3a5c 0%, #0d1f3c 40%, transparent 70%);
          top: -10%; left: -8%;
          animation: drift1 14s ease-in-out infinite alternate;
        }
        .orb-2 {
          width: 450px; height: 450px;
          background: radial-gradient(circle, #2d1b4e 0%, #1a0e30 40%, transparent 70%);
          bottom: -12%; right: -6%;
          animation: drift2 16s ease-in-out infinite alternate;
        }
        .orb-3 {
          width: 350px; height: 350px;
          background: radial-gradient(circle, #0e2a3d 0%, #091a28 40%, transparent 70%);
          top: 40%; left: 55%;
          animation: drift3 18s ease-in-out infinite alternate;
        }
        .orb-4 {
          width: 250px; height: 250px;
          background: radial-gradient(circle, rgba(100,140,200,0.15) 0%, transparent 70%);
          top: 15%; right: 20%;
          animation: drift4 12s ease-in-out infinite alternate;
        }

        @keyframes drift1 { 0%{transform:translate(0,0) scale(1)} 100%{transform:translate(60px,40px) scale(1.15)} }
        @keyframes drift2 { 0%{transform:translate(0,0) scale(1)} 100%{transform:translate(-50px,-30px) scale(1.1)} }
        @keyframes drift3 { 0%{transform:translate(0,0) scale(1)} 100%{transform:translate(-40px,50px) scale(0.9)} }
        @keyframes drift4 { 0%{transform:translate(0,0) scale(1)} 100%{transform:translate(30px,-40px) scale(1.2)} }

        .noise {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 256px 256px;
          pointer-events: none;
          z-index: 1;
        }

        .grid-lines {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
          z-index: 1;
        }

        .card {
          width: 400px;
          position: relative;
          z-index: 10;
          padding: 52px 44px 44px;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(24px) saturate(150%);
          -webkit-backdrop-filter: blur(24px) saturate(150%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow:
            0 0 0 0.5px rgba(255,255,255,0.06) inset,
            0 24px 80px -12px rgba(0, 0, 0, 0.5),
            0 4px 20px rgba(0, 0, 0, 0.3);
          opacity: 0;
          transform: translateY(20px) scale(0.97);
          transition: opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1);
        }
        .card.visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        .card.shake {
          animation: cardShake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }

        @keyframes cardShake {
          10%,90%{transform:translateX(-2px)}
          20%,80%{transform:translateX(3px)}
          30%,50%,70%{transform:translateX(-4px)}
          40%,60%{transform:translateX(4px)}
        }

        .card::before {
          content: '';
          position: absolute;
          top: 0; left: 20%; right: 20%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          border-radius: 50%;
        }

        .icon-wrap {
          width: 52px; height: 52px;
          margin: 0 auto 32px;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
          border: 1px solid rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transform: scale(0.7);
          transition: all 0.6s cubic-bezier(0.34,1.56,0.64,1);
          transition-delay: 0.3s;
        }
        .card.visible .icon-wrap {
          opacity: 1;
          transform: scale(1);
        }
        .icon-wrap svg {
          width: 22px; height: 22px;
          stroke: rgba(255,255,255,0.45);
          stroke-width: 1.5;
          fill: none;
        }

        .heading {
          text-align: center;
          margin-bottom: 8px;
          font-size: 22px;
          font-weight: 600;
          color: rgba(255,255,255,0.9);
          letter-spacing: -0.4px;
          opacity: 0;
          transition: opacity 0.6s ease;
          transition-delay: 0.4s;
        }
        .card.visible .heading { opacity: 1; }

        .subheading {
          text-align: center;
          font-size: 13.5px;
          font-weight: 400;
          color: rgba(255,255,255,0.3);
          margin-bottom: 36px;
          letter-spacing: 0.2px;
          opacity: 0;
          transition: opacity 0.6s ease;
          transition-delay: 0.5s;
        }
        .card.visible .subheading { opacity: 1; }

        .divider {
          width: 40px;
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin: 0 auto 32px;
          opacity: 0;
          transition: opacity 0.5s ease;
          transition-delay: 0.45s;
        }
        .card.visible .divider { opacity: 1; }

        .field {
          position: relative;
          margin-bottom: 18px;
          opacity: 0;
          transform: translateY(8px);
          transition: all 0.5s ease;
        }
        .card.visible .field-1 { opacity:1; transform:translateY(0); transition-delay:0.55s; }
        .card.visible .field-2 { opacity:1; transform:translateY(0); transition-delay:0.65s; }

        .field input {
          width: 100%;
          height: 54px;
          padding: 20px 16px 8px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14.5px;
          font-weight: 500;
          color: #ffffff;
          -webkit-text-fill-color: #ffffff;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          outline: none;
          transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
          caret-color: #6b8afd;
        }
        .field input::placeholder { color: transparent; }
        .field input:-webkit-autofill,
        .field input:-webkit-autofill:hover,
        .field input:-webkit-autofill:focus {
          -webkit-text-fill-color: #ffffff;
          -webkit-box-shadow: 0 0 0 1000px rgba(30,30,50,0.95) inset;
          transition: background-color 5000s ease-in-out 0s;
        }

        .field input:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.12);
        }
        .field input:focus {
          background: rgba(255,255,255,0.06);
          border-color: rgba(107,138,253,0.5);
          box-shadow: 0 0 0 3px rgba(107,138,253,0.1), 0 0 20px rgba(107,138,253,0.05);
        }
        .field input.has-error {
          border-color: rgba(255,107,107,0.4);
        }
        .field input.has-error:focus {
          border-color: rgba(255,107,107,0.6);
          box-shadow: 0 0 0 3px rgba(255,107,107,0.08);
        }

        .field label {
          position: absolute;
          left: 17px;
          top: 17px;
          font-size: 14px;
          color: rgba(255,255,255,0.25);
          pointer-events: none;
          transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
          font-weight: 400;
        }

        .field input:focus + label,
        .field input:not(:placeholder-shown) + label,
        .field input:-webkit-autofill + label {
          top: 8px;
          font-size: 10px;
          color: rgba(107,138,253,0.7);
          letter-spacing: 0.5px;
          font-weight: 500;
          text-transform: uppercase;
        }
        .field input.has-error:focus + label,
        .field input.has-error:not(:placeholder-shown) + label,
        .field input.has-error:-webkit-autofill + label {
          color: rgba(255,107,107,0.7);
        }

        .field-err {
          font-size: 11.5px;
          color: rgba(255,107,107,0.7);
          margin-top: 6px;
          padding-left: 4px;
          font-weight: 400;
        }

        .pass-toggle {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(255,255,255,0.2);
          padding: 4px;
          display: flex;
          border-radius: 8px;
          transition: color 0.2s;
        }
        .pass-toggle:hover { color: rgba(255,255,255,0.4); }
        .pass-toggle svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }

        .submit-wrap {
          margin-top: 28px;
          opacity: 0;
          transform: translateY(8px);
          transition: all 0.5s ease;
          transition-delay: 0.75s;
        }
        .card.visible .submit-wrap { opacity:1; transform:translateY(0); }

        .submit-btn {
          width: 100%;
          height: 52px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14.5px;
          font-weight: 600;
          color: white;
          background: linear-gradient(135deg, #6b8afd 0%, #5a6ff0 50%, #7c5ce7 100%);
          border: none;
          border-radius: 14px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
          letter-spacing: 0.2px;
        }
        .submit-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 50%);
          pointer-events: none;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 30px rgba(107,138,253,0.3), 0 2px 8px rgba(107,138,253,0.2);
        }
        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 2px 10px rgba(107,138,253,0.2);
        }
        .submit-btn:disabled {
          opacity: 0.25;
          cursor: default;
        }
        .submit-btn.loading {
          color: transparent;
          pointer-events: none;
        }

        .spinner {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%,-50%);
          width: 20px; height: 20px;
          border: 2px solid rgba(255,255,255,0.25);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.65s linear infinite;
        }
        @keyframes spin { to { transform:translate(-50%,-50%) rotate(360deg); } }

        .err {
          text-align: center;
          font-size: 13px;
          color: #ff6b6b;
          margin-top: 14px;
          opacity: 0;
          animation: fadeIn 0.3s ease forwards;
          font-weight: 400;
        }
        @keyframes fadeIn { to { opacity:1; } }


        .foot {
          position: absolute;
          bottom: 28px;
          left: 0; right: 0;
          text-align: center;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 11px;
          color: rgba(255,255,255,0.1);
          letter-spacing: 0.5px;
          z-index: 5;
        }

        @media (max-width: 440px) {
          .card {
            width: calc(100% - 24px);
            padding: 40px 28px 36px;
            border-radius: 20px;
          }
        }
      `}</style>

      <div className="scene">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="orb orb-4" />
        <div className="noise" />
        <div className="grid-lines" />

        <div className={`card ${mounted ? "visible" : ""} ${shake ? "shake" : ""}`}>
          <div className="icon-wrap">
            <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <div className="heading">Welcome back</div>
          <div className="subheading">Sign in to your dashboard</div>
          <div className="divider" />

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="field field-1">
              <input
                type="text"
                placeholder=" "
                className={errors.identifier ? "has-error" : ""}
                autoComplete="username"
                spellCheck="false"
                autoFocus
                {...register("identifier")}
              />
              <label>Email or Username</label>
            </div>
            {errors.identifier && (
              <div className="field-err">{errors.identifier.message}</div>
            )}

            <div className="field field-2">
              <input
                type={showPass ? "text" : "password"}
                placeholder=" "
                className={errors.password ? "has-error" : ""}
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
                {...register("password")}
              />
              <label>Password</label>
              <button
                className="pass-toggle"
                onClick={() => setShowPass(!showPass)}
                tabIndex={-1}
                type="button"
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
              <div className="field-err">{errors.password.message}</div>
            )}

            {error && <div className="err">{error}</div>}

            <div className="submit-wrap">
              <button
                type="submit"
                className={`submit-btn ${isPending ? "loading" : ""}`}
                disabled={!identifier?.trim() || !password?.trim()}
              >
                {isPending && <div className="spinner" />}
                Sign In
              </button>
            </div>
          </form>

        </div>

        <div className="foot">© 2026 AIM TRENDSETT LLC</div>
      </div>
    </>
  );
}
