"use client";

import { useState } from "react";
import { useFieldArray } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getBackendUrl } from "@/lib/api/env";
import {
  INPUT_SM_CLASS,
  INPUT_TYPED_SM_CLASS,
  SECONDARY_BUTTON_CLASS,
  SECTION_LABEL_CLASS,
  chipClass,
} from "../fieldStyles";

export default function VariantsSection({ form, attributes, token }) {
  const { fields, replace, update } = useFieldArray({ control: form.control, name: "variants" });
  // Seeded from whatever variants the form was initialised with, so edit mode opens
  // with the product's existing attribute options already selected. Without this the
  // chips render empty on a product that plainly has variants, and pressing
  // "Вариант үүсгэх" would replace the real variants with nothing.
  const [selectedOptions, setSelectedOptions] = useState(() => {
    const loaded = form.getValues("variants") || [];
    const map = {};
    loaded.forEach((variant) => {
      (variant.attributes || []).forEach((attr) => {
        const attributeId = attr.attributeId ?? attr.attribute?.id;
        const optionId = attr.optionId ?? attr.option?.id;
        if (!attributeId || !optionId) return;
        if (!map[attributeId]) map[attributeId] = [];
        if (!map[attributeId].includes(optionId)) map[attributeId].push(optionId);
      });
    });
    return map;
  });
  const [uploadingIndex, setUploadingIndex] = useState({});
  const [uploadError, setUploadError] = useState("");

  /**
   * Per-variant image upload, ported from the old AddProductComponent.
   *
   * buildProductPayload already prefers a variant's own images and falls back to
   * the shared product images only when it has none, but the rewrite shipped
   * without any UI to attach them — so every variant silently took the fallback.
   *
   * The wire format is preserved exactly: multipart `images`, `folder=products`,
   * `type=variant_images`, and `isPrimary: false` on every uploaded image. The
   * payload builder's filter only keeps images whose imageUrl is http(s), so the
   * hosted URL returned by the backend is what must be stored here.
   */
  const uploadVariantImages = async (index, event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = ""; // allow re-selecting the same file later
    if (files.length === 0) return;

    if (!token) {
      setUploadError("Зураг байршуулахын тулд нэвтэрсэн байх шаардлагатай");
      return;
    }

    setUploadError("");
    setUploadingIndex((prev) => ({ ...prev, [index]: true }));
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("images", file));
      formData.append("folder", "products");
      formData.append("type", "variant_images");

      const response = await fetch(`${getBackendUrl()}/api/v1/upload/images`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Зураг байршуулахад алдаа гарлаа");
      }

      const uploaded = (result.data?.images || []).map((img) => ({
        imageUrl: img.url,
        altText: img.original_filename || "",
        isPrimary: false,
      }));

      const current = form.getValues(`variants.${index}.images`) || [];
      form.setValue(`variants.${index}.images`, [...current, ...uploaded], { shouldDirty: true });
    } catch (e) {
      setUploadError(e.message || "Зураг байршуулахад алдаа гарлаа");
    } finally {
      setUploadingIndex((prev) => ({ ...prev, [index]: false }));
    }
  };

  const removeVariantImage = (index, imageIndex) => {
    const current = form.getValues(`variants.${index}.images`) || [];
    form.setValue(
      `variants.${index}.images`,
      current.filter((_, i) => i !== imageIndex),
      { shouldDirty: true }
    );
  };

  // Coerce empty/null/undefined/NaN to 0, preserving numeric values.
  // Matches original updateVariant logic: value === '' ? 0 : parseFloat(value)
  const coerceToNumber = (value) => {
    if (value === '' || value === null || value === undefined) return 0;
    const num = parseFloat(value);
    return isFinite(num) ? num : 0;
  };

  const toggleOption = (attributeId, optionId) => {
    setSelectedOptions((prev) => {
      const current = prev[attributeId] || [];
      const next = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      return { ...prev, [attributeId]: next };
    });
  };

  // Cartesian product of the selected options, ported from the old component.
  const generate = () => {
    const entries = Object.entries(selectedOptions)
      .map(([attrId, optionIds]) => ({
        attributeId: parseInt(attrId, 10),
        options: optionIds.map((id) => parseInt(id, 10)),
      }))
      .filter((e) => e.options.length > 0);

    if (entries.length === 0) {
      replace([]);
      return;
    }

    let combinations = [[]];
    for (const { attributeId, options } of entries) {
      const next = [];
      for (const combination of combinations) {
        for (const optionId of options) {
          next.push([...combination, { attributeId, optionId }]);
        }
      }
      combinations = next;
    }

    const baseSku = form.getValues("sku") || "PROD";
    const basePrice = form.getValues("price") || 0;

    replace(
      combinations.map((attrs, index) => {
        const names = attrs.map(({ attributeId, optionId }) => {
          const attribute = attributes.find((a) => a.id === attributeId);
          const option = attribute?.options.find((o) => o.id === optionId);
          return `${attribute?.name}-${option?.value}`;
        });
        const suffix = names.join("-").toUpperCase().replace(/\s+/g, "-");

        return {
          sku: `${baseSku}-${suffix}`,
          price: Number(basePrice),
          isDefault: index === 0,
          attributes: attrs,
          inventory: { quantity: 0 },
          images: [],
        };
      })
    );
  };

  const setDefault = (index) => {
    fields.forEach((field, i) => update(i, { ...form.getValues(`variants.${i}`), isDefault: i === index }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Вариантууд</CardTitle>
        <CardDescription>Аттрибут сонгоод вариантуудыг үүсгэнэ үү</CardDescription>
      </CardHeader>
      <CardContent className="space-y-ui-5">
        <div className="space-y-ui-4">
          {attributes.map((attribute) => (
            <div key={attribute.id} className="space-y-ui-2">
              <span className={SECTION_LABEL_CLASS}>{attribute.name}</span>
              <div className="flex flex-wrap gap-ui-2">
                {attribute.options.map((option) => {
                  const isOn = (selectedOptions[attribute.id] || []).includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={isOn}
                      onClick={() => toggleOption(attribute.id, option.id)}
                      className={chipClass(isOn)}
                    >
                      {option.value}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" onClick={generate} className={SECONDARY_BUTTON_CLASS}>
          Вариант үүсгэх
        </Button>

        {uploadError && (
          <p className="text-[12px] text-destructive" role="alert">
            {uploadError}
          </p>
        )}

        {/*
          table-fixed with explicit widths on the numeric columns: the default auto
          layout split all four evenly at 158px, which left a generated SKU of 70+
          characters showing about twelve of them. SKU is the only column without a
          width so it absorbs the remainder. min-w keeps the columns from crushing
          on a narrow viewport — the wrapper scrolls instead.
        */}
        {fields.length > 0 && (
          <div className="overflow-x-auto rounded-[8px] border-[1px] border-border">
            {/*
              border-collapse / m-0 / the explicit border-* on every th and td:
              style.css styles the bare elements — `td { border: 1px solid #343444 }`,
              `th { border-width: 0 1px 1px 0 }`, `table { border-collapse: separate;
              border-width: 1px 0 0 1px; margin: 0 0 30px }`. Those are element
              selectors at (0,0,1), so any class outranks them; the black grid and the
              stray 30px margin appeared only because nothing here declared a border
              or a margin at all, leaving the template's values unopposed. Only a
              light horizontal rule between rows is wanted — the wrapper above draws
              the outer frame, so the last row deliberately has no bottom border.
            */}
            <table className="m-0 w-full min-w-[640px] table-fixed border-collapse border-0 text-[14px]">
              <thead>
                <tr>
                  <th className="border-x-0 border-t-0 border-b-[1px] border-border bg-muted/40 px-ui-3 py-ui-2 text-left font-medium">SKU</th>
                  <th className="w-[124px] border-x-0 border-t-0 border-b-[1px] border-border bg-muted/40 px-ui-3 py-ui-2 text-left font-medium">Зураг</th>
                  {/* 124px, not 100: MNT prices reach seven digits and were clipping. */}
                  <th className="w-[124px] border-x-0 border-t-0 border-b-[1px] border-border bg-muted/40 px-ui-3 py-ui-2 text-left font-medium">Үнэ</th>
                  <th className="w-[92px] border-x-0 border-t-0 border-b-[1px] border-border bg-muted/40 px-ui-3 py-ui-2 text-left font-medium">Тоо</th>
                  <th className="w-[72px] border-x-0 border-t-0 border-b-[1px] border-border bg-muted/40 px-ui-3 py-ui-2 text-center font-medium">Үндсэн</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((variant, index) => (
                  <tr key={variant.id} className="transition-colors hover:bg-accent/40">
                    <td className="border-x-0 border-b-0 border-t-[1px] border-border px-ui-3 py-ui-2">
                      <Input
                        {...form.register(`variants.${index}.sku`)}
                        title={form.watch(`variants.${index}.sku`) || ""}
                        className={INPUT_SM_CLASS}
                      />
                    </td>
                    <td className="border-x-0 border-b-0 border-t-[1px] border-border px-ui-3 py-ui-2">
                      <div className="flex flex-wrap items-center gap-ui-1">
                        {(form.watch(`variants.${index}.images`) || []).map((img, imgIndex) => (
                          <span key={img.imageUrl ?? imgIndex} className="relative inline-flex">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img.imageUrl}
                              alt={img.altText || `Вариант ${index + 1} зураг ${imgIndex + 1}`}
                              className="h-[32px] w-[32px] rounded-[4px] border-[1px] border-border object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeVariantImage(index, imgIndex)}
                              aria-label="Зураг хасах"
                              className="absolute -right-[5px] -top-[5px] flex h-[15px] w-[15px] items-center justify-center rounded-full border-0 bg-destructive p-0 text-[11px] leading-none text-destructive-foreground"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        <label className="inline-flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-[4px] border-[1px] border-dashed border-input text-[16px] leading-none text-muted-foreground transition-colors hover:bg-accent">
                          {uploadingIndex[index] ? "…" : "+"}
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            disabled={!!uploadingIndex[index]}
                            onChange={(e) => uploadVariantImages(index, e)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </td>
                    <td className="border-x-0 border-b-0 border-t-[1px] border-border px-ui-3 py-ui-2">
                      <Input
                        {...form.register(`variants.${index}.price`, { setValueAs: coerceToNumber })}
                        type="number"
                        min="0"
                        className={INPUT_TYPED_SM_CLASS}
                      />
                    </td>
                    <td className="border-x-0 border-b-0 border-t-[1px] border-border px-ui-3 py-ui-2">
                      <Input
                        {...form.register(`variants.${index}.inventory.quantity`, { setValueAs: coerceToNumber })}
                        type="number"
                        min="0"
                        className={INPUT_TYPED_SM_CLASS}
                      />
                    </td>
                    <td className="border-x-0 border-b-0 border-t-[1px] border-border px-ui-3 py-ui-2 text-center">
                      {/*
                        style.css sets `input[type="radio"] { width:22px; height:22px }`
                        at specificity (0,1,1) — one attribute selector plus one element —
                        which outranks a Tailwind class (0,1,0), so the plain utility was
                        ignored and this rendered 22px against the 16px Radix radios in
                        PricingSection. The `!` twin settles it by importance.
                      */}
                      <input
                        type="radio"
                        name="defaultVariant"
                        aria-label="Үндсэн вариант"
                        checked={form.watch(`variants.${index}.isDefault`) === true}
                        onChange={() => setDefault(index)}
                        className="h-[16px] w-[16px] !h-[16px] !w-[16px] cursor-pointer align-middle"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
