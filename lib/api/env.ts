export function getBackendUrl(): string {
  // When running in browser, use the Next.js rewrite proxy to avoid CORS
  if (typeof window !== 'undefined') {
    return ''; // Empty string = use relative URLs which go through Next.js rewrites
  }
  
  // Server-side: use actual backend URL
  const candidate = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!candidate) {
    throw new Error('BACKEND_URL is not configured');
  }
  // Normalize by removing any trailing slash
  return candidate.replace(/\/$/, '');
}

export function resolveImageUrl(input: string | undefined | null): string {
  const fallback = '/images/products/1.png';
  if (!input || typeof input !== 'string') return fallback;
  // Allow absolute URLs (e.g., Cloudinary) to pass through unchanged
  if (input.startsWith('http://') || input.startsWith('https://')) return input;
  const base = getBackendUrl();
  // Treat as relative path to backend
  if (input.startsWith('/')) return `${base}${input}`;
  return `${base}/${input}`;
}


