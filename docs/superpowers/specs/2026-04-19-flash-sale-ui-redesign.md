# Flash Sale Page UI Redesign

**Date:** 2026-04-19  
**Status:** Approved

## Problem

The `/flash-sale` page has two critical issues:
1. It uses a bare `<div className="main-content-wrap">` instead of the `<Layout>` component, so the sidebar and header are missing — the page looks completely disconnected from the rest of the dashboard.
2. The "New Flash Sale" form asks the user to type a raw numeric Product ID, which is completely non-UX-friendly. No one knows product IDs off the top of their head.

## Goals

- Add `<Layout>` wrapper so the page gets the sidebar, header, and breadcrumb — consistent with every other dashboard page.
- Replace the Product ID number input with an **inline search combobox**: type a name or SKU, see a dropdown of matching products with image + name + price, click to select.
- Show a selected-product preview (name, SKU, price) so the user knows exactly what they picked before submitting.
- Add a **1-hour** duration preset alongside the existing 10/15/30-minute ones.
- Keep everything else (date, start time, duration pills, discount %, preview bar, scheduled list) intact — just clean up the layout.

## Architecture

### Files changed

| File | Change |
|------|--------|
| `app/flash-sale/page.js` | Wrap with `<Layout>`, pass breadcrumb props |
| `app/flash-sale/FlashSaleForm.js` | Replace `productId` number input with `ProductCombobox` client component |
| `app/flash-sale/ProductCombobox.jsx` | New client component — search + dropdown + selection preview |

### ProductCombobox component

**Location:** `app/flash-sale/ProductCombobox.jsx` (client component)

**Props:**
```js
// onSelect(product: { id, name, sku, price, imageUrl, category }) => void
// value: { id, name, sku, price, imageUrl, category } | null
```

**Behavior:**
1. On mount, fetch all products via `GET /api/v1/products/` using the session token (`useSession`). Store in local state.
2. Render a text input. On change, filter the in-memory list client-side by `name` and `sku` (case-insensitive).
3. Show dropdown (max 6 items) while input is focused and query is non-empty. Each row: product thumbnail (32×32, fallback placeholder), name, SKU, price.
4. On row click: call `onSelect(product)`, close dropdown, clear input.
5. When `value` is set: show a selected-product card below the input (48×48 image, name, SKU, category, price, × clear button).
6. Clicking × calls `onSelect(null)` and re-focuses the input.
7. Close dropdown on outside click (mousedown listener on document).

**Data fetch:** On mount, call `getDiscountableProducts(token)` from `lib/api/discounts.ts`. This works client-side because `getBackendUrl()` falls back to `NEXT_PUBLIC_BACKEND_URL`. Token comes from `useSession()`.

**Why in-memory filtering (not debounced API calls):** The product list for a cosmetics store is typically a few hundred items — fetching once and filtering locally is faster and avoids request throttling issues. If the list grows beyond ~1000 items, a debounced API search can be added later.

### FlashSaleForm changes

- Remove `productId` string field from state; add `selectedProduct: null` field.
- Replace the Product ID `<input type="number">` with `<ProductCombobox value={selectedProduct} onSelect={p => set('selectedProduct', p)} />`.
- Validation: require `selectedProduct` instead of `productId`.
- Pass `productId: selectedProduct.id` to `createFlashSale()`.
- Add `{ label: '1 цаг', minutes: 60 }` to the `DURATIONS` array.

### page.js changes

- Import `Layout` from `@/components/layout/Layout`.
- Wrap the returned JSX in `<Layout breadcrumbTitleParent="Маркетинг" breadcrumbTitle="Flash Sale">`.
- Remove the bare `<div className="main-content-wrap">` wrapper (Layout provides this).

## UI Details

**Combobox input:** styled to match existing dashboard inputs (`border: 1px solid #e2e8f0`, `border-radius: 6px`, `padding: 8px 12px`). Shows a search icon on the left.

**Dropdown:** `position: absolute`, `z-index: 50`, `box-shadow: 0 4px 12px rgba(0,0,0,0.08)`, max 6 rows, scrollable if more.

**Selected product card:** sits directly below the combobox, `background: #f8fafc`, `border-radius: 8px`, flex row with image on left, meta on right, × button far right.

**Duration pills:** existing style, add `{ label: '1 цаг', minutes: 60 }`.

## What is NOT changing

- `FlashSaleList.js` — no changes needed, the list is already correct.
- `lib/api/flashSale.ts` — no changes needed.
- `lib/api/discounts.ts` — `getDiscountableProducts` is reused via a new client-side fetch in `ProductCombobox`.
- The `/discounts` page — separate page, not touched.
- Backend — no changes needed.

## Out of Scope

- Pagination or infinite scroll in the combobox dropdown.
- Category filter in the combobox.
- Bulk flash sale creation.
- The `/discounts` page redesign.
