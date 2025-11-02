"use server";
import Link from "next/link";
import { getCampaigns } from "@/lib/api/campaigns";
import GetTokenServer from "@/lib/GetTokenServer";
import CampaignRowActions from "./CampaignRowActions";

// Campaign type labels
const campaignTypeLabels = {
  PRODUCT: 'Бараа',
  CATEGORY: 'Ангилал',
  BRAND: 'Брэнд',
  GLOBAL: 'Бүгд'
};

// Discount type labels
const discountTypeLabels = {
  PERCENTAGE: 'Хувь',
  FIXED_AMOUNT: 'Тогтмол дүн',
  BUY_X_GET_Y: 'X авч Y авах',
  FREE_SHIPPING: 'Үнэгүй хүргэлт',
  BUNDLE: 'Багц'
};

export default async function CampaignTable({ searchParams }) {
  try {
    const token = await GetTokenServer();
    
    if (!token) {
      return (
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-red-600 mb-4">Нэвтрэх шаардлагатай</h3>
          <p className="text-gray-600">Урамшуулал үзэхийн тулд нэвтэрнэ үү.</p>
        </div>
      );
    }

    const { campaigns, pagination } = await getCampaigns(token, {
      page: searchParams?.page ? parseInt(searchParams.page) : 1,
      limit: 20,
      search: searchParams?.search,
      active: searchParams?.active ? searchParams.active === 'true' : undefined,
      campaignType: searchParams?.campaignType
    });

    return (
      <>
        <div className="wg-table table-all-campaign">
          <ul className="table-title flex gap20 mb-14">
            <li>
              <div className="body-title">Нэр</div>
            </li>
            <li>
              <div className="body-title">Төрөл</div>
            </li>
            <li>
              <div className="body-title">Хөнгөлөлт</div>
            </li>
            <li>
              <div className="body-title">Давуу эрэмбэ</div>
            </li>
            <li>
              <div className="body-title">Хугацаа</div>
            </li>
            <li>
              <div className="body-title">Ашиглалт</div>
            </li>
            <li>
              <div className="body-title">Статус</div>
            </li>
            <li>
              <div className="body-title">Үйлдэл</div>
            </li>
          </ul>
          <ul className="flex flex-column">
            {campaigns.length === 0 ? (
              <li className="text-center py-8">
                <div className="body-text">
                  {searchParams?.search ? 'Таны хайлтанд тохирох урамшуулал олдсонгүй.' : 'Урамшуулал үүсгээгүй байна.'}
                </div>
                {!searchParams?.search && (
                  <Link href="/new-campaign" className="tf-button style-1 mt-4">
                    Эхний урамшууллаа үүсгэх
                  </Link>
                )}
              </li>
            ) : (
              campaigns.map((campaign) => {
                const startDate = new Date(campaign.startDate);
                const endDate = new Date(campaign.endDate);
                const now = new Date();
                const isActive = campaign.active && now >= startDate && now <= endDate;
                const isUpcoming = now < startDate;
                const isExpired = now > endDate;
                
                // Campaign type icon
                const campaignTypeIcon = {
                  PRODUCT: 'icon-shopping-bag',
                  CATEGORY: 'icon-grid',
                  BRAND: 'icon-award',
                  GLOBAL: 'icon-globe'
                }[campaign.campaignType] || 'icon-tag';

                // Campaign icon color based on status
                const iconBgColor = isActive ? 'linear-gradient(135deg, #10b981, #059669)' : 
                                   isExpired ? 'linear-gradient(135deg, #6b7280, #4b5563)' :
                                   'linear-gradient(135deg, #f59e0b, #d97706)';

                return (
                  <li className="product-item gap14" key={campaign.id}>
                    <div className="image no-bg">
                      <div className="campaign-icon" style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '8px',
                        background: iconBgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        <i className={campaignTypeIcon} style={{ fontSize: '20px' }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap20 flex-grow">
                      {/* Name */}
                      <div className="name" style={{ flex: '1.5' }}>
                        <Link href={`/campaigns/${campaign.id}`} className="body-title-2">
                          {campaign.name}
                        </Link>
                        {campaign.description && (
                          <div className="text-tiny" style={{ color: '#6b7280', marginTop: '4px' }}>
                            {campaign.description.substring(0, 60)}
                            {campaign.description.length > 60 ? '...' : ''}
                          </div>
                        )}
                      </div>
                      
                      {/* Type */}
                      <div className="body-text" style={{ flex: '1' }}>
                        <div style={{ fontWeight: '500' }}>
                          {campaignTypeLabels[campaign.campaignType]}
                        </div>
                        <div className="text-tiny" style={{ color: '#6b7280' }}>
                          {campaign._count ? (
                            campaign.campaignType === 'PRODUCT' ? `${campaign._count.products} бараа` :
                            campaign.campaignType === 'CATEGORY' ? `${campaign._count.categories} ангилал` :
                            campaign.campaignType === 'BRAND' ? `${campaign._count.brands} брэнд` :
                            'Бүх бараа'
                          ) : ''}
                        </div>
                      </div>
                      
                      {/* Discount */}
                      <div className="body-text" style={{ flex: '1' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#10b981' }}>
                          {campaign.discountType === 'PERCENTAGE' ? `${campaign.discountValue}%` :
                           campaign.discountType === 'FIXED_AMOUNT' ? `₮${campaign.discountValue.toLocaleString()}` :
                           campaign.discountType === 'BUY_X_GET_Y' ? `${campaign.buyQuantity}+${campaign.getQuantity}` :
                           campaign.discountType === 'FREE_SHIPPING' ? 'Үнэгүй' : '-'}
                        </div>
                        <div className="text-tiny" style={{ color: '#6b7280' }}>
                          {discountTypeLabels[campaign.discountType]}
                        </div>
                      </div>
                      
                      {/* Priority */}
                      <div className="body-text" style={{ flex: '0.5' }}>
                        <div style={{ 
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          color: campaign.priority >= 50 ? '#dc2626' :
                                 campaign.priority >= 20 ? '#d97706' :
                                 '#059669',
                          backgroundColor: campaign.priority >= 50 ? '#fee2e2' :
                                          campaign.priority >= 20 ? '#fef3c7' :
                                          '#d1fae5'
                        }}>
                          {campaign.priority}
                        </div>
                      </div>
                      
                      {/* Period */}
                      <div className="body-text" style={{ flex: '1' }}>
                        <div style={{ fontSize: '13px' }}>
                          {startDate.toLocaleDateString('mn-MN')}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>
                          → {endDate.toLocaleDateString('mn-MN')}
                        </div>
                      </div>
                      
                      {/* Usage */}
                      <div className="body-text" style={{ flex: '1' }}>
                        <div style={{ fontWeight: '500' }}>
                          {campaign.usageCount || 0}
                          {campaign.usageLimit ? ` / ${campaign.usageLimit}` : ''}
                        </div>
                        {campaign._count?.usageHistory !== undefined && (
                          <div className="text-tiny" style={{ color: '#6b7280' }}>
                            {campaign._count.usageHistory} түүх
                          </div>
                        )}
                      </div>
                      
                      {/* Status */}
                      <div className="body-text" style={{ flex: '1' }}>
                        <span
                          className="status-badge"
                          style={{
                            padding: '6px 12px',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: isActive && campaign.active ? '#065f46' : 
                                   isExpired || !campaign.active ? '#991b1b' : 
                                   '#92400e',
                            backgroundColor: isActive && campaign.active ? '#d1fae5' : 
                                           isExpired || !campaign.active ? '#fee2e2' : 
                                           '#fef3c7'
                          }}
                        >
                          {isActive && campaign.active ? 'Идэвхтэй' : 
                           isExpired ? 'Дууссан' :
                           !campaign.active ? 'Идэвхгүй' :
                           'Удахгүй'}
                        </span>
                      </div>
                      
                      {/* Actions */}
                      <div className="list-icon-function" style={{ flex: '0.8' }}>
                        <Link href={`/campaigns/${campaign.id}`} className="item eye">
                          <i className="icon-eye" />
                        </Link>
                        <Link href={`/campaigns/${campaign.id}/edit`} className="item edit">
                          <i className="icon-edit-3" />
                        </Link>
                        <CampaignRowActions campaign={campaign} />
                      </div>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
        
        {campaigns.length > 0 && pagination && (
          <>
            <div className="divider" />
            <div className="flex items-center justify-between flex-wrap gap10">
              <div className="text-tiny">
                Хуудас {pagination.page} / {pagination.totalPages} - Нийт {pagination.total} урамшуулал
              </div>
              {pagination.totalPages > 1 && (
                <div className="flex gap-2">
                  {pagination.hasPrev && (
                    <Link
                      href={`/campaigns?page=${pagination.page - 1}${searchParams?.search ? `&search=${searchParams.search}` : ''}`}
                      className="tf-button style-2"
                    >
                      Өмнөх
                    </Link>
                  )}
                  {pagination.hasNext && (
                    <Link
                      href={`/campaigns?page=${pagination.page + 1}${searchParams?.search ? `&search=${searchParams.search}` : ''}`}
                      className="tf-button style-1"
                    >
                      Дараах
                    </Link>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </>
    );
  } catch (error) {
    console.error('Error in CampaignTable:', error);
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium text-red-600 mb-4">Урамшуулал ачаалахад алдаа гарлаа</h3>
        <p className="text-gray-600">{error.message}</p>
      </div>
    );
  }
}

