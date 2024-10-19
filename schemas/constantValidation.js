const { z } = require("zod");
exports.requiredString = z
  .string({ required_error: "Заавал оруулна уу" })
  .trim()
  .min(1, "Заавал оруулна уу");
exports.requiredNumber = z.number({ required_error: "Заавал оруулна уу" });
exports.requiredBoolean = z.boolean({ required_error: "Заавал оруулна уу" });
exports.requiredDate = z.string({ required_error: "Заавал оруулна уу" }).date();
exports.optionalString = z.string().optional();
exports.optionalNumber = z.number().optional();
exports.optionalBoolean = z.boolean().optional();
exports.optionalDate = z.date().optional();
