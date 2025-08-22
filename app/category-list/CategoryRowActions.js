"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CategoryRowActions({ id, productCount = 0 }) {
  const router = useRouter();

  async function handleDelete() {
    // Enhanced confirmation message based on product count
    let confirmMessage = "Delete this category? This cannot be undone.";
    let forceDelete = false;
    
    if (productCount > 0) {
      confirmMessage = `This category contains ${productCount} product(s). Deleting it will remove all associated products as well. Are you sure you want to continue? This action cannot be undone.`;
      
      // For categories with products, offer force delete option
      const firstConfirm = confirm(confirmMessage);
      if (!firstConfirm) return;
      
      // Additional confirmation for force delete
      const forceConfirm = confirm(`⚠️ WARNING: This will permanently delete ${productCount} product(s) along with the category.\n\nThis action is irreversible. Are you absolutely sure?`);
      if (!forceConfirm) return;
      
      forceDelete = true;
    } else {
      const confirmed = confirm(confirmMessage);
      if (!confirmed) return;
    }
    
    try {
      // Add force parameter if needed
      const url = forceDelete ? `/api/category-actions/delete?id=${id}&force=true` : `/api/category-actions/delete?id=${id}`;
      
      const res = await fetch(url, {
        method: "POST",
      });
      
      if (res.redirected) {
        window.location.href = res.url;
        return;
      }
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        
        // Enhanced error handling for specific cases
        if (data?.message?.includes("products") || data?.message?.includes("cannot delete")) {
          alert(`Cannot delete category: ${data.message}\n\nPlease remove or reassign all products in this category before deleting.`);
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
      <Link href={`/edit-category/${id}`} className="item edit" title="Edit category">
        <i className="icon-edit-3" />
      </Link>
      <button 
        type="button" 
        className="item trash" 
        title={productCount > 0 ? `Delete category (${productCount} products will also be deleted)` : "Delete category"} 
        onClick={handleDelete}
      >
        <i className="icon-trash-2" />
      </button>
    </div>
  );
}


