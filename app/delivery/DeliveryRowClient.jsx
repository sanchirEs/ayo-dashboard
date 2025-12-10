"use client";

import Link from "next/link";
import { getStatusBlockClass, formatOrderDate } from "@/lib/api/orders";
import DeliveryRowActions from "./DeliveryRowActions";

export default function DeliveryRowClient({ delivery, isSelected, onSelect }) {
  const customerName = delivery.user ? `${delivery.user.firstName} ${delivery.user.lastName}` : 'N/A';
  
  // Extract Papa shipment data
  const papaShipment = delivery.papaShipment;
  const papaCode = papaShipment?.papaCode || 'Not Created';
  const papaStatus = papaShipment?.papaStatus || 'PENDING';
  const driverName = papaShipment?.driverName || 'Not Assigned';
  
  return (
    <li 
      className="product-item gap14"
      style={{ 
        transition: 'background-color 0.2s ease',
        borderBottom: '1px solid #f3f4f6',
        backgroundColor: isSelected ? '#eff6ff' : 'transparent'
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = '#f9fafb';
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <div className="flex items-center justify-between gap20 flex-grow">
        {/* Order ID */}
        <div className="body-text">
          <Link href={`/order-detail/${delivery.id}`} className="text-blue-600 hover:underline font-medium">
            #{delivery.id} 
          </Link><div className="body-text">{customerName}</div>
        </div>

        {/* Papa Code */}
        <div className="body-text font-mono text-sm">
          {papaCode === 'Not Created' ? (
            <span className="text-gray-400">{papaCode}</span>
          ) : (
            <span className="text-gray-700">{papaCode}</span>
          )}
        </div>

        {/* Papa Status Badge */}
        <div>
          <div className={getStatusBlockClass(papaStatus)}>
            {papaStatus}
          </div>
        </div>

        {/* Driver Info */}
        <div className="body-text text-sm">
          {driverName === 'Not Assigned' ? (
            <span className="text-gray-400">{driverName}</span>
          ) : (
            <span className="text-gray-700">{driverName}</span>
          )}
        </div>

        {/* Item Count */}
        <div className="body-text">
          {delivery.orderItems.length} items
        </div>

        {/* Created Date */}
        <div className="body-text text-sm">
          {formatOrderDate(delivery.createdAt)}
        </div>

        {/* Actions */}
        <DeliveryRowActions delivery={delivery} />
      </div>
    </li>
  );
}

