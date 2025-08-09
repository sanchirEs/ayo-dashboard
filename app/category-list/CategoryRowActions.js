"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CategoryRowActions({ id }) {
  const router = useRouter();

  async function handleDelete() {
    const confirmed = confirm("Delete this category? This cannot be undone.");
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/category-actions/delete?id=${id}`, {
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
      <button type="button" className="item trash" title="Delete category" onClick={handleDelete}>
        <i className="icon-trash-2" />
      </button>
    </div>
  );
}


