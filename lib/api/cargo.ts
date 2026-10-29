/**
 * Cargo pricing admin API (ayo-back/src/routes/cargoRoutes.js).
 *
 * Import products carry a cargo fee = weight x rate. This page sets the rate,
 * weighs products, sets category default weights and runs the reprice-all job.
 * The rate and default weight themselves are ordinary store settings
 * (CARGO_RATE_PER_KG, CARGO_DEFAULT_WEIGHT_G) edited through
 * updateSettingClient in ./settings.
 *
 * Works both server-side (no token arg -> tokenService) and client-side
 * (pass token from useSession()).
 */

import { getBackendUrl } from './env';
import { tokenService } from './token-service';
import { handleApiError, logApiError } from './error-handler';
import { fetchWithAuthHandling } from './fetch-with-auth';

// ==================== TYPES ====================

/** Where a product's effective weight comes from, most specific first. */
export type CargoWeightSource = 'MEASURED' | 'CATEGORY' | 'DEFAULT';

export type RepriceStatus = 'IDLE' | 'RUNNING' | 'DONE' | 'FAILED';

export interface RepriceJobState {
  status: RepriceStatus;
  phase: string | null;
  total: number;
  done: number;
  changed: number;
  failed: number;
  /** At most 20 messages. */
  errors: string[];
  startedAt: string | null;
  finishedAt: string | null;
}

export interface CargoOverview {
  settings: { ratePerKg: number; defaultWeightG: number };
  counts: {
    importProducts: number;
    measured: number;
    category: number;
    default: number;
  };
  /** Import products whose stored cargo differs from the freshly resolved one. */
  staleCount: number;
  /** Cargo collected on paid, non-cancelled orders in the last 30 days. */
  cargo30d: { mnt: number; units: number };
  job: RepriceJobState;
}

export interface CargoProductRow {
  id: number;
  name: string;
  sku: string | null;
  imageUrl: string | null;
  price: number;
  /** null = house import product (not from a retailer). */
  retailerSlug: string | null;
  /** The product's own measured weight, null when never weighed. */
  cargoWeightG: number | null;
  /** Effective weight after the measured -> category -> default fallback. */
  weightG: number;
  source: CargoWeightSource;
  cargoMnt: number | null;
  /** Units on paid orders still on their way (WAITING / LEFT_KOREA / IN_CUSTOMS). */
  pendingUnits: number;
}

export interface CargoProductsPage {
  rows: CargoProductRow[];
  total: number;
}

export type CargoProductFilter = 'all' | 'unmeasured' | 'measured';

export interface CargoProductsParams {
  filter?: CargoProductFilter;
  q?: string;
  take?: number;
  skip?: number;
}

export interface CargoCategoryRow {
  id: number;
  name: string;
  parentId: number | null;
  isImportCategory: boolean;
  /** This category's own default weight, null when unset. */
  cargoWeightG: number | null;
  /** Nearest ancestor's weight (excluding itself), null when there is none. */
  inheritedWeightG: number | null;
  productCount: number;
}

export interface ProductWeightResult {
  productId: number;
  weightG: number;
  source: CargoWeightSource;
  cargoMnt: number;
  price: number;
}

export interface CategoryWeightResult {
  id: number;
  cargoWeightG: number | null;
}

// ==================== HELPERS ====================

async function authHeaders(token?: string | null): Promise<Record<string, string>> {
  const t = token ?? (await tokenService.getTokenWithRetry());
  return {
    Authorization: `Bearer ${t}`,
    'Content-Type': 'application/json',
  };
}

function base() {
  return `${getBackendUrl()}/api/v1/cargo`;
}

/**
 * Every call funnels through here so a failure returns a shaped object instead
 * of throwing into a server component and blanking the page.
 */
async function request<T>(
  path: string,
  init: RequestInit,
  source: string,
  fallback: T,
  token?: string | null
): Promise<{ success: boolean; data: T; error?: string }> {
  try {
    const headers = await authHeaders(token);
    const res = await fetchWithAuthHandling(`${base()}${path}`, { ...init, headers }, source);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (error) {
    const e = handleApiError(error);
    logApiError(source, e, { path });
    return { success: false, data: fallback, error: e.message };
  }
}

const EMPTY_JOB: RepriceJobState = {
  status: 'IDLE',
  phase: null,
  total: 0,
  done: 0,
  changed: 0,
  failed: 0,
  errors: [],
  startedAt: null,
  finishedAt: null,
};

// ==================== OVERVIEW ====================

export async function getCargoOverview(token?: string | null) {
  return request<CargoOverview | null>(
    '/overview',
    { method: 'GET', cache: 'no-store' },
    'getCargoOverview',
    null,
    token
  );
}

// ==================== PRODUCTS ====================

export async function getCargoProducts(
  params: CargoProductsParams = {},
  token?: string | null
) {
  const qs = new URLSearchParams();
  if (params.filter) qs.set('filter', params.filter);
  if (params.q) qs.set('q', params.q);
  if (params.take !== undefined) qs.set('take', String(params.take));
  if (params.skip !== undefined) qs.set('skip', String(params.skip));
  const query = qs.toString();
  return request<CargoProductsPage>(
    `/products${query ? `?${query}` : ''}`,
    { method: 'GET', cache: 'no-store' },
    'getCargoProducts',
    { rows: [], total: 0 },
    token
  );
}

/** `weightG` null clears the measured weight (falls back to category/default). */
export async function setProductWeight(
  id: number,
  weightG: number | null,
  token?: string | null
) {
  return request<ProductWeightResult | null>(
    `/products/${id}/weight`,
    { method: 'PATCH', body: JSON.stringify({ weightG }) },
    'setProductWeight',
    null,
    token
  );
}

// ==================== CATEGORIES ====================

export async function getCargoCategories(token?: string | null) {
  return request<CargoCategoryRow[]>(
    '/categories',
    { method: 'GET', cache: 'no-store' },
    'getCargoCategories',
    [],
    token
  );
}

/** `weightG` null clears the category weight (children inherit from further up). */
export async function setCategoryWeight(
  id: number,
  weightG: number | null,
  token?: string | null
) {
  return request<CategoryWeightResult | null>(
    `/categories/${id}/weight`,
    { method: 'PATCH', body: JSON.stringify({ weightG }) },
    'setCategoryWeight',
    null,
    token
  );
}

// ==================== REPRICE JOB ====================

/** Starts the job; a second start while one runs fails with the 409 message. */
export async function startReprice(token?: string | null) {
  return request<RepriceJobState>(
    '/reprice',
    { method: 'POST' },
    'startReprice',
    EMPTY_JOB,
    token
  );
}

export async function getRepriceStatus(token?: string | null) {
  return request<RepriceJobState>(
    '/reprice',
    { method: 'GET', cache: 'no-store' },
    'getRepriceStatus',
    EMPTY_JOB,
    token
  );
}
