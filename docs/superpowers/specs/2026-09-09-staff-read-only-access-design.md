# Staff accounts: read everything, change nothing

**Date:** 2026-09-09
**Status:** approved, implementing
**Repos touched:** `ayo-back`, `ayo-dashboard`
**Supersedes:** `2026-08-11-revoke-staff-dashboard-access-design.md`

## Why

Staff reported they cannot log in. They can — `loginWithCredentials` has no role
gate, so BRANCH and SHEET_* accounts authenticate and get a valid session. The
dashboard then bounces them to `/unauthorized` on the very next request, because
the Aug 11/Aug 21 revoke set their route allowlist to `["/unauthorized"]`. From
the shop floor that is indistinguishable from a broken login.

The owner is reversing the revoke, but not to the pre-revoke model. The new
rule is broader on reads and narrower on writes:

> Every staff role sees every operational page and its data. No staff role can
> change anything, except the single action that role exists to perform.

## Scope decisions (owner, 2026-09-09)

**Roles covered:** all four — `BRANCH`, `SHEET_PICKUP`, `SHEET_DELIVERY`,
`SHEET_REFUND`. The enum is the contract; whoever holds the role gets the
behaviour, including accounts created later.

**Each role keeps its one action.** Rejected "pure read-only" because it would
strand the in-store pickup flow and the sheet-payments confirm workflow on an
admin. Matches the owner's standing framing: "everyone sees it, but of course
everyone can not do everything."

**Reads staff get:** orders, deliveries, products, campaigns, import orders,
sheet-payments, pickup logs, barcodes, store locations, **and `/all-user`**
(the customer database — explicitly granted).

**Reads staff do NOT get:** `/report` + `/sales` (financials), `/setting` +
`/store-settings`, `/sms-broadcast`.

**Not restoring `ASSIGNABLE_ROLES`.** Admins still cannot create new staff
accounts from `/add-new-user`; the owner did not ask for it. The four roles stay
out of the dropdown.

## Architecture

The revoke worked by *removing* staff from `authorize()` lists across 31 route
files. Reversing that by enumeration would mean re-opening those files and then
hand-auditing all 115 write endpoints to re-close them — and every endpoint
added later would be a silent write leak. Wrong shape. Two choke points instead.

### 1. Reads open by rule — `middlewares/protect.js`

`authorize(...roles)` gains one staff clause: if the caller holds a staff role,
the request is a read (`GET`/`HEAD`), the route already admits `ADMIN`, and the
path is not read-denied, allow it.

Staff inherit admin's read surface automatically. No per-route edits, and a
GET endpoint added next month works for staff with nobody having to remember.

Read deny-list (prefixes, matched on the `/api/v1`-relative path):

| Prefix | Reason |
| --- | --- |
| `/analytics` | Financials — backs `/report` and `/sales` |
| `/sms-broadcast` | Campaign history and recipient lists |
| `/system`, `/debug`, `/redis` | Infrastructure internals, never staff-facing |

`/settings` is deliberately NOT denied: it is a public-read endpoint the
storefront depends on, so denying staff there would be theatre. The
`/setting` and `/store-settings` *pages* are gated on the dashboard instead.

### 2. Writes closed by default — `middlewares/staffAccess.js` (new)

One `denyStaffWrites` guard: staff role + non-read method → 403, unless the path
matches that role's explicit action allowlist.

**Where it runs.** Not mounted at the top of `routes/index.js`, which was the
first instinct and is wrong: the v1 router runs before any route's `protect`, so
`req.userRole` would still be undefined and the guard would never fire. It runs
instead at the tail of `protect` and `passAuth`, the two places the role is
first known. Every authenticated route passes through one of them, and a route
that uses neither cannot identify a staff caller in the first place.

Fail-closed. A new POST added later is blocked for staff by default. This also
covers routers that forgot their own `authorize()` — see the security fix below.

The action allowlist, and nothing else:

| Role | Path | Method |
| --- | --- | --- |
| BRANCH | `/orders/send-pickup-pin/:id`, `/orders/verify-pickup-pin/:id` | POST |
| BRANCH | `/pickup-pins/records/:id/send-pin`, `/pickup-pins/records/:id/verify` | POST |
| BRANCH, SHEET_PICKUP | `/sheet-payments[/tabs/:tabId]/rows/:i/{send-pin,verify-pin,confirm-pickup}` | POST |
| SHEET_DELIVERY | `/sheet-payments/tabs/:tabId/rows/:i/confirm-delivery` | POST |
| SHEET_REFUND | `/sheet-payments/tabs/:tabId/rows/:i/confirm-refund` | POST |
| all four | `/sheet-payments[/tabs/:tabId]/refresh` | POST |

BRANCH appears on the sheet pickup actions because that was its pre-revoke
capability (`canPickup` admitted `BRANCH` as well as `SHEET_PICKUP`).

`refresh` is a judgement call, flagged: it is a POST, but it re-pulls the Google
Sheet rather than mutating business data, and without it the page staff live on
serves stale rows.

Explicitly NOT allowlisted, though pre-revoke access might suggest otherwise:
`POST /pickup-pins/imports` (bulk xlsx upload), `PATCH .../phone` (editing a
customer's number), `POST /pickup-pins/records/:id/cancel`. Those are changes.

### 3. Data scoping — `services/orderServices.js`

`isAdminVendor` — duplicated in `getOrders` (~line 585) and `getOrderDetails`
(~line 810) — must include the four staff roles. Miss this and every order page
loads but shows zero rows, because the query silently scopes to
`userId: <the staff account's own id>`. This is the failure mode the three-layer
note warns about: looks like "access granted but no data", not like an error.

### 4. Dashboard page gate — `lib/permissions.ts`

`ROLE_ALLOWED_ROUTES` for all four roles becomes the shared staff page list;
`ROLE_LANDING` returns to `/order-list`.

Excluded from the list: the owner's four sensitive areas, and every page whose
only purpose is to perform a write (`/add-new-user`, `/create-role`,
`/add-product`, `/new-*`, `/edit-*`). A read-only account on a creation form is
a wall of buttons that all 403.

`Menu.js` gets the staff sidebar back, and `SheetTableClient.jsx` restores
`canPickup`/`canDeliver`/`canRefund` to their pre-revoke role sets so the kept
actions are reachable in the UI.

## Security fix, in passing

`routes/sheetPaymentRoutes.js` (the legacy `/sheet-payments` router, distinct
from `/sheet-payments/tabs`) applies `protect` and **no `authorize` at all**.
Any authenticated user — every CUSTOMER account included — can today:

- `GET /rows` and `GET /logs` — the full payments sheet with customer phone numbers
- `PATCH /rows/:rowIndex/phone` — edit a customer's number
- `POST /rows/:rowIndex/send-pin` — fire an SMS PIN

The Aug 21 commit reported closing exactly this hole, but only added the
router-level `authorize` to `sheetPaymentTabRoutes.js`. The legacy router
mounted seven lines away in `index.js` was missed.

Fix: `router.use(authorize('ADMIN','SUPERADMIN', ...STAFF_ROLES))`, with
`denyStaffWrites` narrowing staff to the allowlist above. This is independent of
the staff feature and would be worth shipping on its own.

## Testing

- `ayo-back/src/__tests__/staffAccess.test.js` (new) — the write-guard: each
  staff role allowed on its own action, blocked on a sample across the other
  115 write endpoints, blocked on another role's action, admins unaffected.
- `ayo-back/src/__tests__/authorizeStaffRead.test.js` (new) — the read rule:
  staff GET allowed where ADMIN is admitted, denied on the deny-list, non-GET
  falls through to the normal check, non-staff roles unchanged.
- Both files MUST be added to `vitest.config.mjs`'s `include` array — it lists
  test files individually, not by glob, and an unlisted test silently never runs
  while the suite still reports green.
- No `vi.mock`: it is a silent no-op in this CJS codebase. Use `createX(deps)`
  factories, and remember `vi` is a global (`require("vitest")` throws).
- `ayo-dashboard`: `lib/permissions.test.ts` currently asserts the revocation,
  so it will go red — that is the signal the change landed. Rewrite against the
  new model.

## Verification, and its limits

`ayo-back` must not be booted locally — it warms cache against the production
database. So the middleware chain was instead exercised inside a throwaway
Express app: the real `protect`, `authorize` and `denyStaffWrites`, real signed
JWTs, real HTTP requests, no database. 23 role/method/path cases.

**That run earned its keep.** The unit tests passed while four of the kept
actions were in fact broken: these guards run from inside `protect`, which
routers mount on themselves, so `req.path` arrives relative to that mount
(`/storepay/rows/3/confirm-pickup`) and every allowlist entry — written against
the full path — missed. Staff were silently denied the one action their role
exists to perform. The unit tests fed full paths directly and could not see it.
`policyPath` now reads `req.originalUrl`, which is mount-independent, and there
is a regression test for the mount-relative shape.

Still not covered: no request has hit the real routers with a real database, and
no browser has loaded the dashboard as a staff user. The page gate, the sidebar
and the sheet buttons are verified by unit tests and reading only. First real
proof is staff logging in after deploy.

Railway does not run `prisma migrate deploy`. No schema change here, so that is
not a risk this time.

## Not touched

- `prisma/schema.prisma` — enum values unchanged, no migration.
- User rows — no production writes; this stays a code-only change, revertable
  with a single `git revert` per repo.
- `utils/claimEligibility.js` — staff rows stay non-claimable.
- `ASSIGNABLE_ROLES` — see scope decisions.
