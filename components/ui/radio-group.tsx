"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root className={cn("grid gap-2", className)} {...props} ref={ref} />
));
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      // p-0: public/css/style.css's `form button { padding: 14px 22px }` (spec 0,0,2)
      // applies to every plain <button> and wins by default whenever nothing more
      // specific sets padding. This element sets h-4 w-4 but no padding utility, so
      // without an explicit p-0 (a single class, spec 0,1,0, always beats a 2-element
      // selector) the template's padding alone forces a ~46x30 box. Do not remove.
      //
      // h-ui-4/w-ui-4 (round 3): this app's <html> is font-size: 62.5%, so the
      // rem-based h-4/w-4 rendered at 10px instead of the intended 16px even after
      // the padding fix. RadioGroup is used exclusively by components/product-form/**,
      // so it's converted to the px-based ui-* scale (tailwind.config.js).
      "aspect-square h-ui-4 w-ui-4 shrink-0 cursor-pointer rounded-full border border-primary p-0 text-primary shadow",
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
      <span className="h-ui-2 w-ui-2 rounded-full bg-primary" />
    </RadioGroupPrimitive.Indicator>
  </RadioGroupPrimitive.Item>
));
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
