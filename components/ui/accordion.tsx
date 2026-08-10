"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item ref={ref} className={cn("border-b border-border", className)} {...props} />
));
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  // Radix renders Header as an <h3>, which style.css sizes at 24px with its own
  // line-height. The Trigger inside sets text-[14px], but the Header's line-height
  // still governs the row's height, so it is neutralised here — same defect as the
  // <h1> in ProductForm.jsx.
  <AccordionPrimitive.Header className="flex text-[14px] leading-none">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        // px-0 / border-0 / rounded-none: `form button` (public/css/style.css) sets
        // padding: 14px 22px, a 12px radius and a 1px border on every plain <button>.
        // This trigger declared none of those itself, so all three leaked through
        // unopposed. px-0 matches the parent Card's own horizontal padding, so the
        // trigger content stays flush with the rest of the card.
        //
        // py-ui-4, not py-4 (round 3 revision of the round-2 fix): the round-2 fix
        // used `!py-4` because Bootstrap ships its own `.py-4` utility (padding:
        // 1.5rem !important) that collides with Tailwind's same-named, non-important
        // `.py-4` — same class name, different framework — and `!important` was
        // needed to out-rank it. That worked, but 1rem is still rem-based, so it
        // rendered at 10px instead of 16px under this app's font-size: 62.5% root.
        // `py-ui-4` (tailwind.config.js's px-based ui-* scale) sidesteps both
        // problems by construction: it isn't 1.5rem so the root-font-size scaling
        // doesn't apply, and it isn't named "py-4" so Bootstrap's collision doesn't
        // apply either — no `!important` needed, a plain utility now suffices.
        // text-[14px] (not a named ui-* fontSize key): verified that tailwind-merge
        // silently drops a custom-named text-* size class whenever a text-* colour
        // class shares the same cn() call — see tailwind.config.js's comment.
        "flex flex-1 cursor-pointer items-center justify-between py-ui-4 px-0 border-0 rounded-none text-[14px] font-medium transition-all hover:underline",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        "[&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-ui-4 w-ui-4 shrink-0 text-muted-foreground transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-[14px] data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-ui-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
