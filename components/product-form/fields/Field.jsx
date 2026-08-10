"use client";

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";

/**
 * The single field primitive for the product form.
 *
 * Label, hint and error placement are decided here once so no section can drift.
 * `children` is a render prop receiving react-hook-form's `field`.
 *
 * space-y-ui-1.5/ml-ui-0.5/text-[Npx] (round 3): this app's <html> is
 * font-size: 62.5% (public/css/style.css:157), which shrinks Tailwind's rem-based
 * text-sm/text-xs to 8.75px/7.5px instead of their textbook 14px/12px. Field is
 * used exclusively inside components/product-form/**, so spacing is converted to
 * the px-based ui-* scale (tailwind.config.js) rather than left at the shrunken
 * size the other 133 files in this app still use. Font sizes use Tailwind's
 * arbitrary bracket syntax (text-[14px]/text-[12px]) instead of a config-level
 * ui-* fontSize scale: verified that tailwind-merge silently drops a custom-named
 * text-* size class whenever a text-* colour class shares the same cn() call —
 * exactly what FormDescription's own text-muted-foreground would trigger — while
 * bracket values are correctly recognized as a distinct (non-colour) group.
 */
export default function Field({ control, name, label, hint, required = false, children }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-ui-1.5">
          {label && (
            <FormLabel className="text-[14px] font-medium">
              {label}
              {required && <span className="ml-ui-0.5 text-destructive">*</span>}
            </FormLabel>
          )}
          <FormControl>{children(field)}</FormControl>
          {hint && <FormDescription className="text-[12px] text-muted-foreground">{hint}</FormDescription>}
          <FormMessage className="text-[12px] text-destructive" />
        </FormItem>
      )}
    />
  );
}
