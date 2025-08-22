"use client";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import CategoryRowActions from "./CategoryRowActions";

function collectExpandableIds(nodes) {
  const ids = new Set();
  const walk = (arr) => {
    for (const n of arr || []) {
      if (n.children && n.children.length) ids.add(n.id);
      if (n.children?.length) walk(n.children);
    }
  };
  walk(nodes || []);
  return ids;
}

export default function CategoryRowsClient({ nodes, query }) {
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  const expandableIds = useMemo(() => collectExpandableIds(nodes), [nodes]);

  useEffect(() => {
    if (query && query.length > 0) {
      setExpandedIds(new Set(expandableIds));
    } else {
      setExpandedIds(new Set());
    }
  }, [query, expandableIds]);

  function toggle(id) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const renderRows = (arr, depth = 0) => {
    const rows = [];
    for (const c of arr || []) {
      const hasChildren = !!(c.children && c.children.length);
      const isExpanded = expandedIds.has(c.id);

      rows.push(
        <li key={c.id} className="attribute-item flex items-center justify-between gap20">
          <div className="name flex items-center gap-2" style={{ paddingLeft: depth * 16 }}>
            {hasChildren ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={isExpanded ? "Collapse" : "Expand"}
                aria-expanded={isExpanded}
                onClick={() => toggle(c.id)}
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            ) : (
              <span className="inline-flex h-6 w-6 items-center justify-center text-muted-foreground">
                <Folder className="h-4 w-4" />
              </span>
            )}
            <div className="min-w-0">
              <span className="body-title-2 block truncate" title={c.name}>
                {c.name}
              </span>
              {depth > 0 ? (
                <span className="text-xs text-muted-foreground ml-2">(level {depth})</span>
              ) : null}
            </div>
          </div>
          <div className="body-text truncate" title={c.description || "No description"}>
            {c.description || "No description"}
          </div>
          <div className="body-text whitespace-nowrap">{c._count?.products || 0} products</div>
          <CategoryRowActions id={c.id} productCount={c._count?.products || 0} />
        </li>
      );

      if (hasChildren && isExpanded) {
        rows.push(...renderRows(c.children, depth + 1));
      }
    }
    return rows;
  };

  return <>{renderRows(nodes, 0)}</>;
}


