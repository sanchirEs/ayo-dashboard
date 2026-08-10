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
    return <div className="p-ui-6 text-[14px] text-muted-foreground">Ачааллаж байна...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)}>
        {/*
          -mx-ui-6/mb-ui-6/px-ui-6/py-ui-3 (round 3): this app's <html> is
          font-size: 62.5%, which shrinks rem-based -mx-6/mb-6/px-6/py-3 to 62.5% of
          their textbook size. This bar is a plain <div>, not a form control, so
          none of the template's form/select/button rules target it — the only
          problem is the root font-size, and Tailwind auto-generates the negative
          variant for any spacing-scale key (including custom ones), so -mx-ui-6
          works the same way -mx-6 did. Verified in the live compiled CSS.
        */}
        <div className="sticky top-0 z-10 -mx-ui-6 mb-ui-6 flex items-center justify-between border-b border-border bg-background px-ui-6 py-ui-3">
          {/*
            leading-none is load-bearing, not decoration. style.css styles the bare
            element as `h1 { font-size: 100px; line-height: 132px }`. text-[16px]
            overrides only the font-size — line-height is a separate property, and
            with no utility declaring it the template's absolute 132px stood
            unopposed, so this one-line heading occupied 132px and inflated the
            sticky bar to 156px around a 36px button row. That was the large blank
            band at the top of the page. Any heading in this form that sets
            text-[Npx] must set a leading-* alongside it.
          */}
          <h1 className="text-[16px] font-semibold leading-none">
            {mode === "create" ? "Бараа нэмэх" : "Бараа засах"}
          </h1>
          {/*
            border-[1px]/px-[16px]/py-[8px]: Bootstrap ships its own .px-4, .py-2 and
            .border utilities carrying !important, with the exact same class names
            Tailwind's own px-4/py-2/border compile to but different values (Bootstrap's
            spacer scale, and a plain grey border colour) — same name, two frameworks.
            cva's own base classes ("h-9 px-4 py-2", plus "border border-input" for the
            outline variant) always inject the plain px-4/py-2/border/h-9/rounded-md
            tokens, and tailwind-merge does NOT treat a `!`-prefixed OR a custom-named
            "ui-*" utility as replacing its plain counterpart (verified:
            `twMerge('px-4 !px-4')` and `twMerge('h-9 h-ui-9')` both keep both classes).
            So neither an earlier `!px-4` attempt nor a `ui-*`-scale one actually wins —
            the leftover plain token keeps matching Bootstrap's/cva's own rule, and since
            bootstrap.css is bundled after Tailwind's utilities, an !important-vs-
            !important tie goes the wrong way.
            The fix that actually works, proven for BOTH the px-4/py-2/border Bootstrap
            collision (round 2) and the h-9/rounded-md root-font-size shrink (round 3):
            pass the intended pixel value through Tailwind's arbitrary bracket syntax
            (px-[16px] etc). tailwind-merge DOES recognize a bracket value as the same
            conflict group as the plain utility it's overriding (verified:
            `twMerge('px-4 px-[1rem]')` and `twMerge('h-9 h-[36px]')` both evict the
            plain class), so the plain "px-4"/"py-2"/"border"/"h-9"/"rounded-md" tokens
            are removed outright — no !important war needed, since Bootstrap's/the
            template's rules can no longer match an element that no longer carries the
            token they key off. Font size uses the same bracket approach for the same
            reason text-[Npx] is used everywhere else in this round (see
            tailwind.config.js's comment on the fontSize collision with tailwind-merge).
            Цуцлах keeps its own `border-input` (Tailwind-only, no Bootstrap collision)
            for colour, now unopposed once the colliding `border` token is gone.
            Хадгалах's `border-0` is unrelated to this mechanism — the default variant
            has no border utility at all, so `form button` was leaking an unwanted 1px
            border in unopposed; border-0 (0 either way, so no collision to worry about)
            already fixed that.
          */}
          <div className="flex items-center gap-ui-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              className="cursor-pointer h-[36px] rounded-[6px] border-[1px] px-[16px] py-[8px] text-[14px]"
            >
              Цуцлах
            </Button>
            <LoadingButton
              type="submit"
              loading={submitting}
              className="cursor-pointer border-0 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 h-[36px] rounded-[6px] px-[16px] py-[8px] text-[14px]"
            >
              Хадгалах
            </LoadingButton>
          </div>
        </div>

        {(formError || error) && (
          <div className="mb-ui-6 rounded-ui-md border border-destructive/40 bg-destructive/10 px-ui-4 py-ui-3 text-[14px] text-destructive">
            {formError || error}
          </div>
        )}

        <div className="flex flex-col gap-ui-6 lg:flex-row lg:items-start">
          <div className="flex-1 space-y-ui-6">
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
          <div className="space-y-ui-6 lg:sticky lg:top-ui-20 lg:w-[380px] lg:shrink-0">
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
