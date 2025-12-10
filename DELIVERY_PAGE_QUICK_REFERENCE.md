# 🚚 Delivery Page - Quick Reference

## 📁 File Structure

```
ayo-dashboard/
├── lib/
│   └── api/
│       ├── orders.ts              (existing - reference for helpers)
│       └── deliveries.ts          ✨ CREATE NEW - API client
│
├── app/
│   ├── order-list/                (existing - copy from here)
│   │   ├── page.js
│   │   ├── OrderTable.js
│   │   ├── OrderTableClient.jsx
│   │   ├── OrderRowClient.jsx
│   │   ├── OrderRowActions.jsx
│   │   └── OrderFilters.jsx
│   │
│   └── delivery/                  ✨ CREATE NEW FOLDER
│       ├── page.js                ✨ CREATE - copy from order-list/page.js
│       ├── DeliveryTable.js       ✨ CREATE - copy from OrderTable.js
│       ├── DeliveryTableClient.jsx ✨ CREATE - copy from OrderTableClient.jsx
│       ├── DeliveryRowClient.jsx  ✨ CREATE - copy from OrderRowClient.jsx
│       ├── DeliveryRowActions.jsx ✨ CREATE - copy from OrderRowActions.jsx
│       └── DeliveryFilters.jsx    ✨ CREATE - copy from OrderFilters.jsx
│
└── routes.ts                      ✏️ UPDATE - add delivery route
```

---

## 🔄 Rename Mapping Table

| Original (Order)         | New (Delivery)              | Notes                    |
|-------------------------|-----------------------------|--------------------------|
| `OrderList`             | `DeliveryList`              | Component name           |
| `OrderTable`            | `DeliveryTable`             | Component name           |
| `OrderTableClient`      | `DeliveryTableClient`       | Component name           |
| `OrderRowClient`        | `DeliveryRowClient`         | Component name           |
| `OrderRowActions`       | `DeliveryRowActions`        | Component name           |
| `OrderFilters`          | `DeliveryFilters`           | Component name           |
| `getOrders`             | `getDeliveries`             | API function             |
| `orders`                | `deliveries`                | Variable name            |
| `order`                 | `delivery`                  | Variable name (singular) |
| `selectedOrders`        | `selectedDeliveries`        | State variable           |
| `orderId`               | `deliveryId`                | Parameter name           |
| `/order-list`           | `/delivery`                 | Route path               |
| `Order List`            | `Delivery Management`       | Page title               |
| `Loading orders...`     | `Loading deliveries...`     | Loading text             |
| `No orders found`       | `No deliveries found`       | Empty state text         |
| `selectedOrders`        | `selectedDeliveries`        | sessionStorage key       |

---

## 📊 Column Comparison

### OLD - Order List Columns:
```
[✓] Product (with image)
[✓] Order ID
[✓] Customer
[✓] Total
[✓] Items
[✓] Payment (provider)
[✓] Status (order status)
[✓] Date
[✓] Action
```

### NEW - Delivery List Columns:
```
[✓] Select (checkbox)
[✓] Order ID
[✓] Customer
[✓] Papa Code
[✓] Status (Papa shipment status)
[✓] Driver
[✓] Items
[✓] Created
[✓] Actions
```

**Removed:** Product image, Total, Payment  
**Added:** Papa Code, Driver info  
**Changed:** Status now shows Papa shipment status instead of order status

---

## 🎯 Backend Endpoints Used

### Primary Endpoint:
```
GET /api/v1/admin/shipping/orders/deliverable
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)
- `status` - Filter by order status
- `search` - Search by order ID or customer name
- `dateFrom` - Start date (ISO format)
- `dateTo` - End date (ISO format)

**Response Structure:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "status": "PROCESSING",
      "total": 150000,
      "createdAt": "2025-01-20T10:00:00Z",
      "user": {
        "id": 1,
        "email": "john@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "telephone": "99001122"
      },
      "orderItems": [
        {
          "id": 1,
          "quantity": 2,
          "price": 75000,
          "product": {
            "name": "Product Name",
            "sku": "SKU-001",
            "ProductImages": [
              { "imageUrl": "https://..." }
            ]
          }
        }
      ],
      "shipping": {
        "address": "123 Main St",
        "city": "Ulaanbaatar",
        "phone": "99001122"
      },
      "payment": {
        "status": "COMPLETED",
        "provider": "QPAY"
      },
      "papaShipment": {
        "id": 45,
        "papaCode": "PO10522",
        "papaStatus": "START",
        "papaPincode": "1234",
        "driverName": "Battulga",
        "driverPhone": "99887766",
        "shippingAmount": 5000,
        "createdAt": "2025-01-20T10:05:00Z",
        "statusChangedAt": "2025-01-20T10:30:00Z"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

### Secondary Endpoints (for actions):

**Get Cargo Shipments:**
```
GET /api/v1/admin/shipping/orders/:orderId/cargos
```

**Sync Cargo Data:**
```
POST /api/v1/admin/shipping/orders/:orderId/cargos/sync
```

**Get Stats:**
```
GET /api/v1/admin/shipping/stats
```

**Get Cargo Stats:**
```
GET /api/v1/admin/shipping/cargos/stats
```

---

## 🎨 Papa Status Badge Styling

Use the same `getStatusBlockClass` helper from `lib/api/orders.ts`:

### Papa Status Values:
- `NEW` - Created but not confirmed
- `CONFIRM` - Confirmed, visible to drivers
- `CREATING_SHIPPING` - Driver assigned
- `START` - Driver picked up package
- `END` - Driver delivered
- `COMPLETED` - Fully completed
- `CANCELLED` - Cancelled

### Badge CSS Classes (use existing):
```javascript
const getStatusBlockClass = (status) => {
  const baseClass = 'block-available';
  
  switch(status) {
    case 'START':
    case 'END':
      return baseClass; // Green
    case 'CONFIRM':
    case 'CREATING_SHIPPING':
      return 'block-pending'; // Yellow
    case 'NEW':
      return 'block-not-available'; // Gray
    case 'COMPLETED':
      return 'block-available'; // Green
    case 'CANCELLED':
      return 'block-not-available'; // Red
    default:
      return baseClass;
  }
};
```

---

## 🔧 Helper Functions to Import

From `lib/api/orders.ts`:

```typescript
import { 
  getStatusBlockClass,    // For status badges
  formatOrderDate,        // For date formatting
  formatPrice,            // For price formatting (if needed)
  translateStatus         // For status translation (if needed)
} from "@/lib/api/orders";
```

These functions already exist and work perfectly for deliveries too!

---

## 📝 Step-by-Step Checklist

### Phase 1: Setup
- [ ] Create `lib/api/deliveries.ts`
- [ ] Create folder `app/delivery/`
- [ ] Copy all 6 files from `order-list` to `delivery`

### Phase 2: Rename Files
- [ ] Rename `page.js` content
- [ ] Rename `DeliveryTable.js` content
- [ ] Rename `DeliveryTableClient.jsx` content
- [ ] Rename `DeliveryRowClient.jsx` content
- [ ] Rename `DeliveryRowActions.jsx` content
- [ ] Rename `DeliveryFilters.jsx` content

### Phase 3: Update API Client
- [ ] Create deliveries.ts interface
- [ ] Update API endpoint to `/admin/shipping/orders/deliverable`
- [ ] Remove payment-related params
- [ ] Test API call in browser console

### Phase 4: Update Components
- [ ] Update table columns in DeliveryTableClient
- [ ] Update row data in DeliveryRowClient
- [ ] Remove payment filters in DeliveryFilters
- [ ] Update action buttons in DeliveryRowActions

### Phase 5: Routes & Navigation
- [ ] Add route to `routes.ts`
- [ ] Add menu item to sidebar
- [ ] Test navigation

### Phase 6: Testing
- [ ] Visit `/delivery` page
- [ ] Test filters work
- [ ] Test pagination works
- [ ] Test actions work
- [ ] Check mobile responsive
- [ ] Verify no console errors

---

## 🐛 Debugging Guide

### Issue: Page shows "Cannot read property 'papaShipment' of undefined"
**Fix:** Add optional chaining:
```javascript
const papaCode = delivery?.papaShipment?.papaCode || 'Not Created';
```

### Issue: Table columns don't align
**Fix:** Count your columns and update gridTemplate:
```javascript
// 9 columns = 9 sections in gridTemplate
const gridTemplate = '40px 90px minmax(150px, 2fr) 120px 100px 90px 140px 120px 120px';
```

### Issue: Filters not updating page
**Fix:** Check router.push path:
```javascript
router.push(`/delivery?${params.toString()}`); // NOT /order-list
```

### Issue: API returns 401 Unauthorized
**Fix:** Check token is passed in headers:
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### Issue: "deliveries.map is not a function"
**Fix:** Initialize with empty array:
```javascript
const [deliveries] = useState(initialDeliveries || []);
```

---

## 💾 Code Snippets

### Empty State Handler:
```jsx
{deliveries.length === 0 ? (
  <li className="product-item gap14">
    <div className="text-center py-8 text-gray-500">
      No deliveries found. Orders will appear here after payment completion.
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

### Pagination Info:
```jsx
<div className="text-tiny">
  Showing {deliveries.length > 0 ? (pagination.currentPage - 1) * pagination.limit + 1 : 0} to{" "}
  {Math.min(pagination.currentPage * pagination.limit, pagination.total)} of{" "}
  {pagination.total} deliveries
</div>
```

### Optional Data Display:
```jsx
{/* Papa Code - handle missing shipment */}
<div className="body-text font-mono text-sm">
  {delivery.papaShipment?.papaCode || (
    <span className="text-gray-400">Not Created</span>
  )}
</div>

{/* Driver Name - handle not assigned */}
<div className="body-text text-sm">
  {delivery.papaShipment?.driverName || (
    <span className="text-gray-400">Not Assigned</span>
  )}
</div>
```

---

## 🎯 Success Criteria

✅ **Visual Check:**
- Page loads without errors
- Table displays data in clean, aligned columns
- Filters are visible and functional
- Pagination shows correct numbers

✅ **Functional Check:**
- Can filter by status
- Can search by order ID or customer name
- Can select date range
- Pagination works (next/prev)
- Can select individual deliveries with checkbox

✅ **Data Check:**
- Order IDs link to order detail page
- Papa codes display correctly (or "Not Created")
- Status badges show correct colors
- Driver names show (or "Not Assigned")
- Item counts are accurate
- Dates format correctly

✅ **Responsive Check:**
- Works on desktop (1920px)
- Works on tablet (768px)
- Works on mobile (375px)

---

## 📞 Quick Commands

```bash
# Start dev server
npm run dev

# Check page
open http://localhost:3000/delivery

# Test API directly
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/admin/shipping/orders/deliverable?page=1&limit=20

# Check console for errors
# Open browser DevTools > Console tab
```

---

## 🎓 Remember

1. **Copy, don't rewrite** - All the code already exists in order-list
2. **Find & Replace** - Use editor search to rename consistently
3. **Test incrementally** - Check after each file
4. **Use browser DevTools** - Console shows errors clearly
5. **Backend is ready** - API endpoints already work, just use them

**The task is 90% copy-paste and 10% rename.** Keep it simple!

---

## 📚 Related Documentation

- Main Plan: `DELIVERY_PAGE_MASTER_PLAN.md`
- Backend Guide: `ayo-back/PAPA_CARGO_TRACKING_GUIDE.md`
- API Docs: `ayo-back/src/routes/adminShipmentRoutes.js`
- Frontend Reference: `app/order-list/*` files

---

Good luck! 🚀 If you follow the steps exactly, you'll have a working delivery page in no time.

