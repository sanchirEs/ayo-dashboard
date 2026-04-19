# Flash Sale UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the `/flash-sale` dashboard page by adding the Layout wrapper (sidebar + header) and replacing the raw Product ID number input with a searchable inline combobox.

**Architecture:** Three files change — `page.js` gets the `<Layout>` wrapper, `FlashSaleForm.js` swaps its product ID input for a `<ProductCombobox>` component, and a new `ProductCombobox.jsx` handles fetching all products once and filtering client-side. No backend changes needed.

**Tech Stack:** Next.js 15 App Router, React 18, `next-auth/react` (`useSession`), existing `lib/api/discounts.ts` (`getDiscountableProducts`), existing `lib/api/env.ts` (`resolveImageUrl`).

---

### Task 1: Add Layout wrapper to page.js

**Files:**
- Modify: `ayo-dashboard/app/flash-sale/page.js`

The page currently renders a bare `<div className="main-content-wrap">` with no sidebar or header. Wrapping it in `<Layout>` fixes this — exactly like every other page in the dashboard (e.g. `app/discounts/page.js`).

- [ ] **Step 1: Open the file and understand its current shape**

Read `ayo-dashboard/app/flash-sale/page.js`. It currently looks like:

```js
import GetTokenServer from "@/lib/GetTokenServer";
import FlashSaleForm from "./FlashSaleForm";
import FlashSaleList from "./FlashSaleList";

export const metadata = { title: 'Flash Sale Scheduler — Dashboard' };

export default async function FlashSalePage() {
  const token = await GetTokenServer();
  // ...
  return (
    <div className="main-content-wrap">
      {/* header, form, list, script */}
    </div>
  );
}
```

- [ ] **Step 2: Rewrite page.js with Layout wrapper**

Replace the entire file with:

```js
import Layout from "@/components/layout/Layout";
import GetTokenServer from "@/lib/GetTokenServer";
import FlashSaleForm from "./FlashSaleForm";
import FlashSaleList from "./FlashSaleList";

export const metadata = { title: 'Flash Sale Scheduler — Dashboard' };

export default async function FlashSalePage() {
  const token = await GetTokenServer();
  const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || '';
  const shareLink = `${frontendUrl}/flashsale`;

  return (
    <Layout breadcrumbTitleParent="Маркетинг" breadcrumbTitle="Flash Sale">
      <div className="flex items-center justify-between gap10 flex-wrap mb-20">
        <div>
          <h3 className="text-title">⚡ Flash Sale</h3>
          <p style={{ color: '#6b7280', marginTop: 4, fontSize: 13 }}>
            Хуваалцах линк:{' '}
            <a
              href={shareLink}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#3b82f6', textDecoration: 'underline' }}
            >
              {shareLink}
            </a>
          </p>
        </div>
        <CopyLinkButton shareLink={shareLink} />
      </div>

      <FlashSaleForm token={token} />
      <FlashSaleList />
    </Layout>
  );
}
```

Note: `CopyLinkButton` is a tiny client component we add in Step 3 to replace the inline `<script dangerouslySetInnerHTML>` hack.

- [ ] **Step 3: Create CopyLinkButton client component**

Create `ayo-dashboard/app/flash-sale/CopyLinkButton.jsx`:

```jsx
"use client";
import { useState } from "react";

export default function CopyLinkButton({ shareLink }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        padding: '8px 16px',
        borderRadius: 6,
        border: '1px solid #e2e8f0',
        background: 'white',
        cursor: 'pointer',
        fontSize: 13,
        color: copied ? '#10b981' : '#374151',
        transition: 'color 0.2s'
      }}
    >
      {copied ? '✓ Хуулагдлаа!' : '📋 Линк хуулах'}
    </button>
  );
}
```

- [ ] **Step 4: Add import to page.js**

Add `import CopyLinkButton from "./CopyLinkButton";` at the top of `page.js` (after the other imports).

- [ ] **Step 5: Verify in browser**

Start the dashboard dev server (`npm run dev` in `ayo-dashboard/`) and open `http://localhost:3002/flash-sale`. You should see the full sidebar, header, and breadcrumb "Маркетинг > Flash Sale". The page should look identical to `/discounts` in terms of chrome.

- [ ] **Step 6: Commit**

```bash
git -C "D:/project-ayo/ayo-dashboard" add app/flash-sale/page.js app/flash-sale/CopyLinkButton.jsx
git -C "D:/project-ayo/ayo-dashboard" commit -m "fix: add Layout wrapper to flash-sale page, extract CopyLinkButton"
```

---

### Task 2: Create ProductCombobox component

**Files:**
- Create: `ayo-dashboard/app/flash-sale/ProductCombobox.jsx`

This is the core UX improvement. The component fetches all products once on mount, then filters in-memory as the user types. When a product is selected it shows a confirmation card.

- [ ] **Step 1: Create the file**

Create `ayo-dashboard/app/flash-sale/ProductCombobox.jsx`:

```jsx
"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { getDiscountableProducts } from "@/lib/api/discounts";
import { resolveImageUrl } from "@/lib/api/env";

export default function ProductCombobox({ value, onSelect }) {
  const { data: session } = useSession();
  const [allProducts, setAllProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  // Fetch all products once when token is available
  useEffect(() => {
    const token = session?.user?.accessToken;
    if (!token || allProducts.length > 0) return;
    setLoading(true);
    getDiscountableProducts(token)
      .then(setAllProducts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session?.user?.accessToken]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleMouseDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const filtered = query.trim()
    ? allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.sku.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : [];

  const handleSelect = (product) => {
    onSelect(product);
    setQuery("");
    setOpen(false);
  };

  const handleClear = () => {
    onSelect(null);
    setQuery("");
  };

  // If a product is already selected, show the confirmation card
  if (value) {
    return (
      <div
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          padding: "10px 12px",
          background: "#f8fafc",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        {value.images?.[0]?.url ? (
          <img
            src={resolveImageUrl(value.images[0].url)}
            alt={value.name}
            style={{ width: 48, height: 48, borderRadius: 6, objectFit: "cover", flexShrink: 0 }}
          />
        ) : (
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 6,
              background: "#e2e8f0",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94a3b8",
              fontSize: 20,
            }}
          >
            📦
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{value.name}</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
            SKU: {value.sku}
            {value.category ? ` · ${value.category.name}` : ""}
            {" · "}
            ₮{Number(value.price).toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: "#10b981", fontWeight: 600, marginTop: 2 }}>
            ✓ Сонгогдсон
          </div>
        </div>
        <button
          type="button"
          onClick={handleClear}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 20,
            color: "#9ca3af",
            lineHeight: 1,
            padding: "0 4px",
            flexShrink: 0,
          }}
          title="Арилгах"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          border: `1px solid ${open ? "#3b82f6" : "#e2e8f0"}`,
          borderRadius: 6,
          padding: "8px 12px",
          background: "white",
          gap: 8,
          transition: "border-color 0.15s",
        }}
      >
        <span style={{ color: "#9ca3af", fontSize: 14 }}>🔍</span>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={loading ? "Бараа ачааллаж байна..." : "Нэр эсвэл SKU-аар хайх..."}
          disabled={loading}
          style={{
            border: "none",
            outline: "none",
            width: "100%",
            fontSize: 14,
            color: "#374151",
            background: "transparent",
          }}
        />
      </div>

      {open && query.trim() && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: 6,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            zIndex: 50,
            maxHeight: 260,
            overflowY: "auto",
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: "10px 12px", color: "#9ca3af", fontSize: 13 }}>
              Бараа олдсонгүй
            </div>
          ) : (
            filtered.map((product) => (
              <div
                key={product.id}
                onMouseDown={() => handleSelect(product)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 12px",
                  cursor: "pointer",
                  borderBottom: "1px solid #f8fafc",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
              >
                {product.images?.[0]?.url ? (
                  <img
                    src={resolveImageUrl(product.images[0].url)}
                    alt={product.name}
                    style={{ width: 32, height: 32, borderRadius: 4, objectFit: "cover", flexShrink: 0 }}
                  />
                ) : (
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 4,
                      background: "#f1f5f9",
                      flexShrink: 0,
                    }}
                  />
                )}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{product.name}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>
                    SKU: {product.sku} · ₮{Number(product.price).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify the file saved correctly**

Check that `ayo-dashboard/app/flash-sale/ProductCombobox.jsx` exists and is not empty.

- [ ] **Step 3: Commit**

```bash
git -C "D:/project-ayo/ayo-dashboard" add app/flash-sale/ProductCombobox.jsx
git -C "D:/project-ayo/ayo-dashboard" commit -m "feat: add ProductCombobox with inline search and selection card"
```

---

### Task 3: Wire ProductCombobox into FlashSaleForm

**Files:**
- Modify: `ayo-dashboard/app/flash-sale/FlashSaleForm.js`

Replace the `productId` string state + number input with `selectedProduct` state + `<ProductCombobox>`. Also add the 1-hour duration preset.

- [ ] **Step 1: Update the DURATIONS array**

In `FlashSaleForm.js`, find:

```js
const DURATIONS = [
  { label: '10 минут', minutes: 10 },
  { label: '15 минут', minutes: 15 },
  { label: '20 минут', minutes: 20 },
  { label: '30 минут', minutes: 30 },
];
```

Replace with:

```js
const DURATIONS = [
  { label: '10 мин', minutes: 10 },
  { label: '15 мин', minutes: 15 },
  { label: '30 мин', minutes: 30 },
  { label: '1 цаг', minutes: 60 },
];
```

- [ ] **Step 2: Add ProductCombobox import**

At the top of `FlashSaleForm.js`, add:

```js
import ProductCombobox from "./ProductCombobox";
```

- [ ] **Step 3: Replace productId state with selectedProduct**

Find the `useState` for `form`:

```js
const [form, setForm] = useState({
  productId: '',
  startDate: '',
  startTime: '12:00',
  duration: 10,
  discountPct: 20
});
```

Replace with:

```js
const [selectedProduct, setSelectedProduct] = useState(null);
const [form, setForm] = useState({
  startDate: '',
  startTime: '12:00',
  duration: 10,
  discountPct: 20
});
```

- [ ] **Step 4: Update handleCreate validation and payload**

Find `handleCreate`. Change the validation check from:

```js
if (!form.productId || !form.startDate || !form.startTime) {
  setError('Бүх талбарыг бөглөнө үү');
  return;
}
```

To:

```js
if (!selectedProduct || !form.startDate || !form.startTime) {
  setError('Бараа сонгоод бүх талбарыг бөглөнө үү');
  return;
}
```

And change the `createFlashSale` call from:

```js
await createFlashSale({
  productId: Number(form.productId),
  startDate: start.toISOString(),
  endDate: end.toISOString(),
  discountPct: Number(form.discountPct)
}, token);
```

To:

```js
await createFlashSale({
  productId: selectedProduct.id,
  startDate: start.toISOString(),
  endDate: end.toISOString(),
  discountPct: Number(form.discountPct)
}, token);
```

- [ ] **Step 5: Replace the Product ID input with ProductCombobox**

Find this block in the JSX (inside the `return` of mode `"create"`):

```jsx
<div>
  <label className="body-title" style={{ display: 'block', marginBottom: 6 }}>
    Product ID
  </label>
  <input
    type="number"
    value={form.productId}
    onChange={e => set('productId', e.target.value)}
    placeholder="e.g. 123"
    style={{
      width: 200,
      padding: '8px 12px',
      border: '1px solid #e2e8f0',
      borderRadius: 6,
      fontSize: 14
    }}
  />
  <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>
    Products хуудаснаас ID-г олно уу
  </div>
</div>
```

Replace with:

```jsx
<div>
  <label className="body-title" style={{ display: 'block', marginBottom: 6 }}>
    Бараа сонгох
  </label>
  <ProductCombobox value={selectedProduct} onSelect={setSelectedProduct} />
</div>
```

- [ ] **Step 6: Verify in browser**

With the dev server running, go to `http://localhost:3002/flash-sale`. Confirm:
1. The sidebar and header are visible (from Task 1).
2. The "Бараа сонгох" field shows a search input with 🔍 icon.
3. Typing a product name shows a dropdown with image + name + SKU + price.
4. Clicking a row shows the selected product card with × button.
5. Clicking × clears the selection and re-shows the search input.
6. Submitting without a product selected shows "Бараа сонгоод бүх талбарыг бөглөнө үү".
7. The duration pills now show: 10 мин, 15 мин, 30 мин, 1 цаг.

- [ ] **Step 7: Commit**

```bash
git -C "D:/project-ayo/ayo-dashboard" add app/flash-sale/FlashSaleForm.js
git -C "D:/project-ayo/ayo-dashboard" commit -m "feat: replace Product ID input with ProductCombobox in FlashSaleForm"
```

---

## Done

After all three tasks the `/flash-sale` page will have:
- Full dashboard chrome (sidebar, header, breadcrumb)
- Searchable product picker with image thumbnails and selection confirmation
- 1-hour duration option
- No more raw Product ID field
