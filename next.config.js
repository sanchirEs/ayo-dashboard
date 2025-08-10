/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: [{ hostname: "lh3.googleusercontent.com" }, { hostname: "res.cloudinary.com" }] },
  env: {
    // Avoid hardcoded localhost in production; prefer server-side BACKEND_URL
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
  },
};

module.exports = nextConfig;
