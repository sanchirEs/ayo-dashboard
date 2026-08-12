"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import ImageGallery from "../fields/ImageGallery";
import ImageUploadField from "@/components/upload/ImageUploadField";

/**
 * Images have exactly one writer.
 *
 * The old component had two — an onChange handler writing raw File objects and a
 * useEffect writing Cloudinary URL objects — into the same `images` field, so
 * whichever ran last won and uploads could silently fail to attach.
 *
 * Uploads are normalized to `{ imageUrl, altText, isPrimary }` before they touch
 * the form. `addProductsSchema.images` only accepts `File[]` or that exact shape,
 * so storing a raw Cloudinary response here would fail validation and block
 * submission. `altText` must be non-empty — imageSchema requires min(1).
 *
 * onChange handles the clear-all case (empty array). File selection with autoUpload
 * uses onUploadComplete instead, which normalizes Cloudinary objects. Both paths
 * write the same normalized shape to the form.
 */
export default function MediaSection({ form }) {
  const images = form.watch("images") || [];

  const toFormImage = (img, index, offset) => ({
    imageUrl: img.imageUrl || img.url || img.secure_url,
    altText: img.name || img.alt || form.getValues("name") || "Бүтээгдэхүүний зураг",
    isPrimary: offset + index === 0,
  });

  const handleRemoveImage = (index) => {
    const current = form.getValues("images") || [];
    form.setValue(
      "images",
      current.filter((_, i) => i !== index),
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Зураг</CardTitle>
        <CardDescription>Эхний зураг үндсэн зураг болно</CardDescription>
      </CardHeader>
      <CardContent className="space-y-ui-4">
        {images.length > 0 && <ImageGallery images={images} onRemove={handleRemoveImage} />}

        {/*
          The dropzone's own styled-jsx renders `.upload-description` in rem, so it
          lands at 8.75px under this app's 62.5% root font-size. ImageUploadField is
          shared with app/edit-product/, which is out of scope for this rewrite, so
          the size is corrected from the outside with an arbitrary-variant class on
          the wrapper it already forwards to its root element — no edit to the shared
          component and no change to how the edit-product pages render.

          The `!` is required: styled-jsx scopes its rule as `.jsx-<hash>.upload-description`
          (two classes), which ties with this variant's own two-class selector and then
          wins on source order, because styled-jsx injects into <head> at runtime after
          Tailwind's stylesheet. Importance settles it without a specificity race.
        */}
        <ImageUploadField
          className="[&_.upload-description]:!text-[12px]"
          value={images}
          autoUpload
          maxFiles={10}
          onChange={(value) => {
            if (!value || value.length === 0) {
              form.setValue("images", [], {
                shouldDirty: true,
                shouldValidate: true,
              });
            }
          }}
          onUploadComplete={(uploaded) => {
            const current = form.getValues("images") || [];
            const added = (uploaded || []).map((img, i) => toFormImage(img, i, current.length));
            form.setValue("images", [...current, ...added], {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
          onUploadError={(err) => {
            form.setError("images", { type: "manual", message: err?.message || "Зураг байршуулахад алдаа гарлаа" });
          }}
        />
      </CardContent>
    </Card>
  );
}
