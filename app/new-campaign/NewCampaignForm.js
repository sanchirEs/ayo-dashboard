"use client";
import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import GetToken, { GetSession } from "@/lib/GetTokenClient";
import { createCampaign } from "@/lib/api/campaigns";
import { getCategoryTreePublic } from "@/lib/api/categories-client";
import { getBrandsClient } from "@/lib/api/brands";
import { useRouter } from "next/navigation";

// Campaign validation schema
const campaignSchema = z.object({
  name: z.string().min(3, "Нэр хамгийн багадаа 3 тэмдэгт байх ёстой"),
  description: z.string().optional(),
  campaignType: z.enum(['PRODUCT', 'CATEGORY', 'BRAND', 'GLOBAL']),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'BUY_X_GET_Y', 'FREE_SHIPPING']),
  discountValue: z.number().min(0, "Утга 0-ээс их байх ёстой"),
  priority: z.number().min(1, "Давуу эрэмбэ 1-99 хооронд байх ёстой").max(99),
  startDate: z.string().min(1, "Эхлэх огноо шаардлагатай"),
  endDate: z.string().min(1, "Дуусах огноо шаардлагатай"),
  minPurchaseAmount: z.number().optional(),
  maxDiscountAmount: z.number().optional(),
  usageLimit: z.number().optional(),
  userUsageLimit: z.number().optional(),
  buyQuantity: z.number().optional(),
  getQuantity: z.number().optional(),
  getDiscountPercent: z.number().optional(),
  productIds: z.array(z.number()).optional(),
  categoryIds: z.array(z.number()).optional(),
  brandIds: z.array(z.number()).optional(),
}).refine((data) => {
  return new Date(data.endDate) > new Date(data.startDate);
}, {
  message: "Дуусах огноо нь эхлэх огнооноос хойш байх ёстой",
  path: ["endDate"],
});

export default function NewCampaignForm() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const TOKEN = GetToken();
  const session = GetSession();
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      description: "",
      campaignType: "GLOBAL",
      discountType: "PERCENTAGE",
      discountValue: 10,
      priority: 10,
      startDate: "",
      endDate: "",
      minPurchaseAmount: undefined,
      maxDiscountAmount: undefined,
      usageLimit: undefined,
      userUsageLimit: undefined,
      buyQuantity: undefined,
      getQuantity: undefined,
      getDiscountPercent: undefined,
      productIds: [],
      categoryIds: [],
      brandIds: [],
    },
  });

  const campaignType = form.watch("campaignType");
  const discountType = form.watch("discountType");

  // Load categories and brands
  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesData, brandsData] = await Promise.all([
          getCategoryTreePublic(),
          getBrandsClient(TOKEN)
        ]);
        setCategories(categoriesData);
        setBrands(brandsData);
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };
    
    if (TOKEN) {
      loadData();
    }
  }, [TOKEN]);

  async function onSubmit(values) {
    setError("");
    setSuccess("");
    
    startTransition(async () => {
      try {
        const campaignData = {
          name: values.name,
          description: values.description || undefined,
          campaignType: values.campaignType,
          discountType: values.discountType,
          discountValue: Number(values.discountValue),
          priority: Number(values.priority),
          startDate: new Date(values.startDate).toISOString(),
          endDate: new Date(values.endDate).toISOString(),
          ...(values.minPurchaseAmount && { minPurchaseAmount: Number(values.minPurchaseAmount) }),
          ...(values.maxDiscountAmount && { maxDiscountAmount: Number(values.maxDiscountAmount) }),
          ...(values.usageLimit && { usageLimit: Number(values.usageLimit) }),
          ...(values.userUsageLimit && { userUsageLimit: Number(values.userUsageLimit) }),
          ...(values.buyQuantity && { buyQuantity: Number(values.buyQuantity) }),
          ...(values.getQuantity && { getQuantity: Number(values.getQuantity) }),
          ...(values.getDiscountPercent && { getDiscountPercent: Number(values.getDiscountPercent) }),
          ...(values.productIds && values.productIds.length > 0 && { productIds: values.productIds }),
          ...(values.categoryIds && values.categoryIds.length > 0 && { categoryIds: values.categoryIds }),
          ...(values.brandIds && values.brandIds.length > 0 && { brandIds: values.brandIds }),
        };

        await createCampaign(campaignData, TOKEN);
        setSuccess("Урамшуулал амжилттай үүсгэлээ! Идэвхжүүлэх хэрэгтэй.");
        form.reset();
        
        // Redirect to campaigns list after 2 seconds
        setTimeout(() => {
          router.push('/campaigns');
        }, 2000);
      } catch (error) {
        setError(error.message || "Урамшуулал үүсгэхэд алдаа гарлаа");
        console.error("Campaign creation error:", error);
      }
    });
  }

  // Check if user has permission
  const canCreateCampaign = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPERADMIN';

  if (!canCreateCampaign) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium text-red-600 mb-4">Хандах эрхгүй</h3>
        <p className="text-gray-600">Зөвхөн админ хэрэглэгч урамшуулал үүсгэх эрхтэй.</p>
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

      {/* Basic Information */}
      <div className="flex gap20 flex-wrap">
        <fieldset className="name flex-grow">
          <div className="body-title">
            Урамшууллын нэр <span className="tf-color-1">*</span>
          </div>
          <input
            {...form.register("name")}
            className="flex-grow"
            type="text"
            placeholder="Жишээ нь: Хаврын хямдрал 2025"
            tabIndex={0}
          />
          {form.formState.errors.name && (
            <div className="text-red-500 text-sm mt-1">
              {form.formState.errors.name.message}
            </div>
          )}
        </fieldset>

        <fieldset className="priority" style={{ maxWidth: '150px' }}>
          <div className="body-title">
            Давуу эрэмбэ <span className="tf-color-1">*</span>
          </div>
          <input
            {...form.register("priority", { valueAsNumber: true })}
            className="flex-grow"
            type="number"
            min="1"
            max="99"
            placeholder="10"
          />
          <div className="text-tiny" style={{ color: '#6b7280', marginTop: '4px' }}>
            {/* 1-19: Суурь, 20-49: Энгийн, 50-79: Томоохон, 80-99: Онцгой */}
          </div>
          {form.formState.errors.priority && (
            <div className="text-red-500 text-sm mt-1">
              {form.formState.errors.priority.message}
            </div>
          )}
        </fieldset>
      </div>

      {/* <fieldset className="description">
        <div className="body-title">Тайлбар</div>
        <textarea
          {...form.register("description")}
          className="flex-grow"
          placeholder="Урамшууллын тухай дэлгэрэнгүй мэдээлэл..."
          rows={3}
        />
      </fieldset> */}

      {/* Campaign & Discount Type */}
      <div className="flex gap20 flex-wrap">
        <fieldset className="campaign-type flex-grow">
          <div className="body-title">
            Урамшууллын төрөл <span className="tf-color-1">*</span>
          </div>
          <select
            {...form.register("campaignType")}
            className="flex-grow"
          >
            {/* <option value="GLOBAL">Бүх бараа (Дэлгүүр даяар)</option> */}
            <option value="CATEGORY">Ангилал</option>
            <option value="BRAND">Брэнд</option>
            <option value="PRODUCT">Тодорхой бараа</option>
          </select>
          <div className="text-tiny" style={{ color: '#6b7280', marginTop: '4px' }}>
            Хэнд хамаарахыг сонгоно уу
          </div>
        </fieldset>

        <fieldset className="discount-type flex-grow">
          <div className="body-title">
            Хөнгөлөлтийн төрөл <span className="tf-color-1">*</span>
          </div>
          <select
            {...form.register("discountType")}
            className="flex-grow"
          >
            <option value="PERCENTAGE">Хувиар (25% OFF)</option>
            <option value="FIXED_AMOUNT">Тогтмол дүн (₮10,000 OFF)</option>
            <option value="BUY_X_GET_Y">X авч Y авах (2+1 үнэгүй)</option>
            <option value="FREE_SHIPPING">Үнэгүй хүргэлт</option>
          </select>
        </fieldset>
      </div>

      {/* Discount Value */}
      {discountType === 'BUY_X_GET_Y' ? (
        <div className="flex gap20 flex-wrap">
          <fieldset className="buy-quantity flex-grow">
            <div className="body-title">
              Авах тоо <span className="tf-color-1">*</span>
            </div>
            <input
              {...form.register("buyQuantity", { valueAsNumber: true })}
              className="flex-grow"
              type="number"
              min="1"
              placeholder="2"
            />
            <div className="text-tiny" style={{ color: '#6b7280', marginTop: '4px' }}>
              Хэдэн ширхэг авах вэ
            </div>
          </fieldset>

          <fieldset className="get-quantity flex-grow">
            <div className="body-title">
              Авах бонус тоо <span className="tf-color-1">*</span>
            </div>
            <input
              {...form.register("getQuantity", { valueAsNumber: true })}
              className="flex-grow"
              type="number"
              min="1"
              placeholder="1"
            />
            <div className="text-tiny" style={{ color: '#6b7280', marginTop: '4px' }}>
              Хэдэн ширхэг үнэгүй/хямдрах вэ
            </div>
          </fieldset>

          <fieldset className="get-discount-percent flex-grow">
            <div className="body-title">
              Бонус барааны хөнгөлөлт % <span className="tf-color-1">*</span>
            </div>
            <input
              {...form.register("getDiscountPercent", { valueAsNumber: true })}
              className="flex-grow"
              type="number"
              min="0"
              max="100"
              placeholder="100"
            />
            <div className="text-tiny" style={{ color: '#6b7280', marginTop: '4px' }}>
              100 = бүрэн үнэгүй, 50 = 50% хямдрах
            </div>
          </fieldset>
        </div>
      ) : (
        <fieldset className="discount-value">
          <div className="body-title">
            Хөнгөлөлтийн хэмжээ <span className="tf-color-1">*</span>
          </div>
          <input
            {...form.register("discountValue", { valueAsNumber: true })}
            className="flex-grow"
            type="number"
            min="0"
            max={discountType === 'PERCENTAGE' ? 100 : undefined}
            step={discountType === 'FIXED_AMOUNT' ? '100' : '1'}
            placeholder={discountType === 'PERCENTAGE' ? '25' : '10000'}
          />
          <div className="text-tiny" style={{ color: '#6b7280', marginTop: '4px' }}>
            {discountType === 'PERCENTAGE' && '1-100 хооронд хувь (25 = 25% хөнгөлөлт)'}
            {discountType === 'FIXED_AMOUNT' && 'Тогтмол дүн (₮10,000 = ₮10,000 хөнгөлөлт)'}
            {discountType === 'FREE_SHIPPING' && 'Үнэгүй хүргэлт (0 гэж оруулна уу)'}
          </div>
          {form.formState.errors.discountValue && (
            <div className="text-red-500 text-sm mt-1">
              {form.formState.errors.discountValue.message}
            </div>
          )}
        </fieldset>
      )}

      {/* Date Range */}
      <div className="flex gap20 flex-wrap">
        <fieldset className="start-date flex-grow">
          <div className="body-title">
            Эхлэх огноо <span className="tf-color-1">*</span>
          </div>
          <input
            {...form.register("startDate")}
            className="flex-grow"
            type="datetime-local"
          />
          {form.formState.errors.startDate && (
            <div className="text-red-500 text-sm mt-1">
              {form.formState.errors.startDate.message}
            </div>
          )}
        </fieldset>

        <fieldset className="end-date flex-grow">
          <div className="body-title">
            Дуусах огноо <span className="tf-color-1">*</span>
          </div>
          <input
            {...form.register("endDate")}
            className="flex-grow"
            type="datetime-local"
          />
          {form.formState.errors.endDate && (
            <div className="text-red-500 text-sm mt-1">
              {form.formState.errors.endDate.message}
            </div>
          )}
        </fieldset>
      </div>

      {/* Targeting - Categories */}
      {campaignType === 'CATEGORY' && (
        <fieldset className="categories">
          <div className="body-title">
            Ангилал сонгох <span className="tf-color-1">*</span>
          </div>
          <select
            {...form.register("categoryIds")}
            className="flex-grow"
            multiple
            size="5"
            style={{ height: 'auto', minHeight: '120px' }}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <div className="text-tiny" style={{ color: '#6b7280', marginTop: '4px' }}>
            Ctrl/Cmd + Click олон ангилал сонгох
          </div>
        </fieldset>
      )}

      {/* Targeting - Brands */}
      {campaignType === 'BRAND' && (
        <fieldset className="brands">
          <div className="body-title">
            Брэнд сонгох <span className="tf-color-1">*</span>
          </div>
          <select
            {...form.register("brandIds")}
            className="flex-grow"
            multiple
            size="5"
            style={{ height: 'auto', minHeight: '120px' }}
          >
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
          <div className="text-tiny" style={{ color: '#6b7280', marginTop: '4px' }}>
            Ctrl/Cmd + Click олон брэнд сонгох
          </div>
        </fieldset>
      )}

      {/* Constraints */}
      <div className="flex gap20 flex-wrap">
        <fieldset className="min-purchase flex-grow">
          <div className="body-title">Хамгийн бага худалдан авалт</div>
          <input
            {...form.register("minPurchaseAmount", { valueAsNumber: true })}
            className="flex-grow"
            type="number"
            min="0"
            step="1000"
            placeholder="50000"
          />
          <div className="text-tiny" style={{ color: '#6b7280', marginTop: '4px' }}>
            Урамшуулал ашиглахад шаардлагатай доод үнэ
          </div>
        </fieldset>

        <fieldset className="max-discount flex-grow">
          <div className="body-title">Хамгийн их хөнгөлөлт</div>
          <input
            {...form.register("maxDiscountAmount", { valueAsNumber: true })}
            className="flex-grow"
            type="number"
            min="0"
            step="1000"
            placeholder="200000"
          />
          <div className="text-tiny" style={{ color: '#6b7280', marginTop: '4px' }}>
            Хөнгөлөлтийн дээд хязгаар
          </div>
        </fieldset>
      </div>

      {/* Usage Limits */}
      <div className="flex gap20 flex-wrap">
        <fieldset className="usage-limit flex-grow">
          <div className="body-title">Нийт ашиглах хязгаар</div>
          <input
            {...form.register("usageLimit", { valueAsNumber: true })}
            className="flex-grow"
            type="number"
            min="1"
            placeholder="1000"
          />
          <div className="text-tiny" style={{ color: '#6b7280', marginTop: '4px' }}>
            Урамшууллыг хэдэн удаа ашиглах вэ (хоосон бол хязгааргүй)
          </div>
        </fieldset>

        <fieldset className="user-usage-limit flex-grow">
          <div className="body-title">Хэрэглэгч тус бүрийн хязгаар</div>
          <input
            {...form.register("userUsageLimit", { valueAsNumber: true })}
            className="flex-grow"
            type="number"
            min="1"
            placeholder="1"
          />
          <div className="text-tiny" style={{ color: '#6b7280', marginTop: '4px' }}>
            Нэг хэрэглэгч хэдэн удаа ашиглах вэ
          </div>
        </fieldset>
      </div>

      {/* Help Text */}
      <div className="p-4 rounded-lg" style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <div className="flex gap10 items-start">
          <i className="icon-info" style={{ color: '#1d4ed8', marginTop: '2px' }} />
          <div style={{ fontSize: '13px', color: '#1e40af' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Анхаарах зүйлс:</div>
            <ul style={{ paddingLeft: '20px', margin: '0' }}>
              <li>Урамшуулал үүсгэсний дараа идэвхжүүлэх шаардлагатай</li>
              <li>Олон урамшуулал хамааралтай бол давуу эрэмбэ өндөр нь илүү эрхтэй</li>
              <li>Барааны үнэ автоматаар тооцоологдож шинэчлэгдэнэ</li>
              <li>Coupon-тэй хамт ашиглаж болно</li>
            </ul>
          </div>
        </div>
      </div>

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
              Үүсгэж байна...
            </>
          ) : (
            <>
              <i className="icon-plus" style={{ marginRight: '8px' }} />
              Урамшуулал үүсгэх
            </>
          )}
        </button>
      </div>
    </form>
  );
}

