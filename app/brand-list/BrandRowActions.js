"use client";
import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import MergeBrandDialog from "./MergeBrandDialog";

const COMPACT = { width: 20, padding: 0, flexShrink: 0 };

export default function BrandRowActions({ id, productCount = 0, brandName }) {
  const router = useRouter();
  // The token comes from the session: this runs in a click handler's tree, where
  // the server-only token helper returns null and the backend answers 401.
  const { data: session } = useSession();
  const [merging, setMerging] = useState(false);
  // The brand routes are ADMIN / SUPERADMIN only; a 403 would also sign the user out.
  const canMerge = ["ADMIN", "SUPERADMIN"].includes(session?.user?.role);

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
    // Four icons overflow the template's 130px Actions column: `.list-icon-function
    // .item` makes each one 32px wide with a 20px gap. With merge shown the gap
    // tightens and the two buttons are 20px (the icon's own width) so nothing shrinks.
    <div className="list-icon-function" style={canMerge ? { gap: 14 } : undefined}>
      <Link href={`/brand-detail/${id}`} className="item eye" title="View brand details">
        <i className="icon-eye" />
      </Link>
      <Link href={`/edit-brand/${id}`} className="item edit" title="Edit brand">
        <i className="icon-edit-3" />
      </Link>
      {canMerge && (
        <button
          type="button"
          className="item"
          style={{ color: '#7c3aed', ...COMPACT }}
          title="Өөр брэндтэй нэгтгэх"
          aria-label={`${brandName} брэндийг нэгтгэх`}
          onClick={() => setMerging(true)}
        >
          <i className="icon-git-merge" />
        </button>
      )}
      <button 
        type="button" 
        className="item trash"
        style={canMerge ? COMPACT : undefined}
        title={productCount > 0 ? `Delete brand (${productCount} products will be updated)` : "Delete brand"} 
        onClick={handleDelete}
      >
        <i className="icon-trash-2" />
      </button>
      {merging &&
        createPortal(
          <MergeBrandDialog
            loser={{ id, name: brandName }}
            token={session?.user?.accessToken}
            onClose={(merged) => {
              setMerging(false);
              if (merged) router.refresh();
            }}
          />,
          document.body
        )}
    </div>
  );
}
