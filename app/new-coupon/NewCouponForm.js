"use client";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import GetToken, { GetSession } from "@/lib/GetTokenClient";
import { createCoupon } from "@/lib/api/coupons";
import { useRouter } from "next/navigation";

// Coupon validation schema
const couponSchema = z.object({
  code: z.string()
    .min(3, "Code must be at least 3 characters")
    .max(20, "Code too long")
    .regex(/^[A-Z0-9_-]+$/, "Code must contain only uppercase letters, numbers, underscore, and dash"),
  discountPercent: z.number()
    .min(1, "Discount must be at least 1%")
    .max(100, "Discount cannot exceed 100%"),
  validFrom: z.string().min(1, "Start date is required"),
  validUntil: z.string().min(1, "End date is required"),
  minPurchase: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).optional(),
  maxUsage: z.number().min(1).optional(),
}).refine((data) => {
  return new Date(data.validUntil) > new Date(data.validFrom);
}, {
  message: "End date must be after start date",
  path: ["validUntil"],
});

export default function NewCouponForm() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();
  const TOKEN = GetToken();
  const session = GetSession();
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: "",
      discountPercent: 10,
      validFrom: "",
      validUntil: "",
      minPurchase: undefined,
      maxDiscount: undefined,
      maxUsage: undefined,
    },
  });

  async function onSubmit(values) {
    setError("");
    setSuccess("");
    
    startTransition(async () => {
      try {
        const couponData = {
          code: values.code.toUpperCase(),
          discountPercent: Number(values.discountPercent),
          validFrom: values.validFrom,
          validUntil: values.validUntil,
          ...(values.minPurchase && { minPurchase: Number(values.minPurchase) }),
          ...(values.maxDiscount && { maxDiscount: Number(values.maxDiscount) }),
          ...(values.maxUsage && { maxUsage: Number(values.maxUsage) }),
        };

        await createCoupon(couponData, TOKEN);
        setSuccess("Coupon created successfully!");
        form.reset();
        
        // Redirect to coupons list after 2 seconds
        setTimeout(() => {
          router.push('/coupons');
        }, 2000);
      } catch (error) {
        setError(error.message || "Failed to create coupon");
        console.error("Coupon creation error:", error);
      }
    });
  }

  // Check if user has permission to create coupons
  const canCreateCoupon = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPERADMIN';

  if (!canCreateCoupon) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium text-red-600 mb-4">Access Denied</h3>
        <p className="text-gray-600">You don't have permission to create coupons. Only administrators can manage coupons.</p>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="form-new-product form-style-1">
      {error && (
        <div className="alert alert-danger mb-4" style={{ 
          color: '#dc2626', 
          padding: '12px 16px', 
          border: '1px solid #fecaca', 
          borderRadius: '8px',
          backgroundColor: '#fef2f2'
        }}>
          <i className="icon-alert-circle" style={{ marginRight: '8px' }} />
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success mb-4" style={{ 
          color: '#059669', 
          padding: '12px 16px', 
          border: '1px solid #a7f3d0', 
          borderRadius: '8px',
          backgroundColor: '#ecfdf5'
        }}>
          <i className="icon-check-circle" style={{ marginRight: '8px' }} />
          {success}
        </div>
      )}

      <div className="flex gap20 flex-wrap">
        <fieldset className="name flex-grow">
          <div className="body-title">
            Coupon Code <span className="tf-color-1">*</span>
          </div>
          <input
            {...form.register("code")}
            className="flex-grow"
            type="text"
            placeholder="e.g., SUMMER20, WELCOME10"
            style={{ textTransform: 'uppercase' }}
            tabIndex={0}
          />
          <div className="text-tiny" style={{ color: '#6b7280', marginTop: '4px' }}>
            Only uppercase letters, numbers, underscore, and dash allowed
          </div>
          {form.formState.errors.code && (
            <div className="text-red-500 text-sm mt-1">
              {form.formState.errors.code.message}
            </div>
          )}
        </fieldset>

        <fieldset className="discount">
          <div className="body-title">
            Discount Percentage <span className="tf-color-1">*</span>
          </div>
          <input
            {...form.register("discountPercent", { valueAsNumber: true })}
            className="flex-grow"
            type="number"
            min="1"
            max="100"
            placeholder="10"
          />
          {form.formState.errors.discountPercent && (
            <div className="text-red-500 text-sm mt-1">
              {form.formState.errors.discountPercent.message}
            </div>
          )}
        </fieldset>
      </div>

      <div className="flex gap20 flex-wrap">
        <fieldset className="valid-from flex-grow">
          <div className="body-title">
            Valid From <span className="tf-color-1">*</span>
          </div>
          <input
            {...form.register("validFrom")}
            className="flex-grow"
            type="date"
            min={new Date().toISOString().split('T')[0]}
          />
          {form.formState.errors.validFrom && (
            <div className="text-red-500 text-sm mt-1">
              {form.formState.errors.validFrom.message}
            </div>
          )}
        </fieldset>

        <fieldset className="valid-until flex-grow">
          <div className="body-title">
            Valid Until <span className="tf-color-1">*</span>
          </div>
          <input
            {...form.register("validUntil")}
            className="flex-grow"
            type="date"
            min={new Date().toISOString().split('T')[0]}
          />
          {form.formState.errors.validUntil && (
            <div className="text-red-500 text-sm mt-1">
              {form.formState.errors.validUntil.message}
            </div>
          )}
        </fieldset>
      </div>

      <div className="flex gap20 flex-wrap">
        <fieldset className="min-purchase flex-grow">
          <div className="body-title">Minimum Purchase Amount (Optional)</div>
          <input
            {...form.register("minPurchase", { valueAsNumber: true })}
            className="flex-grow"
            type="number"
            min="0"
            step="0.01"
            placeholder="50.00"
          />
          <div className="text-tiny" style={{ color: '#6b7280', marginTop: '4px' }}>
            Minimum order value required to use this coupon
          </div>
          {form.formState.errors.minPurchase && (
            <div className="text-red-500 text-sm mt-1">
              {form.formState.errors.minPurchase.message}
            </div>
          )}
        </fieldset>

        <fieldset className="max-discount flex-grow">
          <div className="body-title">Maximum Discount Amount (Optional)</div>
          <input
            {...form.register("maxDiscount", { valueAsNumber: true })}
            className="flex-grow"
            type="number"
            min="0"
            step="0.01"
            placeholder="100.00"
          />
          <div className="text-tiny" style={{ color: '#6b7280', marginTop: '4px' }}>
            Maximum discount amount for this coupon
          </div>
          {form.formState.errors.maxDiscount && (
            <div className="text-red-500 text-sm mt-1">
              {form.formState.errors.maxDiscount.message}
            </div>
          )}
        </fieldset>
      </div>

      <fieldset className="max-usage">
        <div className="body-title">Maximum Usage Count (Optional)</div>
        <input
          {...form.register("maxUsage", { valueAsNumber: true })}
          className="flex-grow"
          type="number"
          min="1"
          placeholder="100"
        />
        <div className="text-tiny" style={{ color: '#6b7280', marginTop: '4px' }}>
          Total number of times this coupon can be used. Leave empty for unlimited usage.
        </div>
        {form.formState.errors.maxUsage && (
          <div className="text-red-500 text-sm mt-1">
            {form.formState.errors.maxUsage.message}
          </div>
        )}
      </fieldset>

      <div className="bot">
        <div />
        <button 
          className="tf-button w208" 
          type="submit"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <i className="icon-loader" style={{ marginRight: '8px' }} />
              Creating...
            </>
          ) : (
            <>
              <i className="icon-plus" style={{ marginRight: '8px' }} />
              Create Coupon
            </>
          )}
        </button>
      </div>
    </form>
  );
}
