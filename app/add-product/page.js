"use client";

import Layout from "@/components/layout/Layout";
import ProductForm from "@/components/product-form/ProductForm";
import { getBackendUrl } from "@/lib/api/env";
import { fetchWithAuthHandling } from "@/lib/api/fetch-with-auth";
import { addProductHierarchicalTags } from "@/lib/api/hierarchicalTags";
import toastManager from "@/lib/toast";

export default function AddProduct() {
  const createProduct = async (payload, { form, token }) => {
    const response = await fetchWithAuthHandling(
      `${getBackendUrl()}/api/v1/products/createproduct`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      "AddProduct.createProduct"
    );

    const data = await response.json();

    if (!response.ok) {
      return { ok: false, message: data.message || `Алдаа гарлаа (${response.status})` };
    }

    toastManager.success(data.message || "Бараа амжилттай нэмэгдлээ");

    // Hierarchical tags are a second request. If it fails the product still exists,
    // so report it plainly and name the product rather than swallowing the error
    // the way the old component did.
    const hierarchicalTagIds = form.getValues("hierarchicalTagIds") || [];
    if (hierarchicalTagIds.length > 0 && data.data?.id) {
      try {
        const ok = await addProductHierarchicalTags(
          data.data.id,
          { tagOptionIds: hierarchicalTagIds },
          token
        );
        if (!ok) throw new Error("rejected");
      } catch {
        toastManager.warning(
          `Бараа #${data.data.id} үүслээ, гэхдээ ангилал шошго нэмэгдсэнгүй. Барааны хуудаснаас дахин оролдоно уу.`,
          { title: "Ангилал шошго" }
        );
      }
    }

    return { ok: true, data: data.data };
  };

  return (
    <Layout breadcrumbTitleParent="Бараа" breadcrumbTitle="Бараа нэмэх" pageTitle="Бараа нэмэх">
      <ProductForm mode="create" onSubmit={createProduct} />
    </Layout>
  );
}
