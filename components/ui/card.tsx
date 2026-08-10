import * as React from "react";
import { cn } from "@/lib/utils";

// p-ui-*/rounded-ui-*/text-[Npx]: this app's <html> renders at font-size: 62.5%
// (public/css/style.css:157), which shrinks Tailwind's rem-based text-base/p-6/
// rounded-lg etc. to 62.5% of their textbook size app-wide. Card/CardHeader/
// CardTitle/CardDescription/CardContent are used exclusively by
// components/product-form/** (verified — no other file imports them), so they're
// converted to the px-based ui-* scale (tailwind.config.js) rather than left at
// the shrunken scale the other 133 files still use. Font sizes use Tailwind's
// arbitrary bracket syntax (text-[16px]/text-[12px]) rather than a config-level
// ui-* fontSize scale: verified that tailwind-merge silently drops a custom-named
// text-* size class whenever a text-* colour class is merged in the same cn()
// call (as CardDescription's own text-muted-foreground would trigger) — bracket
// values don't have that failure mode.
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-ui-lg border border-border bg-card text-card-foreground shadow-sm", className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-ui-1 p-ui-6 pb-0", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-[16px] font-semibold leading-none", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-[12px] text-muted-foreground", className)} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-ui-6", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
