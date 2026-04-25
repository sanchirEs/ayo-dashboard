/**
 * Store Settings API
 * Works both server-side (no token arg → uses tokenService) and
 * client-side (pass token from useSession()).
 */

import { tokenService } from './token-service';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export interface StoreSetting {
  id: number;
  key: string;
  value: string;
  type: 'NUMBER' | 'STRING' | 'BOOLEAN';
  label: string;
  description: string | null;
  updatedAt: string;
  updatedBy: number | null;
  updatedByUser: { id: number; email: string; firstName: string | null } | null;
}

export interface PublicSettings {
  [key: string]: number | string | boolean;
}

export async function getAdminSettings(token?: string): Promise<StoreSetting[]> {
  const t = token ?? (await tokenService.getTokenWithRetry());
  const res = await fetch(`${BACKEND}/api/v1/settings`, {
    headers: { Authorization: `Bearer ${t}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch settings');
  const json = await res.json();
  return json.data;
}

export async function getPublicSettings(): Promise<PublicSettings> {
  const res = await fetch(`${BACKEND}/api/v1/settings/public`, { cache: 'no-store' });
  if (!res.ok) return {};
  const json = await res.json();
  return json.data ?? {};
}

export async function updateSettingClient(
  key: string,
  value: string,
  token: string
): Promise<StoreSetting> {
  const res = await fetch(`${BACKEND}/api/v1/settings/${key}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ value }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update setting');
  }
  const json = await res.json();
  return json.data;
}
