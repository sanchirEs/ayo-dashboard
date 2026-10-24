"use client";

/**
 * Pieces for the till setup pages, on top of the partner pages' (colours, Button,
 * Table, ErrorText). Inline px styles on purpose: the Remos template sets
 * html{font-size:62.5%}, which shrinks every rem-based Tailwind size to two thirds.
 */

import { useEffect, useId, useRef } from "react";
import { C, inputStyle, labelStyle } from "@/components/partners/ui";

export { Button, C, ErrorText, Table, inputStyle, labelStyle } from "@/components/partners/ui";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A modal that behaves like one: named for screen readers, keeps Tab inside,
 * closes on Escape or a click outside, and hands focus back to whatever opened it.
 */
export function Dialog({ title, onClose, children, width = 480 }) {
  const titleId = useId();
  const panel = useRef(null);

  useEffect(() => {
    const opener = document.activeElement;
    const first = panel.current?.querySelector("[data-autofocus]") || panel.current?.querySelector(FOCUSABLE);
    first?.focus();
    return () => {
      if (opener && typeof opener.focus === "function") opener.focus();
    };
  }, []);

  const onKeyDown = (event) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const items = [...panel.current.querySelectorAll(FOCUSABLE)];
    if (items.length === 0) return;
    const [head, tail] = [items[0], items[items.length - 1]];
    if (event.shiftKey && document.activeElement === head) {
      event.preventDefault();
      tail.focus();
    } else if (!event.shiftKey && document.activeElement === tail) {
      event.preventDefault();
      head.focus();
    }
  };

  return (
    <div
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15,23,42,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 16,
        overscrollBehavior: "contain",
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
        style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          width: "100%",
          maxWidth: width,
          maxHeight: "calc(100vh - 32px)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: `1px solid ${C.line}` }}>
          <div id={titleId} className="body-title">
            {title}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Хаах"
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, lineHeight: 1, color: C.muted, width: 40, height: 40 }}
          >
            &times;
          </button>
        </div>
        <div style={{ padding: 18, overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

/**
 * A label tied to its control, with the hint before the mistake and the error
 * right under the field. `children` is a function that receives the props the
 * control must spread, so the label, hint and error stay connected.
 */
export function Field({ label, hint, error, children, style }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div style={style}>
      <label htmlFor={id} style={labelStyle}>
        {label}
      </label>
      {children({
        id,
        "aria-describedby": [hintId, errorId].filter(Boolean).join(" ") || undefined,
        "aria-invalid": error ? true : undefined,
        style: error ? { ...inputStyle, border: `1px solid ${C.red}` } : inputStyle,
      })}
      {hint && !error && (
        <div id={hintId} style={{ fontSize: 13, color: C.muted, marginTop: 5 }}>
          {hint}
        </div>
      )}
      {error && (
        <div id={errorId} style={{ fontSize: 13, color: C.red, marginTop: 5 }}>
          {error}
        </div>
      )}
    </div>
  );
}

/** A status chip: colour plus a word, never colour alone. */
export function Pill({ tone = "gray", children }) {
  const [bg, fg] = {
    gray: [C.grayBg, C.muted],
    green: [C.greenBg, C.green],
    amber: [C.amberBg, C.amber],
    red: [C.redBg, "#b91c1c"],
    blue: ["#dbeafe", "#1d4ed8"],
  }[tone];
  return (
    <span style={{ padding: "3px 10px", borderRadius: 999, backgroundColor: bg, color: fg, fontSize: 13, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

/** A white section with a heading, used to group one setting and its save button. */
export function Section({ title, description, actions, children }) {
  return (
    <section style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: 18, marginBottom: 16, backgroundColor: "#fff" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ maxWidth: 560 }}>
          <h3 style={{ fontSize: 17, fontWeight: 600, color: C.text, margin: 0 }}>{title}</h3>
          {description && <p style={{ fontSize: 14, color: C.muted, margin: "4px 0 0" }}>{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

/** "9 минутын өмнө" style age for a last-seen time. */
export function ago(iso, nowMs = Date.now()) {
  if (!iso) return null;
  const minutes = Math.max(0, Math.round((nowMs - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "саяхан";
  if (minutes < 60) return `${minutes} минутын өмнө`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} цагийн өмнө`;
  return `${Math.round(hours / 24)} өдрийн өмнө`;
}
