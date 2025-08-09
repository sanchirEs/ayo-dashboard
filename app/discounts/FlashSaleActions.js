"use client";
import { useState, useTransition } from "react";
import { updateProductFlashSale, isFlashSaleActive } from "@/lib/api/discounts";
import GetToken from "@/lib/GetTokenClient";

export default function FlashSaleActions({ product }) {
  const [showModal, setShowModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    flashSale: product.flashSale || false,
    flashSaleEndDate: product.flashSaleEndDate ? product.flashSaleEndDate.split('T')[0] : '',
    price: product.price || 0
  });
  const TOKEN = GetToken();

  const isActive = product.flashSale && isFlashSaleActive(product.flashSaleEndDate);

  const handleUpdate = () => {
    setIsUpdating(true);
    setError(null);
    startTransition(async () => {
      try {
        const updateData = {
          flashSale: formData.flashSale,
          ...(formData.flashSale && formData.flashSaleEndDate && {
            flashSaleEndDate: new Date(formData.flashSaleEndDate).toISOString()
          }),
          ...(formData.price !== product.price && { price: Number(formData.price) })
        };

        await updateProductFlashSale(product.id, updateData, TOKEN);
        
        // Refresh the page to show updated data
        window.location.reload();
      } catch (error) {
        console.error('Update error:', error);
        
        if (error.message.includes('PERMISSION_DENIED')) {
          setError({
            type: 'permission',
            message: 'Permission denied: Only VENDOR and SUPERADMIN users can update flash sales.'
          });
        } else {
          setError({
            type: 'general',
            message: error.message || 'Failed to update flash sale'
          });
        }
      } finally {
        setIsUpdating(false);
      }
    });
  };

  const quickToggle = () => {
    setIsUpdating(true);
    setError(null);
    startTransition(async () => {
      try {
        const updateData = {
          flashSale: !product.flashSale,
          ...(product.flashSale && { flashSaleEndDate: null }) // Remove end date when disabling
        };

        await updateProductFlashSale(product.id, updateData, TOKEN);
        window.location.reload();
      } catch (error) {
        console.error('Toggle error:', error);
        
        if (error.message.includes('PERMISSION_DENIED')) {
          setError({
            type: 'permission',
            message: 'Permission denied: Only VENDOR and SUPERADMIN users can toggle flash sales.'
          });
        } else {
          setError({
            type: 'general',
            message: error.message || 'Failed to toggle flash sale'
          });
        }
      } finally {
        setIsUpdating(false);
      }
    });
  };

  return (
    <>
      <div className="flex gap5">
        <div 
          className="item edit" 
          onClick={() => setShowModal(true)}
          style={{ cursor: 'pointer' }}
          title="Edit flash sale"
        >
          <i className="icon-edit-3" />
        </div>
        <div 
          className="item toggle" 
          onClick={quickToggle}
          style={{ 
            cursor: isUpdating ? 'not-allowed' : 'pointer',
            opacity: isUpdating ? 0.5 : 1
          }}
          title={product.flashSale ? 'Disable flash sale' : 'Enable flash sale'}
        >
          <i className={isUpdating ? "icon-loader" : (product.flashSale ? "icon-toggle-left" : "icon-toggle-right")} />
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div className="flex items-center justify-between mb-20">
              <h4 className="text-title">Flash Sale Settings</h4>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setError(null);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}
              >
                ×
              </button>
            </div>

            <div className="product-info mb-20" style={{
              padding: '16px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px'
            }}>
              <h5 style={{ margin: '0 0 8px 0' }}>{product.name}</h5>
              <p style={{ margin: '0', color: '#64748b', fontSize: '14px' }}>SKU: {product.sku}</p>
            </div>

            {/* Error Display */}
            {error && (
              <div className={`alert mb-20`} style={{
                backgroundColor: error.type === 'permission' ? '#fef2f2' : '#fef2f2',
                border: `1px solid ${error.type === 'permission' ? '#fca5a5' : '#fca5a5'}`,
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div className="flex items-start gap10">
                  <i className={`icon-${error.type === 'permission' ? 'shield' : 'alert-triangle'}`} style={{ 
                    color: error.type === 'permission' ? '#dc2626' : '#dc2626', 
                    marginTop: '2px' 
                  }} />
                  <div>
                    <h5 style={{ color: '#dc2626', margin: '0 0 8px 0', fontWeight: 'bold' }}>
                      {error.type === 'permission' ? 'Permission Error' : 'Update Failed'}
                    </h5>
                    <p style={{ color: '#b91c1c', margin: '0', lineHeight: '1.5' }}>
                      {error.message}
                    </p>
                    {error.type === 'permission' && (
                      <div style={{ marginTop: '12px' }}>
                        <p style={{ color: '#b91c1c', margin: '0', fontSize: '14px' }}>
                          <strong>Solution:</strong> Contact your system administrator to:
                        </p>
                        <ul style={{ color: '#b91c1c', margin: '8px 0 0 20px', fontSize: '14px' }}>
                          <li>Upgrade your role to VENDOR or SUPERADMIN</li>
                          <li>Or have a SUPERADMIN update the flash sale settings</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="form-group mb-20">
              <label className="body-title" style={{ display: 'block', marginBottom: '8px' }}>
                Flash Sale Status
              </label>
              <div className="flex items-center gap10">
                <input
                  type="checkbox"
                  checked={formData.flashSale}
                  onChange={(e) => setFormData(prev => ({ ...prev, flashSale: e.target.checked }))}
                  id="flashSaleToggle"
                />
                <label htmlFor="flashSaleToggle" className="body-text">
                  Enable flash sale for this product
                </label>
              </div>
            </div>

            {formData.flashSale && (
              <>
                <div className="form-group mb-20">
                  <label className="body-title" style={{ display: 'block', marginBottom: '8px' }}>
                    Flash Sale End Date
                  </label>
                  <input
                    type="date"
                    value={formData.flashSaleEndDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, flashSaleEndDate: e.target.value }))}
                    className="flex-grow"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="form-group mb-20">
                  <label className="body-title" style={{ display: 'block', marginBottom: '8px' }}>
                    Sale Price
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                    className="flex-grow"
                    min="0"
                    step="0.01"
                  />
                  <div className="text-tiny" style={{ color: '#6b7280', marginTop: '4px' }}>
                    Current price: ${product.price}
                  </div>
                </div>
              </>
            )}

            <div className="flex gap10 justify-end">
              <button 
                onClick={() => {
                  setShowModal(false);
                  setError(null);
                }}
                className="tf-button style-2"
                disabled={isUpdating || isPending}
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdate}
                className="tf-button"
                disabled={isUpdating || isPending}
              >
                {isUpdating || isPending ? (
                  <>
                    <i className="icon-loader" style={{ marginRight: '8px' }} />
                    Updating...
                  </>
                ) : (
                  'Update Flash Sale'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
