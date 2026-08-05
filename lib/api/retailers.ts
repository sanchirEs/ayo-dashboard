/**
 * Retailer sourcing API (Costco Korea, Olive Young).
 *
 * Mirrors ayo-back/src/routes/retailerRoutes.js. Two layers matter here:
 *   RetailerProduct = staging (scraped, curated, never customer-visible)
 *   Product         = live storefront row, created only by an explicit publish
 *
 * Works both server-side (no token arg -> tokenService) and client-side
 * (pass token from useSession()).
 */

import { getBackendUrl } from './env';
import { tokenService } from './token-service';
import { handleApiError, logApiError } from './error-handler';
import { fetchWithAuthHandling } from './fetch-with-auth';

// ==================== TYPES ====================

/** Machine-owned unless noted. READY/ARCHIVED are only ever set by an admin. */
export type RetailerProductStatus =
  | 'NEW'
  | 'AWAITING_DETAIL'
  | 'BLOCKED'
  | 'SKIPPED'
  | 'READY'
  | 'PUBLISHED'
  | 'STALE'
  | 'ARCHIVED';

export interface Retailer {
  id: number;
  slug: string;
  name: string;
  displayName: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  countryCode: string;
  currency: string;
  /** null = FX not configured yet; pricing stays NULL rather than guessing. */
  fxRateToMnt: string | null;
  markupPct: string;
  priceRoundTo: number;
  fxUpdatedAt: string | null;
  leadTimeDays: number;
  defaultCategoryId: number | null;
  cdnBaseUrl: string | null;
  isActive: boolean;
  displayOrder: number;
  lastSyncedAt: string | null;
  _count?: { retailerProducts: number; categories: number; brands: number };
}

export interface RetailerCategoryRow {
  id: number;
  retailerId: number;
  externalId: string;
  path: string;
  name: string;
  depth: number;
  parentId: number | null;
  productCount: number;
  categoryId: number | null;
  isIgnored: boolean;
  defaultVisible: boolean;
  defaultOrderable: boolean;
  category: { id: number; name: string } | null;
  /** Staged rows that actually landed on this node (not their tree's number). */
  _count?: { products: number };
}

export interface RetailerBrandRow {
  id: number;
  retailerId: number;
  externalId: string;
  name: string;
  nameKo: string | null;
  brandId: number | null;
  productCount: number;
  brand: { id: number; name: string } | null;
}

export interface RetailerVariantRow {
  id: number;
  externalId: string;
  name: string;
  priceOriginal: string | null;
  sortSeq: number | null;
  inStockAtScrape: boolean;
}

export interface RetailerProductRow {
  id: number;
  externalId: string;
  nameOriginal: string;
  nameEn: string | null;
  nameMn: string | null;
  subtitle: string | null;
  priceOriginal: string | null;
  listPriceOriginal: string | null;
  discountPct: number | null;
  computedPriceMnt: string | null;
  priceMnt: string | null;
  status: RetailerProductStatus;
  blockedReason: string | null;
  reviewNote: string | null;
  hasVariants: boolean;
  detailFetchedAt: string | null;
  imageUrl: string | null;
  productUrl: string | null;
  rawCategoryPath: string | null;
  productId: number | null;
  priceDrift: boolean;
  maxOrderQty: number | null;
  publishedAt: string | null;
  retailerCategory: {
    id: number;
    path: string;
    categoryId: number | null;
    isIgnored: boolean;
  } | null;
  retailerBrand: { id: number; name: string; brandId: number | null } | null;
  variants: RetailerVariantRow[];
}

export interface StatusSummary {
  total: number;
  byStatus: Record<string, number>;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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
  return `${getBackendUrl()}/api/v1/retailers`;
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
): Promise<{ success: boolean; data: T; pagination?: Pagination; error?: string }> {
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

// ==================== RETAILERS ====================

export async function getRetailers(token?: string | null) {
  return request<Retailer[]>(
    '/admin/list',
    { method: 'GET', cache: 'no-store' },
    'getRetailers',
    [],
    token
  );
}

export type UpdateRetailerPayload = Partial<{
  displayName: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  fxRateToMnt: string | number | null;
  markupPct: string | number;
  priceRoundTo: number;
  leadTimeDays: number;
  defaultCategoryId: number | null;
  isActive: boolean;
  displayOrder: number;
}>;

export async function updateRetailer(
  slug: string,
  payload: UpdateRetailerPayload,
  token?: string | null
) {
  return request<Retailer | null>(
    `/admin/${slug}`,
    { method: 'PATCH', body: JSON.stringify(payload) },
    'updateRetailer',
    null,
    token
  );
}

// ==================== CATEGORY MAPPING ====================

export async function getRetailerCategories(slug: string, token?: string | null) {
  return request<RetailerCategoryRow[]>(
    `/admin/${slug}/categories`,
    { method: 'GET', cache: 'no-store' },
    'getRetailerCategories',
    [],
    token
  );
}

export async function updateRetailerCategory(
  id: number,
  payload: Partial<{
    categoryId: number | null;
    isIgnored: boolean;
    defaultVisible: boolean;
    defaultOrderable: boolean;
  }>,
  token?: string | null
) {
  return request<RetailerCategoryRow | null>(
    `/admin/categories/${id}`,
    { method: 'PATCH', body: JSON.stringify(payload) },
    'updateRetailerCategory',
    null,
    token
  );
}

// ==================== BRAND MAPPING ====================

export async function getRetailerBrands(slug: string, token?: string | null) {
  return request<RetailerBrandRow[]>(
    `/admin/${slug}/brands`,
    { method: 'GET', cache: 'no-store' },
    'getRetailerBrands',
    [],
    token
  );
}

export async function updateRetailerBrand(
  id: number,
  brandId: number | null,
  token?: string | null
) {
  return request<RetailerBrandRow | null>(
    `/admin/brands/${id}`,
    { method: 'PATCH', body: JSON.stringify({ brandId }) },
    'updateRetailerBrand',
    null,
    token
  );
}

// ==================== CURATION QUEUE ====================

export async function getStagingProducts(
  slug: string,
  params: {
    page?: number;
    limit?: number;
    status?: string;
    categoryId?: number;
    search?: string;
    priceDrift?: boolean;
  } = {},
  token?: string | null
) {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.status) qs.set('status', params.status);
  if (params.categoryId) qs.set('categoryId', String(params.categoryId));
  if (params.search) qs.set('search', params.search);
  if (params.priceDrift) qs.set('priceDrift', 'true');

  return request<RetailerProductRow[]>(
    `/admin/${slug}/products?${qs}`,
    { method: 'GET', cache: 'no-store' },
    'getStagingProducts',
    [],
    token
  );
}

export async function updateStagingProduct(
  id: number,
  payload: Partial<{
    nameMn: string | null;
    priceMnt: string | number | null;
    status: RetailerProductStatus;
    reviewNote: string | null;
    retailerCategoryId: number | null;
  }>,
  token?: string | null
) {
  return request<RetailerProductRow | null>(
    `/admin/products/${id}`,
    { method: 'PATCH', body: JSON.stringify(payload) },
    'updateStagingProduct',
    null,
    token
  );
}

export async function getStatusSummary(slug: string, token?: string | null) {
  return request<StatusSummary>(
    `/admin/${slug}/summary`,
    { method: 'GET', cache: 'no-store' },
    'getStatusSummary',
    { total: 0, byStatus: {} },
    token
  );
}

// ==================== PRICING / GATING ====================

/**
 * Recompute computedPriceMnt across the whole staging table. Slow (minutes on
 * 20k rows) — call after changing fxRateToMnt or markupPct.
 */
export async function recomputePrices(slug: string, token?: string | null) {
  return request<{ examined: number; updated: number }>(
    `/admin/${slug}/recompute-prices`,
    { method: 'POST' },
    'recomputePrices',
    { examined: 0, updated: 0 },
    token
  );
}

/**
 * Re-run the auto-gate. REQUIRED after changing category mappings — gating
 * happens at ingest, so mapping a category does NOT retroactively unblock the
 * rows already sitting at BLOCKED/NO_CATEGORY.
 */
export async function regateProducts(slug: string, token?: string | null) {
  return request<{ examined: number; changed: number; byStatus: Record<string, number> }>(
    `/admin/${slug}/regate`,
    { method: 'POST' },
    'regateProducts',
    { examined: 0, changed: 0, byStatus: {} },
    token
  );
}

// ==================== PUBLISH ====================

export interface PublishResult {
  retailerProductId: number;
  productId: number;
  variantCount: number;
}

export async function publishStagingProduct(id: number, token?: string | null) {
  return request<PublishResult | null>(
    `/admin/products/${id}/publish`,
    { method: 'POST' },
    'publishStagingProduct',
    null,
    token
  );
}

export async function repriceStagingProduct(id: number, token?: string | null) {
  return request<{ productId: number; price: string } | null>(
    `/admin/products/${id}/reprice`,
    { method: 'POST' },
    'repriceStagingProduct',
    null,
    token
  );
}

/**
 * Publishes rows that are already at status READY (and only those). `ids`
 * targets specific rows, otherwise it takes the first `limit` READY rows.
 */
export async function publishBulk(
  slug: string,
  payload: { ids?: number[]; limit?: number },
  token?: string | null
) {
  return request<{
    attempted: number;
    published: PublishResult[];
    failed: Array<{ retailerProductId: number; externalId: string; error: string }>;
  }>(
    `/admin/${slug}/publish`,
    { method: 'POST', body: JSON.stringify(payload) },
    'publishBulk',
    { attempted: 0, published: [], failed: [] },
    token
  );
}
