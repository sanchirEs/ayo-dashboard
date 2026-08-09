# Add Product Form Rewrite — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 2,300-line `/add-product` page and its 4,040-line private CSS file with a two-column form built from shared, create/edit-agnostic components, without changing the product wire format.

**Architecture:** A `ProductForm` container owns a single react-hook-form instance and renders section components that receive `form` as a prop and never fetch data. Payload construction is extracted to a pure, unit-tested function in `lib/products/`. Reference data (categories, brands, attributes, tags) loads through one hook. `/add-product` becomes a thin wrapper; `/edit-product/[id]` adopts the same components in a later, separate change.

**Tech Stack:** Next.js 15 (App Router, client components), React 18, react-hook-form + zod, Tailwind CSS, shadcn/ui on Radix, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-09-add-product-form-redesign-design.md`

## Global Constraints

- **Never modify `components/ui/button.tsx`.** Its `default` variant is an empty string and 325 call sites across the app depend on it rendering unstyled. In all new code, always pass an explicit `variant` (`outline`, `secondary`, `ghost`, `destructive`, or `link`). For the primary save button use `className="bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"` alongside `variant="default"`.
- **Colours and radii come only from the tokens already in `globals.css`**: `--background`, `--foreground`, `--card`, `--muted`, `--muted-foreground`, `--border`, `--input`, `--ring`, `--primary`, `--destructive`, `--radius`. No new colour values, no gradients.
- **Type scale is three sizes only:** card titles `text-base font-semibold`, labels `text-sm font-medium`, hints `text-xs text-muted-foreground`.
- **Sizing:** inputs `h-10`, cards `p-6`, vertical field rhythm `space-y-5`.
- **Interactive states are mandatory on every control:** `cursor-pointer` when clickable, `disabled:cursor-not-allowed disabled:opacity-50` when disabled, `focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring` on focus.
- **Vitest runs in `environment: 'node'` and only collects `**/*.test.ts`** (see `vitest.config.ts`). Tests must be `.test.ts`, not `.tsx`, and may only cover pure logic. Do not add a component-testing setup.
- **Never run `git add -A` or `git add .`.** The user commits in these same checkouts during sessions, and `package.json`, `package-lock.json` and `app/edit-product/[id]/EditProductComponent_Complete.js` currently carry their uncommitted changes. Stage explicit paths only.
- **Do not touch any file under `app/edit-product/`** in this plan.
- **All user-facing copy is Mongolian**, matching the strings already in `AddProductComponent.js`.
- Run commands from `d:\project-ayo\ayo-dashboard`. Git commands use `git -C "D:/project-ayo/ayo-dashboard"`.
- `tsconfig.json` sets `allowJs: true` and `strict: false` and includes `**/*.jsx`, so `npx tsc --noEmit` does check the new `.jsx` files — but it also reports **pre-existing errors elsewhere in the repo**. Judge each verification step only by whether errors name the files that step created. Do not attempt to fix unrelated pre-existing errors.
- The shell is PowerShell. Use `Select-String` and `Get-ChildItem`, not `grep` or `find`.

---

## File Structure

**Created:**

| File | Responsibility |
|---|---|
| `lib/products/buildProductPayload.ts` | Pure form-state → API-body function |
| `lib/products/buildProductPayload.test.ts` | Characterization tests locking the wire format |
| `lib/products/categoryPaths.ts` | Flatten a category tree into searchable path entries |
| `lib/products/categoryPaths.test.ts` | Tests for flattening and path search |
| `lib/products/productFormDefaults.ts` | Form default values |
| `components/ui/card.tsx` | shadcn Card |
| `components/ui/switch.tsx` | shadcn Switch |
| `components/ui/radio-group.tsx` | shadcn RadioGroup |
| `components/ui/accordion.tsx` | shadcn Accordion |
| `components/product-form/ProductForm.jsx` | Container; owns the form, layout shell, submit |
| `components/product-form/useProductFormData.js` | One hook loading all reference data |
| `components/product-form/fields/Field.jsx` | Label + control + hint + error |
| `components/product-form/fields/CategoryPicker.jsx` | Single path-aware multi-select |
| `components/product-form/sections/BasicInfoSection.jsx` | Name, SKU, description, howToUse, ingredients, specs |
| `components/product-form/sections/PricingSection.jsx` | Simple ⇄ variant mode, price, quantity |
| `components/product-form/sections/VariantsSection.jsx` | Attribute selection + variant table |
| `components/product-form/sections/MediaSection.jsx` | Image gallery (rail) |
| `components/product-form/sections/OrganizeSection.jsx` | Categories, brand, tags (rail) |
| `components/product-form/sections/AdvancedSection.jsx` | Flash sale / discount / promotion (rail, collapsed) |

**Modified:** `app/add-product/page.js`, `package.json`

**Deleted (Task 9 only):** `app/add-product/AddProductComponent.js`, `app/add-product/premium-product-form.css`

**Committed as-is:** `lib/products/variantNormalization.ts`, `lib/products/variantNormalization.test.ts` (currently untracked)

---

### Task 1: Commit the in-flight variant normalization module

`lib/products/variantNormalization.ts` and its test already exist but are untracked. Later tasks import from `lib/products/`, so this lands first and on its own.

**Files:**
- Commit (no edits): `lib/products/variantNormalization.ts`, `lib/products/variantNormalization.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `normalizeVariantAttributes(attributes): { attributeId: number; optionId: number }[]` and `normalizeLoadedVariants(variants)`, importable as `@/lib/products/variantNormalization`. Used by the edit-product follow-up, not by this plan.

- [ ] **Step 1: Run the existing tests to confirm they pass**

Run: `npx vitest run lib/products/variantNormalization.test.ts`
Expected: PASS, 0 failures.

- [ ] **Step 2: Confirm nothing else is accidentally staged**

Run: `git -C "D:/project-ayo/ayo-dashboard" status --short`
Expected: `lib/products/` shown as untracked; `package.json`, `package-lock.json` and `app/edit-product/[id]/EditProductComponent_Complete.js` shown as modified. Leave those three alone.

- [ ] **Step 3: Commit the two files by explicit path**

```bash
git -C "D:/project-ayo/ayo-dashboard" add lib/products/variantNormalization.ts lib/products/variantNormalization.test.ts
git -C "D:/project-ayo/ayo-dashboard" commit -m "Add variant normalization helpers for the product form

Flattens API variant attributes to the {attributeId, optionId} pairs the
create/update endpoints expect, and guarantees exactly one isDefault variant.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Extract `buildProductPayload` as a tested pure function

This is the safety net. The tests are written against the **current** behaviour of `AddProductComponent.js:491-628` so that the UI rewrite provably cannot change what gets sent to the API.

**Files:**
- Create: `lib/products/buildProductPayload.ts`
- Create: `lib/products/buildProductPayload.test.ts`
- Reference (do not modify yet): `app/add-product/AddProductComponent.js:491-628`

**Interfaces:**
- Consumes: nothing
- Produces:

```ts
export type ProductMode = 'simple' | 'variants';

export interface UploadedImage {
  imageUrl?: string;
  url?: string;
  secure_url?: string;
  optimized_url?: string;
  name?: string;
  alt?: string;
  isPrimary?: boolean;
}

export interface PayloadVariant {
  sku: string;
  price: number;
  isDefault: boolean;
  attributes: { attributeId: number; optionId: number }[];
  inventory?: { quantity: number };
  images: { imageUrl: string; altText: string; isPrimary: boolean }[];
}

export interface BuildPayloadContext {
  mode: ProductMode;
  variants: PayloadVariant[];
  specs: { type: string; value: string }[];
  categoryIds: number[];
  tags: string[];
  uploadedImages: UploadedImage[];
  advancedEnabled: boolean;
  vendorId: number;
}

export function buildProductPayload(
  values: Record<string, any>,
  ctx: BuildPayloadContext
): Record<string, any>;
```

- [ ] **Step 1: Write the failing characterization tests**

Create `lib/products/buildProductPayload.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildProductPayload, type BuildPayloadContext } from './buildProductPayload';

const baseValues = {
  sku: 'SKU1',
  name: 'Тест бараа',
  description: 'Тайлбар',
  howToUse: '',
  ingredients: '',
  vendorId: '1',
  brandId: '',
  price: '',
  quantity: '',
  categoryId: '',
  flashSale: false,
  flashSaleEndDate: '',
  discountId: '',
  promotionId: '',
};

const baseCtx: BuildPayloadContext = {
  mode: 'simple',
  variants: [],
  specs: [],
  categoryIds: [],
  tags: [],
  uploadedImages: [],
  advancedEnabled: false,
  vendorId: 1,
};

describe('buildProductPayload — simple mode', () => {
  it('creates a single DEFAULT variant carrying price, quantity and images', () => {
    const payload = buildProductPayload(
      { ...baseValues, price: '1000', quantity: '5' },
      {
        ...baseCtx,
        uploadedImages: [{ url: 'https://cdn/a.jpg' }, { url: 'https://cdn/b.jpg' }],
      }
    );

    expect(payload.price).toBe(1000);
    expect(payload.variants).toHaveLength(1);
    expect(payload.variants[0]).toMatchObject({
      sku: 'SKU1-DEFAULT',
      price: 1000,
      isDefault: true,
      attributes: [],
      inventory: { quantity: 5 },
    });
    expect(payload.variants[0].images).toEqual([
      { imageUrl: 'https://cdn/a.jpg', altText: 'Тест бараа', isPrimary: true },
      { imageUrl: 'https://cdn/b.jpg', altText: 'Тест бараа', isPrimary: false },
    ]);
  });

  it('sets price to 0 and omits variants entirely when quantity is missing', () => {
    const payload = buildProductPayload({ ...baseValues, price: '1000' }, baseCtx);
    expect(payload.price).toBe(1000);
    expect(payload.variants).toBeUndefined();
  });

  it('defaults price to 0 when no price is entered', () => {
    const payload = buildProductPayload(baseValues, baseCtx);
    expect(payload.price).toBe(0);
  });
});

describe('buildProductPayload — variant mode', () => {
  const variants = [
    {
      sku: 'SKU1-RED',
      price: 1200,
      isDefault: false,
      attributes: [{ attributeId: 1, optionId: 10 }],
      inventory: { quantity: 2 },
      images: [],
    },
    {
      sku: 'SKU1-BLUE',
      price: 1500,
      isDefault: true,
      attributes: [{ attributeId: 1, optionId: 11 }],
      inventory: { quantity: 3 },
      images: [],
    },
  ];

  it("uses the default variant's price as the product price", () => {
    const payload = buildProductPayload(baseValues, { ...baseCtx, mode: 'variants', variants });
    expect(payload.price).toBe(1500);
    expect(payload.variants).toHaveLength(2);
  });

  it('falls back to the first variant price when none is marked default', () => {
    const noDefault = variants.map((v) => ({ ...v, isDefault: false }));
    const payload = buildProductPayload(baseValues, {
      ...baseCtx, mode: 'variants', variants: noDefault,
    });
    expect(payload.price).toBe(1200);
  });

  it('falls back to price 0 when there are no variants', () => {
    const payload = buildProductPayload(baseValues, { ...baseCtx, mode: 'variants' });
    expect(payload.price).toBe(0);
    expect(payload.variants).toBeUndefined();
  });

  it('prefers variant-specific images over main-form images', () => {
    const withOwnImage = [
      {
        ...variants[0],
        images: [{ imageUrl: 'https://cdn/own.jpg', altText: 'own', isPrimary: true }],
      },
      variants[1],
    ];
    const payload = buildProductPayload(baseValues, {
      ...baseCtx,
      mode: 'variants',
      variants: withOwnImage,
      uploadedImages: [{ url: 'https://cdn/main.jpg' }],
    });

    expect(payload.variants[0].images).toEqual([
      { imageUrl: 'https://cdn/own.jpg', altText: 'own', isPrimary: true },
    ]);
    expect(payload.variants[1].images).toEqual([
      { imageUrl: 'https://cdn/main.jpg', altText: 'Тест бараа - Variant 2', isPrimary: false },
    ]);
  });

  it('drops preview and non-http variant images before falling back', () => {
    const withPreview = [
      {
        ...variants[0],
        images: [{ imageUrl: 'blob:local', altText: 'x', isPrimary: true, _isPreview: true } as any],
      },
    ];
    const payload = buildProductPayload(baseValues, {
      ...baseCtx, mode: 'variants', variants: withPreview, uploadedImages: [],
    });
    expect(payload.variants[0].images).toEqual([]);
  });
});

describe('buildProductPayload — shared fields', () => {
  it('falls back to categoryId when categoryIds is empty', () => {
    const payload = buildProductPayload({ ...baseValues, categoryId: '62' }, baseCtx);
    expect(payload.categoryIds).toEqual([62]);
  });

  it('prefers categoryIds when present', () => {
    const payload = buildProductPayload(
      { ...baseValues, categoryId: '62' },
      { ...baseCtx, categoryIds: [1, 2] }
    );
    expect(payload.categoryIds).toEqual([1, 2]);
  });

  it('yields an empty array when neither is set', () => {
    expect(buildProductPayload(baseValues, baseCtx).categoryIds).toEqual([]);
  });

  it('omits brandId when blank and includes it as a number when set', () => {
    expect('brandId' in buildProductPayload(baseValues, baseCtx)).toBe(false);
    expect(buildProductPayload({ ...baseValues, brandId: '7' }, baseCtx).brandId).toBe(7);
  });

  it('drops specs whose type or value is blank', () => {
    const payload = buildProductPayload(baseValues, {
      ...baseCtx,
      specs: [
        { type: 'Багтаамж', value: '50ml' },
        { type: '  ', value: 'x' },
        { type: 'y', value: '   ' },
      ],
    });
    expect(payload.specs).toEqual([{ type: 'Багтаамж', value: '50ml' }]);
  });

  it('passes tags and vendorId through', () => {
    const payload = buildProductPayload(baseValues, { ...baseCtx, tags: ['шинэ', 'хямдрал'] });
    expect(payload.tags).toEqual(['шинэ', 'хямдрал']);
    expect(payload.vendorId).toBe(1);
  });

  it('resolves image URLs from imageUrl, url or secure_url', () => {
    const payload = buildProductPayload(
      { ...baseValues, price: '10', quantity: '1' },
      {
        ...baseCtx,
        uploadedImages: [
          { imageUrl: 'https://cdn/schema-shape.jpg', altText: 'a', isPrimary: true } as any,
          { url: 'https://cdn/raw.jpg' },
          { secure_url: 'https://cdn/secure.jpg' },
        ],
      }
    );
    expect(payload.variants[0].images.map((i: any) => i.imageUrl)).toEqual([
      'https://cdn/schema-shape.jpg',
      'https://cdn/raw.jpg',
      'https://cdn/secure.jpg',
    ]);
  });
});

describe('buildProductPayload — advanced fields', () => {
  const advancedValues = {
    ...baseValues,
    flashSale: true,
    flashSaleEndDate: '2026-09-01',
    discountId: '3',
    promotionId: '4',
  };

  it('omits every advanced field when the section is disabled', () => {
    const payload = buildProductPayload(advancedValues, baseCtx);
    expect('flashSale' in payload).toBe(false);
    expect('discountId' in payload).toBe(false);
    expect('promotionId' in payload).toBe(false);
  });

  it('includes them when the section is enabled', () => {
    const payload = buildProductPayload(advancedValues, { ...baseCtx, advancedEnabled: true });
    expect(payload.flashSale).toBe(true);
    expect(payload.flashSaleEndDate).toBe('2026-09-01');
    expect(payload.discountId).toBe(3);
    expect(payload.promotionId).toBe(4);
  });

  it('omits flashSale when enabled but not switched on', () => {
    const payload = buildProductPayload(
      { ...advancedValues, flashSale: false },
      { ...baseCtx, advancedEnabled: true }
    );
    expect('flashSale' in payload).toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/products/buildProductPayload.test.ts`
Expected: FAIL — `Failed to resolve import "./buildProductPayload"`.

- [ ] **Step 3: Implement the pure function**

Create `lib/products/buildProductPayload.ts`. This is a direct port of `AddProductComponent.js:491-628` with all `console.log` calls removed and the closed-over state turned into the `ctx` parameter. Do not change any behaviour, including the quirks the tests pin down.

```ts
/**
 * Builds the request body for POST /api/v1/products/createproduct.
 *
 * Extracted verbatim from the old AddProductComponent so the UI rewrite cannot
 * change the wire format. Its quirks are deliberate and covered by tests:
 *  - simple mode emits no `variants` at all unless BOTH price and quantity are set
 *  - simple mode's generated variant SKU is `<sku>-DEFAULT`
 *  - variant mode takes the product-level price from the default variant
 */

export type ProductMode = 'simple' | 'variants';

export interface UploadedImage {
  /** Written by MediaSection; must come first so schema-valid images resolve. */
  imageUrl?: string;
  url?: string;
  secure_url?: string;
  optimized_url?: string;
  name?: string;
  alt?: string;
  isPrimary?: boolean;
}

export interface PayloadImage {
  imageUrl: string;
  altText: string;
  isPrimary: boolean;
}

export interface PayloadVariant {
  sku: string;
  price: number;
  isDefault: boolean;
  attributes: { attributeId: number; optionId: number }[];
  inventory?: { quantity: number };
  images: PayloadImage[];
}

export interface BuildPayloadContext {
  mode: ProductMode;
  variants: PayloadVariant[];
  specs: { type: string; value: string }[];
  categoryIds: number[];
  tags: string[];
  uploadedImages: UploadedImage[];
  advancedEnabled: boolean;
  vendorId: number;
}

/**
 * `imageUrl` is checked first because MediaSection stores images in the shape
 * `schemas/productSchema.ts` validates (`{ imageUrl, altText, isPrimary }`).
 * `url` / `secure_url` remain supported for raw Cloudinary responses.
 */
const imageUrlOf = (img: UploadedImage): string =>
  (img.imageUrl || img.url || img.secure_url || (img as unknown as string)) as string;

export function buildProductPayload(
  values: Record<string, any>,
  ctx: BuildPayloadContext
): Record<string, any> {
  const payload: Record<string, any> = {
    sku: values.sku,
    name: values.name,
    description: values.description,
    howToUse: values.howToUse || '',
    ingredients: values.ingredients || '',
    specs: ctx.specs.filter((s) => s.type.trim() && s.value.trim()),
    categoryIds:
      ctx.categoryIds.length > 0
        ? ctx.categoryIds
        : values.categoryId
          ? [Number(values.categoryId)]
          : [],
    vendorId: Number(values.vendorId || ctx.vendorId),
    ...(values.brandId && { brandId: Number(values.brandId) }),
    tags: ctx.tags,
  };

  if (ctx.mode === 'simple') {
    payload.price = values.price ? Number(values.price) : 0;
  } else {
    const def = ctx.variants.find((v) => v.isDefault);
    payload.price = def
      ? Number(def.price)
      : Number(ctx.variants[0]?.price || 0);
  }

  if (ctx.advancedEnabled) {
    if (values.flashSale) {
      payload.flashSale = true;
      if (values.flashSaleEndDate) payload.flashSaleEndDate = values.flashSaleEndDate;
    }
    if (values.discountId && values.discountId !== '') {
      payload.discountId = Number(values.discountId);
    }
    if (values.promotionId && values.promotionId !== '') {
      payload.promotionId = Number(values.promotionId);
    }
  }

  const variantImages = (variant: PayloadVariant, index: number): PayloadImage[] => {
    const own = (variant.images || []).filter(
      (img: any) =>
        img.imageUrl &&
        (img.imageUrl.startsWith('http://') || img.imageUrl.startsWith('https://')) &&
        !img._isPreview
    );
    if (own.length > 0) return own;

    if (ctx.uploadedImages.length > 0) {
      return ctx.uploadedImages.map((img) => ({
        imageUrl: imageUrlOf(img),
        altText: `${values.name} - Variant ${index + 1}`,
        isPrimary: index === 0,
      }));
    }
    return [];
  };

  if (ctx.mode === 'variants' && ctx.variants.length > 0) {
    payload.variants = ctx.variants.map((variant, index) => ({
      sku: variant.sku,
      price: Number(variant.price),
      isDefault: variant.isDefault,
      attributes: variant.attributes,
      inventory: variant.inventory,
      images: variantImages(variant, index),
    }));
  } else if (ctx.mode === 'simple') {
    const images: PayloadImage[] = ctx.uploadedImages.map((img, index) => ({
      imageUrl: imageUrlOf(img),
      altText: `${values.name}`,
      isPrimary: index === 0,
    }));

    if (values.price && values.quantity) {
      payload.variants = [
        {
          sku: `${values.sku}-DEFAULT`,
          price: Number(values.price),
          isDefault: true,
          attributes: [],
          inventory: { quantity: Number(values.quantity) },
          images,
        },
      ];
    }
  }

  return payload;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/products/buildProductPayload.test.ts`
Expected: PASS, 18 tests.



If the "prefers variant-specific images" test fails on the second variant's `isPrimary`, note the original marks `isPrimary: index === 0` on the *variant* index, not the image index. That is the existing behaviour — match it, do not correct it.

- [ ] **Step 5: Commit**

```bash
git -C "D:/project-ayo/ayo-dashboard" add lib/products/buildProductPayload.ts lib/products/buildProductPayload.test.ts
git -C "D:/project-ayo/ayo-dashboard" commit -m "Extract product payload building into a tested pure function

Characterization tests lock the current wire format so the add-product UI
rewrite cannot change what the create endpoint receives.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Add the missing shadcn primitives

**Files:**
- Create: `components/ui/card.tsx`, `components/ui/switch.tsx`, `components/ui/radio-group.tsx`, `components/ui/accordion.tsx`
- Modify: `package.json` (dependencies only)

**Interfaces:**
- Consumes: `cn` from `@/lib/utils` (already exists)
- Produces: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` from `@/components/ui/card`; `Switch` from `@/components/ui/switch`; `RadioGroup`, `RadioGroupItem` from `@/components/ui/radio-group`; `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` from `@/components/ui/accordion`

- [ ] **Step 1: Install the Radix dependencies**

Run: `npm install @radix-ui/react-switch @radix-ui/react-radio-group @radix-ui/react-accordion`

This edits `package.json` and `package-lock.json`, which already carry unrelated local modifications. Do not revert or stash those.

- [ ] **Step 2: Create `components/ui/card.tsx`**

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-lg border border-border bg-card text-card-foreground shadow-sm", className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1 p-6 pb-0", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-base font-semibold leading-none", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-xs text-muted-foreground", className)} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
```

- [ ] **Step 3: Create `components/ui/switch.tsx`**

```tsx
"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
        "data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
```

- [ ] **Step 4: Create `components/ui/radio-group.tsx`**

```tsx
"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root className={cn("grid gap-2", className)} {...props} ref={ref} />
));
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      "aspect-square h-4 w-4 shrink-0 cursor-pointer rounded-full border border-primary text-primary shadow",
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
      <span className="h-2 w-2 rounded-full bg-primary" />
    </RadioGroupPrimitive.Indicator>
  </RadioGroupPrimitive.Item>
));
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
```

- [ ] **Step 5: Create `components/ui/accordion.tsx`**

```tsx
"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item ref={ref} className={cn("border-b border-border", className)} {...props} />
));
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 cursor-pointer items-center justify-between py-4 text-sm font-medium transition-all hover:underline",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        "[&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
```

- [ ] **Step 6: Verify `lucide-react` is available**

Run: `node -e "require.resolve('lucide-react'); console.log('ok')"`
Expected: `ok`. If it throws, run `npm install lucide-react`.

- [ ] **Step 7: Verify the accordion animations exist**

The accordion classes reference `animate-accordion-up` / `animate-accordion-down`, which come from `tailwindcss-animate` (already a plugin in `tailwind.config.js`) only when the keyframes are declared. Check:

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors from the four new files.

Then add to `tailwind.config.js` inside `theme.extend`, after the `colors` block:

```js
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
```

- [ ] **Step 8: Commit**

```bash
git -C "D:/project-ayo/ayo-dashboard" add components/ui/card.tsx components/ui/switch.tsx components/ui/radio-group.tsx components/ui/accordion.tsx tailwind.config.js package.json package-lock.json
git -C "D:/project-ayo/ayo-dashboard" commit -m "Add card, switch, radio-group and accordion primitives

Needed by the product form rewrite. Button is deliberately untouched: its
default variant is empty and 325 call sites rely on that.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

Note: `package.json` and `package-lock.json` carried pre-existing local modifications. Confirm with the user before including them in this commit; if they object, commit the four component files and `tailwind.config.js` only.

---

### Task 4: Category path helpers

The picker needs to search across full ancestor paths. That logic is pure and testable, so it lands before any UI.

**Files:**
- Create: `lib/products/categoryPaths.ts`
- Create: `lib/products/categoryPaths.test.ts`

**Interfaces:**
- Consumes: nothing. It declares its own structural `CategoryTreeNode` type rather than importing `CategoryNode` from `@/lib/api/categories`, so the tests stay pure and independent of the API module.
- Produces:

```ts
export interface CategoryPathEntry {
  id: number;
  name: string;        // leaf name
  path: string[];      // ancestor names, root first, including the leaf
  pathLabel: string;   // path joined with " › "
}

export function flattenCategoryTree(nodes: CategoryTreeNode[]): CategoryPathEntry[];
export function searchCategoryPaths(entries: CategoryPathEntry[], query: string): CategoryPathEntry[];
```

- [ ] **Step 1: Write the failing tests**

Create `lib/products/categoryPaths.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { flattenCategoryTree, searchCategoryPaths } from './categoryPaths';

const tree = [
  {
    id: 1,
    name: 'Гоо сайхан',
    children: [
      {
        id: 2,
        name: 'Арьс арчилгаа',
        children: [{ id: 3, name: 'Цэвэрлэгч', children: [] }],
      },
    ],
  },
  {
    id: 62,
    name: 'Захиалгын бараа',
    children: [
      { id: 70, name: 'Costco', children: [{ id: 71, name: 'Cleansers', children: [] }] },
      { id: 80, name: 'Olive Young', children: [{ id: 81, name: 'Cleansers', children: [] }] },
    ],
  },
];

describe('flattenCategoryTree', () => {
  it('returns one entry per node, including branches', () => {
    // 8 nodes: 1, 2, 3 in the first branch; 62, 70, 71, 80, 81 in the second.
    expect(flattenCategoryTree(tree)).toHaveLength(8);
  });

  it('builds the full ancestor path for a leaf', () => {
    const entry = flattenCategoryTree(tree).find((e) => e.id === 3)!;
    expect(entry.path).toEqual(['Гоо сайхан', 'Арьс арчилгаа', 'Цэвэрлэгч']);
    expect(entry.pathLabel).toBe('Гоо сайхан › Арьс арчилгаа › Цэвэрлэгч');
    expect(entry.name).toBe('Цэвэрлэгч');
  });

  it('distinguishes same-named leaves under different parents', () => {
    const labels = flattenCategoryTree(tree)
      .filter((e) => e.name === 'Cleansers')
      .map((e) => e.pathLabel);
    expect(labels).toEqual([
      'Захиалгын бараа › Costco › Cleansers',
      'Захиалгын бараа › Olive Young › Cleansers',
    ]);
  });

  it('handles an empty or missing tree', () => {
    expect(flattenCategoryTree([])).toEqual([]);
    expect(flattenCategoryTree(undefined as any)).toEqual([]);
  });
});

describe('searchCategoryPaths', () => {
  const entries = flattenCategoryTree(tree);

  it('returns everything for a blank query', () => {
    expect(searchCategoryPaths(entries, '')).toHaveLength(8);
    expect(searchCategoryPaths(entries, '   ')).toHaveLength(8);
  });

  it('matches on the leaf name case-insensitively', () => {
    expect(searchCategoryPaths(entries, 'цэвэрл').map((e) => e.id)).toEqual([3]);
  });

  it('keeps a match when the query hits an ancestor, not the leaf', () => {
    const ids = searchCategoryPaths(entries, 'costco').map((e) => e.id);
    expect(ids).toContain(70);
    expect(ids).toContain(71);
  });

  it('matches across the whole path string', () => {
    const ids = searchCategoryPaths(entries, 'olive cleansers').map((e) => e.id);
    expect(ids).toEqual([81]);
  });

  it('returns an empty array when nothing matches', () => {
    expect(searchCategoryPaths(entries, 'zzzz')).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/products/categoryPaths.test.ts`
Expected: FAIL — `Failed to resolve import "./categoryPaths"`.

- [ ] **Step 3: Implement**

Create `lib/products/categoryPaths.ts`:

```ts
/**
 * Flattening and search for the category picker.
 *
 * The catalogue has ~728 categories since the retailer trees were mirrored under
 * category 62, and leaf names repeat across retailers ("Cleansers" exists under
 * both Costco and Olive Young). So the picker shows and searches full ancestor
 * paths rather than leaf names.
 */

export interface CategoryTreeNode {
  id: number;
  name: string;
  children?: CategoryTreeNode[] | null;
}

export interface CategoryPathEntry {
  id: number;
  name: string;
  path: string[];
  pathLabel: string;
}

export const PATH_SEPARATOR = ' › ';

export function flattenCategoryTree(nodes: CategoryTreeNode[] | null | undefined): CategoryPathEntry[] {
  if (!Array.isArray(nodes)) return [];

  const out: CategoryPathEntry[] = [];

  const walk = (node: CategoryTreeNode, ancestors: string[]) => {
    if (!node || typeof node.id !== 'number') return;
    const path = [...ancestors, node.name];
    out.push({
      id: node.id,
      name: node.name,
      path,
      pathLabel: path.join(PATH_SEPARATOR),
    });
    (node.children || []).forEach((child) => walk(child, path));
  };

  nodes.forEach((node) => walk(node, []));
  return out;
}

/**
 * Every whitespace-separated term must appear somewhere in the entry's full path,
 * so "olive cleansers" finds the Olive Young leaf while "cleansers" finds both.
 * Searching the whole path is what keeps ancestors from vanishing mid-search —
 * the bug in the old CategorySelector, which tested only a node's own name.
 */
export function searchCategoryPaths(
  entries: CategoryPathEntry[],
  query: string
): CategoryPathEntry[] {
  const terms = (query || '').toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return entries;

  return entries.filter((entry) => {
    const haystack = entry.pathLabel.toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/products/categoryPaths.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git -C "D:/project-ayo/ayo-dashboard" add lib/products/categoryPaths.ts lib/products/categoryPaths.test.ts
git -C "D:/project-ayo/ayo-dashboard" commit -m "Add category path flattening and path-aware search

Search matches the full ancestor path so a query no longer hides the parents of
its own matches, and repeated leaf names across retailer trees stay distinct.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: `Field` primitive and `useProductFormData` hook

The two shared foundations every section depends on.

**Files:**
- Create: `components/product-form/fields/Field.jsx`
- Create: `components/product-form/useProductFormData.js`
- Create: `lib/products/productFormDefaults.ts`

**Interfaces:**
- Consumes: `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`, `FormDescription` from `@/components/ui/form`; `getCategoryTreePublic` from `@/lib/api/categories`; `getBrandsClient` from `@/lib/api/brands`; `getAttributes` from `@/lib/api/attributes`; `getTagPresets` from `@/lib/api/tags`; `getTagGroups` from `@/lib/api/hierarchicalTags`; `flattenCategoryTree` from `@/lib/products/categoryPaths`
- Produces:
  - `<Field name label hint required control>{children}</Field>` — children receive `field` via a render prop
  - `useProductFormData(token)` returning `{ categoryEntries, brands, attributes, tagPresets, tagGroups, loading, error }`
  - `PRODUCT_FORM_DEFAULTS` object

- [ ] **Step 1: Create `lib/products/productFormDefaults.ts`**

```ts
export const PRODUCT_FORM_DEFAULTS = {
  name: '',
  description: '',
  howToUse: '',
  ingredients: '',
  sku: '',
  categoryId: '',
  categoryIds: [] as number[],
  vendorId: '1',
  brandId: '',
  images: [] as any[],
  tagsCsv: '',
  price: '',
  quantity: '',
  flashSale: false,
  flashSaleEndDate: '',
  discountId: '',
  promotionId: '',
};
```

- [ ] **Step 2: Create `components/product-form/fields/Field.jsx`**

Every label, hint, error position and spacing decision lives here and nowhere else. This is what replaces roughly 1,000 lines of repeated markup.

```jsx
"use client";

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";

/**
 * The single field primitive for the product form.
 *
 * Label, hint and error placement are decided here once so no section can drift.
 * `children` is a render prop receiving react-hook-form's `field`.
 */
export default function Field({ control, name, label, hint, required = false, children }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-1.5">
          {label && (
            <FormLabel className="text-sm font-medium">
              {label}
              {required && <span className="ml-0.5 text-destructive">*</span>}
            </FormLabel>
          )}
          <FormControl>{children(field)}</FormControl>
          {hint && <FormDescription className="text-xs text-muted-foreground">{hint}</FormDescription>}
          <FormMessage className="text-xs text-destructive" />
        </FormItem>
      )}
    />
  );
}
```

- [ ] **Step 3: Create `components/product-form/useProductFormData.js`**

```jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { getCategoryTreePublic } from "@/lib/api/categories";
import { getBrandsClient } from "@/lib/api/brands";
import { getAttributes } from "@/lib/api/attributes";
import { getTagPresets } from "@/lib/api/tags";
import { getTagGroups } from "@/lib/api/hierarchicalTags";
import { flattenCategoryTree } from "@/lib/products/categoryPaths";

/**
 * Loads every piece of reference data the product form needs, in one place.
 *
 * Replaces the old component's four separate loading booleans with one flag.
 * Categories come from the tree endpoint, not the flat list: the flat list has
 * no parentId, so it cannot produce the ancestor paths the picker displays.
 */
export default function useProductFormData(token) {
  const [tree, setTree] = useState([]);
  const [brands, setBrands] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [tagPresets, setTagPresets] = useState([]);
  const [tagGroups, setTagGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      try {
        const [treeData, brandsData, attributesData, presets, groups] = await Promise.all([
          getCategoryTreePublic(),
          getBrandsClient(token),
          getAttributes(),
          getTagPresets(),
          getTagGroups(),
        ]);
        if (cancelled) return;

        setTree(treeData || []);
        setBrands(brandsData || []);
        setAttributes(
          (attributesData || []).filter(
            (attr) => Array.isArray(attr.options) && attr.options.length > 0
          )
        );
        setTagPresets(presets || []);
        setTagGroups(groups || []);
      } catch (err) {
        if (!cancelled) setError("Өгөгдөл ачаалахад алдаа гарлаа");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const categoryEntries = useMemo(() => flattenCategoryTree(tree), [tree]);

  return { categoryEntries, brands, attributes, tagPresets, tagGroups, loading, error };
}
```

- [ ] **Step 4: Verify the three files compile**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors mentioning `productFormDefaults`, `Field.jsx` or `useProductFormData.js`.

- [ ] **Step 5: Commit**

```bash
git -C "D:/project-ayo/ayo-dashboard" add components/product-form/fields/Field.jsx components/product-form/useProductFormData.js lib/products/productFormDefaults.ts
git -C "D:/project-ayo/ayo-dashboard" commit -m "Add the product form field primitive and reference-data hook

One Field component owns label, hint and error placement. One hook replaces the
four separate loading flags, and loads categories from the tree endpoint so
ancestor paths are available.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: `CategoryPicker`

The one functional fix in this plan. Replaces both the `CategorySelector` tree and the flat 728-chip grid.

**Files:**
- Create: `components/product-form/fields/CategoryPicker.jsx`

**Interfaces:**
- Consumes: `searchCategoryPaths`, `CategoryPathEntry` from `@/lib/products/categoryPaths`; `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` from `@/components/ui/dialog`; `Badge` from `@/components/ui/badge`; `Button` from `@/components/ui/button`; `Input` from `@/components/ui/input`
- Produces: `<CategoryPicker entries value onChange disabled />` where `value` is `number[]` and `onChange` receives `number[]`

- [ ] **Step 1: Create the component**

```jsx
"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchCategoryPaths } from "@/lib/products/categoryPaths";

/**
 * Multi-select category picker.
 *
 * Replaces the old pair of controls (a single-select tree plus a flat grid of every
 * category as a chip). Results show the full ancestor path because leaf names repeat
 * across the mirrored retailer trees.
 */
export default function CategoryPicker({ entries, value = [], onChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = useMemo(
    () => entries.filter((e) => value.includes(e.id)),
    [entries, value]
  );

  const results = useMemo(() => searchCategoryPaths(entries, query), [entries, query]);

  const toggle = (id) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  return (
    <div className="space-y-2">
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-input bg-background p-2">
        {selected.length === 0 && (
          <span className="px-1 text-sm text-muted-foreground">Ангилал сонгогдоогүй</span>
        )}
        {selected.map((entry) => (
          <span
            key={entry.id}
            title={entry.pathLabel}
            className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground"
          >
            {entry.name}
            <button
              type="button"
              disabled={disabled}
              onClick={() => toggle(entry.id)}
              aria-label={`${entry.name} арилгах`}
              className="cursor-pointer rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              ×
            </button>
          </span>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => setOpen(true)}
          className="ml-auto cursor-pointer disabled:cursor-not-allowed"
        >
          + Сонгох
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Ангилал сонгох</DialogTitle>
          </DialogHeader>

          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ангилал хайх..."
            className="h-10"
          />

          <div className="max-h-96 overflow-y-auto rounded-md border border-border">
            {results.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Илэрц олдсонгүй</p>
            ) : (
              results.map((entry) => {
                const isSelected = value.includes(entry.id);
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => toggle(entry.id)}
                    className={`flex w-full cursor-pointer items-center gap-2 border-b border-border px-3 py-2 text-left text-sm transition-colors last:border-b-0 hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                      isSelected ? "bg-accent/50" : ""
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
                        isSelected ? "border-primary bg-primary text-primary-foreground" : "border-input"
                      }`}
                    >
                      {isSelected && "✓"}
                    </span>
                    <span className="truncate text-muted-foreground">
                      {entry.path.slice(0, -1).join(" › ")}
                      {entry.path.length > 1 && " › "}
                      <span className="text-foreground">{entry.name}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">{value.length} сонгогдсон</span>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="cursor-pointer"
            >
              Болсон
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors mentioning `CategoryPicker`.

- [ ] **Step 3: Commit**

```bash
git -C "D:/project-ayo/ayo-dashboard" add components/product-form/fields/CategoryPicker.jsx
git -C "D:/project-ayo/ayo-dashboard" commit -m "Add path-aware multi-select category picker

Replaces the single-select tree plus the flat grid that rendered all ~728
categories as chips. Results carry their full ancestor path.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: Left-column sections — BasicInfo, Pricing, Variants

**Files:**
- Create: `components/product-form/sections/BasicInfoSection.jsx`
- Create: `components/product-form/sections/PricingSection.jsx`
- Create: `components/product-form/sections/VariantsSection.jsx`

**Interfaces:**
- Consumes: `Field` from `../fields/Field`; `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`; `RadioGroup`, `RadioGroupItem`; `Input`, `Textarea`, `Button`; `useFieldArray` from `react-hook-form`
- Produces: three default-exported components, each taking `{ form }` plus the props noted below. `VariantsSection` additionally takes `{ attributes }`. None of them fetch, and none of them branch on create-vs-edit.

Form fields these sections own: `name`, `sku`, `description`, `howToUse`, `ingredients`, `specs[]` (`useFieldArray`), `productMode`, `price`, `quantity`, `variants[]` (`useFieldArray`).

- [ ] **Step 1: Create `BasicInfoSection.jsx`**

```jsx
"use client";

import { useFieldArray } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Field from "../fields/Field";

export default function BasicInfoSection({ form }) {
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "specs" });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Үндсэн мэдээлэл</CardTitle>
        <CardDescription>Бүтээгдэхүүний үндсэн мэдээллийг оруулна уу</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Field control={form.control} name="name" label="Бүтээгдэхүүний нэр" required>
          {(field) => <Input {...field} className="h-10" placeholder="Бүтээгдэхүүний нэр оруулна уу" />}
        </Field>

        <Field
          control={form.control}
          name="sku"
          label="SKU"
          required
          hint="Дахин давтагдахгүй байх ёстой"
        >
          {(field) => <Input {...field} className="h-10" placeholder="SKU оруулна уу" />}
        </Field>

        <Field control={form.control} name="description" label="Тайлбар" required>
          {(field) => (
            <Textarea {...field} rows={5} placeholder="Бүтээгдэхүүний дэлгэрэнгүй тайлбар..." />
          )}
        </Field>

        <Field control={form.control} name="howToUse" label="Хэрэглэх арга">
          {(field) => (
            <Textarea {...field} rows={4} placeholder="Энэ бүтээгдэхүүнийг хэрхэн ашиглах талаар..." />
          )}
        </Field>

        <Field control={form.control} name="ingredients" label="Найрлага">
          {(field) => (
            <Textarea {...field} rows={4} placeholder="Бүтээгдэхүүний найрлага, тус бүрийн орцыг жагсаана уу..." />
          )}
        </Field>

        <div className="space-y-2">
          <span className="text-sm font-medium">Техникийн тодорхойлолт</span>
          {fields.map((spec, index) => (
            <div key={spec.id} className="flex items-start gap-2">
              <Input
                {...form.register(`specs.${index}.type`)}
                className="h-10 flex-1"
                placeholder="Төрөл (ж: Багтаамж)"
              />
              <Input
                {...form.register(`specs.${index}.value`)}
                className="h-10 flex-1"
                placeholder="Утга (ж: 50ml)"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                aria-label="Устгах"
                className="h-10 w-10 shrink-0 cursor-pointer text-muted-foreground hover:text-destructive"
              >
                ×
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ type: "", value: "" })}
            className="cursor-pointer"
          >
            + Тодорхойлолт нэмэх
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Create `PricingSection.jsx`**

```jsx
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import Field from "../fields/Field";

export default function PricingSection({ form }) {
  const mode = form.watch("productMode");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Үнэ болон нөөц</CardTitle>
        <CardDescription>Бараа нэг үнэтэй юу, эсвэл вариант бүр өөр үнэтэй юу</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <RadioGroup
          value={mode}
          onValueChange={(v) => form.setValue("productMode", v, { shouldDirty: true })}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          {[
            { value: "simple", title: "Энгийн бараа", desc: "Ганц үнэ, тоо ширхэгтэй" },
            { value: "variants", title: "Вариант бүхий бараа", desc: "Өнгө, хэмжээ гэх мэт олон сонголт" },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-accent ${
                mode === opt.value ? "border-primary bg-accent/40" : "border-border"
              }`}
            >
              <RadioGroupItem value={opt.value} className="mt-0.5" />
              <span>
                <span className="block text-sm font-medium">{opt.title}</span>
                <span className="block text-xs text-muted-foreground">{opt.desc}</span>
              </span>
            </label>
          ))}
        </RadioGroup>

        {mode === "simple" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field control={form.control} name="price" label="Үнэ" required hint="Төгрөгөөр">
              {(field) => <Input {...field} type="number" min="0" className="h-10" placeholder="0" />}
            </Field>
            <Field control={form.control} name="quantity" label="Тоо ширхэг" required>
              {(field) => <Input {...field} type="number" min="0" className="h-10" placeholder="0" />}
            </Field>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Create `VariantsSection.jsx`**

The cartesian-product generation is ported from `AddProductComponent.js:305-355`, unchanged in behaviour.

```jsx
"use client";

import { useState } from "react";
import { useFieldArray } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function VariantsSection({ form, attributes }) {
  const { fields, replace, update } = useFieldArray({ control: form.control, name: "variants" });
  const [selectedOptions, setSelectedOptions] = useState({});

  const toggleOption = (attributeId, optionId) => {
    setSelectedOptions((prev) => {
      const current = prev[attributeId] || [];
      const next = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      return { ...prev, [attributeId]: next };
    });
  };

  // Cartesian product of the selected options, ported from the old component.
  const generate = () => {
    const entries = Object.entries(selectedOptions)
      .map(([attrId, optionIds]) => ({
        attributeId: parseInt(attrId, 10),
        options: optionIds.map((id) => parseInt(id, 10)),
      }))
      .filter((e) => e.options.length > 0);

    if (entries.length === 0) {
      replace([]);
      return;
    }

    let combinations = [[]];
    for (const { attributeId, options } of entries) {
      const next = [];
      for (const combination of combinations) {
        for (const optionId of options) {
          next.push([...combination, { attributeId, optionId }]);
        }
      }
      combinations = next;
    }

    const baseSku = form.getValues("sku") || "PROD";
    const basePrice = form.getValues("price") || 0;

    replace(
      combinations.map((attrs, index) => {
        const names = attrs.map(({ attributeId, optionId }) => {
          const attribute = attributes.find((a) => a.id === attributeId);
          const option = attribute?.options.find((o) => o.id === optionId);
          return `${attribute?.name}-${option?.value}`;
        });
        const suffix = names.join("-").toUpperCase().replace(/\s+/g, "-");

        return {
          sku: `${baseSku}-${suffix}`,
          price: Number(basePrice),
          isDefault: index === 0,
          attributes: attrs,
          inventory: { quantity: 0 },
          images: [],
        };
      })
    );
  };

  const setDefault = (index) => {
    fields.forEach((field, i) => update(i, { ...form.getValues(`variants.${i}`), isDefault: i === index }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Вариантууд</CardTitle>
        <CardDescription>Аттрибут сонгоод вариантуудыг үүсгэнэ үү</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-4">
          {attributes.map((attribute) => (
            <div key={attribute.id} className="space-y-2">
              <span className="text-sm font-medium">{attribute.name}</span>
              <div className="flex flex-wrap gap-2">
                {attribute.options.map((option) => {
                  const isOn = (selectedOptions[attribute.id] || []).includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleOption(attribute.id, option.id)}
                      className={`cursor-pointer rounded-md border px-3 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                        isOn
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background hover:bg-accent"
                      }`}
                    >
                      {option.value}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" onClick={generate} className="cursor-pointer">
          Вариант үүсгэх
        </Button>

        {fields.length > 0 && (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">SKU</th>
                  <th className="px-3 py-2 text-left font-medium">Үнэ</th>
                  <th className="px-3 py-2 text-left font-medium">Тоо</th>
                  <th className="px-3 py-2 text-left font-medium">Үндсэн</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((variant, index) => (
                  <tr key={variant.id} className="border-t border-border transition-colors hover:bg-accent/40">
                    <td className="px-3 py-2">
                      <Input {...form.register(`variants.${index}.sku`)} className="h-9" />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        {...form.register(`variants.${index}.price`, { valueAsNumber: true })}
                        type="number"
                        min="0"
                        className="h-9 w-28"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        {...form.register(`variants.${index}.inventory.quantity`, { valueAsNumber: true })}
                        type="number"
                        min="0"
                        className="h-9 w-24"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="radio"
                        name="defaultVariant"
                        checked={form.watch(`variants.${index}.isDefault`) === true}
                        onChange={() => setDefault(index)}
                        className="cursor-pointer"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Verify compilation**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors mentioning the three new section files.

- [ ] **Step 5: Commit**

```bash
git -C "D:/project-ayo/ayo-dashboard" add components/product-form/sections/BasicInfoSection.jsx components/product-form/sections/PricingSection.jsx components/product-form/sections/VariantsSection.jsx
git -C "D:/project-ayo/ayo-dashboard" commit -m "Add basic info, pricing and variants sections

Specs and variants are useFieldArray arrays on the form rather than parallel
useState, removing the sync effects the old component needed.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: Rail sections — Media, Organize, Advanced

**Files:**
- Create: `components/product-form/sections/MediaSection.jsx`
- Create: `components/product-form/sections/OrganizeSection.jsx`
- Create: `components/product-form/sections/AdvancedSection.jsx`

**Interfaces:**
- Consumes: `ImageUploadField` from `@/components/upload/ImageUploadField` (props used: `value`, `onChange`, `autoUpload`, `onUploadComplete`, `onUploadError`, `maxFiles`); `CategoryPicker` from `../fields/CategoryPicker`; `Switch`; `Accordion*`; `Field`
- Produces:
  - `<MediaSection form onUploadComplete />` — writes uploaded Cloudinary image objects to the `images` form field, and nothing else writes that field
  - `<OrganizeSection form categoryEntries brands tagPresets tagGroups />` — owns `categoryIds`, `brandId`, `tags`, `hierarchicalTagIds`
  - `<AdvancedSection form enabled onEnabledChange />` — owns `flashSale`, `flashSaleEndDate`, `discountId`, `promotionId`

- [ ] **Step 1: Create `MediaSection.jsx`**

The single-writer rule for `images` is the fix for the image bug: `ImageUploadField` reports completed Cloudinary uploads and this is the only place that writes them into the form.

```jsx
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import ImageUploadField from "@/components/upload/ImageUploadField";

/**
 * Images have exactly one writer.
 *
 * The old component had two — an onChange handler writing raw File objects and a
 * useEffect writing Cloudinary URL objects — into the same `images` field, so
 * whichever ran last won and uploads could silently fail to attach.
 *
 * Uploads are normalized to `{ imageUrl, altText, isPrimary }` before they touch
 * the form. `addProductsSchema.images` only accepts `File[]` or that exact shape,
 * so storing a raw Cloudinary response here would fail validation and block
 * submission. `altText` must be non-empty — imageSchema requires min(1).
 */
export default function MediaSection({ form }) {
  const images = form.watch("images") || [];

  const toFormImage = (img, index, offset) => ({
    imageUrl: img.imageUrl || img.url || img.secure_url,
    altText: img.name || img.alt || form.getValues("name") || "Бүтээгдэхүүний зураг",
    isPrimary: offset + index === 0,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Зураг</CardTitle>
        <CardDescription>Эхний зураг үндсэн зураг болно</CardDescription>
      </CardHeader>
      <CardContent>
        <ImageUploadField
          value={images}
          autoUpload
          maxFiles={10}
          onChange={() => {}}
          onUploadComplete={(uploaded) => {
            const current = form.getValues("images") || [];
            const added = (uploaded || []).map((img, i) => toFormImage(img, i, current.length));
            form.setValue("images", [...current, ...added], {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
          onUploadError={(err) => {
            form.setError("images", { type: "manual", message: err?.message || "Зураг байршуулахад алдаа гарлаа" });
          }}
        />
        {images.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">{images.length} зураг байршуулсан</p>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Create `OrganizeSection.jsx`**

```jsx
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Field from "../fields/Field";
import CategoryPicker from "../fields/CategoryPicker";

export default function OrganizeSection({ form, categoryEntries, brands, tagPresets, tagGroups }) {
  const tags = form.watch("tags") || [];
  const hierarchicalTagIds = form.watch("hierarchicalTagIds") || [];

  const toggleTag = (name) => {
    form.setValue(
      "tags",
      tags.includes(name) ? tags.filter((t) => t !== name) : [...tags, name],
      { shouldDirty: true }
    );
  };

  const toggleHierarchical = (optionId) => {
    form.setValue(
      "hierarchicalTagIds",
      hierarchicalTagIds.includes(optionId)
        ? hierarchicalTagIds.filter((id) => id !== optionId)
        : [...hierarchicalTagIds, optionId],
      { shouldDirty: true }
    );
  };

  const chipClass = (isOn) =>
    `cursor-pointer rounded-md border px-2.5 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
      isOn ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:bg-accent"
    }`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ангилал ба брэнд</CardTitle>
        <CardDescription>Бүтээгдэхүүнд олон ангилал оноож болно</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Field control={form.control} name="categoryIds" label="Ангилал" required>
          {(field) => (
            <CategoryPicker
              entries={categoryEntries}
              value={field.value || []}
              onChange={field.onChange}
            />
          )}
        </Field>

        <Field control={form.control} name="brandId" label="Брэнд">
          {(field) => (
            <select
              {...field}
              className="h-10 w-full cursor-pointer rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Брэнд сонгох</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
          )}
        </Field>

        <div className="space-y-2">
          <span className="text-sm font-medium">Шошго</span>
          <div className="flex flex-wrap gap-1.5">
            {tagPresets.map((preset) => (
              <button
                key={preset.id ?? preset.name}
                type="button"
                onClick={() => toggleTag(preset.name)}
                className={chipClass(tags.includes(preset.name))}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <span className="text-sm font-medium">Ангилал шошго</span>
          {tagGroups.map((group) => (
            <div key={group.id} className="space-y-1.5">
              <span className="text-xs text-muted-foreground">{group.name}</span>
              <div className="flex flex-wrap gap-1.5">
                {(group.options || []).map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleHierarchical(option.id)}
                    className={chipClass(hierarchicalTagIds.includes(option.id))}
                  >
                    {option.value ?? option.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Create `AdvancedSection.jsx`**

```jsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import Field from "../fields/Field";

export default function AdvancedSection({ form, enabled, onEnabledChange }) {
  const flashSale = form.watch("flashSale");

  return (
    <Card>
      <CardContent className="py-0">
        <Accordion type="single" collapsible>
          <AccordionItem value="advanced" className="border-b-0">
            <AccordionTrigger className="cursor-pointer">Нэмэлт тохиргоо</AccordionTrigger>
            <AccordionContent className="space-y-5 pt-2">
              <label className="flex cursor-pointer items-center justify-between">
                <span className="text-sm font-medium">Нэмэлт тохиргоо ашиглах</span>
                <Switch checked={enabled} onCheckedChange={onEnabledChange} />
              </label>

              {enabled && (
                <>
                  <label className="flex cursor-pointer items-center justify-between">
                    <span className="text-sm font-medium">Flash Sale</span>
                    <Switch
                      checked={!!flashSale}
                      onCheckedChange={(v) => form.setValue("flashSale", v, { shouldDirty: true })}
                    />
                  </label>

                  {flashSale && (
                    <Field control={form.control} name="flashSaleEndDate" label="Дуусах огноо">
                      {(field) => <Input {...field} type="date" className="h-10" />}
                    </Field>
                  )}

                  <Field control={form.control} name="discountId" label="Хямдралын ID">
                    {(field) => <Input {...field} type="number" min="1" className="h-10" placeholder="—" />}
                  </Field>

                  <Field control={form.control} name="promotionId" label="Урамшууллын ID">
                    {(field) => <Input {...field} type="number" min="1" className="h-10" placeholder="—" />}
                  </Field>
                </>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Verify compilation**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors mentioning the three new section files.

- [ ] **Step 5: Commit**

```bash
git -C "D:/project-ayo/ayo-dashboard" add components/product-form/sections/MediaSection.jsx components/product-form/sections/OrganizeSection.jsx components/product-form/sections/AdvancedSection.jsx
git -C "D:/project-ayo/ayo-dashboard" commit -m "Add media, organize and advanced rail sections

Images now have a single writer, which is what the old two-writer arrangement
got wrong.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 9: `ProductForm` container, wire `/add-product`, delete the old page

The final assembly. After this task the new page is live and the old files are gone.

**Files:**
- Create: `components/product-form/ProductForm.jsx`
- Modify: `app/add-product/page.js`
- Delete: `app/add-product/AddProductComponent.js`, `app/add-product/premium-product-form.css`

**Interfaces:**
- Consumes: everything produced by Tasks 2–8, plus `Layout` from `@/components/layout/Layout`, `GetToken` from `@/lib/GetTokenClient`, `getBackendUrl` from `@/lib/api/env`, `fetchWithAuthHandling` from `@/lib/api/fetch-with-auth`, `addProductHierarchicalTags` from `@/lib/api/hierarchicalTags`, `toastManager` from `@/lib/toast`, `addProductsSchema` from `@/schemas/productSchema`
- Produces: `<ProductForm mode initialValues onSubmit />`, where
  `onSubmit(payload: Record<string, any>) => Promise<{ ok: boolean; message?: string; data?: any }>`.
  `ProductForm` owns the form, layout, validation, payload building, submitting state and error display; the **page** owns the network call. This is what keeps the edit page a follow-up rather than a second rewrite.

**Two subtleties an implementer will otherwise get wrong:**

1. `productMode`, `tags` and `hierarchicalTagIds` are **not** declared in `addProductsSchema`. zod strips unknown keys, so they are `undefined` on the `values` argument that `handleSubmit` passes. Always read them with `form.getValues(...)` / `form.watch(...)`, never off `values`. `price`, `quantity`, `sku`, `name`, `description`, `specs` and `variants` *are* in the schema and can be read from `values`.
2. `form.reset()` with no argument restores the **initial** values, which for edit mode means the loaded product — correct in both modes. Only the create page's `onSubmit` should clear the form to blank defaults.

- [ ] **Step 1: Create `ProductForm.jsx`**

```jsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import LoadingButton from "@/components/customui/LoadingButton";
import { addProductsSchema } from "@/schemas/productSchema";
import GetToken from "@/lib/GetTokenClient";
import { buildProductPayload } from "@/lib/products/buildProductPayload";
import { PRODUCT_FORM_DEFAULTS } from "@/lib/products/productFormDefaults";
import useProductFormData from "./useProductFormData";
import BasicInfoSection from "./sections/BasicInfoSection";
import PricingSection from "./sections/PricingSection";
import VariantsSection from "./sections/VariantsSection";
import MediaSection from "./sections/MediaSection";
import OrganizeSection from "./sections/OrganizeSection";
import AdvancedSection from "./sections/AdvancedSection";

const VENDOR_ID = 1;

export default function ProductForm({ mode = "create", initialValues, onSubmit }) {
  const token = GetToken();
  const { categoryEntries, brands, attributes, tagPresets, tagGroups, loading, error } =
    useProductFormData(token);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [advancedEnabled, setAdvancedEnabled] = useState(false);

  const form = useForm({
    resolver: zodResolver(addProductsSchema),
    defaultValues: {
      ...PRODUCT_FORM_DEFAULTS,
      productMode: "simple",
      specs: [],
      variants: [],
      tags: [],
      hierarchicalTagIds: [],
      ...initialValues,
    },
    mode: "onChange",
  });

  const productMode = form.watch("productMode");

  const submit = async (values) => {
    if (!token) {
      setFormError("Та нэвтрэх хэрэгтэй");
      return;
    }

    const variants = form.getValues("variants") || [];

    if (productMode === "variants") {
      if (variants.length === 0) {
        setFormError("Вариант үүсгэнэ үү");
        return;
      }
      if (variants.filter((v) => v.isDefault).length !== 1) {
        setFormError("Нэг үндсэн вариант сонгоно уу");
        return;
      }
      if (variants.some((v) => !v.sku || !v.price)) {
        setFormError("Бүх вариантуудад SKU болон үнэ оруулна уу");
        return;
      }
    } else if (!values.price || !values.quantity) {
      setFormError("Энгийн бараанд үнэ болон тоо ширхэг заавал оруулна уу");
      return;
    }

    const specs = form.getValues("specs") || [];
    const types = specs.map((s) => s.type.trim()).filter(Boolean);
    if (new Set(types).size !== types.length) {
      setFormError("Техникийн тодорхойлолтын төрлүүд давтагдаж болохгүй. Өөр өөр төрөл ашиглана уу.");
      return;
    }

    setFormError("");
    setSubmitting(true);

    try {
      const payload = buildProductPayload(values, {
        mode: productMode,
        variants,
        specs,
        categoryIds: form.getValues("categoryIds") || [],
        tags: form.getValues("tags") || [],
        uploadedImages: form.getValues("images") || [],
        advancedEnabled,
        vendorId: VENDOR_ID,
      });

      // The page owns the network call, so edit mode differs only in its onSubmit.
      const result = await onSubmit(payload, { form, token });

      if (!result?.ok) {
        // Surface what the backend actually said instead of a generic message.
        setFormError(result?.message || "Алдаа гарлаа");
        return;
      }

      if (mode === "create") {
        form.reset({
          ...PRODUCT_FORM_DEFAULTS,
          productMode: "simple",
          specs: [],
          variants: [],
          tags: [],
          hierarchicalTagIds: [],
        });
        setAdvancedEnabled(false);
      }
    } catch {
      setFormError("Сүлжээний алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Ачааллаж байна...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)}>
        <div className="sticky top-0 z-10 -mx-6 mb-6 flex items-center justify-between border-b border-border bg-background px-6 py-3">
          <h1 className="text-base font-semibold">
            {mode === "create" ? "Бараа нэмэх" : "Бараа засах"}
          </h1>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              className="cursor-pointer"
            >
              Цуцлах
            </Button>
            <LoadingButton
              type="submit"
              loading={submitting}
              className="cursor-pointer bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              Хадгалах
            </LoadingButton>
          </div>
        </div>

        {(formError || error) && (
          <div className="mb-6 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {formError || error}
          </div>
        )}

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="flex-1 space-y-6">
            <BasicInfoSection form={form} />
            <PricingSection form={form} />
            {productMode === "variants" && (
              <VariantsSection form={form} attributes={attributes} />
            )}
          </div>

          <div className="w-full space-y-6 lg:sticky lg:top-20 lg:w-[380px] lg:shrink-0">
            <MediaSection form={form} />
            <OrganizeSection
              form={form}
              categoryEntries={categoryEntries}
              brands={brands}
              tagPresets={tagPresets}
              tagGroups={tagGroups}
            />
            <AdvancedSection
              form={form}
              enabled={advancedEnabled}
              onEnabledChange={setAdvancedEnabled}
            />
          </div>
        </div>
      </form>
    </Form>
  );
}
```

- [ ] **Step 2: Rewrite `app/add-product/page.js`**

The page owns the network call. Edit mode will supply a different one against the update endpoint, and nothing inside `ProductForm` or the sections has to change for that.

```jsx
"use client";

import Layout from "@/components/layout/Layout";
import ProductForm from "@/components/product-form/ProductForm";
import { getBackendUrl } from "@/lib/api/env";
import { fetchWithAuthHandling } from "@/lib/api/fetch-with-auth";
import { addProductHierarchicalTags } from "@/lib/api/hierarchicalTags";
import toastManager from "@/lib/toast";

export default function AddProduct() {
  const createProduct = async (payload, { form, token }) => {
    const response = await fetchWithAuthHandling(
      `${getBackendUrl()}/api/v1/products/createproduct`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      "AddProduct.createProduct"
    );

    const data = await response.json();

    if (!response.ok) {
      return { ok: false, message: data.message || `Алдаа гарлаа (${response.status})` };
    }

    toastManager.success(data.message || "Бараа амжилттай нэмэгдлээ");

    // Hierarchical tags are a second request. If it fails the product still exists,
    // so report it plainly and name the product rather than swallowing the error
    // the way the old component did.
    const hierarchicalTagIds = form.getValues("hierarchicalTagIds") || [];
    if (hierarchicalTagIds.length > 0 && data.data?.id) {
      try {
        const ok = await addProductHierarchicalTags(
          data.data.id,
          { tagOptionIds: hierarchicalTagIds },
          token
        );
        if (!ok) throw new Error("rejected");
      } catch {
        toastManager.warning(
          `Бараа #${data.data.id} үүслээ, гэхдээ ангилал шошго нэмэгдсэнгүй. Барааны хуудаснаас дахин оролдоно уу.`,
          { title: "Ангилал шошго" }
        );
      }
    }

    return { ok: true, data: data.data };
  };

  return (
    <Layout breadcrumbTitleParent="Бараа" breadcrumbTitle="Бараа нэмэх" pageTitle="Бараа нэмэх">
      <ProductForm mode="create" onSubmit={createProduct} />
    </Layout>
  );
}
```

- [ ] **Step 3: Confirm the `LoadingButton` props match**

Run: `Select-String -Path components/customui/LoadingButton.jsx -Pattern "function LoadingButton" -Context 0,12`
Expected: it accepts `loading`, `type`, `className` and `children`. If its prop is named `isLoading` rather than `loading`, change the call in `ProductForm.jsx` to match. Do not modify `LoadingButton.jsx` — other pages use it.

- [ ] **Step 4: Start the dev server and check the page renders**

The backend must be running for reference data to load. In one terminal, from `d:\project-ayo\ayo-back`: `npm run dev`. In another, from `d:\project-ayo\ayo-dashboard`: `npm run dev`.

Open `http://localhost:3002/add-product` and confirm:
- The page renders in two columns with a sticky header carrying Цуцлах and Хадгалах.
- No 4,040-line CSS is loaded — the old `premium-*` classes appear nowhere in the DOM inspector.
- The category field shows "Ангилал сонгогдоогүй" and one **+ Сонгох** button — not a grid of hundreds of chips.
- Clicking **+ Сонгох** opens a dialog; typing `цэвэрл` shows results labelled with their full path.
- The simple/variant radios show a filled dot when selected, and switching to Вариант reveals the variants card.
- Every button and chip shows a pointer cursor on hover.

- [ ] **Step 5: Create one product end to end**

Fill in name, SKU, description, price, quantity, pick at least one category, upload one image, and save. Confirm a success toast appears and the product shows up in `/product-list`.

Then repeat in variant mode: pick attribute options, press **Вариант үүсгэх**, set a default, and save.

- [ ] **Step 6: Delete the old page files**

```bash
git -C "D:/project-ayo/ayo-dashboard" rm app/add-product/AddProductComponent.js app/add-product/premium-product-form.css
```

Note `app/edit-product/[id]/premium-product-form.css` is a separate file and stays — the edit page still imports it.

- [ ] **Step 7: Confirm nothing else referenced the deleted files**

Run: `Get-ChildItem app,components,lib -Recurse -Include *.js,*.jsx,*.tsx | Select-String -Pattern "AddProductComponent|add-product/premium-product-form"`
Expected: no matches.

- [ ] **Step 8: Run the full test suite and a production build**

Run: `npm run test`
Expected: PASS — the `buildProductPayload`, `categoryPaths` and `variantNormalization` suites.

Run: `npm run build`
Expected: build succeeds with no errors from `/add-product`.

- [ ] **Step 9: Commit**

```bash
git -C "D:/project-ayo/ayo-dashboard" add components/product-form/ProductForm.jsx app/add-product/page.js
git -C "D:/project-ayo/ayo-dashboard" commit -m "Rebuild the add-product page on the shared product form

Two-column layout with a sticky save bar, built from shadcn components. Replaces
a 2,300-line component and a 4,040-line private stylesheet.

Submit failures now surface the backend message, and a failed hierarchical-tag
write raises a warning naming the created product instead of being swallowed.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Follow-up (not in this plan)

Adopting `ProductForm` in `/edit-product/[id]` is a separate change. Before it starts, the user must confirm **which of `EditProductComponent.js`, `EditProductComponent_new.js` and `EditProductComponent_Complete.js` is actually live**, since `_Complete.js` currently carries uncommitted local edits. That change also deletes `app/edit-product/[id]/premium-product-form.css` and wires `normalizeLoadedVariants` from Task 1 into edit mode's `initialValues`.
