export const vendorRoutes = [
  "/add-product",
  "/product-list", 
  "/oder-list",
  "/oder-detail",
  "/oder-tracking",
  "/add-tags"
];

export const authRoutes = ["/login"];

export const adminRoutes = [
  "/all-user",
  "/add-new-user", 
  "/category-list",
  "/new-category",
  // Tags list is accessible to all logged-in users; Add Tags allowed for vendors via vendorRoutes
  "/report",
  "/setting",
  "/create-role"
];

export const apiAuthPrefix = "/api/auth";
export const DEFAULT_LOGIN_REDIRECT = "/";
