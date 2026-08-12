"use client";

import { useState } from "react";

export default function ImageGallery({ images = [], onRemove }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <div className="space-y-ui-3">
      <div className="grid grid-cols-3 gap-ui-3">
        {images.map((img, index) => (
          <div
            key={img.imageUrl ?? index}
            className="group relative aspect-square overflow-hidden rounded-[8px] border-[1px] border-border bg-muted"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.imageUrl}
              alt={img.altText || `Зураг ${index + 1}`}
              className="h-full w-full object-cover"
            />

            {/* Primary badge */}
            {img.isPrimary && (
              <span className="absolute left-ui-2 top-ui-2 inline-flex rounded-[4px] bg-primary/90 px-ui-2 py-ui-1 text-[11px] font-medium text-primary-foreground leading-none">
                Үндсэн
              </span>
            )}

            {/* Delete button */}
            <button
              type="button"
              onClick={() => onRemove(index)}
              aria-label="Зураг хасах"
              className="absolute right-ui-2 top-ui-2 flex h-[28px] w-[28px] items-center justify-center rounded-full bg-destructive/90 text-[16px] leading-none text-destructive-foreground shadow-sm transition-opacity hover:bg-destructive"
            >
              ×
            </button>
          </div>
        ))}

      </div>

      <p className="text-[12px] text-muted-foreground">
        {images.length} зураг байршуулсан
      </p>
    </div>
  );
}
