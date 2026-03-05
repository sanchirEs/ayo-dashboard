/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  images: { remotePatterns: [{ hostname: "lh3.googleusercontent.com" }, { hostname: "res.cloudinary.com" }] },
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
  },

  // Proxy /api/v1/* to the backend to avoid CORS in the browser
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;

    if (!backendUrl) {
      console.warn('⚠️ BACKEND_URL is not configured. API rewrites will not work.');
      return [];
    }

    console.log('🔄 Proxying /api/v1/* requests to:', backendUrl);

    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};