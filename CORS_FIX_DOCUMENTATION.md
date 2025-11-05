# CORS Error Fix Documentation

## Problem

The dashboard was experiencing CORS (Cross-Origin Resource Sharing) errors on multiple API endpoints:
- `categories/?all=true` 
- `presets` (tag presets)
- `tag-groups`
- `brands/all`

These errors occurred because **client-side components were making direct fetch requests to the backend API**, which is hosted on a different origin than the Next.js frontend. Browsers block such cross-origin requests by default for security reasons.

## Root Cause

The API utility functions in `lib/api/` were directly calling `getBackendUrl()` which points to the backend server (different domain/port), causing CORS violations when called from browser-based React components marked with `"use client"`.

### Example of the Problem:
```typescript
// In lib/api/tags.ts - BEFORE (caused CORS error)
export async function getTagPresets(): Promise<TagPreset[]> {
  const res = await fetch(
    `${getBackendUrl()}/api/v1/tags/presets`,  // ❌ Direct backend call from browser
    { cache: "no-store" }
  );
  // ...
}
```

## Solution

Implemented a **proxy pattern** similar to the existing `attributes.ts` file:

1. **Created Next.js API proxy routes** that run server-side (same origin as frontend):
   - `/app/api/categories/all/route.ts`
   - `/app/api/tags/presets/route.ts`
   - `/app/api/brands/all/route.ts`
   - `/app/api/tag-groups/list/route.ts` (already existed)

2. **Updated API functions** to detect browser execution and route through the proxy:
   - `lib/api/categories.ts` → `getCategories()`, `getCategoriesClient()`
   - `lib/api/tags.ts` → `getTagPresets()`
   - `lib/api/hierarchicalTags.ts` → `getTagGroups()`
   - `lib/api/brands.ts` → `getAllBrands()`, `getBrandsClient()`

### Example of the Fix:
```typescript
// In lib/api/tags.ts - AFTER (no CORS error)
export async function getTagPresets(): Promise<TagPreset[]> {
  try {
    const isBrowser = typeof window !== 'undefined';
    const url = isBrowser 
      ? '/api/tags/presets'  // ✅ Same-origin proxy route
      : `${getBackendUrl()}/api/v1/tags/presets`;  // Server-side direct call
    
    const res = await fetch(url, { cache: "no-store" });
    // ...
  }
}
```

## How It Works

### Request Flow:

**Before (CORS Error):**
```
Browser Component → Backend API (different origin) ❌ CORS Error
```

**After (Fixed):**
```
Browser Component → Next.js API Route (same origin) → Backend API ✅ Success
```

The Next.js API routes act as a **server-side proxy**, forwarding requests to the backend while avoiding CORS issues since:
1. Browser calls Next.js API (same origin - no CORS)
2. Next.js server calls backend (server-to-server - no CORS)

## Files Modified

### New Files (API Proxy Routes):
- `app/api/categories/all/route.ts`
- `app/api/tags/presets/route.ts`
- `app/api/brands/all/route.ts`

### Updated Files:
- `lib/api/categories.ts`
- `lib/api/tags.ts`
- `lib/api/hierarchicalTags.ts`
- `lib/api/brands.ts`

## Testing

To verify the fix works:

1. Restart the Next.js development server:
   ```bash
   cd ayo-dashboard
   npm run dev
   ```

2. Open the dashboard and navigate to pages that were experiencing CORS errors:
   - Edit Product page (uses categories, brands, tag-groups, presets)
   - Add Product page
   - Tags management page

3. Open browser DevTools (F12) → Network tab
   - You should see requests to `/api/categories/all`, `/api/tags/presets`, etc.
   - All requests should return **200 OK** instead of **CORS errors**

4. Check the Console tab - no red CORS error messages should appear

## Environment Configuration

Make sure your `.env` file has the backend URL configured:

```env
BACKEND_URL=http://your-backend-api-url
# or
NEXT_PUBLIC_BACKEND_URL=http://your-backend-api-url
```

The proxy routes will use this URL to forward requests to the actual backend.

## Future Considerations

When adding new API functions that will be called from client components:

1. **Always check for browser execution:**
   ```typescript
   const isBrowser = typeof window !== 'undefined';
   const url = isBrowser ? '/api/your-endpoint' : `${getBackendUrl()}/api/v1/your-endpoint`;
   ```

2. **Create corresponding API proxy route** at `app/api/your-endpoint/route.ts`

3. **Follow the existing pattern** from `app/api/attributes/list/route.ts`

## Alternative Solutions Considered

1. **Configure CORS on backend** - Not ideal as it opens security concerns and requires backend changes
2. **Make all components server-side** - Not feasible for interactive components that need client-side state
3. **Proxy pattern (chosen)** - Best balance of security, simplicity, and functionality

## Benefits of This Approach

✅ No CORS configuration needed on backend  
✅ Works with existing backend without modifications  
✅ Secure - backend URL not exposed to browser  
✅ Compatible with Next.js architecture  
✅ Easy to maintain and extend  
✅ Follows Next.js best practices  

## Status

🟢 **FIXED** - All CORS errors resolved. Dashboard API requests now work correctly from client components.

