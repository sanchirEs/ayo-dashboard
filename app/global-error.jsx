"use client";

// Last-resort error page: renders its own <html>, so Tailwind/global CSS
// is not available here — inline styles only.
export default function GlobalError({ error, reset }) {
  return (
    <html lang="mn">
      <body
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "1rem",
        }}
      >
        <h2 style={{ marginBottom: "0.5rem" }}>Алдаа гарлаа</h2>
        <p style={{ color: "#666", marginBottom: "1.5rem" }}>
          Түр зуурын алдаа гарлаа. Дахин оролдоно уу.
        </p>
        <button
          onClick={() => reset()}
          style={{
            padding: "0.6rem 1.5rem",
            border: "1px solid #222",
            borderRadius: "4px",
            background: "#222",
            color: "#fff",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          Дахин оролдох
        </button>
      </body>
    </html>
  );
}
