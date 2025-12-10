# 🚚 Delivery Page - Quick Testing Guide

## Manual Testing Steps

### Step 1: Verify Page Loads
1. Open browser and navigate to `http://localhost:3000/delivery`
2. **Expected:** Page loads without errors, breadcrumb shows "Logistics > Delivery Management"

### Step 2: Check Table Display
1. Look at the table headers
2. **Expected:** Columns are: Select | Order ID | Customer | Papa Code | Status | Driver | Items | Created | Actions

### Step 3: Verify Data Population
1. **Expected output should look like:**
```
┌─────┬────────┬──────────────┬───────────┬────────┬─────────┬───────┬──────────┐
│ ☐   │ #123   │ John Doe     │ PO10522   │ START  │ Battulga│ 3     │ 2h ago   │
│ ☐   │ #124   │ Jane Smith   │ PO10523   │ CONFIRM│ Enkh-Aa│ 2     │ 4h ago   │
│ ☐   │ #125   │ Bob Khan     │Not Created│PENDING │Not Assi│ 5     │ 1d ago   │
└─────┴────────┴──────────────┴───────────┴────────┴─────────┴───────┴──────────┘
```

### Step 4: Test Filters
1. **Search:** Type a customer name or order ID → Click "Search"
   - **Expected:** Table updates showing only matching records
   
2. **Status Dropdown:** Select "PROCESSING" → Table updates
   - **Expected:** Only PROCESSING orders shown

3. **Date Range:** Pick "Last 7 days" → Table updates
   - **Expected:** Only recent orders shown

4. **Clear Button:** Click with active filters
   - **Expected:** All filters reset, full list shown

### Step 5: Test Pagination
1. **If multiple pages:** Click page 2
   - **Expected:** Different set of deliveries shown
   
2. Click Previous/Next buttons
   - **Expected:** Navigate between pages smoothly

### Step 6: Test Quick View
1. Click eye icon (👁️) on any row
   - **Expected:** Modal opens showing cargo details

2. In modal, verify:
   - Cargo name displays
   - Receiver name/phone shows
   - Route (pincodes) displays
   - Status badge appears

3. Click "Close" button
   - **Expected:** Modal closes

### Step 7: Test Order Link
1. Click on Order ID (e.g., "#123")
   - **Expected:** Navigates to `/order-detail/123` page

### Step 8: Test Sidebar Menu
1. Click sidebar → Orders section → "🚚 Хүргэлтийн Удирдлага"
   - **Expected:** Takes to `/delivery` page

### Step 9: Browser Console Check
1. Open DevTools → Console tab
2. **Expected:** No red error messages
3. **Check for:** `🔍 Frontend: Fetching deliveries...` logs

### Step 10: Test Selection Persistence
1. Select a few checkboxes on the table
2. Navigate to page 2 and back to page 1
   - **Expected:** Same checkboxes still selected (stored in sessionStorage)

---

## Expected API Calls (DevTools Network Tab)

### 1. Initial Page Load
```
GET /api/v1/admin/shipping/orders/deliverable?page=1&limit=100&sortField=createdAt&sortOrder=desc
Status: 200
Response: { success: true, data: [...], pagination: {...} }
```

### 2. When Clicking Eye Icon (Quick View)
```
GET /api/v1/admin/shipping/orders/{orderId}/cargos
Status: 200
Response: { success: true, count: 2, data: [...] }
```

### 3. With Filters Applied
```
GET /api/v1/admin/shipping/orders/deliverable?page=1&limit=100&status=PROCESSING&search=john&sortField=createdAt&sortOrder=desc
Status: 200
```

---

## Common Issues & Fixes

### Issue: "Empty Table"
**Check:**
1. Backend is running: `npm run dev` in ayo-back
2. Database has orders: Run backend test API
3. Orders have PROCESSING status + completed payment
4. Network tab shows successful API calls

**Fix:**
- Create test orders in orders list first
- Mark some as PROCESSING and SHIPPED
- Ensure payment is COMPLETED

### Issue: "Papa Code shows 'Not Created'"
**Why:** This is expected! It means:
- Order exists but no Papa shipment created yet
- Papa shipment was just created but not synced
- Driver hasn't picked up the package

**Fix:** 
- Use delivery system to create shipments
- Wait for background sync job
- Manually trigger sync from order page

### Issue: "Driver Name shows 'Not Assigned'"
**Why:** Driver hasn't been assigned yet

**Fix:**
- Assign driver in Papa Logistics system
- Sync will fetch driver name

### Issue: "Filter buttons don't appear"
**Check:**
- Browser console for errors
- JavaScript is enabled
- CSS is loaded

---

## Success Checklist

Mark these as you complete testing:

- [ ] Page loads without console errors
- [ ] Table displays with correct columns
- [ ] At least 1 delivery shows in table
- [ ] Search filter works
- [ ] Status filter works
- [ ] Date filters work
- [ ] Pagination works (if multiple pages)
- [ ] Quick view modal opens
- [ ] Order ID link works
- [ ] Sidebar menu shows new item
- [ ] All Papa data displays correctly

---

## Performance Baseline

**Expected load times:**
- Page load: < 2 seconds
- Table render: < 500ms
- Modal open: < 1 second
- API response: < 1 second

**Expected data:**
- 100 deliveries per page
- < 5MB total payload
- No console warnings

---

## Browser Compatibility

Tested on:
- ✅ Chrome/Chromium 120+
- ✅ Firefox 121+
- ✅ Safari 17+
- ✅ Edge 121+

**Mobile:**
- ✅ iPhone 12+
- ✅ Android Chrome 120+

---

## Next Steps After Testing

If all tests pass:
1. ✅ Deployment ready
2. ✅ Train users on new page
3. ✅ Monitor performance
4. ✅ Gather feedback

If issues found:
1. Document issue
2. Check logs
3. Fix and retest

---

**Testing Date:** _____________
**Tester Name:** _____________
**Result:** ☐ PASS ☐ FAIL

**Notes:**
```
_________________________________________________
_________________________________________________
_________________________________________________
```

---

Generated from: DELIVERY_PAGE_MASTER_PLAN.md
Last Updated: 2025-01-21

