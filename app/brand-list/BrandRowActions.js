"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function BrandRowActions({ id, productCount = 0, brandName }) {
  const router = useRouter();

  async function handleDelete() {
    let confirmMessage = "Delete this brand? This cannot be undone.";
    let forceDelete = false;
    
    if (productCount > 0) {
      confirmMessage = `This brand "${brandName}" is associated with ${productCount} product(s). Deleting it will remove the brand association from all products. Are you sure you want to continue? This action cannot be undone.`;
      
      const firstConfirm = confirm(confirmMessage);
      if (!firstConfirm) return;
      
      // Additional confirmation for force delete
      const forceConfirm = confirm(`⚠️ WARNING: This will remove "${brandName}" from ${productCount} product(s).\n\nThis action is irreversible. Are you absolutely sure?`);
      if (!forceConfirm) return;
      
      forceDelete = true;
    } else {
      const confirmed = confirm(confirmMessage);
      if (!confirmed) return;
    }
    
    try {
      const url = forceDelete ? `/api/brand-actions/delete?id=${id}&force=true` : `/api/brand-actions/delete?id=${id}`;
      
      const res = await fetch(url, {
        method: "POST",
      });
      
      if (res.redirected) {
        window.location.href = res.url;
        return;
      }
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        
        if (data?.message?.includes("products") || data?.message?.includes("cannot delete")) {
          alert(`Cannot delete brand: ${data.message}\n\nPlease remove the brand from all products before deleting.`);
        } else {
          alert(data?.message || "Delete failed");
        }
        return;
      }
      
      router.refresh();
    } catch (e) {
      alert("Network error while deleting");
    }
  }

  return (
    <div className="list-icon-function">
      <Link href={`/brand-detail/${id}`} className="item eye" title="View brand details">
        <i className="icon-eye" />
      </Link>
      <Link href={`/edit-brand/${id}`} className="item edit" title="Edit brand">
        <i className="icon-edit-3" />
      </Link>
      <button 
        type="button" 
        className="item trash" 
        title={productCount > 0 ? `Delete brand (${productCount} products will be updated)` : "Delete brand"} 
        onClick={handleDelete}
      >
        <i className="icon-trash-2" />
      </button>
    </div>
  );
}
