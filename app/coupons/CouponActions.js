"use client";
import { useState, useTransition } from "react";
import { deleteCoupon } from "@/lib/api/coupons";
import GetToken from "@/lib/GetTokenClient";

export default function CouponActions({ couponId }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const TOKEN = GetToken();

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this coupon? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    startTransition(async () => {
      try {
        await deleteCoupon(couponId, TOKEN);
        // Refresh the page to show updated list
        window.location.reload();
      } catch (error) {
        alert('Failed to delete coupon: ' + error.message);
        console.error('Delete error:', error);
      } finally {
        setIsDeleting(false);
      }
    });
  };

  return (
    <div 
      className="item trash" 
      onClick={handleDelete}
      style={{ 
        opacity: isDeleting || isPending ? 0.5 : 1,
        cursor: isDeleting || isPending ? 'not-allowed' : 'pointer'
      }}
      title={isDeleting || isPending ? 'Deleting...' : 'Delete coupon'}
    >
      <i className={isDeleting || isPending ? "icon-loader" : "icon-trash-2"} />
    </div>
  );
}
