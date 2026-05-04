"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { deleteStoreLocation } from "@/lib/api/storeLocations";

export default function StoreLocationRowActions({ id, name }) {
  const router = useRouter();
  const { data: session } = useSession();

  async function handleDelete() {
    if (!confirm(`"${name}" салбарыг устгах уу? Энэ үйлдлийг буцаах боломжгүй.`)) return;

    const token = session?.user?.accessToken || null;
    const result = await deleteStoreLocation(id, token);

    if (result.success) {
      router.refresh();
    } else {
      alert(result.message || "Устгахад алдаа гарлаа");
    }
  }

  return (
    <div className="list-icon-function">
      <Link href={`/store-locations/${id}/edit`} className="item edit" title="Засах">
        <i className="icon-edit-3" />
      </Link>
      <button type="button" className="item trash" title="Устгах" onClick={handleDelete}>
        <i className="icon-trash-2" />
      </button>
    </div>
  );
}
