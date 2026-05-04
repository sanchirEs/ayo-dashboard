import { getBackendUrl } from './env';
import { tokenService } from './token-service';
import { handleApiError, logApiError } from './error-handler';
import { fetchWithAuthHandling } from './fetch-with-auth';

export interface BroadcastUser {
  id: number;
  firstName: string | null;
  lastName: string | null;
  telephone: string;
  lastOrderDate: string | null;
}

export interface PreviewResult {
  users: BroadcastUser[];
  total: number;
  excludedNoPhone: number;
}

export interface BroadcastFilters {
  role?: string;
  hasOrdered?: boolean;
  lastOrderedDays?: string;
  neverOrdered?: boolean;
  registeredAfter?: string;
}

export interface Broadcast {
  id: number;
  title: string;
  message: string;
  targetCount: number;
  skippedCount: number;
  status: 'PROCESSING' | 'COMPLETED' | 'PARTIAL_FAILURE';
  createdAt: string;
  stats: Record<string, number>;
}

export interface BroadcastTemplate {
  id: number;
  name: string;
  template: string;
}

async function authHeaders(token?: string | null): Promise<Record<string, string>> {
  const t = token ?? (await tokenService.getTokenWithRetry());
  return { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' };
}

function base() {
  return `${getBackendUrl()}/api/v1/sms-broadcast`;
}

export async function previewBroadcastUsers(
  filters: BroadcastFilters,
  token?: string | null
): Promise<{ success: boolean; data: PreviewResult; error?: string }> {
  try {
    const headers = await authHeaders(token);
    const params = new URLSearchParams();
    if (filters.role && filters.role !== 'ALL') params.set('role', filters.role);
    if (filters.hasOrdered) params.set('hasOrdered', 'true');
    if (filters.lastOrderedDays) params.set('lastOrderedDays', filters.lastOrderedDays);
    if (filters.neverOrdered) params.set('neverOrdered', 'true');
    if (filters.registeredAfter) params.set('registeredAfter', filters.registeredAfter);
    const res = await fetchWithAuthHandling(
      `${base()}/preview?${params.toString()}`,
      { method: 'GET', headers, cache: 'no-store' },
      'previewBroadcastUsers'
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (error) {
    const e = handleApiError(error);
    logApiError('previewBroadcastUsers', e, filters as Record<string, unknown>);
    return { success: false, data: { users: [], total: 0, excludedNoPhone: 0 }, error: e.message };
  }
}

export async function sendBroadcast(
  payload: { title: string; message: string; userIds: number[]; saveAsTemplate?: { name: string }; filters?: BroadcastFilters },
  token?: string | null
): Promise<{ success: boolean; data?: { broadcastId: number; queued: number; skipped: number }; error?: string }> {
  try {
    const headers = await authHeaders(token);
    const res = await fetchWithAuthHandling(
      base(),
      { method: 'POST', headers, body: JSON.stringify(payload) },
      'sendBroadcast'
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string };
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (error) {
    const e = handleApiError(error);
    logApiError('sendBroadcast', e, { userCount: payload.userIds.length });
    return { success: false, error: e.message };
  }
}

export async function getBroadcasts(
  token?: string | null
): Promise<{ success: boolean; data: Broadcast[]; error?: string }> {
  try {
    const headers = await authHeaders(token);
    const res = await fetchWithAuthHandling(
      base(),
      { method: 'GET', headers, cache: 'no-store' },
      'getBroadcasts'
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (error) {
    const e = handleApiError(error);
    logApiError('getBroadcasts', e, {});
    return { success: false, data: [], error: e.message };
  }
}

export async function getBroadcastTemplates(
  token?: string | null
): Promise<{ success: boolean; data: BroadcastTemplate[]; error?: string }> {
  try {
    const headers = await authHeaders(token);
    const res = await fetchWithAuthHandling(
      `${base()}/templates`,
      { method: 'GET', headers, cache: 'no-store' },
      'getBroadcastTemplates'
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (error) {
    const e = handleApiError(error);
    logApiError('getBroadcastTemplates', e, {});
    return { success: false, data: [], error: e.message };
  }
}

export async function saveBroadcastTemplate(
  payload: { name: string; message: string },
  token?: string | null
): Promise<{ success: boolean; data?: BroadcastTemplate; error?: string }> {
  try {
    const headers = await authHeaders(token);
    const res = await fetchWithAuthHandling(
      `${base()}/templates`,
      { method: 'POST', headers, body: JSON.stringify(payload) },
      'saveBroadcastTemplate'
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string };
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (error) {
    const e = handleApiError(error);
    logApiError('saveBroadcastTemplate', e, payload);
    return { success: false, error: e.message };
  }
}
