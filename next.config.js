/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  images: {
    deviceSizes: [640, 1024, 1920],
    imageSizes: [128, 256, 512],
    remotePatterns: [
      { hostname: "lh3.googleusercontent.com" },
      { hostname: "res.cloudinary.com" },
      // Cloudflare R2 (Cloudinary replacement): custom domain + bucket dev URL.
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
