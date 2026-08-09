"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchCategoryPaths } from "@/lib/products/categoryPaths";

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
    <div className="space-y-2">
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-input bg-background p-2">
        {selected.length === 0 && (
          <span className="px-1 text-sm text-muted-foreground">Ангилал сонгогдоогүй</span>
        )}
        {selected.map((entry) => {
          const isUnresolved = entry.isUnresolved === true;
          return (
            <span
              key={entry.id}
              title={isUnresolved ? "Ангилал олдсонгүй" : entry.pathLabel}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs ${
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
                className="cursor-pointer rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
          className="ml-auto cursor-pointer disabled:cursor-not-allowed"
        >
          + Сонгох
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Ангилал сонгох</DialogTitle>
          </DialogHeader>

          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ангилал хайх..."
            className="h-10"
          />

          <div className="max-h-96 overflow-y-auto rounded-md border border-border">
            {results.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Илэрц олдсонгүй</p>
            ) : (
              results.map((entry) => {
                const isSelected = value.includes(entry.id);
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => toggle(entry.id)}
                    className={`flex w-full cursor-pointer items-center gap-2 border-b border-border px-3 py-2 text-left text-sm transition-colors last:border-b-0 hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                      isSelected ? "bg-accent/50" : ""
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
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

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">{uniqueValue.length} сонгогдсон</span>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="cursor-pointer"
            >
              Болсон
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
