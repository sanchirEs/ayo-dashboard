import { z } from "zod";
const {
  optionalString,
  optionalNumber,
  optionalBoolean,
  requiredString,
  requiredNumber,
} = require("./constantValidation");

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
  categoryId: z.union([
    z.string().refine((v) => {
      let n = Number(v);
      return !isNaN(n) && v?.length > 0;
    }, { message: "Сонгоно уу" }),
    z.number().min(1, { message: "Сонгоно уу" })
  ], { required_error: "Сонгоно уу" }),
  vendorId: z.union([
    z.string().refine((v) => {
      if (!v) return true; // Allow empty for auto-assignment
      let n = Number(v);
      return !isNaN(n) && v?.length > 0;
    }, { message: "Тоо оруулна уу" }),
    z.number().min(1, { message: "Vendor ID оруулна уу" })
  ]).optional(),
  
  // File uploads for images
  images: z.array(z.instanceof(File)).optional(),
  
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
  categoryId: z.union([
    z.string().refine((v) => {
      const n = Number(v);
      return !isNaN(n) && v?.length > 0;
    }, { message: "Сонгоно уу" }),
    z.number().min(1, { message: "Сонгоно уу" })
  ], { required_error: "Сонгоно уу" }),
  quantity: z.union([
    z.string().refine((v) => {
      const n = Number(v);
      return !isNaN(n) && v?.length > 0;
    }, { message: "Тоо оруулна уу" }),
    z.number().min(0, { message: "Тоо оруулна уу" })
  ], { required_error: "Заавал оруулна уу" }),
  tagsCsv: optionalString,
  images: z.array(z.instanceof(File)).optional(),
});

// Export types for use in components
export type ProductSpec = z.infer<typeof productSpecSchema>;
export type AddProductForm = z.infer<typeof addProductsSchema>;
export type EditProductForm = z.infer<typeof editProductsSchema>;