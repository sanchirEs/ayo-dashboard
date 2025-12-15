"use client";

import { formatOrderDate } from "@/lib/api/orders";

export default function CargoTrackingModal({ delivery, onClose }) {
  if (!delivery) return null;

  const papaShipment = delivery.papaShipment;
  const cargoShipments = papaShipment?.cargoShipments || delivery.papaCargoShipments || [];

  const getCargoStatusBadge = (status) => {
    const statusClasses = {
      'NEW': 'bg-blue-100 text-blue-700',
      'START': 'bg-orange-100 text-orange-700',
      'END': 'bg-purple-100 text-purple-700',
      'COMPLETED': 'bg-green-100 text-green-700',
    };
    
    const statusEmoji = {
      'NEW': '🔵',
      'START': '🟠',
      'END': '🟣',
      'COMPLETED': '✅',
    };

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-700'}`}>
        <span>{statusEmoji[status] || '⚪'}</span>
        <span>{status || 'UNKNOWN'}</span>
      </span>
    );
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-semibold">
            📦 Order #{delivery.id} - Cargo Tracking
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Customer & Order Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3">👤 Customer Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <span className="ml-2 font-medium">
                  {delivery.user?.firstName} {delivery.user?.lastName}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Phone:</span>
                <span className="ml-2 font-medium">{delivery.user?.telephone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <span className="ml-2 font-medium">{delivery.user?.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Order Total:</span>
                <span className="ml-2 font-medium">₮ {Number(delivery.total).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Papa Shipment Info */}
          {papaShipment && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3">🚚 Papa Shipment</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Papa Code:</span>
                  <span className="ml-2 font-mono font-semibold">{papaShipment.papaCode}</span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className="ml-2">{getCargoStatusBadge(papaShipment.papaStatus)}</span>
                </div>
                {papaShipment.papaPincode && (
                  <div>
                    <span className="text-gray-600">PIN Code:</span>
                    <span className="ml-2 font-mono font-semibold">{papaShipment.papaPincode}</span>
                  </div>
                )}
                {papaShipment.driverName && (
                  <>
                    <div>
                      <span className="text-gray-600">Driver:</span>
                      <span className="ml-2 font-medium">{papaShipment.driverName}</span>
                    </div>
                    {papaShipment.driverPhone && (
                      <div>
                        <span className="text-gray-600">Driver Phone:</span>
                        <span className="ml-2 font-medium">{papaShipment.driverPhone}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Timeline */}
              {(papaShipment.createdAt || papaShipment.confirmedAt || papaShipment.driverAssignedAt) && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <h4 className="text-sm font-semibold mb-2">Timeline</h4>
                  <div className="space-y-2 text-sm">
                    {papaShipment.createdAt && (
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span className="text-gray-600">Created:</span>
                        <span className="font-medium">{formatOrderDate(papaShipment.createdAt)}</span>
                      </div>
                    )}
                    {papaShipment.confirmedAt && (
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span className="text-gray-600">Confirmed:</span>
                        <span className="font-medium">{formatOrderDate(papaShipment.confirmedAt)}</span>
                      </div>
                    )}
                    {papaShipment.driverAssignedAt && (
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span className="text-gray-600">Driver Assigned:</span>
                        <span className="font-medium">{formatOrderDate(papaShipment.driverAssignedAt)}</span>
                      </div>
                    )}
                    {papaShipment.pickedUpAt && (
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span className="text-gray-600">Picked Up:</span>
                        <span className="font-medium">{formatOrderDate(papaShipment.pickedUpAt)}</span>
                      </div>
                    )}
                    {papaShipment.deliveredAt && (
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span className="text-gray-600">Delivered:</span>
                        <span className="font-medium">{formatOrderDate(papaShipment.deliveredAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cargo Shipments */}
          {cargoShipments.length > 0 ? (
            <div>
              <h3 className="font-semibold mb-3">
                📦 Cargo Shipments ({cargoShipments.length} {cargoShipments.length === 1 ? 'package' : 'packages'})
              </h3>
              <div className="space-y-4">
                {cargoShipments.map((cargo, index) => (
                  <div key={cargo.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-lg">
                          Cargo #{index + 1}: {cargo.papaCargoId}
                        </h4>
                        {cargo.cargoName && (
                          <p className="text-sm text-gray-600 mt-1">{cargo.cargoName}</p>
                        )}
                      </div>
                      <div>
                        {getCargoStatusBadge(cargo.cargoStatus)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {cargo.cargoCode && (
                        <div>
                          <span className="text-gray-600">Cargo Code:</span>
                          <span className="ml-2 font-mono">{cargo.cargoCode}</span>
                        </div>
                      )}
                      
                      {(cargo.startPincode || cargo.endPincode) && (
                        <div className="col-span-2">
                          <span className="text-gray-600">PIN Codes:</span>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="font-mono bg-yellow-100 px-3 py-1 rounded">
                              Start: {cargo.startPincode || 'N/A'}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="font-mono bg-green-100 px-3 py-1 rounded">
                              End: {cargo.endPincode || 'N/A'}
                            </span>
                          </div>
                        </div>
                      )}

                      {cargo.receiverName && (
                        <div>
                          <span className="text-gray-600">Receiver:</span>
                          <span className="ml-2 font-medium">{cargo.receiverName}</span>
                        </div>
                      )}

                      {cargo.receiverPhone && (
                        <div>
                          <span className="text-gray-600">Receiver Phone:</span>
                          <span className="ml-2 font-medium">{cargo.receiverPhone}</span>
                        </div>
                      )}

                      {cargo.toAddress && (
                        <div className="col-span-2">
                          <span className="text-gray-600">Address:</span>
                          <p className="mt-1 text-gray-900">{cargo.toAddress}</p>
                        </div>
                      )}

                      {cargo.lastSyncedAt && (
                        <div className="col-span-2 pt-2 border-t">
                          <span className="text-gray-600 text-xs">Last synced:</span>
                          <span className="ml-2 text-xs text-gray-500">
                            {formatOrderDate(cargo.lastSyncedAt)}
                          </span>
                        </div>
                      )}

                      {cargo.syncError && (
                        <div className="col-span-2 bg-red-50 border border-red-200 rounded p-2">
                          <span className="text-red-700 text-xs">⚠️ Sync Error: {cargo.syncError}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg">📦 No cargo shipments found</p>
              <p className="text-sm mt-2">Cargo tracking will appear here once the shipment is processed.</p>
            </div>
          )}

          {/* Order Items */}
          <div>
            <h3 className="font-semibold mb-3">
              🛍️ Order Items ({delivery.orderItems.length} items)
            </h3>
            <div className="space-y-2">
              {delivery.orderItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between border rounded p-3">
                  <div className="flex items-center gap-3">
                    {item.product.ProductImages?.[0]?.imageUrl && (
                      <img 
                        src={item.product.ProductImages[0].imageUrl} 
                        alt={item.product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-gray-600">SKU: {item.product.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {item.quantity} × ₮{Number(item.price).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      = ₮{(item.quantity * Number(item.price)).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-gray-50 sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}





