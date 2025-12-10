"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatOrderDate, getStatusBlockClass } from "@/lib/api/orders";
import GetTokenClient from "@/lib/GetTokenClient";
import { getBackendUrl } from "@/lib/api/env";

export default function DeliveryQuickView({ open, onOpenChange, deliveryId }) {
  const [delivery, setDelivery] = useState(null);
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(false);
  const token = GetTokenClient();

  useEffect(() => {
    if (open && deliveryId) {
      fetchDeliveryDetails();
    } else {
      setDelivery(null);
      setCargos([]);
    }
  }, [open, deliveryId, token]);

  const fetchDeliveryDetails = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      // Fetch cargo details for the order
      const cargoUrl = `${getBackendUrl()}/api/v1/admin/shipping/orders/${deliveryId}/cargos`;
      const cargoResponse = await fetch(cargoUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (cargoResponse.ok) {
        const cargoResult = await cargoResponse.json();
        setCargos(cargoResult.data || []);
      }
    } catch (error) {
      console.error('Error fetching cargo details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto p-0">
        <DialogTitle className="sr-only">Delivery Details #{deliveryId}</DialogTitle>
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-3 text-gray-600">Loading delivery details...</p>
          </div>
        ) : (
          <div className="bg-white">
            {/* Header */}
            <div className="text-center py-8 px-6 border-b-2 border-dashed">
              <div className="text-3xl font-bold text-gray-900 mb-2">Delivery Details</div>
              <div className="text-sm text-gray-500">Order #{deliveryId}</div>
            </div>

            {/* Cargo Information */}
            {cargos.length > 0 ? (
              <div className="px-6 py-4">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-4">Cargo Shipments</div>
                <div className="space-y-4">
                  {cargos.map((cargo, index) => (
                    <div key={cargo.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-gray-900">
                          {cargo.cargoName || `Cargo ${index + 1}`}
                        </div>
                        <div className={getStatusBlockClass(cargo.cargoStatus)}>
                          {cargo.cargoStatus}
                        </div>
                      </div>

                      {cargo.receiverName && (
                        <div className="text-sm text-gray-600 mb-1">
                          <strong>Receiver:</strong> {cargo.receiverName}
                        </div>
                      )}

                      {cargo.receiverPhone && (
                        <div className="text-sm text-gray-600 mb-1">
                          <strong>Phone:</strong> {cargo.receiverPhone}
                        </div>
                      )}

                      {cargo.toAddress && (
                        <div className="text-sm text-gray-600 mb-1">
                          <strong>Address:</strong> {cargo.toAddress}
                        </div>
                      )}

                      {(cargo.startPincode || cargo.endPincode) && (
                        <div className="text-sm text-gray-600 mt-2">
                          <strong>Route:</strong> {cargo.startPincode || 'N/A'} → {cargo.endPincode || 'Pending'}
                        </div>
                      )}

                      {cargo.cargoCode && (
                        <div className="text-xs text-gray-500 mt-2">
                          Code: <span className="font-mono">{cargo.cargoCode}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                <p>No cargo shipments found for this delivery</p>
              </div>
            )}

            {/* Close Button */}
            <div className="border-t bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

