"use client";

import Link from "next/link";
import { getStatusBlockClass, formatOrderDate } from "@/lib/api/orders";
import DeliveryRowActions from "./DeliveryRowActions";

export default function DeliveryRowClient({ delivery, isSelected, onSelect }) {
  const customerName = delivery.user ? `${delivery.user.firstName} ${delivery.user.lastName}` : 'N/A';
  const customerPhone = delivery.user?.telephone || 'N/A';
  
  // Extract Papa shipment data
  const papaShipment = delivery.papaShipment;
  const papaCode = papaShipment?.papaCode || 'Not Created';
  const papaStatus = papaShipment?.papaStatus || 'PENDING';
  const driverName = papaShipment?.driverName || 'Not Assigned';
  const driverPhone = papaShipment?.driverPhone || '';
  
  // Get cargo shipment count
  const cargoCount = papaShipment?.cargoShipments?.length || 
                     delivery.papaCargoShipments?.length || 0;
  
  // Format driver display with phone if available
  const driverDisplay = driverName === 'Not Assigned' 
    ? 'Not Assigned' 
    : driverPhone 
      ? `${driverName} (${driverPhone.slice(-4)})` 
      : driverName;
  
  // Status-based emoji indicators
  const getStatusEmoji = (status) => {
    switch (status) {
      case 'NEW': return '🔵';
      case 'CONFIRM': return '🟡';
      case 'START': return '🟠';
      case 'END': return '🟣';
      case 'COMPLETED': return '✅';
      case 'CANCELLED': return '❌';
      default: return '⚪';
    }
  };
  
  return (
    <li 
      className="product-item gap14"
      style={{ 
        transition: 'background-color 0.2s ease',
        borderBottom: '1px solid #f3f4f6',
        backgroundColor: isSelected ? '#eff6ff' : 'transparent',
        padding: '12px 16px'
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = '#f9fafb';
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <div className="flex items-center justify-between gap20 flex-grow">
        {/* Order ID & Customer */}
        <div className="body-text" style={{ minWidth: '180px' }}>
          <Link href={`/order-detail/${delivery.id}`} className="text-blue-600 hover:underline font-medium">
            #{delivery.id}
          </Link>
          <div className="body-text" style={{ fontSize: '0.875rem', marginTop: '2px' }}>
            {customerName}
          </div>
          {customerPhone !== 'N/A' && (
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>
              📞 {customerPhone}
            </div>
          )}
        </div>

        {/* Papa Code */}
        <div className="body-text font-mono text-sm" style={{ minWidth: '110px' }}>
          {papaCode === 'Not Created' ? (
            <span className="text-gray-400">{papaCode}</span>
          ) : (
            <span className="text-gray-700 font-semibold">{papaCode}</span>
          )}
        </div>

        {/* Papa Status Badge */}
        <div style={{ minWidth: '120px' }}>
          <div className={getStatusBlockClass(papaStatus)} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>{getStatusEmoji(papaStatus)}</span>
            <span>{papaStatus}</span>
          </div>
        </div>

        {/* Driver Info */}
        <div className="body-text text-sm" style={{ minWidth: '160px' }}>
          {driverName === 'Not Assigned' ? (
            <span className="text-gray-400">🚗 {driverName}</span>
          ) : (
            <div>
              <div className="text-gray-700 font-medium">{driverName}</div>
              {driverPhone && (
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>
                  📞 {driverPhone}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Item Count & Cargo */}
        <div className="body-text" style={{ minWidth: '90px' }}>
          <div>{delivery.orderItems.length} items</div>
          {cargoCount > 0 && (
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>
              📦 {cargoCount} {cargoCount === 1 ? 'cargo' : 'cargos'}
            </div>
          )}
        </div>

        {/* Created Date & Last Update */}
        <div className="body-text text-sm" style={{ minWidth: '140px' }}>
          <div>{formatOrderDate(delivery.createdAt)}</div>
          {papaShipment?.statusChangedAt && (
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>
              Updated: {formatOrderDate(papaShipment.statusChangedAt)}
            </div>
          )}
        </div>

        {/* Actions */}
        <DeliveryRowActions delivery={delivery} />
      </div>
    </li>
  );
}

