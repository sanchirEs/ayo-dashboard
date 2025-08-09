export function getBackendUrl(): string {
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


