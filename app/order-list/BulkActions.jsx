"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bulkUpdateOrderStatusClient } from "@/lib/api/orders-client";
import { bulkDeliverOrdersClient } from "@/lib/api/shipping";
import GetTokenClient from "@/lib/GetTokenClient";

export default function BulkActions({ selectedOrders, onUpdateComplete }) {
  const router = useRouter();
  const token = GetTokenClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDelivering, setIsDelivering] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const handleBulkStatusUpdate = async (newStatus) => {
    if (!token || isUpdating || selectedOrders.size === 0) return;

    const validOrderIds = Array.from(selectedOrders);

    if (validOrderIds.length === 0) {
      alert('Cannot update CANCELLED or DELIVERED orders');
      return;
    }

    setIsUpdating(true);
    setShowStatusDropdown(false);

    try {
      const result = await bulkUpdateOrderStatusClient(validOrderIds, newStatus, token);
      
      if (result.success) {
        alert(`Successfully updated ${result.updatedCount || validOrderIds.length} order(s)`);
        onUpdateComplete?.();
        router.refresh();
      } else {
        alert(`Failed to update orders: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Error updating orders: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkDeliver = async () => {
    if (!token || isDelivering || selectedOrders.size === 0) return;

    const validOrderIds = Array.from(selectedOrders);

    if (validOrderIds.length === 0) {
      alert('No orders selected');
      return;
    }

    // Confirm action
    const confirmMessage = `Are you ready to deliver ${validOrderIds.length} order(s)?\n\nThis will:\n• Create Papa shipments\n• Make them visible to drivers immediately\n• Driver will come to pick up the orders`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    setIsDelivering(true);

    try {
      const result = await bulkDeliverOrdersClient(validOrderIds, token);
      
      if (result.success) {
        const { succeeded, failed } = result.summary;
        
        if (failed > 0) {
          alert(`Delivery completed:\n✅ ${succeeded} orders delivered successfully\n❌ ${failed} orders failed\n\nCheck failed shipments page for details.`);
        } else {
          alert(`🎉 Successfully delivered ${succeeded} order(s)!\n\nDrivers can now see these orders in Papa app and will come to pick them up.`);
        }
        
        onUpdateComplete?.();
        router.refresh();
      } else {
        alert(`Failed to deliver orders: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Error delivering orders: ${error.message}`);
    } finally {
      setIsDelivering(false);
    }
  };

  if (selectedOrders.size === 0) return null;

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      {/* PRIMARY ACTION: Deliver Button */}
      <button
        onClick={handleBulkDeliver}
        disabled={isDelivering || isUpdating}
        style={{
          padding: '6px 14px',
          fontSize: '13px',
          backgroundColor: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: (isDelivering || isUpdating) ? 'not-allowed' : 'pointer',
          opacity: (isDelivering || isUpdating) ? 0.6 : 1,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: '600',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          if (!isDelivering && !isUpdating) {
            e.target.style.backgroundColor = '#059669';
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.3)';
          }
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#10b981';
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = 'none';
        }}
      >
        {isDelivering ? (
          <>
            <div style={{
              width: '12px',
              height: '12px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTop: '2px solid white',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite'
            }} />
            Delivering...
          </>
        ) : (
          <>
            <i className="icon-truck" style={{ fontSize: '14px' }} />
            🚚 Deliver ({selectedOrders.size})
          </>
        )}
      </button>

      {/* SECONDARY ACTIONS: Status Dropdown */}
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setShowStatusDropdown(!showStatusDropdown)}
          disabled={isUpdating || isDelivering}
        style={{
          padding: '5px 12px',
          fontSize: '12px',
          backgroundColor: '#3730a3',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
            cursor: (isUpdating || isDelivering) ? 'not-allowed' : 'pointer',
            opacity: (isUpdating || isDelivering) ? 0.6 : 1,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: '500'
        }}
      >
        {isUpdating ? (
          <>
            <div style={{
              width: '12px',
              height: '12px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTop: '2px solid white',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite'
            }} />
            Updating...
          </>
        ) : (
          <>
            <i className="icon-edit-3" style={{ fontSize: '12px' }} />
              More Actions
          </>
        )}
      </button>

      {showStatusDropdown && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 998
            }}
            onClick={() => setShowStatusDropdown(false)}
          />
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '4px',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 999,
            minWidth: '160px'
          }}>
            <div style={{ padding: '4px 0' }}>
              <div style={{
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: '600',
                color: '#6b7280',
                borderBottom: '1px solid #f3f4f6',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Update Status
              </div>
              {['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleBulkStatusUpdate(status)}
                  disabled={isUpdating}
                  style={{
                    width: '100%',
                    padding: '7px 12px',
                    textAlign: 'left',
                    fontSize: '13px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: isUpdating ? 'not-allowed' : 'pointer',
                    color: status === 'CANCELLED' ? '#ef4444' : '#374151',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => {
                    if (!isUpdating) e.target.style.backgroundColor = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      </div>
      
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
