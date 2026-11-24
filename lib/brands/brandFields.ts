import { z } from "zod";

/**
 * The form fields the Phase 2 brand pages added: slug, featured flag, sort order.
 * The edit and new forms share them so the two cannot drift apart.
 */

// Same rule as the backend (brandSchema, 400 otherwise): lowercase ascii words
// joined by single dashes.
export const BRAND_SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const brandExtraFields = {
  // Optional: a blank slug on create means "generate one from the name".
  slug: z
    .string()
    .trim()
    .max(100, "Slug хэт урт байна")
    .refine(
      (value) => value === "" || BRAND_SLUG_PATTERN.test(value),
      "Зөвхөн жижиг латин үсэг, тоо, дундын зураас (жишээ нь about-tone)"
    )
    .optional(),
  isFeatured: z.boolean().optional(),
  // The input is text; blank counts as 0 (the column default).
  sortOrder: z.coerce
    .number({ invalid_type_error: "Тоо оруулна уу" })
    .int("Бүхэл тоо оруулна уу")
    .min(0, "0 эсвэл түүнээс их байх ёстой"),
};

/**
 * The slug to put in the request, or undefined to leave it out.
 *
 * Blank is never sent (the backend answers 400, it does not ignore it), and a slug
 * the brand already has is not resent, so saving other fields can never trip the
 * "slug already taken" check against the brand's own row.
 */
export function slugToSend(
  typed: string | undefined | null,
  current: string | null | undefined
): string | undefined {
  const slug = (typed || "").trim();
  if (!slug || slug === current) return undefined;
  return slug;
}
