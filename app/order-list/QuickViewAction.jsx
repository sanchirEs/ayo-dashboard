"use client";

import { useState } from "react";
import OrderQuickView from "./OrderQuickView";

export default function QuickViewAction({ order }) {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <button 
        className="item eye" 
        onClick={() => setOpen(true)} 
        title="See Detail"
      >
        <i className="icon-eye" />
      </button>
      <OrderQuickView open={open} onOpenChange={setOpen} orderId={order.id} />
    </>
  );
}
