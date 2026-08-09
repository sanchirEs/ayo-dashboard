# Add Product form — rewrite design

**Date:** 2026-08-09
**Status:** Approved for planning
**Scope:** `ayo-dashboard` — `/add-product`, with the resulting components reused by `/edit-product/[id]` in a follow-up.

## Problem

`/add-product` is visually inconsistent with the rest of the dashboard and unpleasant to use. Three separate causes:

1. **It wears a skin no other page wears.** `app/add-product/premium-product-form.css` is a 4,040-line private design system (`premium-card`, `premium-input`, `premium-label`) used only by add-product and edit-product. Every other page — including the most recently built ones (`retailers`, `store-settings`, `import-orders`) — uses the Remos house classes or Tailwind. The page reads as a different application.

2. **The markup is hand-rolled.** `AddProductComponent.js` is 2,300 lines, of which lines 776–2300 are JSX. Every field is written out as roughly six nested `div`s with bespoke class names, so sizing, spacing, focus and cursor treatment vary field by field. There is no shared field primitive.

3. **Form state is fragmented.** react-hook-form is only one of seven sources of truth. `variants`, `productSpecs`, `selectedTags`, `selectedCategoryIds`, `selectedHierarchicalTags` and `uploadedImages` each live in their own `useState` and are copied into the form by `useEffect`. This is the direct cause of the image bug (see Known defects).

Duplication compounds all of it:

| File | Size |
|---|---|
| `app/add-product/AddProductComponent.js` | 109 KB |
| `app/add-product/premium-product-form.css` | 98 KB |
| `app/edit-product/[id]/EditProductComponent.js` | 97 KB |
| `app/edit-product/[id]/EditProductComponent_new.js` | 105 KB |
| `app/edit-product/[id]/EditProductComponent_Complete.js` | 121 KB |
| `app/edit-product/[id]/premium-product-form.css` | 98 KB (byte-identical copy) |

Three rival copies of the edit component exist with no marker for which is live.

## Goals

- `/add-product` looks and feels native to the dashboard, built from real components rather than bespoke CSS.
- The product wire format is provably unchanged.
- Category selection becomes usable at the current catalogue size (~728 categories).
- The components produced are create/edit-agnostic, so `/edit-product/[id]` can adopt them in a follow-up that is mostly deletion.

## Non-goals

- Changing any backend endpoint, request shape or response shape.
- Migrating other dashboard pages to the new styling.
- Rewriting `/edit-product/[id]` in this piece of work. Its adoption is a separate, subsequent change.
- Adding the `estimatedDeliveryDays` / `deliveryNote` fields. They exist in `schemas/productSchema.ts` but are not rendered by the current form, and adding them is out of scope. `isImportedProduct` is derived on the backend from category 62 and must stay off the form.
- Introducing a component-testing setup. The project has no testing-library configuration and this work will not add one.

## Decisions taken

| Decision | Choice | Rationale |
|---|---|---|
| Styling system | Tailwind + shadcn (`components/ui/*`) | Already installed and partly used; yields real components and the largest code reduction |

"Tuned to sit beside the Remos chrome" means, concretely: use only the HSL design tokens already defined in `globals.css` (`--background`, `--foreground`, `--muted`, `--border`, `--primary`, `--destructive`, `--radius`). No new colour values, no new radius values, no brand hues introduced by this work. Dark mode then works through the existing `.dark` token block with no extra effort.

| Layout | Two-column: main content left, 380px sticky rail right | Standard product-admin pattern; roughly halves the scroll |
| Feature scope | Unchanged — all existing sections retained | User confirmed all four candidate sections are in use |
| Sequencing | Shared components built create/edit-agnostic from day one; only `/add-product` wired in this change | Gives an early reviewable page without repeating the history that produced three edit copies |

### Scope note

Dropping the "Нэмэлт тохиргоо" section (flash sale / discount / promotion) and the hierarchical-tags section was raised, since both duplicate dedicated pages (`/flash-sale`, `/discounts`, `/campaigns`, and `/products/[id]/hierarchical-tags`). The user confirmed both are in use and should stay. They are retained in full. The hierarchical-tags **error handling** still changes — see Error handling.

## Architecture

```
components/product-form/
  ProductForm.jsx            container — owns react-hook-form; props { mode, initialValues, onSubmit }
  useProductFormData.js      one hook, one Promise.all, one loading state
  sections/
    BasicInfoSection.jsx     name, SKU, description, howToUse, ingredients, specs
    PricingSection.jsx       simple ⇄ variant mode, price, quantity
    VariantsSection.jsx      attribute selection + generated variant table
    MediaSection.jsx         image gallery                    ┐
    OrganizeSection.jsx      categories, brand, tags          ├ right rail
    AdvancedSection.jsx      flash sale / discount / promotion ┘ (collapsed by default)
  fields/
    Field.jsx                label + control + hint + error, in one place
    CategoryPicker.jsx       replaces CategorySelector + the chip grid

lib/products/
  variantNormalization.ts    already exists (currently untracked) — kept unchanged
  buildProductPayload.ts     extracted from AddProductComponent.js:491, made pure
  productFormDefaults.ts     default values, and product → form mapping for edit mode

components/ui/
  card.tsx  switch.tsx  radio-group.tsx  accordion.tsx   missing shadcn primitives to add
```

**Boundary rule.** Sections receive the react-hook-form `form` object plus whatever reference data they need as props. They never fetch, and they never branch on create-vs-edit. Anything that must differ between the two pages is handled in `ProductForm.jsx` or passed in. This rule is what makes the edit-product follow-up small.

`app/add-product/page.js` becomes a thin server-free wrapper rendering `<ProductForm mode="create" />`. The current `dynamic(..., { ssr: false })` wrapper is removed; it exists to dodge `File` API access during SSR, which no longer happens once images are handled inside client-only sections.

### State

react-hook-form is the single source of truth. Specifically:

- `specs` and `variants` become `useFieldArray` arrays.
- `categoryIds`, `brandId`, `tags`, `hierarchicalTagIds` and `images` become controlled form fields.
- **No `useEffect` copies state into the form.** All the current sync effects disappear.

Reference data (categories, brands, attributes, tag presets, tag groups) is not form state and stays in `useProductFormData`, which performs the same five-call `Promise.all` as today and exposes one `loading` flag and one `error` value instead of the current four separate loading booleans.

### Payload

`buildProductPayload(formValues, context)` is extracted as a pure function and must reproduce today's output exactly, including:

- Simple mode: product-level `price`; a single generated variant with SKU `` `${sku}-DEFAULT` ``, `isDefault: true`, empty `attributes`, `inventory.quantity`, and images mapped from the uploaded set with `isPrimary` on the first.
- Variant mode: product-level `price` taken from the default variant, falling back to the first variant, falling back to `0`.
- `categoryIds` falling back to `[Number(categoryId)]` when the multi-select is empty.
- `brandId` included only when truthy.
- Advanced fields (`flashSale`, `flashSaleEndDate`, `discountId`, `promotionId`) included only when the advanced section is enabled and the individual value is set.
- Variant image resolution order: variant-specific uploaded images, then main-form uploaded images, then `[]`.

Submission remains a single `POST /api/v1/products/createproduct` with a JSON body, followed by the separate hierarchical-tags call when tags are selected.

## Visual design

### Shell

```
┌───────────────────────────────────────────────────────┐
│  ← Бараа нэмэх                    [Цуцлах] [Хадгалах] │  sticky
└───────────────────────────────────────────────────────┘
   ┌─ main (flex-1) ──────────┐  ┌─ rail (380px, sticky) ┐
   │ Үндсэн мэдээлэл          │  │ Зураг                 │
   │ Үнэ болон нөөц           │  │ Ангилал & брэнд       │
   │ (Вариант — variant mode) │  │ Шошго                 │
   │ ▸ Нэмэлт тохиргоо        │  │                       │
   └──────────────────────────┘  └───────────────────────┘
```

The save action moves from the bottom of the page to the sticky top bar. It currently sits below roughly 2,000px of scroll.

The rail collapses below the main column at the `lg` breakpoint.

### Category picker

One component replaces the two that render today (the `CategorySelector` tree and the "Боломжтой ангилалууд" chip grid).

The field shows current selections as removable chips with a button that opens a dialog:

```
Ангилал *
┌──────────────────────────────────────────────────┐
│ [Арьс арчилгаа ×] [Цэвэрлэгч ×]      + Сонгох    │
└──────────────────────────────────────────────────┘

┌─ Ангилал сонгох ────────────────────────────────┐
│ [Хайх] [Мод]                                     │
│ 🔍 цэвэрл                                        │
├──────────────────────────────────────────────────┤
│ ☑ Гоо сайхан › Арьс арчилгаа › Цэвэрлэгч         │
│ ☐ Захиалгын бараа › Costco › ... › Cleansers     │
│ ☐ Захиалгын бараа › Olive Young › ... › Cleanser │
└──────────────────────────────────────────────────┘
```

Three requirements, all driven by the catalogue having grown to roughly 728 categories after the retailer trees were mirrored under category 62:

1. **Search results display the full ancestor path**, not the leaf name. Costco and Olive Young both contain a "Cleansers"; leaf names alone are ambiguous.
2. **Search matches against the full path string.** The current `CategorySelector.jsx:26` `matchesSearch` tests only a category's own name, so searching removes the ancestors of every match from the tree and the results look empty or orphaned.
3. **Tree browsing is retained** as a second tab, for finding a category whose name you do not know.

Selected chips display the leaf name; the full path is available on hover via `title`.

### Craft rules

Applied uniformly through the `Field` primitive and the shadcn components rather than per-field:

- **Sizing** — inputs `h-10`; one radius token (`--radius`, already defined in `globals.css`); cards `p-6`; vertical field rhythm `space-y-5`.
- **Cursors** — `cursor-pointer` on every clickable element; `cursor-not-allowed opacity-50` when disabled. Most current custom controls set no cursor at all.
- **Focus** — a single `focus-visible:ring-2 ring-ring` treatment everywhere, inherited from shadcn.
- **Hover** — on cards, chips, variant rows and image tiles.
- **No gradients.** The unreadable purple hierarchical-tags panel is removed rather than restyled.
- **Type scale** — three sizes only: card titles `text-base font-semibold`, labels `text-sm font-medium`, hints `text-xs text-muted-foreground`.

The two hand-rolled toggle circles become a real `switch.tsx`. The simple/variant selector becomes a real `radio-group.tsx`.

## Known defects to fix

| Defect | Current cause | Resolution |
|---|---|---|
| Category selection unusable | Two pickers render simultaneously; search hides ancestors of matches; ~728 flat entries | New `CategoryPicker` per above |
| Images may not attach | `handleImagesChange` (`:239`) writes `File[]` into `form.images` while the effect at `:226` writes URL objects into the same field; last write wins | Single source of truth; images are one controlled field written in one place |
| Toggles have no visible state | No `switch.tsx` exists; controls are hand-rolled | Add `switch.tsx` |
| Save failures are opaque | Catch-all sets `"Системийн алдаа гарлаа"`, discarding the backend message | Surface the backend message |
| Hierarchical tags can fail silently | The second POST's failure is caught and only logged (`:739`); the product saves and the user is not told | Warning toast naming the created product |
| Console noise | ~60 `console.log` calls across payload building and submission | Removed |

## Error handling

- Field-level errors come from zod via `Field`, rendered in one consistent position.
- A single form-level alert sits at the top of the form for submission failures, showing the backend's `message` when present and a generic fallback only when there is none.
- A failed hierarchical-tags POST no longer fails silently: the product-created success is still reported, followed by a warning toast identifying the created product so the tags can be applied from `/products/[id]/hierarchical-tags`.

## Testing

Vitest is already configured (`vitest.config.ts`, `npm run test`) and `lib/products/variantNormalization.test.ts` exists as precedent.

1. **Characterization tests are written first**, against the *current* `buildProductPayload` behaviour, covering: simple mode, variant mode, the `${sku}-DEFAULT` variant, the `categoryIds` fallback, advanced fields on and off, and the variant image resolution order.
2. The UI is then rewritten. Those tests passing unchanged is the evidence that the wire format did not move.
3. `variantNormalization.test.ts` continues to pass unchanged.

No component or browser tests are added.

## Deletions

Once `/add-product` is on the new components:

- `app/add-product/premium-product-form.css`
- `app/add-product/AddProductComponent.js`

Deferred to the edit-product follow-up, since they are still live until then:

- `app/edit-product/[id]/premium-product-form.css`
- All three `EditProductComponent*.js` files

`EditProductComponent_Complete.js` currently has uncommitted local modifications. It must not be touched in this change, and the follow-up must confirm with the user which of the three copies is live before deleting any of them.

## Risks

- **Wire-format regression.** Mitigated by the characterization tests, which are written before any UI work.
- **`lib/products/variantNormalization.ts` is untracked.** It needs committing so the new components can depend on it. Stage it by explicit path — the user commits in these same checkouts during sessions, so `git add -A` is unsafe here.
- **shadcn additions.** `card.tsx`, `switch.tsx`, `radio-group.tsx` and `accordion.tsx` bring in `@radix-ui/react-switch`, `-radio-group` and `-accordion`. `package.json` already has uncommitted local changes, so dependency additions must be staged carefully alongside them.
- **Visual divergence.** The new page will look somewhat more modern than its siblings. Accepted deliberately; the shell chrome (sidebar, header, breadcrumb) is unchanged, so the two sit together without clashing.
