"use client";

import { useState } from "react";
import DeliveryQuickView from "./DeliveryQuickView";

export default function DeliveryRowActions({ delivery }) {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <button 
        className="item eye" 
        onClick={() => setOpen(true)} 
        title="View Delivery Details"
      >
        <i className="icon-eye" />
      </button>
      <DeliveryQuickView open={open} onOpenChange={setOpen} deliveryId={delivery.id} />
    </>
  );
}

