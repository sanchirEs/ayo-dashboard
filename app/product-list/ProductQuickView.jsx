"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function ProductQuickView({ open, onOpenChange, product }) {
  const [index, setIndex] = useState(0);
  const images = product?.images || [];

  useEffect(() => {
    if (!open) setIndex(0);
  }, [open]);

  const next = () => setIndex((i) => (i + 1) % Math.max(images.length || 1, 1));
  const prev = () => setIndex((i) => (i - 1 + Math.max(images.length || 1, 1)) % Math.max(images.length || 1, 1));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-[94vw] md:w-[80vw] lg:w-[70vw] xl:w-[60vw] p-6 md:p-8 rounded-2xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="body-title mb-2">{product?.name}</DialogTitle>
          <DialogDescription className="text-tiny">Quick details preview. Use Edit to modify.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
          {/* Media */}
          <div className="md:col-span-7">
            <div className="relative w-full aspect-[4/3] overflow-hidden rounded-xl border bg-white">
              <img
                src={images[index]?.url ? `${process.env.NEXT_PUBLIC_BACKEND_URL}${images[index].url}` : "/images/products/1.png"}
                alt={product?.name}
                className="w-full h-full object-cover"
              />
              {images.length > 1 && (
                <div className="absolute inset-0 flex items-center justify-between p-2">
                  <button className="tf-button style-1 px-3 py-1 md:px-4 md:py-2" onClick={prev} aria-label="Previous">
                    ‹
                  </button>
                  <button className="tf-button style-1 px-3 py-1 md:px-4 md:py-2" onClick={next} aria-label="Next">
                    ›
                  </button>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-5 grid grid-cols-6 sm:grid-cols-8 gap-2">
                {images.slice(0, 12).map((img, i) => (
                  <button
                    key={img.id || i}
                    onClick={() => setIndex(i)}
                    className={`border rounded-lg overflow-hidden aspect-square ${i === index ? "ring-2 ring-primary" : ""}`}
                    aria-label={`Preview image ${i + 1}`}
                  >
                    <img
                      src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${img.url}`}
                      alt="thumb"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="md:col-span-5 space-y-6">
            <div>
              <div className="text-tiny text-muted-foreground">Price</div>
              <div className="body-title-2">MNT {product?.price}</div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-tiny text-muted-foreground">Category</div>
                <div className="body-text">{product?.category?.name || "-"}</div>
              </div>
              <div>
                <div className="text-tiny text-muted-foreground">Stock</div>
                <div className="body-text">{product?.stock ?? 0}</div>
              </div>
            </div>
            <div>
              <div className="text-tiny text-muted-foreground mb-2">Tags</div>
              <div className="flex flex-wrap gap-2">
                {(product?.tags || []).length
                  ? (product?.tags || []).map((t, i) => (
                      <span key={`${t}-${i}`} className="px-3 py-1 rounded-full border bg-white body-text text-sm">
                        {t}
                      </span>
                    ))
                  : <span className="text-muted-foreground body-text">-</span>}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6 gap-2">
          <a className="tf-button style-1" href={`/edit-product/${product?.id}`}>Edit</a>
          <button className="tf-button" onClick={() => onOpenChange(false)}>Close</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


