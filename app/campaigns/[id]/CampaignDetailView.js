"use client";

const campaignTypeLabels = {
  PRODUCT: 'Тодорхой бараа',
  CATEGORY: 'Ангилал',
  BRAND: 'Брэнд',
  GLOBAL: 'Бүх бараа'
};

const discountTypeLabels = {
  PERCENTAGE: 'Хувиар',
  FIXED_AMOUNT: 'Тогтмол дүн',
  BUY_X_GET_Y: 'X авч Y авах',
  FREE_SHIPPING: 'Үнэгүй хүргэлт',
  BUNDLE: 'Багц'
};

export default function CampaignDetailView({ campaign, analytics }) {
  const startDate = new Date(campaign.startDate);
  const endDate = new Date(campaign.endDate);
  const now = new Date();
  const isActive = campaign.active && now >= startDate && now <= endDate;
  const isUpcoming = now < startDate;
  const isExpired = now > endDate;

  return (
    <div className="flex flex-column gap20">
      {/* Status Banner */}
      <div className="p-4 rounded-lg" style={{
        background: isActive ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)' :
                   isExpired ? 'linear-gradient(135deg, #fee2e2, #fecaca)' :
                   'linear-gradient(135deg, #fef3c7, #fde68a)',
        border: `2px solid ${isActive ? '#10b981' : isExpired ? '#ef4444' : '#f59e0b'}`
      }}>
        <div className="flex items-center gap10">
          <i className={`${isActive ? 'icon-check-circle' : isExpired ? 'icon-x-circle' : 'icon-clock'}`} 
             style={{ 
               fontSize: '24px', 
               color: isActive ? '#065f46' : isExpired ? '#991b1b' : '#92400e' 
             }} 
          />
          <div>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: 'bold',
              color: isActive ? '#065f46' : isExpired ? '#991b1b' : '#92400e'
            }}>
              {isActive ? '✅ Идэвхтэй урамшуулал' : 
               isExpired ? '❌ Дууссан урамшуулал' :
               !campaign.active ? '⏸️ Идэвхгүй урамшуулал' :
               '⏰ Удахгүй эхлэх урамшуулал'}
            </h3>
            <p style={{ 
              fontSize: '14px',
              color: isActive ? '#047857' : isExpired ? '#7f1d1d' : '#78350f',
              marginTop: '4px'
            }}>
              {campaign.active ? 
                `${startDate.toLocaleDateString('mn-MN')} - ${endDate.toLocaleDateString('mn-MN')}` :
                'Идэвхжүүлэх шаардлагатай'}
            </p>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="wg-box">
        <h4 className="mb-20" style={{ fontSize: '16px', fontWeight: 'bold' }}>
          Үндсэн мэдээлэл
        </h4>
        
        <div className="flex flex-column gap15">
          <div className="flex gap20">
            <div style={{ flex: '0 0 180px', fontWeight: '500', color: '#6b7280' }}>
              Нэр:
            </div>
            <div style={{ flex: '1', fontWeight: '600' }}>
              {campaign.name}
            </div>
          </div>

          {campaign.description && (
            <div className="flex gap20">
              <div style={{ flex: '0 0 180px', fontWeight: '500', color: '#6b7280' }}>
                Тайлбар:
              </div>
              <div style={{ flex: '1' }}>
                {campaign.description}
              </div>
            </div>
          )}

          <div className="flex gap20">
            <div style={{ flex: '0 0 180px', fontWeight: '500', color: '#6b7280' }}>
              Төрөл:
            </div>
            <div style={{ flex: '1' }}>
              <span style={{
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '13px',
                backgroundColor: '#eff6ff',
                color: '#1e40af'
              }}>
                {campaignTypeLabels[campaign.campaignType]}
              </span>
            </div>
          </div>

          <div className="flex gap20">
            <div style={{ flex: '0 0 180px', fontWeight: '500', color: '#6b7280' }}>
              Хөнгөлөлтийн төрөл:
            </div>
            <div style={{ flex: '1' }}>
              <span style={{
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '13px',
                backgroundColor: '#ecfdf5',
                color: '#065f46'
              }}>
                {discountTypeLabels[campaign.discountType]}
              </span>
            </div>
          </div>

          <div className="flex gap20">
            <div style={{ flex: '0 0 180px', fontWeight: '500', color: '#6b7280' }}>
              Хөнгөлөлтийн хэмжээ:
            </div>
            <div style={{ flex: '1', fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
              {campaign.discountType === 'PERCENTAGE' ? `${campaign.discountValue}%` :
               campaign.discountType === 'FIXED_AMOUNT' ? `₮${Number(campaign.discountValue).toLocaleString()}` :
               campaign.discountType === 'BUY_X_GET_Y' ? `${campaign.buyQuantity} авч ${campaign.getQuantity} авах (${campaign.getDiscountPercent}% хөнгөлөлт)` :
               'Үнэгүй хүргэлт'}
            </div>
          </div>

          <div className="flex gap20">
            <div style={{ flex: '0 0 180px', fontWeight: '500', color: '#6b7280' }}>
              Давуу эрэмбэ:
            </div>
            <div style={{ flex: '1' }}>
              <span style={{
                padding: '6px 16px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 'bold',
                color: campaign.priority >= 50 ? '#dc2626' :
                       campaign.priority >= 20 ? '#d97706' :
                       '#059669',
                backgroundColor: campaign.priority >= 50 ? '#fee2e2' :
                                campaign.priority >= 20 ? '#fef3c7' :
                                '#d1fae5'
              }}>
                {campaign.priority}
              </span>
            </div>
          </div>

          {campaign.minPurchaseAmount && (
            <div className="flex gap20">
              <div style={{ flex: '0 0 180px', fontWeight: '500', color: '#6b7280' }}>
                Доод худалдан авалт:
              </div>
              <div style={{ flex: '1' }}>
                ₮{Number(campaign.minPurchaseAmount).toLocaleString()}
              </div>
            </div>
          )}

          {campaign.maxDiscountAmount && (
            <div className="flex gap20">
              <div style={{ flex: '0 0 180px', fontWeight: '500', color: '#6b7280' }}>
                Дээд хөнгөлөлт:
              </div>
              <div style={{ flex: '1' }}>
                ₮{Number(campaign.maxDiscountAmount).toLocaleString()}
              </div>
            </div>
          )}

          {campaign.creator && (
            <div className="flex gap20">
              <div style={{ flex: '0 0 180px', fontWeight: '500', color: '#6b7280' }}>
                Үүсгэсэн:
              </div>
              <div style={{ flex: '1' }}>
                {campaign.creator.firstName} {campaign.creator.lastName} ({campaign.creator.email})
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Targeting Information */}
      <div className="wg-box">
        <h4 className="mb-20" style={{ fontSize: '16px', fontWeight: 'bold' }}>
          Хамрах хүрээ
        </h4>
        
        <div className="flex gap20 flex-wrap">
          {campaign._count && (
            <>
              {campaign._count.products > 0 && (
                <div className="flex-grow p-4 rounded-lg" style={{ backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>
                    {campaign._count.products}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                    Тодорхой бараа
                  </div>
                </div>
              )}
              
              {campaign._count.categories > 0 && (
                <div className="flex-grow p-4 rounded-lg" style={{ backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>
                    {campaign._count.categories}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                    Ангилал
                  </div>
                </div>
              )}
              
              {campaign._count.brands > 0 && (
                <div className="flex-grow p-4 rounded-lg" style={{ backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>
                    {campaign._count.brands}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                    Брэнд
                  </div>
                </div>
              )}

              {campaign.campaignType === 'GLOBAL' && (
                <div className="flex-grow p-4 rounded-lg" style={{ backgroundColor: '#eff6ff', border: '2px solid #3b82f6' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e40af' }}>
                    <i className="icon-globe" style={{ marginRight: '8px' }} />
                    GLOBAL
                  </div>
                  <div style={{ fontSize: '14px', color: '#1e40af', marginTop: '4px' }}>
                    Бүх бараанд хамаарна
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Targeting Details */}
        {(campaign.products?.length > 0 || campaign.categories?.length > 0 || campaign.brands?.length > 0) && (
          <div className="mt-20">
            {campaign.products && campaign.products.length > 0 && (
              <div className="mb-15">
                <div style={{ fontWeight: '500', marginBottom: '10px' }}>Тодорхой бараа:</div>
                <div className="flex flex-wrap gap10">
                  {campaign.products.slice(0, 10).map((cp) => (
                    <span key={cp.id} style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: '1px solid #e5e7eb'
                    }}>
                      {cp.product.name}
                    </span>
                  ))}
                  {campaign.products.length > 10 && (
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      color: '#6b7280'
                    }}>
                      +{campaign.products.length - 10} өөр
                    </span>
                  )}
                </div>
              </div>
            )}

            {campaign.categories && campaign.categories.length > 0 && (
              <div className="mb-15">
                <div style={{ fontWeight: '500', marginBottom: '10px' }}>Ангилал:</div>
                <div className="flex flex-wrap gap10">
                  {campaign.categories.map((cc) => (
                    <span key={cc.id} style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      backgroundColor: '#eff6ff',
                      color: '#1e40af',
                      border: '1px solid #bfdbfe'
                    }}>
                      {cc.category.name}
                      {cc.includeSubcategories && ' (+ дэд ангилал)'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {campaign.brands && campaign.brands.length > 0 && (
              <div className="mb-15">
                <div style={{ fontWeight: '500', marginBottom: '10px' }}>Брэнд:</div>
                <div className="flex flex-wrap gap10">
                  {campaign.brands.map((cb) => (
                    <span key={cb.id} style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      backgroundColor: '#fef3c7',
                      color: '#92400e',
                      border: '1px solid #fde68a'
                    }}>
                      {cb.brand.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Analytics */}
      {analytics && (
        <div className="wg-box">
          <h4 className="mb-20" style={{ fontSize: '16px', fontWeight: 'bold' }}>
            Гүйцэтгэл (Сүүлийн 7 хоног)
          </h4>
          
          <div className="flex gap20 flex-wrap">
            <div className="flex-grow p-4 rounded-lg" style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#065f46' }}>
                {analytics.performance.usageInPeriod}
              </div>
              <div style={{ fontSize: '14px', color: '#047857', marginTop: '4px' }}>
                Ашигласан тоо
              </div>
            </div>

            <div className="flex-grow p-4 rounded-lg" style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e40af' }}>
                ₮{Math.round(analytics.performance.totalDiscountGiven).toLocaleString()}
              </div>
              <div style={{ fontSize: '14px', color: '#1d4ed8', marginTop: '4px' }}>
                Нийт хөнгөлөлт
              </div>
            </div>

            <div className="flex-grow p-4 rounded-lg" style={{ backgroundColor: '#fef3c7', border: '1px solid #fde68a' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#92400e' }}>
                ₮{Math.round(analytics.performance.totalRevenue).toLocaleString()}
              </div>
              <div style={{ fontSize: '14px', color: '#78350f', marginTop: '4px' }}>
                Нийт орлого
              </div>
            </div>

            <div className="flex-grow p-4 rounded-lg" style={{ backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#374151' }}>
                ₮{Math.round(analytics.performance.avgDiscountPerOrder).toLocaleString()}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                Дундаж хөнгөлөлт
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Usage Information */}
      <div className="wg-box">
        <h4 className="mb-20" style={{ fontSize: '16px', fontWeight: 'bold' }}>
          Ашиглалтын мэдээлэл
        </h4>
        
        <div className="flex flex-column gap15">
          <div className="flex gap20">
            <div style={{ flex: '0 0 180px', fontWeight: '500', color: '#6b7280' }}>
              Нийт ашиглалт:
            </div>
            <div style={{ flex: '1', fontSize: '16px', fontWeight: 'bold' }}>
              {campaign.usageCount || 0}
              {campaign.usageLimit && ` / ${campaign.usageLimit}`}
              {campaign.usageLimit && (
                <span style={{
                  marginLeft: '10px',
                  fontSize: '14px',
                  fontWeight: 'normal',
                  color: '#6b7280'
                }}>
                  ({Math.round((campaign.usageCount / campaign.usageLimit) * 100)}% ашигласан)
                </span>
              )}
            </div>
          </div>

          {campaign.userUsageLimit && (
            <div className="flex gap20">
              <div style={{ flex: '0 0 180px', fontWeight: '500', color: '#6b7280' }}>
                Хэрэглэгчийн хязгаар:
              </div>
              <div style={{ flex: '1' }}>
                Хэрэглэгч бүр {campaign.userUsageLimit} удаа ашиглах эрхтэй
              </div>
            </div>
          )}

          {campaign._count && campaign._count.usageHistory !== undefined && (
            <div className="flex gap20">
              <div style={{ flex: '0 0 180px', fontWeight: '500', color: '#6b7280' }}>
                Түүхийн бичлэг:
              </div>
              <div style={{ flex: '1' }}>
                {campaign._count.usageHistory} ашиглалтын түүх
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Period Information */}
      <div className="wg-box">
        <h4 className="mb-20" style={{ fontSize: '16px', fontWeight: 'bold' }}>
          Хугацааны мэдээлэл
        </h4>
        
        <div className="flex gap20 flex-wrap">
          <div className="flex-grow p-4 rounded-lg" style={{ 
            backgroundColor: isUpcoming ? '#fef3c7' : '#f3f4f6',
            border: `1px solid ${isUpcoming ? '#fde68a' : '#e5e7eb'}`
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
              Эхлэх огноо
            </div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }}>
              {startDate.toLocaleString('mn-MN')}
            </div>
          </div>

          <div className="flex-grow p-4 rounded-lg" style={{ 
            backgroundColor: isExpired ? '#fee2e2' : '#f3f4f6',
            border: `1px solid ${isExpired ? '#fecaca' : '#e5e7eb'}`
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
              Дуусах огноо
            </div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }}>
              {endDate.toLocaleString('mn-MN')}
            </div>
          </div>
        </div>

        <div className="mt-15 p-3 rounded" style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '13px', color: '#6b7280' }}>
            Үүсгэсэн: {new Date(campaign.createdAt).toLocaleString('mn-MN')}
            {campaign.modifiedAt && (
              <span style={{ marginLeft: '20px' }}>
                Зассан: {new Date(campaign.modifiedAt).toLocaleString('mn-MN')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

