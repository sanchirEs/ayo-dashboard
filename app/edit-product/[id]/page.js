"use client";

import { use, useCallback, useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import ProductForm from "@/components/product-form/ProductForm";
import GetToken from "@/lib/GetTokenClient";
import { getBackendUrl } from "@/lib/api/env";
import { fetchWithAuthHandling } from "@/lib/api/fetch-with-auth";
import { getProductById } from "@/lib/api/products";
import {
  getProductHierarchicalTags,
  replaceProductHierarchicalTags,
} from "@/lib/api/hierarchicalTags";
import { normalizeLoadedVariants } from "@/lib/products/variantNormalization";
import { PRODUCT_FORM_DEFAULTS } from "@/lib/products/productFormDefaults";
import toastManager from "@/lib/toast";

/**
 * Map an API product onto the shape ProductForm's defaultValues expect.
 *
 * Kept as a pure function so the mapping is readable on its own: this is the only
 * place edit mode differs from create mode in terms of data.
 */
function toInitialValues(product, hierarchicalTags) {
  // The API returns categories in three different shapes depending on endpoint.
  let categoryIds = [];
  if (Array.isArray(product.categories)) {
    categoryIds = product.categories
      .map((cat) => cat.category?.id ?? cat.categoryId ?? cat.id)
      .filter(Boolean);
  } else if (Array.isArray(product.categoryIds)) {
    categoryIds = product.categoryIds;
  } else if (product.categoryId) {
    categoryIds = [product.categoryId];
  }

  // normalizeLoadedVariants flattens the nested attribute join rows to
  // { attributeId, optionId } pairs and guarantees exactly one isDefault. Without
  // it the form fails its own "one default variant" check and the save 400s.
  const loadedVariants = normalizeLoadedVariants(product.variants).map((v) => ({
    ...v,
    id: v.id,
    price: Number(v.price || 0),
    inventory: { quantity: Number(v.inventory?.quantity || 0) },
    images: (v.images || []).map((img) => ({
      imageUrl: img.imageUrl || img.url || img,
      altText: img.altText || product.name || "Барааны зураг",
      isPrimary: img.isPrimary || false,
    })),
  }));

  // A product is only treated as variant-based when it has more than one, matching
  // the old page: a single variant is how simple products are stored.
  const hasVariants = loadedVariants.length > 1;

  const firstVariant = product.variants?.[0];
  const price = firstVariant ? Number(firstVariant.price) : Number(product.price || 0);
  const quantity = firstVariant?.inventory?.quantity ?? product.stock ?? 0;

  // altText must be non-empty — imageSchema requires min(1) and would otherwise
  // reject the untouched product on save.
  const images = (product.ProductImages || product.images || []).map((img, index) => ({
    imageUrl: img.imageUrl || img.url,
    altText: img.altText || img.alt || product.name || "Барааны зураг",
    isPrimary: img.isPrimary ?? index === 0,
  }));

  const tags = Array.isArray(product.tags)
    ? product.tags.map((t) => (typeof t === "string" ? t : t.tag)).filter(Boolean)
    : [];

  return {
    ...PRODUCT_FORM_DEFAULTS,
    name: product.name || "",
    description: product.description || "",
    howToUse: product.howToUse || "",
    ingredients: product.ingredients || "",
    sku: product.sku || "",
    categoryIds,
    brandId: (product.brand?.id ?? product.brandId ?? "").toString(),
    price: price.toString(),
    quantity: quantity.toString(),
    productMode: hasVariants ? "variants" : "simple",
    variants: hasVariants ? loadedVariants : [],
    specs: Array.isArray(product.specs)
      ? product.specs.map((s) => ({ type: s.type || "", value: s.value || "" }))
      : [],
    tags,
    hierarchicalTagIds: (hierarchicalTags?.tagOptions || []).map((t) => t.id),
    images,
    flashSale: product.flashSale || false,
    flashSaleEndDate: product.flashSaleEndDate || "",
    discountId: product.discountId?.toString() || "",
    promotionId: product.promotionId?.toString() || "",
  };
}

export default function EditProductPage({ params }) {
  const resolved = use(params);
  const id = Number(resolved?.id);
  const token = GetToken();

  const [initialValues, setInitialValues] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!token || !Number.isFinite(id)) return;

    let cancelled = false;

    (async () => {
      try {
        const [product, hierarchicalTags] = await Promise.all([
          getProductById(id, token),
          getProductHierarchicalTags(id).catch(() => null),
        ]);

        if (cancelled) return;

        if (!product) {
          setLoadError("Бараа олдсонгүй");
          return;
        }

        setInitialValues(toInitialValues(product, hierarchicalTags));
      } catch {
        if (!cancelled) setLoadError("Өгөгдөл ачаалахад алдаа гарлаа");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, token]);

  const updateProduct = useCallback(
    async (payload, { form, token: submitToken }) => {
      const response = await fetchWithAuthHandling(
        `${getBackendUrl()}/api/v1/products/${id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${submitToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
        "EditProduct.updateProduct"
      );

      const data = await response.json();

      if (!response.ok) {
        return { ok: false, message: data.message || `Алдаа гарлаа (${response.status})` };
      }

      toastManager.success(data.message || "Бараа амжилттай шинэчлэгдлээ");

      // replace, not add: editing must be able to remove a hierarchical tag, and it
      // runs unconditionally so clearing every tag actually clears them server-side.
      // The old page skipped this call when the selection was empty, which made
      // removing the last tag impossible.
      try {
        const ok = await replaceProductHierarchicalTags(
          id,
          { tagOptionIds: form.getValues("hierarchicalTagIds") || [] },
          submitToken
        );
        if (!ok) throw new Error("rejected");
      } catch {
        toastManager.warning(
          "Бараа шинэчлэгдлээ, гэхдээ ангилал шошго хадгалагдсангүй. Дахин оролдоно уу.",
          { title: "Ангилал шошго" }
        );
      }

      return { ok: true, data: data.data };
    },
    [id]
  );

  const layoutProps = {
    breadcrumbTitleParent: "Бараа",
    breadcrumbTitle: "Бараа засах",
    pageTitle: "Бараа засах",
  };

  if (loadError) {
    return (
      <Layout {...layoutProps}>
        <p className="text-[14px] text-destructive">{loadError}</p>
      </Layout>
    );
  }

  // ProductForm seeds react-hook-form's defaultValues once, on mount, so it must not
  // be rendered before the product has arrived.
  if (!initialValues) {
    return (
      <Layout {...layoutProps}>
        <p className="text-[14px] text-muted-foreground">Ачааллаж байна...</p>
      </Layout>
    );
  }

  return (
    <Layout {...layoutProps}>
      <ProductForm mode="edit" initialValues={initialValues} onSubmit={updateProduct} />
    </Layout>
  );
}
