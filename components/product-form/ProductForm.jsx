"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import LoadingButton from "@/components/customui/LoadingButton";
import { addProductsSchema } from "@/schemas/productSchema";
import GetToken from "@/lib/GetTokenClient";
import { buildProductPayload } from "@/lib/products/buildProductPayload";
import { PRODUCT_FORM_DEFAULTS } from "@/lib/products/productFormDefaults";
import useProductFormData from "./useProductFormData";
import BasicInfoSection from "./sections/BasicInfoSection";
import PricingSection from "./sections/PricingSection";
import VariantsSection from "./sections/VariantsSection";
import MediaSection from "./sections/MediaSection";
import OrganizeSection from "./sections/OrganizeSection";
import AdvancedSection from "./sections/AdvancedSection";

const VENDOR_ID = 1;

export default function ProductForm({ mode = "create", initialValues, onSubmit }) {
  const token = GetToken();
  const { categoryEntries, brands, attributes, tagPresets, tagGroups, loading, error } =
    useProductFormData(token);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [advancedEnabled, setAdvancedEnabled] = useState(false);

  const form = useForm({
    resolver: zodResolver(addProductsSchema),
    defaultValues: {
      ...PRODUCT_FORM_DEFAULTS,
      productMode: "simple",
      specs: [],
      variants: [],
      tags: [],
      hierarchicalTagIds: [],
      ...initialValues,
    },
    mode: "onChange",
  });

  const productMode = form.watch("productMode");

  const submit = async (values) => {
    if (!token) {
      setFormError("Та нэвтрэх хэрэгтэй");
      return;
    }

    const variants = form.getValues("variants") || [];

    if (productMode === "variants") {
      if (variants.length === 0) {
        setFormError("Вариант үүсгэнэ үү");
        return;
      }
      if (variants.filter((v) => v.isDefault).length !== 1) {
        setFormError("Нэг үндсэн вариант сонгоно уу");
        return;
      }
      if (variants.some((v) => !v.sku || !v.price)) {
        setFormError("Бүх вариантуудад SKU болон үнэ оруулна уу");
        return;
      }
    } else if (!values.price || !values.quantity) {
      setFormError("Энгийн бараанд үнэ болон тоо ширхэг заавал оруулна уу");
      return;
    }

    const specs = form.getValues("specs") || [];
    const types = specs.map((s) => s.type.trim()).filter(Boolean);
    if (new Set(types).size !== types.length) {
      setFormError("Техникийн тодорхойлолтын төрлүүд давтагдаж болохгүй. Өөр өөр төрөл ашиглана уу.");
      return;
    }

    setFormError("");
    setSubmitting(true);

    try {
      const payload = buildProductPayload(values, {
        mode: productMode,
        variants,
        specs,
        categoryIds: form.getValues("categoryIds") || [],
        tags: form.getValues("tags") || [],
        uploadedImages: form.getValues("images") || [],
        advancedEnabled,
        vendorId: VENDOR_ID,
      });

      // The page owns the network call, so edit mode differs only in its onSubmit.
      const result = await onSubmit(payload, { form, token });

      if (!result?.ok) {
        // Surface what the backend actually said instead of a generic message.
        setFormError(result?.message || "Алдаа гарлаа");
        return;
      }

      if (mode === "create") {
        form.reset({
          ...PRODUCT_FORM_DEFAULTS,
          productMode: "simple",
          specs: [],
          variants: [],
          tags: [],
          hierarchicalTagIds: [],
        });
        setAdvancedEnabled(false);
      }
    } catch {
      setFormError("Сүлжээний алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Ачааллаж байна...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)}>
        <div className="sticky top-0 z-10 -mx-6 mb-6 flex items-center justify-between border-b border-border bg-background px-6 py-3">
          <h1 className="text-base font-semibold">
            {mode === "create" ? "Бараа нэмэх" : "Бараа засах"}
          </h1>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              className="cursor-pointer"
            >
              Цуцлах
            </Button>
            <LoadingButton
              type="submit"
              loading={submitting}
              className="cursor-pointer bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              Хадгалах
            </LoadingButton>
          </div>
        </div>

        {(formError || error) && (
          <div className="mb-6 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {formError || error}
          </div>
        )}

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="flex-1 space-y-6">
            <BasicInfoSection form={form} />
            <PricingSection form={form} />
            {productMode === "variants" && (
              <VariantsSection form={form} attributes={attributes} />
            )}
          </div>

          <div className="w-full space-y-6 lg:sticky lg:top-20 lg:w-[380px] lg:shrink-0">
            <MediaSection form={form} />
            <OrganizeSection
              form={form}
              categoryEntries={categoryEntries}
              brands={brands}
              tagPresets={tagPresets}
              tagGroups={tagGroups}
            />
            <AdvancedSection
              form={form}
              enabled={advancedEnabled}
              onEnabledChange={setAdvancedEnabled}
            />
          </div>
        </div>
      </form>
    </Form>
  );
}
