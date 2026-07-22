# Product-orders: search by product name (2026-07-22)

## Problem

On `/product-orders` (Бүтээгдэхүүнээр tab), typing a product name into the
existing search box returns "Бүтээгдэхүүн олдсонгүй" for products that are
real and have order history. Root cause:

- `ProductOrdersTable.js` fetches only the most recent 500 paid/successful
  orders from the backend, unfiltered by product.
- `ProductOrdersClient.jsx`'s product-name box filters that already-loaded,
  recency-capped batch client-side only.
- If the searched product's orders fall outside the most recent 500, the
  filter finds nothing — not because the product has no orders, but because
  those orders were never fetched.
- Separately, the backend's `/api/v1/orders` `search` param
  (`ayo-back/src/services/orderServices.js:539-558`) only matches customer
  fields (firstName/lastName/email/telephone) and numeric order id. It has
  no path to match product name at all.

## Goal

Typing a product name finds that product's orders regardless of how far
back in history they are, while keeping the existing instant-feedback feel
of the search box.

## Non-goals

- No changes to the "Хэрэглэгчээр" (by-user) tab or its search.
- No changes to the top-level `ProductOrdersFilters` customer search
  (name/phone/email/order number) — stays customer-scoped, unchanged.
- No change to the generic `/api/v1/orders` endpoint's existing `search`
  semantics used elsewhere (e.g. `/order-list`) — the new filter is a
  separate, additive, optional param.
- No pagination redesign; the 500-order cap on this page stays as-is, it's
  just now populated by relevance instead of blind recency.

## Design

### Backend — `ayo-back/src/services/orderServices.js`

Add an optional `productName` query param, read alongside the existing
`search`/`status`/`dateFrom`/`dateTo` params (~line 484-493), and AND it
into the `filters` object built at ~line 563-573:

```js
const productName = queries.productName || "";
...
...(productName
  ? { orderItems: { some: { product: { name: { contains: productName, mode: 'insensitive' } } } } }
  : {}),
```

This is independent of the existing `searchFilter.OR` (customer match) —
both can be present at once (AND'd), or either alone. No route/middleware
change needed: `GET /api/v1/orders` has no query-schema validation, so
`req.query.productName` already reaches the controller/service untouched.

### Frontend plumbing

- `ayo-dashboard/lib/api/orders.ts`: add `productName?: string` to
  `OrdersParams`, append to the query string when present (same pattern as
  existing `search`/`status`/etc., ~line 126-132).
- `ayo-dashboard/app/product-orders/ProductOrdersTable.js`: read
  `params?.productName`, pass through to `getOrders({ ...productName })`
  (~line 160-176).

### Client UX — `ProductOrdersClient.jsx`

The existing product-name input (line ~496-518) keeps its current
`useMemo`-based instant client-side filter over `groups` for zero-latency
feedback on every keystroke.

Additionally, wire it to `useRouter`/`useSearchParams` (same pattern already
used in `ProductOrdersFilters.jsx`): debounce ~400ms after the user stops
typing, then `router.push` with `?productName=<value>` merged into the
current query params (preserving `search`/`status`/`dateFrom`/`dateTo` if
set). This triggers the `Suspense` boundary in `page.js` (keyed on
`JSON.stringify(searchParams)`) to re-fetch from the backend with the widened,
relevance-scoped order set. When it resolves, the new `groups` prop already
contains matches from anywhere in order history, and the existing client
filter continues to narrow the visible rows to the exact matching product(s)
(so orders that match on a *different* co-purchased product don't leak
extra rows into the table).

Clearing the input clears `productName` from the URL the same way
`ProductOrdersFilters`'s clear button does.

### Error handling

No new error paths. Reuses `ProductOrdersTable.js`'s existing try/catch and
empty-state rendering. After this change, an empty result genuinely means
no matching product exists, rather than "not in the last 500 orders."

## Testing

- Search for a product with only old orders (outside the previous 500-order
  window) → now appears.
- Search for a product with no orders at all → still shows the empty state.
- Combine `productName` with `status`/`dateFrom`/`dateTo` → results respect
  all filters together (AND).
- Verify the top-level customer search box (name/phone/email/order number)
  is unaffected.
- Verify `/order-list` (which shares `orderServices.getOrders`) is
  unaffected when `productName` is absent.
