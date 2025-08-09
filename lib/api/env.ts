export function getBackendUrl(): string {
  const candidate = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!candidate) {
    throw new Error('BACKEND_URL is not configured');
  }
  // Normalize by removing any trailing slash
  return candidate.replace(/\/$/, '');
}


