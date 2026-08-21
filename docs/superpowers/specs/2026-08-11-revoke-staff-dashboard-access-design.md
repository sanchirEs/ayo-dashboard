# Revoke all staff dashboard access (BRANCH + SHEET_*)

**Date:** 2026-08-11
**Status:** approved, implementing
**Repos touched:** `ayo-dashboard`, `ayo-back`

## Decision

The owner is withdrawing dashboard access from every non-admin staff account.
Staff will no longer check anything — not the payments Google Sheet, not the
order list, not the in-store pickup PIN page.

Roles revoked: `BRANCH`, `SHEET_PICKUP`, `SHEET_DELIVERY`, `SHEET_REFUND`
(10 accounts: `branch1`–`branch7`, `sheet_pickup_test`, `sheet_delivery_test`,
`sheet_refund_test`).

Roles retained: `ADMIN`, `SUPERADMIN` keep everything; `VENDOR` is unchanged
apart from losing nothing (it was never on the sheet page).

This reverses the 2026-07-21 role design
(`2026-07-21-sheet-payments-pickup-delivery-refund-roles-design.md`) and the
2026-08-06 "everyone sees the order list" grant.

## Mechanism: code-only revoke

Chosen over a production DB demotion. The accounts and their role values stay
untouched in the database; only the gates change. Consequences:

- Staff can still authenticate. They land on `/unauthorized` with an empty
  sidebar and no reachable page.
- Reversal is a single `git revert` in each repo — no hand-reassignment of
  roles, no risk of clobbering a role value we can't reconstruct.
- No migration. The `UserRole` enum keeps all 8 values; dropping enum members
  would require a migration and would break the existing rows that hold them.

## The three gate layers

Per the established pattern, revoking access means editing all three or it
fails open somewhere.

### 1. Dashboard page gate — `lib/permissions.ts`

`ROLE_ALLOWED_ROUTES` for all four roles becomes `["/unauthorized"]`, and
`ROLE_LANDING` for all four becomes `/unauthorized`.

**Why not an empty array.** `middleware.ts` bounces a blocked role to
`getLandingRoute(role)`. With `[]` the landing page is itself blocked, so the
redirect fires again on arrival — an infinite loop (`ERR_TOO_MANY_REDIRECTS`).
Allowlisting exactly the dead-end page terminates the redirect. `/` also
resolves through `getLandingRoute` (`app/page.js`), so post-login lands there
too.

### 2. Backend route authorization — `src/routes/*.js`

| Route | Change |
| --- | --- |
| `sheetPaymentTabRoutes.js` | Router-level `authorize('ADMIN','SUPERADMIN')`; the four confirm/verify routes drop their staff roles |
| `orderRoutes.js` `GET /` and `GET /getorder/:id` | Drop `BRANCH`, `SHEET_*` |
| `orderRoutes.js` send/verify-pickup-pin | Drop `BRANCH` |
| `pickupPinRoutes.js` | Drop `BRANCH` from the router-level authorize |

**Pre-existing hole closed in passing.** `sheetPaymentTabRoutes.js` applied only
`protect` at the router level, so `GET /:tabId/rows` — the full payments sheet,
including customer phone numbers — was readable by *any* authenticated user,
`CUSTOMER` included. The router-level `authorize` closes that. Without it, a
revoked staff account could keep reading the sheet straight from the API even
with the page gate shut.

### 3. Backend service scoping — `src/services/orderServices.js`

`isAdminVendor` (duplicated in `getOrders` and `getOrderDetails`) drops the four
roles, leaving `ADMIN`, `VENDOR`, `SUPERADMIN`. Belt-and-braces: layer 2 already
403s these roles, but if a route is ever reopened, the service must not hand
back all orders.

## Supporting changes

- `authServices.js` `ASSIGNABLE_ROLES` drops the four roles — no new staff
  account can be created with them.
- `app/add-new-user/AddUserForm.js` drops them from the dropdown and the Zod
  enum; the form default moves from `BRANCH` to `ADMIN`.
- `components/layout/Menu.js` renders an empty sidebar for the staff roles
  instead of the Санхүү / Салбар link blocks.
- `app/sheet-payments/SheetTableClient.jsx` narrows `canPickup` / `canDeliver` /
  `canRefund` to `ADMIN` / `SUPERADMIN` (two identical blocks).

## Explicitly not touched

- `prisma/schema.prisma` — enum values stay.
- The user rows themselves — no production writes.
- `lib/auth-utils.ts` role labels and badge colours — still needed so `/all-user`
  renders the existing accounts' roles.
- `utils/claimEligibility.js` and its test — staff rows must remain
  non-claimable regardless of dashboard access.

## Operational consequence, accepted

In-store pickup PIN verification at `/pickup-orders` was a `BRANCH` capability.
After this change only `ADMIN`/`SUPERADMIN` can send and verify a pickup PIN, so
a customer collecting an order in store needs an admin to complete it. Raised
with the owner and confirmed: "kill everything".

## Verification

- `npx vitest run lib/permissions.test.ts` — assertions rewritten to prove
  revocation (every role blocked everywhere except `/unauthorized`, landing is
  `/unauthorized`, API paths still exempt from page-gating).
- Grep both repos for the four role names; every remaining hit must be a label,
  a type union, an enum value, or a claim-eligibility guard — never an
  `authorize()` list, an allowlist, or a `can*` capability check.
