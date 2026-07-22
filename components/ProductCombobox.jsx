"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { searchProducts } from "@/lib/api/discounts";
import { resolveImageUrl } from "@/lib/api/env";

const DEBOUNCE_MS = 250;

/** Marks a product that is hidden from the storefront. */
function InactiveBadge({ style }) {
  return (
    <span
      title="Энэ бараа дэлгүүрт харагдахгүй байна"
      style={{
        display: "inline-block",
        padding: "1px 6px",
        borderRadius: 4,
        background: "#f1f5f9",
        color: "#64748b",
        fontSize: 10,
        fontWeight: 600,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      Идэвхгүй
    </span>
  );
}

export default function ProductCombobox({ value, onSelect }) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);

  // The catalogue is far bigger than one page of /api/v1/products, so the
  // query goes to the backend rather than filtering a preloaded list.
  useEffect(() => {
    const trimmed = query.trim();
    if (!token || !trimmed) {
      setResults([]);
      setSearching(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setSearching(true);
    setError(null);

    const timer = setTimeout(() => {
      searchProducts(trimmed, token, controller.signal)
        .then((found) => {
          if (!controller.signal.aborted) setResults(found);
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setError("Хайлт амжилтгүй боллоо");
            setResults([]);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, DEBOUNCE_MS);

    // Supersede the previous keystroke's request instead of racing it.
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, token]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleMouseDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const handleSelect = (product) => {
    onSelect(product);
    setQuery("");
    setOpen(false);
  };

  const handleClear = () => {
    onSelect(null);
    setQuery("");
  };

  // If a product is already selected, show the confirmation card
  if (value) {
    return (
      <div
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          padding: "10px 12px",
          background: "#f8fafc",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        {value.images?.[0]?.url ? (
          <img
            src={resolveImageUrl(value.images[0].url)}
            alt={value.name}
            style={{ width: 48, height: 48, borderRadius: 6, objectFit: "cover", flexShrink: 0 }}
          />
        ) : (
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 6,
              background: "#e2e8f0",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94a3b8",
              fontSize: 20,
            }}
          >
            📦
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 14,
              color: "#111827",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {value.name}
            {value.isActive === false && <InactiveBadge />}
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
            SKU: {value.sku}
            {value.category ? ` · ${value.category.name}` : ""}
            {" · "}
            ₮{Number(value.price).toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: "#10b981", fontWeight: 600, marginTop: 2 }}>
            ✓ Сонгогдсон
          </div>
        </div>
        <button
          type="button"
          onClick={handleClear}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 20,
            color: "#9ca3af",
            lineHeight: 1,
            padding: "0 4px",
            flexShrink: 0,
          }}
          title="Арилгах"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          border: `1px solid ${open ? "#3b82f6" : "#e2e8f0"}`,
          borderRadius: 6,
          padding: "8px 12px",
          background: "white",
          gap: 8,
          transition: "border-color 0.15s",
        }}
      >
        <span style={{ color: "#9ca3af", fontSize: 14 }}>🔍</span>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Нэр эсвэл SKU-аар хайх..."
          style={{
            border: "none",
            outline: "none",
            width: "100%",
            fontSize: 14,
            color: "#374151",
            background: "transparent",
          }}
        />
      </div>

      {open && query.trim() && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: 6,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            zIndex: 50,
            maxHeight: 260,
            overflowY: "auto",
          }}
        >
          {searching ? (
            <div style={{ padding: "10px 12px", color: "#9ca3af", fontSize: 13 }}>
              Хайж байна...
            </div>
          ) : error ? (
            <div style={{ padding: "10px 12px", color: "#b91c1c", fontSize: 13 }}>
              {error}
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: "10px 12px", color: "#9ca3af", fontSize: 13 }}>
              Бараа олдсонгүй
            </div>
          ) : (
            results.map((product) => (
              <div
                key={product.id}
                onMouseDown={() => handleSelect(product)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 12px",
                  cursor: "pointer",
                  borderBottom: "1px solid #f8fafc",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
              >
                {product.images?.[0]?.url ? (
                  <img
                    src={resolveImageUrl(product.images[0].url)}
                    alt={product.name}
                    style={{ width: 32, height: 32, borderRadius: 4, objectFit: "cover", flexShrink: 0 }}
                  />
                ) : (
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 4,
                      background: "#f1f5f9",
                      flexShrink: 0,
                    }}
                  />
                )}
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#111827",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {product.name}
                    {product.isActive === false && <InactiveBadge />}
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>
                    SKU: {product.sku} · ₮{Number(product.price).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
