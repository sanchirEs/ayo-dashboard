/**
 * Homepage Banners API — works both server-side (no token arg → uses
 * tokenService) and client-side (pass token from useSession()).
 */

import { tokenService } from './token-service';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export type BannerSlot = 'hero' | 'brand' | 'payment' | 'flash-sale';

export interface Banner {
  id: number;
  slot: BannerSlot;
  imageUrl: string;
  mobileImageUrl: string | null;
  linkUrl: string | null;
  altText: string;
  order: number;
  isActive: boolean;
  updatedAt: string;
  updatedBy: number | null;
  updatedByUser: { id: number; email: string; firstName: string | null } | null;
}

export interface BannerPayload {
  slot: BannerSlot;
  imageUrl: string;
  mobileImageUrl?: string | null;
  linkUrl?: string | null;
  altText: string;
  isActive?: boolean;
}

export async function getAdminBanners(token?: string): Promise<Banner[]> {
  const t = token ?? (await tokenService.getTokenWithRetry());
  const res = await fetch(`${BACKEND}/api/v1/banners`, {
    headers: { Authorization: `Bearer ${t}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch banners');
  const json = await res.json();
  return json.data;
}

export async function createBannerClient(payload: BannerPayload, token: string): Promise<Banner> {
  const res = await fetch(`${BACKEND}/api/v1/banners`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create banner');
  }
  const json = await res.json();
  return json.data;
}

export async function updateBannerClient(
  id: number,
  payload: Partial<BannerPayload>,
  token: string
): Promise<Banner> {
  const res = await fetch(`${BACKEND}/api/v1/banners/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update banner');
  }
  const json = await res.json();
  return json.data;
}

export async function deleteBannerClient(id: number, token: string): Promise<void> {
  const res = await fetch(`${BACKEND}/api/v1/banners/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete banner');
  }
}

export async function reorderBannersClient(
  slot: BannerSlot,
  orderedIds: number[],
  token: string
): Promise<Banner[]> {
  const res = await fetch(`${BACKEND}/api/v1/banners/reorder`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ slot, orderedIds }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to reorder banners');
  }
  const json = await res.json();
  return json.data;
}
