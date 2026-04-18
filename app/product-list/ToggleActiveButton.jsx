"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function ToggleActiveButton({ productId, isActive: initialActive, onToggle }) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(initialActive);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
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
        const newActive = data?.data?.isActive ?? !isActive;
        setIsActive(newActive);
        onToggle?.(newActive);
        router.refresh();
      } catch (e) {
        console.error("Network error while toggling product status");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      title={isActive ? "Идэвхгүй болгох" : "Идэвхжүүлэх"}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        cursor: isPending ? 'not-allowed' : 'pointer',
        background: 'none',
        border: 'none',
        padding: '4px',
        borderRadius: '4px',
        opacity: isPending ? 0.6 : 1,
        transition: 'opacity 0.15s',
      }}
      aria-label={isActive ? "Идэвхгүй болгох" : "Идэвхжүүлэх"}
      aria-pressed={isActive}
    >
      {/* Toggle track */}
      <span
        style={{
          position: 'relative',
          display: 'inline-block',
          width: 36,
          height: 20,
          borderRadius: 10,
          backgroundColor: isPending ? '#d1d5db' : isActive ? '#10b981' : '#d1d5db',
          transition: 'background-color 0.22s cubic-bezier(0.4,0,0.2,1)',
          flexShrink: 0,
        }}
      >
        {/* Toggle thumb */}
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: isActive ? 18 : 2,
            width: 16,
            height: 16,
            borderRadius: '50%',
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
            transition: 'left 0.22s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </span>
    </button>
  );
}
