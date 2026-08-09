"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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
 */
export default function MediaSection({ form }) {
  const images = form.watch("images") || [];

  const toFormImage = (img, index, offset) => ({
    imageUrl: img.imageUrl || img.url || img.secure_url,
    altText: img.name || img.alt || form.getValues("name") || "Бүтээгдэхүүний зураг",
    isPrimary: offset + index === 0,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Зураг</CardTitle>
        <CardDescription>Эхний зураг үндсэн зураг болно</CardDescription>
      </CardHeader>
      <CardContent>
        <ImageUploadField
          value={images}
          autoUpload
          maxFiles={10}
          onChange={() => {}}
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
        {images.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">{images.length} зураг байршуулсан</p>
        )}
      </CardContent>
    </Card>
  );
}
