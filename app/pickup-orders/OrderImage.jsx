"use client";

import { resolveImageUrl } from "@/lib/api/env";

export default function OrderImage({ imageUrl, productName }) {
  const handleImageError = (e) => {
    e.target.src = "/images/products/1.png";
  };

  return (
    <div className="image no-bg">
      <img 
        src={imageUrl ? resolveImageUrl(imageUrl) : "/images/products/1.png"} 
        alt={productName || "Product"}
        onError={handleImageError}
      />
    </div>
  );
}
