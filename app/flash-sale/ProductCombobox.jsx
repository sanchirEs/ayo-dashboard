"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { getDiscountableProducts } from "@/lib/api/discounts";
import { resolveImageUrl } from "@/lib/api/env";

export default function ProductCombobox({ value, onSelect }) {
  const { data: session } = useSession();
  const [allProducts, setAllProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  // Fetch all products once when token is available
  useEffect(() => {
    const token = session?.user?.accessToken;
    if (!token || allProducts.length > 0) return;
    setLoading(true);
    getDiscountableProducts(token)
      .then(setAllProducts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session?.user?.accessToken]);

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

  const filtered = query.trim()
    ? allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.sku.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : [];

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
          <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{value.name}</div>
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
          placeholder={loading ? "Бараа ачааллаж байна..." : "Нэр эсвэл SKU-аар хайх..."}
          disabled={loading}
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
          {filtered.length === 0 ? (
            <div style={{ padding: "10px 12px", color: "#9ca3af", fontSize: 13 }}>
              Бараа олдсонгүй
            </div>
          ) : (
            filtered.map((product) => (
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
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{product.name}</div>
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
