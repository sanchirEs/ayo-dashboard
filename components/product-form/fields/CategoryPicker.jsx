"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchCategoryPaths } from "@/lib/products/categoryPaths";
import { INPUT_CLASS, SECONDARY_BUTTON_CLASS } from "../fieldStyles";

/**
 * Multi-select category picker.
 *
 * Replaces the old pair of controls (a single-select tree plus a flat grid of every
 * category as a chip). Results show the full ancestor path because leaf names repeat
 * across the mirrored retailer trees.
 */
export default function CategoryPicker({ entries, value = [], onChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Deduplicate value once to ensure chip count matches display count
  const uniqueValue = useMemo(() => [...new Set(value)], [value]);

  const selected = useMemo(() => {
    // Entries that exist in the array
    const known = entries.filter((e) => uniqueValue.includes(e.id));
    const knownIds = new Set(known.map((e) => e.id));

    // IDs in uniqueValue but not in entries (unresolved)
    const unresolved = uniqueValue
      .filter((id) => !knownIds.has(id))
      .map((id) => ({
        id,
        name: `#${id}`,
        path: [],
        pathLabel: `#${id}`,
        isUnresolved: true,
      }));

    return [...known, ...unresolved];
  }, [entries, uniqueValue]);

  const results = useMemo(() => searchCategoryPaths(entries, query), [entries, query]);

  const toggle = (id) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  return (
    <div className="space-y-ui-2">
      <div className="flex min-h-[40px] flex-wrap items-center gap-ui-1.5 rounded-[8px] border-[1px] border-input bg-background p-ui-2">
        {selected.length === 0 && (
          <span className="px-ui-1 text-[14px] text-muted-foreground">Ангилал сонгогдоогүй</span>
        )}
        {selected.map((entry) => {
          const isUnresolved = entry.isUnresolved === true;
          return (
            <span
              key={entry.id}
              title={isUnresolved ? "Ангилал олдсонгүй" : entry.pathLabel}
              className={`inline-flex items-center gap-ui-1 rounded-[6px] px-ui-2 py-ui-1 text-[12px] leading-[16px] ${
                isUnresolved
                  ? "bg-destructive/10 text-destructive"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {entry.name}
              <button
                type="button"
                disabled={disabled}
                onClick={() => toggle(entry.id)}
                aria-label={`${entry.name} арилгах`}
                // p-0 border-0 leading-none: `form button` (public/css/style.css) gives
                // every plain <button> a 14px/22px padding and a 1px border unless
                // something more specific opposes it. This × had neither, so it was
                // rendering as a ~50px-tall bordered pill instead of an inline glyph.
                className="cursor-pointer rounded-sm border-0 p-0 leading-none transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                ×
              </button>
            </span>
          );
        })}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => setOpen(true)}
          className={`ml-auto disabled:cursor-not-allowed ${SECONDARY_BUTTON_CLASS}`}
        >
          + Сонгох
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-semibold leading-none">Ангилал сонгох</DialogTitle>
          </DialogHeader>

          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ангилал хайх..."
            className={INPUT_CLASS}
          />

          <div className="max-h-[384px] overflow-y-auto rounded-[8px] border-[1px] border-border">
            {results.length === 0 ? (
              <p className="p-ui-4 text-[14px] text-muted-foreground">Илэрц олдсонгүй</p>
            ) : (
              results.map((entry) => {
                const isSelected = value.includes(entry.id);
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => toggle(entry.id)}
                    aria-pressed={isSelected}
                    className={`flex w-full cursor-pointer items-center gap-ui-2 rounded-none border-0 border-b border-border px-ui-3 py-ui-2 text-left text-[14px] transition-colors last:border-b-0 hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                      isSelected ? "bg-accent/50" : ""
                    }`}
                  >
                    <span
                      className={`flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-[4px] border-[1px] text-[11px] leading-none ${
                        isSelected ? "border-primary bg-primary text-primary-foreground" : "border-input"
                      }`}
                    >
                      {isSelected && "✓"}
                    </span>
                    <span className="truncate text-muted-foreground">
                      {entry.path.slice(0, -1).join(" › ")}
                      {entry.path.length > 1 && " › "}
                      <span className="text-foreground">{entry.name}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between pt-ui-2">
            <span className="text-[12px] text-muted-foreground">{uniqueValue.length} сонгогдсон</span>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className={SECONDARY_BUTTON_CLASS}
            >
              Болсон
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
