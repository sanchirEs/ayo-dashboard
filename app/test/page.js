"use client";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export default function SonnerDemo() {
  toast("Event has been created.");
  return (
    <div className="h-screen w-full bg-black">
      {" "}
      <Button
        variant="destructive"
        onClick={() =>
          toast("Event has been created", {
            description: "Sunday, December 03, 2023 at 9:00 AM",

            action: {
              label: "Undo",
              onClick: () => console.log("Undo"),
            },
          })
        }
      >
        Show Toast
      </Button>
    </div>
  );
}
