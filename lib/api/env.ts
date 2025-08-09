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
  const base = getBackendUrl();
  try {
    if (input.startsWith('http://') || input.startsWith('https://')) {
      const u = new URL(input);
      const baseU = new URL(base);
      // Force using backend origin to avoid mixed content and wrong hosts
      return `${baseU.origin}${u.pathname}${u.search}`;
    }
  } catch {
    // ignore parse errors, fall through
  }
  // Treat as relative path
  if (input.startsWith('/')) return `${base}${input}`;
  return `${base}/${input}`;
}


