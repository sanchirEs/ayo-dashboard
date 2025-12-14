"use client";

import { useState } from "react";
import DeliveryQuickView from "./DeliveryQuickView";
import CargoTrackingModal from "./CargoTrackingModal";

export default function DeliveryRowActions({ delivery }) {
  const [open, setOpen] = useState(false);
  const [showCargo, setShowCargo] = useState(false);
  
  const cargoCount = delivery.papaShipment?.cargoShipments?.length || 
                     delivery.papaCargoShipments?.length || 0;
  
  const hasPapaCode = delivery.papaShipment?.papaCode && 
                      delivery.papaShipment.papaCode !== 'Not Created';
  
  return (
    <>
      <div className="flex items-center gap-2">
        {/* View Details Button */}
        <button 
          className="item eye" 
          onClick={() => setOpen(true)} 
          title="View Delivery Details"
        >
          <i className="icon-eye" />
        </button>
        
        {/* Cargo Tracking Button */}
        {hasPapaCode && (
          <button 
            className="item" 
            onClick={() => setShowCargo(true)} 
            title="View Cargo Tracking"
            style={{
              backgroundColor: cargoCount > 0 ? '#dbeafe' : '#f3f4f6',
              color: cargoCount > 0 ? '#1e40af' : '#6b7280',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = cargoCount > 0 ? '#bfdbfe' : '#e5e7eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = cargoCount > 0 ? '#dbeafe' : '#f3f4f6';
            }}
          >
            📦 {cargoCount}
          </button>
        )}
        
        {/* Copy Papa Code Button */}
        {hasPapaCode && (
          <button 
            className="item" 
            onClick={() => {
              navigator.clipboard.writeText(delivery.papaShipment.papaCode);
              // You could add a toast notification here
              alert(`Papa Code ${delivery.papaShipment.papaCode} copied!`);
            }} 
            title="Copy Papa Code"
            style={{
              padding: '6px',
              borderRadius: '6px',
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: '#f3f4f6',
              transition: 'all 0.2s'
            }}
          >
            📋
          </button>
        )}
      </div>
      
      <DeliveryQuickView open={open} onOpenChange={setOpen} deliveryId={delivery.id} />
      
      {showCargo && (
        <CargoTrackingModal 
          delivery={delivery} 
          onClose={() => setShowCargo(false)} 
        />
      )}
    </>
  );
}

