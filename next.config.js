/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  images: {
    deviceSizes: [640, 1024, 1920],
    imageSizes: [128, 256, 512],
    remotePatterns: [
      { hostname: "lh3.googleusercontent.com" },
      // Legacy: no stored data points at Cloudinary any more (all moved to R2
      // 2026-11-10). Kept so a stale URL renders as a broken image instead of
      // next/image throwing; safe to drop after 2026-12.
      { hostname: "res.cloudinary.com" },
      // Cloudflare R2: custom domain + bucket dev URL.
      { protocol: "https", hostname: "img.ayo.mn" },
      { protocol: "https", hostname: "pub-bd8e3dc045ee4776807fa778eb66424f.r2.dev" },
    ],
  },
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
  },
  // Strip console.log/info/debug from production builds (Railway log noise);
  // keep error/warn. Dev builds keep everything.
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
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
