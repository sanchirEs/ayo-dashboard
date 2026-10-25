// Simple route definitions
export const vendorRoutes = [
  "/add-product",
  "/product-list", 
  "/order-list",
  "/delivery",
  "/order-detail",
  "/order-tracking",
  "/add-tags"
];

export const authRoutes = ["/login", "/sign-up"];

export const adminRoutes = [
  "/all-user",
  "/add-new-user",
  "/pickup-logs",
  "/category-list",
  "/new-category",
  "/attributes",
  "/report",
  "/setting",
  "/create-role",
  "/partners",
  "/pos/registers",
  "/pos/staff",
  "/pos/settings",
  "/pos/barcode-links",
  "/pos/sync-issues",
  "/stock",
  "/stock/goods-in",
  "/stock/transfers",
  "/stock/counts",
  "/stock/adjustments",
  "/stock/low",
  "/stock/negative",
  "/stock/sets",
  "/pos",
  "/reports/pos/sales",
  "/reports/pos/margin",
  "/reports/pos/stock-value",
  "/reports/pos/payments",
  "/reports/pos/shifts",
  "/reports/pos/adjustments"
];

export const apiAuthPrefix = "/api/auth";
export const DEFAULT_LOGIN_REDIRECT = "/";
