"use client";

import { useState } from "react";
import ProductQuickView from "./ProductQuickView";

export default function QuickViewAction({ product }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="item eye" onClick={() => setOpen(true)} title="See Detail">
        <i className="icon-eye" />
      </button>
      <ProductQuickView open={open} onOpenChange={setOpen} product={product} />
    </>
  );
}


