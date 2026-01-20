import { getBackendUrl } from './env';
import { tokenService } from './token-service';
import { createSafeApiResponse, handleApiError, logApiError } from './error-handler';
import { fetchWithAuthHandling } from './fetch-with-auth';

export interface CargoShipment {
  id: number;
  papaCargoId: string;
  papaShippingId?: string;
  cargoStatus?: string;
  cargoName?: string;
  cargoCode?: string;
  startPincode?: string;
  endPincode?: string;
  receiverName?: string;
  receiverPhone?: string;
  toAddress?: string;
  lastSyncedAt?: string;
  syncError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PapaShipment {
  id: number;
  papaCode: string;
  papaStatus: string;
  driverName?: string;
  driverPhone?: string;
  driverId?: string;
  papaPincode?: string;
  shippingAmount?: number;
  isPaid?: boolean;
  createdAt?: string;
  updatedAt?: string;
  statusChangedAt?: string;
  driverAssignedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  confirmedAt?: string;
  creator?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  confirmer?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  cargoShipments?: CargoShipment[];
}

export interface OrderItem {
  id: number;
  productId: number;
  variantId?: number;
  quantity: number;
  price: string;
  product: {
    id: number;
    name: string;
    sku: string;
    ProductImages?: Array<{
      imageUrl: string;
    }>;
  };
  variant?: {
    id: number;
    sku: string;
    price: string;
  };
}

export interface ShippingDetails {
  id: number;
  orderId: number;
  shippingMethod: string;
  trackingNumber: string;
  shippingCost: string;
  estimatedDelivery: string;
  createdAt: string;
  modifiedAt: string;
  address?: string;
  city?: string;
  phone?: string;
}

export interface Delivery {
  id: number;
  userId: number;
  total: string;
  shippingCost?: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
  modifiedAt?: string;
  readyToShip?: boolean;
  packedAt?: string;
  packedBy?: number;
  orderItems: OrderItem[];
  shipping?: ShippingDetails;
  payment?: {
    id: number;
    status: string;
    amount: string;
    provider: string;
    createdAt?: string;
  };
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    telephone?: string;
  };
  papaShipment?: PapaShipment;
  papaCargoShipments?: CargoShipment[];
  packer?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export interface DeliveriesResponse {
  success: boolean;
  data: Delivery[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
  message?: string;
}

export interface DeliveriesParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  dateFrom?: string;
  dateTo?: string;
}

export async function getDeliveries(params: DeliveriesParams = {}): Promise<DeliveriesResponse> {
  try {
    const token = await tokenService.getTokenWithRetry();
    if (!token) {
      const apiError = handleApiError(new Error('No authentication token available'));
      logApiError('getDeliveries', apiError, params);
      const page = params.page || 1;
      const limit = params.limit || 20;
      return createSafeApiResponse({
        data: [],
        pagination: { total: 0, totalPages: 0, currentPage: page, limit }
      }, apiError) as any;
    }

    const searchParams = new URLSearchParams();
    
    // Set default page if not provided
    const page = params.page || 1;
    const limit = params.limit || 20;
    
    searchParams.append('page', page.toString());
    searchParams.append('limit', limit.toString());
    
    if (params.status) searchParams.append('status', params.status);
    if (params.search) searchParams.append('search', params.search);
    if (params.dateFrom) searchParams.append('dateFrom', params.dateFrom);
    if (params.dateTo) searchParams.append('dateTo', params.dateTo);
    // Ensure createdAt sorting is used for recent deliveries
    searchParams.append('sortField', params.sortField || 'createdAt');
    searchParams.append('sortOrder', params.sortOrder || 'desc');

    // Fetch deliverable orders from admin shipping endpoint
    const url = `${getBackendUrl()}/api/v1/admin/shipping/orders/deliverable?${searchParams.toString()}`;
    
    console.log('🔍 Frontend: Fetching deliveries from:', url.replace(/Bearer\s+\w+/, 'Bearer ***'));

    const response = await fetchWithAuthHandling(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Always fetch fresh data for deliveries
    }, 'getDeliveries');

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    console.log('📥 Frontend: Deliveries response:', {
      success: result.success,
      deliveriesCount: result.data?.length || 0,
      pagination: result.pagination
    });
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch deliveries');
    }
    
    // ✅ Return only the current page data
    return {
      success: true,
      data: result.data || [],
      pagination: result.pagination || {
        total: 0,
        totalPages: 0,
        currentPage: page,
        limit: limit
      }
    };
  } catch (error) {
    const apiError = handleApiError(error);
    logApiError('getDeliveries', apiError, params);
    const page = params.page || 1;
    const limit = params.limit || 20;
    return createSafeApiResponse({
      data: [],
      pagination: { total: 0, totalPages: 0, currentPage: page, limit }
    }, apiError) as any;
  }
}

// Re-export helper functions from orders API for consistency
export { 
  getStatusBlockClass, 
  formatOrderDate, 
  formatPrice, 
  translateStatus 
} from './orders';

