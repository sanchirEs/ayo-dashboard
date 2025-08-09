"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function DeleteProductButton({ productId, onDeleted }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!productId) return;
    if (!confirm("Delete this product? This cannot be undone.")) return;

    setIsDeleting(true);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/product-actions/delete?id=${productId}`, {
          method: "POST",
        });
        if (res.redirected) {
          window.location.href = res.url;
          return;
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          alert(data?.message || "Delete failed");
          return;
        }
        if (typeof onDeleted === "function") {
          onDeleted();
        }
        router.refresh();
      } catch (e) {
        alert("Network error while deleting");
      } finally {
        setIsDeleting(false);
      }
    });
  };

  const disabled = isDeleting || isPending;

  return (
    <button
      type="button"
      className="item trash"
      onClick={handleDelete}
      title={disabled ? "Deleting..." : "Delete product"}
      style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
      disabled={disabled}
    >
      <i className={disabled ? "icon-loader" : "icon-trash-2"} />
    </button>
  );
}
