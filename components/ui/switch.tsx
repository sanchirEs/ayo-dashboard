"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      // p-0: Radix's Switch.Root renders as a native <button>, so `form button`
      // (public/css/style.css, padding: 14px 22px) applied unopposed — same defect
      // as RadioGroupItem/AccordionTrigger fixed in round 2 — and blew the track out
      // to 48x32. h-ui-5/w-ui-9 (round-3 ui-* scale): this app's <html> is
      // font-size: 62.5%, so the old rem-based h-5/w-9 rendered at 62.5% of their
      // intended 20px/36px size, on top of the padding bug.
      "peer inline-flex h-ui-5 w-ui-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent p-0 transition-colors",
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    )}
    {...props}
    ref={ref}
  >
    {/*
      h-ui-4/w-ui-4: same font-size-scale fix as the track. This thumb was
      previously computing to 0px wide in the live page (the black-blob screenshot)
      — with the track's own box collapsed by the padding bug above, h-4/w-4 (also
      rem-based) had nothing sane to size against. Fixed sizes on both track and
      thumb make the geometry deterministic: 36px track − 16px thumb − 2×2px
      border = 16px of travel, exactly matching translate-x-ui-4 below.
    */}
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-ui-4 w-ui-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
        "data-[state=checked]:translate-x-ui-4 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
