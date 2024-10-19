import { z } from "zod";
const {
  optionalString,
  optionalNumber,
  optionalBoolean,
  requiredString,
  requiredNumber,
  // optionalDate,
} = require("./constantValidation");

export const addProductsSchema = z.object({
  name: requiredString,
  sku: requiredString,

  description: requiredString,
  price: z.string({ required_error: "Заавал оруулна уу" }).refine(
    (v) => {
      let n = Number(v);
      return !isNaN(n) && v?.length > 0;
    },
    { message: "Тоо оруулна уу" }
  ),
  vendorId: z.string({ required_error: "Заавал оруулна уу" }).refine(
    (v) => {
      let n = Number(v);
      return !isNaN(n) && v?.length > 0;
    },
    { message: "Тоо оруулна уу" }
  ),
  categoryId: z.string({ required_error: "Сонгоно уу" }).refine(
    (v) => {
      let n = Number(v);
      return !isNaN(n) && v?.length > 0;
    },
    { message: "Сонгоно уу" }
  ),
  quantity: z.string({ required_error: "Заавал оруулна уу" }).refine(
    (v) => {
      let n = Number(v);
      return !isNaN(n) && v?.length > 0;
    },
    { message: "Тоо оруулна уу" }
  ),
  //   vendorId: requiredNumber,
  images: z.array(z.instanceof(File)).nonempty("Дор хаяж нэг зураг хэрэгтэй"), // Images array schema
  discountId: optionalNumber,
  promotionId: optionalNumber,
  flashSale: optionalBoolean,
  flashSaleEndDate: optionalString,
});
