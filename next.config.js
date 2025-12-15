  /** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: [{ hostname: "lh3.googleusercontent.com" }, { hostname: "res.cloudinary.com" }] },
  env: {
    // Avoid hardcoded localhost in production; prefer server-side BACKEND_URL
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
  },
  
  // Global proxy to fix ALL CORS errors by rewriting /api/v1/* to backend
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

module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  productionBrowserSourceMaps: true,
}