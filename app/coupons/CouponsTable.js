"use server";
import Link from "next/link";
import { getCoupons } from "@/lib/api/coupons";
import { auth } from "@/auth";
import CouponActions from "./CouponActions";

export default async function CouponsTable({ searchParams }) {
  try {
    const session = await auth();
    const token = session?.user?.accessToken || null;
    if (!token) {
      return (
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-red-600 mb-4">Authentication Required</h3>
          <p className="text-gray-600">Please log in to view coupons.</p>
        </div>
      );
    }

    const coupons = await getCoupons(token);

    const filteredCoupons = searchParams?.search 
      ? coupons.filter(coupon => coupon.code.toLowerCase().includes(searchParams.search.toLowerCase()))
      : coupons;

    return (
      <>
        <div className="wg-table table-all-coupon">
          <ul className="table-title flex gap20 mb-14">
            <li><div className="body-title">Coupon Code</div></li>
            <li><div className="body-title">Discount</div></li>
            <li><div className="body-title">Valid Period</div></li>
            <li><div className="body-title">Usage Limits</div></li>
            <li><div className="body-title">Status</div></li>
            <li><div className="body-title">Actions</div></li>
          </ul>
          <ul className="flex flex-column">
            {filteredCoupons.length === 0 ? (
              <li className="text-center py-8">
                <div className="body-text">
                  {searchParams?.search ? 'No coupons found matching your search.' : 'No coupons created yet.'}
                </div>
                {!searchParams?.search && (
                  <Link href="/new-coupon" className="tf-button style-1 mt-4">Create your first coupon</Link>
                )}
              </li>
            ) : (
              filteredCoupons.map((coupon) => {
                const validFrom = new Date(coupon.validFrom);
                const validUntil = new Date(coupon.validUntil);
                const now = new Date();
                const isActive = now >= validFrom && now <= validUntil;
                const isExpired = now > validUntil;

                return (
                  <li className="product-item gap14" key={coupon.id}>
                    <div className="image no-bg">
                      <div className="coupon-icon" style={{ width: '48px', height: '48px', borderRadius: '8px', background: isActive ? 'linear-gradient(135deg, #10b981, #059669)' : isExpired ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <i className="icon-tag" style={{ fontSize: '20px' }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap20 flex-grow">
                      <div className="name">
                        <div className="body-title-2" style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 'bold' }}>{coupon.code}</div>
                        {coupon.minPurchase && (<div className="text-tiny" style={{ color: '#6b7280' }}>Min purchase: ${coupon.minPurchase}</div>)}
                      </div>
                      <div className="body-text">
                        <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{coupon.discountPercent}% OFF</div>
                        {coupon.maxDiscount && (<div className="text-tiny" style={{ color: '#6b7280' }}>Max: ${coupon.maxDiscount}</div>)}
                      </div>
                      <div className="body-text">
                        <div style={{ fontSize: '14px' }}>{validFrom.toLocaleDateString()}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>to {validUntil.toLocaleDateString()}</div>
                      </div>
                      <div className="body-text">
                        <div>{coupon.usageCount || 0} used</div>
                        {coupon.maxUsage ? (<div className="text-tiny" style={{ color: '#6b7280' }}>Limit: {coupon.maxUsage}</div>) : (<div className="text-tiny" style={{ color: '#6b7280' }}>No limit</div>)}
                      </div>
                      <div className="body-text">
                        <span className={`status-badge`} style={{ padding: '6px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold', color: isActive ? '#065f46' : isExpired ? '#991b1b' : '#92400e', backgroundColor: isActive ? '#d1fae5' : isExpired ? '#fee2e2' : '#fef3c7' }}>
                          {isActive ? 'Active' : isExpired ? 'Expired' : 'Upcoming'}
                        </span>
                      </div>
                      <div className="list-icon-function">
                        <Link href={`/coupon-detail/${coupon.id}`} className="item eye"><i className="icon-eye" /></Link>
                        <Link href={`/edit-coupon/${coupon.id}`} className="item edit"><i className="icon-edit-3" /></Link>
                        <CouponActions couponId={coupon.id} />
                      </div>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
        <div className="divider" />
        <div className="flex items-center justify-between flex-wrap gap10">
          <div className="text-tiny">Showing {filteredCoupons.length} of {coupons.length} coupons</div>
        </div>
      </>
    );
  } catch (error) {
    console.error('Error in CouponsTable:', error);
    return (<div className="text-center py-8"><h3 className="text-lg font-medium text-red-600 mb-4">Error Loading Coupons</h3><p className="text-gray-600">{error.message}</p></div>);
  }
}
