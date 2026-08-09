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
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        // px-0 / border-0 / rounded-none: `form button` (public/css/style.css) sets
        // padding: 14px 22px, a 12px radius and a 1px border on every plain <button>.
        // This trigger declared none of those itself, so all three leaked through
        // unopposed. px-0 matches the parent Card's own horizontal padding, so the
        // trigger content stays flush with the rest of the card.
        //
        // py-4 is NOT enough on its own: Bootstrap ships its own `.py-4` utility
        // (padding: 1.5rem !important) that collides with Tailwind's same-named,
        // non-important `.py-4` (1rem) — same class name, different framework,
        // Bootstrap wins on !important alone regardless of specificity. `!py-4`
        // compiles to a distinct class (`.\!py-4`) that Bootstrap has no equivalent
        // for, so it applies Tailwind's own value with matching !important weight.
        "flex flex-1 cursor-pointer items-center justify-between !py-4 px-0 border-0 rounded-none text-sm font-medium transition-all hover:underline",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        "[&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
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
    className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
