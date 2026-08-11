import { z } from "zod";
const {
  optionalString,
  optionalNumber,
  optionalBoolean,
  requiredString,
  requiredNumber,
} = require("./constantValidation");

/**
 * `File` is a browser global. `z.instanceof(File)` dereferences it while the
 * schema object is being constructed — i.e. at module load — so merely importing
 * this file from anything Next renders on the server threw
 * `ReferenceError: File is not defined` and failed the production build at the
 * prerender step. The old product pages worked around it by loading their whole
 * form through `dynamic(..., { ssr: false })`; this removes the landmine instead,
 * so any server-rendered module can import these schemas safely.
 *
 * Behaviour is unchanged in the browser, where `File` exists and the check is the
 * same `instanceof`. On the server the branch simply never matches, which is
 * correct: files are only ever chosen client-side.
 */
const fileInstance = z.custom<File>(
  (value) => typeof File !== "undefined" && value instanceof File,
  { message: "Зураг сонгоно уу" }
);

// Image schema for the new backend structure
const imageSchema = z.object({
  imageUrl: z.string().url({ message: "Зөв URL оруулна уу" }),
  altText: z.string().min(1, { message: "Alt текст оруулна уу" }),
  isPrimary: z.boolean().default(false),
});

// Variant attribute schema
const variantAttributeSchema = z.object({
  attributeId: z.number().min(1, { message: "Аттрибут ID оруулна уу" }),
  optionId: z.number().min(1, { message: "Сонголт ID оруулна уу" }),
});

// Inventory schema
const inventorySchema = z.object({
  quantity: z.number().min(0, { message: "Тоо ширхэг 0-с дээш байх ёстой" }),
});

// Product specification schema
const productSpecSchema = z.object({
  type: z.string().min(1, { message: "Тодорхойлолтын төрөл оруулна уу" }),
  value: z.string().min(1, { message: "Тодорхойлолтын утга оруулна уу" }),
});

// Variant schema
const variantSchema = z.object({
  sku: z.string().min(1, { message: "Вариант SKU оруулна уу" }),
  price: z.number().min(0, { message: "Үнэ 0-с дээш байх ёстой" }),
  isDefault: z.boolean().optional().default(false),
  attributes: z.array(variantAttributeSchema).default([]),
  inventory: inventorySchema.optional(),
  images: z.array(imageSchema).default([]),
});

export const addProductsSchema = z.object({
  name: requiredString,
  sku: requiredString,
  description: requiredString,
  howToUse: z.string().optional(),
  ingredients: z.string().optional(),
  specs: z.array(productSpecSchema).optional(),
  // Support both single category (backward compatibility) and multiple categories
  categoryId: z.union([
    z.string().refine((v) => {
      if (!v) return true; // Allow empty for multiple categories
      let n = Number(v);
      return !isNaN(n) && v?.length > 0;
    }, { message: "Сонгоно уу" }),
    z.number().min(1, { message: "Сонгоно уу" })
  ]).optional(),
  categoryIds: z.array(z.number().min(1)).optional(),
  vendorId: z.union([
    z.string().refine((v) => {
      if (!v) return true; // Allow empty for auto-assignment
      let n = Number(v);
      return !isNaN(n) && v?.length > 0;
    }, { message: "Тоо оруулна уу" }),
    z.number().min(1, { message: "Vendor ID оруулна уу" })
  ]).optional(),
  
  brandId: z.union([
    z.string().refine((v) => {
      if (!v) return true; // Allow empty
      let n = Number(v);
      return !isNaN(n) && v?.length > 0;
    }, { message: "Брэнд сонгоно уу" }),
    z.number().min(1, { message: "Брэнд сонгоно уу" })
  ]).optional(),
  
  // File uploads for images - can be File objects or processed image data
  images: z.union([
    z.array(fileInstance),
    z.array(imageSchema)
  ]).optional(),
  
  // Tags as CSV for form handling
  tagsCsv: z.string().optional(),
  
  // Variants - will be handled separately in form logic
  variants: z.array(variantSchema).optional(),
  
  // Simple product fields
  price: z.union([
    z.string().refine((v) => {
      if (!v) return true; // Allow empty for variant products
      let n = Number(v);
      return !isNaN(n) && v?.length > 0;
    }, { message: "Тоо оруулна уу" }),
    z.number().min(0, { message: "Тоо оруулна уу" })
  ]).optional(),
  quantity: z.union([
    z.string().refine((v) => {
      if (!v) return true; // Allow empty for variant products
      let n = Number(v);
      return !isNaN(n) && v?.length > 0;
    }, { message: "Тоо оруулна уу" }),
    z.number().min(0, { message: "Тоо оруулна уу" })
  ]).optional(),
  
  // Optional promotion fields - hidden by default
  flashSale: z.boolean().optional().default(false),
  flashSaleEndDate: z.string().optional(),
  
  // Delivery fields
  isImportedProduct: z.boolean().optional().default(false),
  estimatedDeliveryDays: z.union([
    z.string().refine((v) => {
      if (!v) return true; // Allow empty, will default to 7
      let n = Number(v);
      return !isNaN(n) && n >= 1 && n <= 365;
    }, { message: "1-365 хоногийн хооронд оруулна уу" }),
    z.number().min(1, { message: "1-с дээш хоног оруулна уу" }).max(365, { message: "365-с доош хоног оруулна уу" })
  ]).optional(),
  deliveryNote: z.string().max(500, { message: "Тайлбар 500 тэмдэгтээс хэтрэх ёсгүй" }).optional(),
  discountId: z.union([
    z.string().refine((v) => {
      if (!v) return true;
      let n = Number(v);
      return !isNaN(n) && v?.length > 0;
    }),
    z.number()
  ]).optional(),
  promotionId: z.union([
    z.string().refine((v) => {
      if (!v) return true;
      let n = Number(v);
      return !isNaN(n) && v?.length > 0;
    }),
    z.number()
  ]).optional(),
});

export const editProductsSchema = z.object({
  name: requiredString,
  sku: requiredString,
  description: requiredString,
  howToUse: z.string().optional(),
  ingredients: z.string().optional(),
  specs: z.array(productSpecSchema).optional(),
  price: z.union([
    z.string().refine((v) => {
      const n = Number(v);
      return !isNaN(n) && v?.length > 0;
    }, { message: "Тоо оруулна уу" }),
    z.number().min(0, { message: "Тоо оруулна уу" })
  ], { required_error: "Заавал оруулна уу" }),
  // Support both single category (backward compatibility) and multiple categories  
  categoryId: z.union([
    z.string().refine((v) => {
      if (!v) return true; // Allow empty for multiple categories
      const n = Number(v);
      return !isNaN(n) && v?.length > 0;
    }, { message: "Сонгоно уу" }),
    z.number().min(1, { message: "Сонгоно уу" })
  ]).optional(),
  categoryIds: z.array(z.number().min(1)).optional(),
  brandId: z.union([
    z.string().refine((v) => {
      if (!v) return true; // Allow empty
      let n = Number(v);
      return !isNaN(n) && v?.length > 0;
    }, { message: "Брэнд сонгоно уу" }),
    z.number().min(1, { message: "Брэнд сонгоно уу" })
  ]).optional(),
  quantity: z.union([
    z.string().refine((v) => {
      const n = Number(v);
      return !isNaN(n) && v?.length > 0;
    }, { message: "Тоо оруулна уу" }),
    z.number().min(0, { message: "Тоо оруулна уу" })
  ], { required_error: "Заавал оруулна уу" }),
  tagsCsv: optionalString,
  images: z.union([
    z.array(fileInstance),
    z.array(imageSchema)
  ]).optional(),
  
  // Delivery fields
  isImportedProduct: z.boolean().optional(),
  estimatedDeliveryDays: z.union([
    z.string().refine((v) => {
      if (!v) return true; // Allow empty
      let n = Number(v);
      return !isNaN(n) && n >= 1 && n <= 365;
    }, { message: "1-365 хоногийн хооронд оруулна уу" }),
    z.number().min(1, { message: "1-с дээш хоног оруулна уу" }).max(365, { message: "365-с доош хоног оруулна уу" })
  ]).optional(),
  deliveryNote: z.string().max(500, { message: "Тайлбар 500 тэмдэгтээс хэтрэх ёсгүй" }).optional(),
});

// Export types for use in components
export type ProductSpec = z.infer<typeof productSpecSchema>;
export type AddProductForm = z.infer<typeof addProductsSchema>;
export type EditProductForm = z.infer<typeof editProductsSchema>;