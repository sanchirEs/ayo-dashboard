"use client";
import { useState } from "react";
import { resolveImageUrl } from "@/lib/api/env";

export default function ProductImage({ product, size = 64 }) {
  const [imageSrc, setImageSrc] = useState(
    product.images && product.images.length > 0
      ? resolveImageUrl(product.images[0].url)
      : "/images/products/1.png"
  );

  const handleError = () => {
    setImageSrc("/images/products/1.png"); // Fallback to existing product image
  };

  return (
    <div
      className="image no-bg"
      style={{
        width: size,
        height: size,
        marginRight: 16,
        borderRadius: 8,
        overflow: "hidden",
        background: "#fff",
        border: "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <img
        src={imageSrc}
        crossOrigin="anonymous"
        alt={product.name}
        onError={handleError}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
  );
}