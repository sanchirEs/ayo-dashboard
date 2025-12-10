# 🚚 Delivery Page - Side-by-Side Code Examples

## This document shows BEFORE (Order) and AFTER (Delivery) code for key files

---

## 📄 File 1: API Client

### BEFORE: `lib/api/orders.ts` (lines 94-106)
```typescript
export async function getOrders(params: OrdersParams = {}): Promise<OrdersResponse> {
  try {
    const token = await tokenService.getTokenWithRetry();
    if (!token) {
      const apiError = handleApiError(new Error('No authentication token available'));
      logApiError('getOrders', apiError, params);
      const page = params.page || 1;
      const limit = params.limit || 20;
      return createSafeApiResponse({
        data: [],
        pagination: { total: 0, totalPages: 0, currentPage: page, limit }
      }, apiError) as any;
    }
```

### AFTER: `lib/api/deliveries.ts` (CREATE NEW)
```typescript
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
```

### BEFORE: API Endpoint (line 128)
```typescript
const url = `${getBackendUrl()}/api/v1/orders?${searchParams.toString()}`;
```

### AFTER: API Endpoint (line 128)
```typescript
const url = `${getBackendUrl()}/api/v1/admin/shipping/orders/deliverable?${searchParams.toString()}`;
```

### BEFORE: Query params (lines 117-122)
```typescript
if (params.status) searchParams.append('status', params.status);
if (params.search) searchParams.append('search', params.search);
if (params.dateFrom) searchParams.append('dateFrom', params.dateFrom);
if (params.dateTo) searchParams.append('dateTo', params.dateTo);
if (params.paymentStatus) searchParams.append('paymentStatus', params.paymentStatus);
if (params.paymentProvider) searchParams.append('paymentProvider', params.paymentProvider);
```

### AFTER: Query params (lines 117-120) - REMOVE payment params
```typescript
if (params.status) searchParams.append('status', params.status);
if (params.search) searchParams.append('search', params.search);
if (params.dateFrom) searchParams.append('dateFrom', params.dateFrom);
if (params.dateTo) searchParams.append('dateTo', params.dateTo);
// REMOVED: paymentStatus and paymentProvider
```

---

## 📄 File 2: Main Page Component

### BEFORE: `app/order-list/page.js`
```javascript
import Layout from "@/components/layout/Layout";
import { Suspense } from "react";
import OrderTable from "./OrderTable";
import OrderFilters from "./OrderFilters";

export default async function OrderList(props) {
    const searchParams = await props.searchParams;
    
    const searchKey = JSON.stringify(searchParams || {});
    
    return (
        <>
            <Layout breadcrumbTitleParent="Orders" breadcrumbTitle="Order List">
                <div className="wg-box">
                    <Suspense fallback={<div>Loading filters...</div>}>
                        <OrderFilters />
                    </Suspense>
                    
                    <Suspense 
                        key={searchKey}
                        fallback={
                            <div className="wg-table table-all-category">
                                <div className="text-center py-8">
                                    <div className="spinner-border" role="status">
                                        <span className="sr-only">Loading orders...</span>
                                    </div>
                                </div>
                            </div>
                        }
                    >
                        <OrderTable searchParams={searchParams} />
                    </Suspense>
                </div>
            </Layout>
        </>
    );
}
```

### AFTER: `app/delivery/page.js`
```javascript
import Layout from "@/components/layout/Layout";
import { Suspense } from "react";
import DeliveryTable from "./DeliveryTable";
import DeliveryFilters from "./DeliveryFilters";

export default async function DeliveryList(props) {
    const searchParams = await props.searchParams;
    
    const searchKey = JSON.stringify(searchParams || {});
    
    return (
        <>
            <Layout breadcrumbTitleParent="Logistics" breadcrumbTitle="Delivery Management">
                <div className="wg-box">
                    <Suspense fallback={<div>Loading filters...</div>}>
                        <DeliveryFilters />
                    </Suspense>
                    
                    <Suspense 
                        key={searchKey}
                        fallback={
                            <div className="wg-table table-all-category">
                                <div className="text-center py-8">
                                    <div className="spinner-border" role="status">
                                        <span className="sr-only">Loading deliveries...</span>
                                    </div>
                                </div>
                            </div>
                        }
                    >
                        <DeliveryTable searchParams={searchParams} />
                    </Suspense>
                </div>
            </Layout>
        </>
    );
}
```

**Changes:**
- ✏️ Line 3: `OrderTable` → `DeliveryTable`
- ✏️ Line 4: `OrderFilters` → `DeliveryFilters`
- ✏️ Line 6: `OrderList` → `DeliveryList`
- ✏️ Line 12: `"Orders"/"Order List"` → `"Logistics"/"Delivery Management"`
- ✏️ Line 14: `<OrderFilters />` → `<DeliveryFilters />`
- ✏️ Line 24: `Loading orders...` → `Loading deliveries...`
- ✏️ Line 30: `<OrderTable` → `<DeliveryTable`

---

## 📄 File 3: Server Data Fetcher

### BEFORE: `app/order-list/OrderTable.js`
```javascript
import { getOrders } from "@/lib/api/orders";
import OrderTableClient from "./OrderTableClient";

export default async function OrderTable({ searchParams }) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  
  const page = parseInt(params.page) || 1;
  const limit = parseInt(params.limit) || 100;
  const status = params.status || '';
  const search = params.search || '';
  const dateFrom = params.dateFrom || '';
  const dateTo = params.dateTo || '';
  const paymentStatus = params.paymentStatus || '';
  const paymentProvider = params.paymentProvider || '';

  try {
    const { data: orders, pagination } = await getOrders({
      page,
      limit,
      status,
      search,
      dateFrom,
      dateTo,
      paymentStatus,
      paymentProvider,
      sortField: 'createdAt',
      sortOrder: 'desc'
    });

    return <OrderTableClient orders={orders} pagination={pagination} />;
  } catch (error) {
    console.error('Error loading orders:', error);
    return (
      <div className="wg-table table-all-category">
        <div className="text-center py-8 text-red-500">
          Error loading orders: {error.message}
        </div>
      </div>
    );
  }
}
```

### AFTER: `app/delivery/DeliveryTable.js`
```javascript
import { getDeliveries } from "@/lib/api/deliveries";
import DeliveryTableClient from "./DeliveryTableClient";

export default async function DeliveryTable({ searchParams }) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  
  const page = parseInt(params.page) || 1;
  const limit = parseInt(params.limit) || 100;
  const status = params.status || '';
  const search = params.search || '';
  const dateFrom = params.dateFrom || '';
  const dateTo = params.dateTo || '';
  // REMOVED: paymentStatus and paymentProvider

  try {
    const { data: deliveries, pagination } = await getDeliveries({
      page,
      limit,
      status,
      search,
      dateFrom,
      dateTo,
      // REMOVED: paymentStatus and paymentProvider
      sortField: 'createdAt',
      sortOrder: 'desc'
    });

    return <DeliveryTableClient deliveries={deliveries} pagination={pagination} />;
  } catch (error) {
    console.error('Error loading deliveries:', error);
    return (
      <div className="wg-table table-all-category">
        <div className="text-center py-8 text-red-500">
          Error loading deliveries: {error.message}
        </div>
      </div>
    );
  }
}
```

**Changes:**
- ✏️ Line 1: `getOrders` from `orders` → `getDeliveries` from `deliveries`
- ✏️ Line 2: `OrderTableClient` → `DeliveryTableClient`
- ✏️ Line 4: `OrderTable` → `DeliveryTable`
- ❌ Lines 13-14: REMOVE `paymentStatus` and `paymentProvider`
- ✏️ Line 17: `orders` → `deliveries`
- ✏️ Line 17: `getOrders` → `getDeliveries`
- ❌ Lines 24-25: REMOVE payment params from API call
- ✏️ Line 30: `OrderTableClient orders={orders}` → `DeliveryTableClient deliveries={deliveries}`
- ✏️ Lines 32, 36: `orders` → `deliveries` in error messages

---

## 📄 File 4: Table Client Component (Most Important!)

### BEFORE: `app/order-list/OrderTableClient.jsx` - Function signature
```javascript
export default function OrderTableClient({ orders: initialOrders, pagination: initialPagination }) {
  const [orders] = useState(initialOrders);
  const [pagination] = useState(initialPagination);
  const [selectedOrders, setSelectedOrders] = useState(new Set());
```

### AFTER: `app/delivery/DeliveryTableClient.jsx` - Function signature
```javascript
export default function DeliveryTableClient({ deliveries: initialDeliveries, pagination: initialPagination }) {
  const [deliveries] = useState(initialDeliveries);
  const [pagination] = useState(initialPagination);
  const [selectedDeliveries, setSelectedDeliveries] = useState(new Set());
```

### BEFORE: Grid template (line 36)
```javascript
const gridTemplate = '40px minmax(150px, 2fr) 90px 120px 100px 70px 90px 100px 140px 120px';
```

### AFTER: Grid template (line 36)
```javascript
const gridTemplate = '40px 90px minmax(150px, 2fr) 120px 100px 90px 140px 120px 120px';
// Columns: Checkbox | Order ID | Customer | Papa Code | Status | Driver | Items | Created | Actions
```

### BEFORE: Table headers (lines 119-160)
```jsx
<ul className="table-title flex gap20 mb-14">
  <li>
    <div className="body-title" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
      <input type="checkbox" ... />
      Product
    </div>
  </li>
  <li><div className="body-title">Order ID</div></li>
  <li><div className="body-title">Customer</div></li>
  <li><div className="body-title">Total</div></li>
  <li><div className="body-title">Items</div></li>
  <li><div className="body-title">Payment</div></li>
  <li><div className="body-title">Status</div></li>
  <li><div className="body-title">Date</div></li>
  <li><div className="body-title">Action</div></li>
</ul>
```

### AFTER: Table headers (lines 119-160)
```jsx
<ul className="table-title flex gap20 mb-14">
  <li>
    <div className="body-title" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
      <input type="checkbox" ... />
      Select
    </div>
  </li>
  <li><div className="body-title">Order ID</div></li>
  <li><div className="body-title">Customer</div></li>
  <li><div className="body-title">Papa Code</div></li>
  <li><div className="body-title">Status</div></li>
  <li><div className="body-title">Driver</div></li>
  <li><div className="body-title">Items</div></li>
  <li><div className="body-title">Created</div></li>
  <li><div className="body-title">Actions</div></li>
</ul>
```

### BEFORE: Render rows (lines 162-177)
```jsx
{orders.length === 0 ? (
  <li className="product-item gap14">
    <div className="text-center py-8 text-gray-500">
      No orders found
    </div>
  </li>
) : (
  orders.map((order) => (
    <OrderRowClient 
      key={order.id} 
      order={order}
      isSelected={selectedOrders.has(order.id)}
      onSelect={() => handleSelectOrder(order.id)}
    />
  ))
)}
```

### AFTER: Render rows (lines 162-177)
```jsx
{deliveries.length === 0 ? (
  <li className="product-item gap14">
    <div className="text-center py-8 text-gray-500">
      No deliveries found
    </div>
  </li>
) : (
  deliveries.map((delivery) => (
    <DeliveryRowClient 
      key={delivery.id} 
      delivery={delivery}
      isSelected={selectedDeliveries.has(delivery.id)}
      onSelect={() => handleSelectDelivery(delivery.id)}
    />
  ))
)}
```

---

## 📄 File 5: Row Component (Critical!)

### BEFORE: `app/order-list/OrderRowClient.jsx`
```javascript
export default function OrderRowClient({ order, isSelected, onSelect }) {
  const firstItem = order.orderItems?.[0];
  const productImage = firstItem?.product?.ProductImages?.[0]?.imageUrl;
  const productName = firstItem?.product?.name || 'Multiple Products';
  const customerName = order.user ? `${order.user.firstName} ${order.user.lastName}` : 'N/A';
  
  return (
    <li className="product-item gap14" ...>
      {/* Checkbox */}
      <div>
        <input type="checkbox" checked={isSelected} onChange={onSelect} ... />
      </div>

      {/* Product Image */}
      <OrderImage imageUrl={productImage} productName={productName} />
      
      <div className="flex items-center justify-between gap20 flex-grow">
        <div className="name">
          <Link href={`/order-detail/${order.id}`}>
            {order.orderItems.length > 1 
              ? `${productName} + ${order.orderItems.length - 1} more`
              : productName
            }
          </Link>
        </div>
        <div className="body-text">#{order.id}</div>
        <div className="body-text">{customerName}</div>
        <div className="body-text">{formatPrice(order.total)}</div>
        <div className="body-text">{order.orderItems.length}</div>
        <div className="body-text">
          {order.payment ? order.payment.provider : 'N/A'}
        </div>
        <div>
          <div className={getStatusBlockClass(order.status)}>
            {translateStatus(order.status)}
          </div>
        </div>
        <div className="body-text text-sm">
          {formatOrderDate(order.createdAt)}
        </div>
        <OrderRowActions order={order} />
      </div>
    </li>
  );
}
```

### AFTER: `app/delivery/DeliveryRowClient.jsx`
```javascript
export default function DeliveryRowClient({ delivery, isSelected, onSelect }) {
  const customerName = delivery.user ? `${delivery.user.firstName} ${delivery.user.lastName}` : 'N/A';
  
  // Extract Papa shipment data
  const papaShipment = delivery.papaShipment;
  const papaCode = papaShipment?.papaCode || 'Not Created';
  const papaStatus = papaShipment?.papaStatus || 'PENDING';
  const driverName = papaShipment?.driverName || 'Not Assigned';
  
  return (
    <li className="product-item gap14" ...>
      {/* Checkbox */}
      <div>
        <input type="checkbox" checked={isSelected} onChange={onSelect} ... />
      </div>

      {/* NO IMAGE - removed */}
      
      <div className="flex items-center justify-between gap20 flex-grow">
        {/* Order ID */}
        <div className="body-text">
          <Link href={`/order-detail/${delivery.id}`} className="text-blue-600 hover:underline">
            #{delivery.id}
          </Link>
        </div>

        {/* Customer Name */}
        <div className="body-text">{customerName}</div>

        {/* Papa Code */}
        <div className="body-text font-mono text-sm">
          {papaCode}
        </div>

        {/* Papa Status */}
        <div>
          <div className={getStatusBlockClass(papaStatus)}>
            {papaStatus}
          </div>
        </div>

        {/* Driver Info */}
        <div className="body-text text-sm">
          {driverName}
        </div>

        {/* Item Count */}
        <div className="body-text">
          {delivery.orderItems.length} items
        </div>

        {/* Created Date */}
        <div className="body-text text-sm">
          {formatOrderDate(delivery.createdAt)}
        </div>

        {/* Actions */}
        <DeliveryRowActions delivery={delivery} />
      </div>
    </li>
  );
}
```

**Key Changes:**
- ❌ REMOVE: productImage, productName variables
- ❌ REMOVE: `<OrderImage />` component
- ✅ ADD: papaShipment, papaCode, papaStatus, driverName variables
- ✏️ CHANGE: All data fields to show delivery-specific info
- ✏️ CHANGE: Status shows Papa status instead of order status

---

## 📄 File 6: Filters Component

### BEFORE: `app/order-list/OrderFilters.jsx` - State variables
```javascript
const [search, setSearch] = useState(searchParams.get('search') || '');
const [status, setStatus] = useState(searchParams.get('status') || '');
const [paymentStatus, setPaymentStatus] = useState(searchParams.get('paymentStatus') || '');
const [paymentProvider, setPaymentProvider] = useState(searchParams.get('paymentProvider') || '');
const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');
```

### AFTER: `app/delivery/DeliveryFilters.jsx` - State variables
```javascript
const [search, setSearch] = useState(searchParams.get('search') || '');
const [status, setStatus] = useState(searchParams.get('status') || '');
// REMOVED: paymentStatus
// REMOVED: paymentProvider
const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');
```

### BEFORE: Route push
```javascript
router.push(`/order-list?${params.toString()}`);
```

### AFTER: Route push
```javascript
router.push(`/delivery?${params.toString()}`);
```

### BEFORE: Active filters count
```javascript
const activeFiltersCount = [search, status, paymentStatus, paymentProvider, dateFrom, dateTo].filter(v => v).length;
```

### AFTER: Active filters count
```javascript
const activeFiltersCount = [search, status, dateFrom, dateTo].filter(v => v).length;
```

---

## 📊 Summary of Key Changes

| Aspect | Order List | Delivery List |
|--------|-----------|---------------|
| **API Endpoint** | `/api/v1/orders` | `/api/v1/admin/shipping/orders/deliverable` |
| **Main Data** | orders | deliveries |
| **Product Image** | ✅ Yes | ❌ No |
| **Payment Filters** | ✅ Yes | ❌ No |
| **Papa Code Column** | ❌ No | ✅ Yes |
| **Driver Column** | ❌ No | ✅ Yes |
| **Status Type** | Order Status | Papa Shipment Status |
| **Total Price Column** | ✅ Yes | ❌ No |

---

## ✅ Verification Checklist

After making changes, verify:

```javascript
// ✓ API client exports function correctly
export async function getDeliveries(...) { ... }

// ✓ Component imports are correct
import DeliveryTable from "./DeliveryTable";
import { getDeliveries } from "@/lib/api/deliveries";

// ✓ Props are passed correctly
<DeliveryTableClient deliveries={deliveries} pagination={pagination} />

// ✓ Map functions work
deliveries.map((delivery) => ...)

// ✓ Optional chaining for Papa data
delivery.papaShipment?.papaCode

// ✓ Routes push to correct path
router.push('/delivery?...')
```

---

## 🎯 Quick Copy-Paste Summary

**Files to create by copying:**
1. `lib/api/orders.ts` → `lib/api/deliveries.ts`
2. `app/order-list/page.js` → `app/delivery/page.js`
3. `app/order-list/OrderTable.js` → `app/delivery/DeliveryTable.js`
4. `app/order-list/OrderTableClient.jsx` → `app/delivery/DeliveryTableClient.jsx`
5. `app/order-list/OrderRowClient.jsx` → `app/delivery/DeliveryRowClient.jsx`
6. `app/order-list/OrderRowActions.jsx` → `app/delivery/DeliveryRowActions.jsx`
7. `app/order-list/OrderFilters.jsx` → `app/delivery/DeliveryFilters.jsx`

**Global Find & Replace in each file:**
- `Order` → `Delivery` (component names)
- `orders` → `deliveries` (variables)
- `order` → `delivery` (singular variables)
- `/order-list` → `/delivery` (routes)
- `selectedOrders` → `selectedDeliveries` (state)

**Manual changes:**
- API endpoint URL
- Table column headers
- Row data fields
- Remove payment filters
- Add Papa shipment data extraction

Done! 🎉

