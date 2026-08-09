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
 */
export default function Field({ control, name, label, hint, required = false, children }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-1.5">
          {label && (
            <FormLabel className="text-sm font-medium">
              {label}
              {required && <span className="ml-0.5 text-destructive">*</span>}
            </FormLabel>
          )}
          <FormControl>{children(field)}</FormControl>
          {hint && <FormDescription className="text-xs text-muted-foreground">{hint}</FormDescription>}
          <FormMessage className="text-xs text-destructive" />
        </FormItem>
      )}
    />
  );
}
