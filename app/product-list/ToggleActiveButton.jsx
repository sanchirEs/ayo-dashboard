"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function ToggleActiveButton({ productId, isActive: initialActive }) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(initialActive);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/product-actions/toggle-active?id=${productId}`, {
          method: "POST",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          console.error("Toggle failed:", data?.message);
          return;
        }
        const data = await res.json();
        setIsActive(data?.data?.isActive ?? !isActive);
        router.refresh();
      } catch (e) {
        console.error("Network error while toggling product status");
      }
    });
  };

  return (
    <button
      type="button"
      className="item"
      onClick={handleToggle}
      disabled={isPending}
      title={isActive ? "Идэвхгүй болгох" : "Идэвхжүүлэх"}
      style={{
        opacity: isPending ? 0.5 : 1,
        cursor: isPending ? "not-allowed" : "pointer",
        color: isActive ? "#10b981" : "#9ca3af",
      }}
    >
      <i className={isPending ? "icon-loader" : isActive ? "icon-eye" : "icon-eye-off"} />
    </button>
  );
}
