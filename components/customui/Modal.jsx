"use client";
import { Dialog, DialogOverlay, DialogContent } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
export function Modal({ children }) {
  const router = useRouter();
  const handleOpenChange = () => {
    router.back();
  };
  return (
    <Dialog defaultOpen={true} open={true} onOpenChange={handleOpenChange}>
      <DialogOverlay>
        <DialogContent className="w-100">{children}</DialogContent>
      </DialogOverlay>
    </Dialog>
  );
}
