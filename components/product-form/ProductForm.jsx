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
          {/*
            px-[1rem]/py-[0.5rem]/border-[1px]: Bootstrap ships its own .px-4, .py-2 and
            .border utilities carrying !important, with the exact same class names
            Tailwind's own px-4/py-2/border compile to but different values (Bootstrap's
            spacer scale, and a plain grey border colour) — same name, two frameworks.
            cva's own base classes ("h-9 px-4 py-2", plus "border border-input" for the
            outline variant) always inject the plain px-4/py-2/border tokens, and
            tailwind-merge does NOT treat a `!`-prefixed utility as replacing its
            non-`!` counterpart (verified: `twMerge('px-4 !px-4')` keeps both). So an
            earlier `!px-4` attempt here still left "px-4" in the class list, Bootstrap's
            same-named !important rule still matched via that leftover token, and since
            bootstrap.css is bundled after Tailwind's utilities, it won an !important-vs-
            !important source-order tie despite our override.
            The fix that actually works: pass the SAME value through Tailwind's arbitrary
            syntax instead (px-[1rem] etc). tailwind-merge DOES recognize px-[1rem] as the
            same conflict group as px-4 (verified: `twMerge('px-4 px-[1rem]')` → only
            'px-[1rem]' survives), so the plain "px-4"/"py-2"/"border" tokens are removed
            outright. With the token gone, Bootstrap's selector no longer matches this
            element at all — no !important war needed, a plain utility wins on
            specificity alone against `form button`'s non-important shorthand.
            Цуцлах keeps its own `border-input` (Tailwind-only, no Bootstrap collision)
            for colour, now unopposed once the colliding `border` token is gone.
            Хадгалах's `border-0` is unrelated to this mechanism — the default variant
            has no border utility at all, so `form button` was leaking an unwanted 1px
            border in unopposed; border-0 (0 either way, so no collision to worry about)
            already fixed that.
          */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              className="cursor-pointer border-[1px] px-[1rem] py-[0.5rem]"
            >
              Цуцлах
            </Button>
            <LoadingButton
              type="submit"
              loading={submitting}
              className="cursor-pointer border-0 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 px-[1rem] py-[0.5rem]"
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

          {/*
            No `w-full` here: `public/css/style.css` (the Remos template stylesheet,
            loaded after globals.css) defines `.w-full { width: 100% !important; }`,
            which beats `lg:w-[380px]` and pins this rail to the full page width. This
            div is a flex child of the `flex flex-col` wrapper above, so it already
            stretches to full width by default at small sizes via `align-items: stretch` —
            `w-full` was redundant even before it became harmful. Do not add it back.
          */}
          <div className="space-y-6 lg:sticky lg:top-20 lg:w-[380px] lg:shrink-0">
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
