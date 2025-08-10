export const apiAuthPrefix = "/api/auth";

// Routes that should never be behind auth
export const publicRoutes = ["/", "/coming-soon"];

// Routes used for authentication
export const authRoutes = ["/login", "/sign-up"];

// Where to send users post-login
export const DEFAULT_LOGIN_REDIRECT = "/";

// Role-based route protection
export const adminRoutes = [
  "/all-user",
  "/add-new-user", 
  "/category-list",
  "/new-category",
  "/report",
  "/setting",
  "/create-role"
];

export const vendorRoutes = [
  "/add-product",
  "/product-list", 
  "/oder-list",
  "/oder-detail",
  "/oder-tracking",
  "/add-tags"
];
