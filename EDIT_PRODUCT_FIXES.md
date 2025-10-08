# Edit Product Pre-population Fixes

## Issues Fixed

The edit product page was not pre-populating the following fields:
1. ❌ Brand dropdown
2. ❌ Product images
3. ❌ Tags (regular and hierarchical)
4. ❌ Stock/Quantity
5. ❌ Variants (for variant products)
6. ❌ Selected attributes (for variant products)

## Root Cause

The `getProductById()` function in `lib/api/products.ts` was not fetching complete product data. It was only returning basic fields without including:
- Brand information
- Variants with inventory
- Tags
- Complete category relationships
- Product specifications

## Solutions Implemented

### 1. Fixed ImageUploadField Component

**File**: `ayo-dashboard/components/upload/ImageUploadField.jsx`

**Problem**: The component didn't initialize preview images from existing product images.

**Solution**: Added `existingImages` prop and `useEffect` to initialize:

```javascript
export default function ImageUploadField({
  ...
  existingImages = [] // NEW: Pre-existing images for edit mode
}) {
  const [initializedImages, setInitializedImages] = useState(false);
  
  // NEW: Initialize preview images from existing images (for edit mode)
  useEffect(() => {
    if (existingImages && existingImages.length > 0 && !initializedImages) {
      console.log("Initializing existing images:", existingImages);
      
      const formattedImages = existingImages.map((img, index) => ({
        id: img.id || `existing_${index}_${Date.now()}`,
        src: img.url || img.imageUrl || img.src,
        name: img.name || img.altText || `Image ${index + 1}`,
        uploaded: true,
        url: img.url || img.imageUrl,
        isPrimary: img.isPrimary || index === 0,
        existing: true // Mark as existing to prevent deletion attempts
      }));
      
      setPreviewImages(formattedImages);
      setUploadedImages(formattedImages);
      
      // Set primary image
      const primaryImg = formattedImages.find(img => img.isPrimary);
      if (primaryImg) {
        setPrimaryImageId(primaryImg.id);
      }
      
      setInitializedImages(true);
    }
  }, [existingImages, initializedImages]);
}
```

Then in EditProductComponent, pass existing images:
```javascript
<ImageUploadField
  ...
  existingImages={uploadedImages} // Pass existing images for pre-population
  ...
/>
```

### 2. Enhanced `getProductById()` API Call

**File**: `ayo-dashboard/lib/api/products.ts`

```typescript
// BEFORE: Only basic fields
export async function getProductById(productId: number, tokenOverride?: string | null): Promise<Product | null> {
  const response = await fetch(
    `${getBackendUrl()}/api/v1/products/${productId}`,
    ...
  );
  // Returned normalized shape with missing fields
}

// AFTER: Include all relations
export async function getProductById(productId: number, tokenOverride?: string | null): Promise<any> {
  const params = new URLSearchParams();
  params.set('include', 'categories,brand,variants,inventory,tags,specs');
  params.set('fields', 'detailed');
  
  const response = await fetch(
    `${getBackendUrl()}/api/v1/products/${productId}?${params.toString()}`,
    ...
  );
  // Returns full product data with all relations
}
```

### 2. Enhanced Data Population Logic

**File**: `ayo-dashboard/app/edit-product/[id]/EditProductComponent_Complete.js`

#### Brand Population
```javascript
// Extract brand ID from nested brand object or direct brandId field
const productBrandId = product.brand?.id || product.brandId || "";
console.log("Brand ID:", productBrandId);

form.reset({
  ...
  brandId: productBrandId.toString(),
  ...
});
```

#### Images Population
```javascript
// Handle both ProductImages and images array formats
if (product.ProductImages || product.images) {
  const existingImages = (product.ProductImages || product.images || []).map(img => ({
    url: img.imageUrl || img.url,
    name: img.altText || img.alt || '',
    isPrimary: img.isPrimary || false,
    id: img.id
  }));
  setUploadedImages(existingImages);
  setPreviewImages(existingImages.map(img => img.url));
  console.log("Images set:", existingImages.length);
}
```

#### Tags Population
```javascript
// Handle tags as array of strings or array of objects
let tagsToSet = [];
if (product.tags && Array.isArray(product.tags)) {
  tagsToSet = product.tags.map(t => typeof t === 'string' ? t : t.tag).filter(Boolean);
} else if (productTags && Array.isArray(productTags)) {
  tagsToSet = productTags.filter(Boolean);
}
if (tagsToSet.length > 0) {
  setSelectedTags(tagsToSet);
  console.log("Tags set:", tagsToSet);
}
```

#### Stock/Quantity Population
```javascript
// Get quantity from first variant or fallback to product.stock
const firstVariant = product.variants?.[0];
const productQuantity = firstVariant?.inventory?.quantity || product.stock || 0;
console.log("Quantity:", productQuantity);

form.reset({
  ...
  quantity: productQuantity.toString(),
  ...
});
```

#### Variants Population
```javascript
// Determine if product has multiple variants
const hasMultipleVariants = product.variants && product.variants.length > 1;
setProductMode(hasMultipleVariants ? "variants" : "simple");

if (hasMultipleVariants && product.variants) {
  const formattedVariants = product.variants.map(v => ({
    ...v,
    id: v.id,
    price: Number(v.price || 0),
    inventory: { quantity: Number(v.inventory?.quantity || 0) },
    images: (v.images || []).map(img => ({
      imageUrl: img.imageUrl || img.url || img,
      altText: img.altText || '',
      isPrimary: img.isPrimary || false
    })),
    attributes: v.attributes || []
  }));
  setVariants(formattedVariants);
  console.log("Formatted variants:", formattedVariants);
}
```

#### Selected Attributes Population (NEW)
```javascript
// Extract and set selected attribute options from variants
const attributeOptionsMap = {};
formattedVariants.forEach(variant => {
  if (variant.attributes && Array.isArray(variant.attributes)) {
    variant.attributes.forEach(attr => {
      const attributeId = attr.attributeId || attr.attribute?.id;
      const optionId = attr.optionId || attr.option?.id;
      if (attributeId && optionId) {
        if (!attributeOptionsMap[attributeId]) {
          attributeOptionsMap[attributeId] = new Set();
        }
        attributeOptionsMap[attributeId].add(optionId);
      }
    });
  }
});

// Convert Sets to Arrays
const selectedOptions = {};
Object.keys(attributeOptionsMap).forEach(attrId => {
  selectedOptions[attrId] = Array.from(attributeOptionsMap[attrId]);
});
setSelectedAttributeOptions(selectedOptions);
```

## Testing Checklist

### Simple Products
- [x] Product name, description, SKU pre-filled
- [x] Brand dropdown shows selected brand
- [x] Price and quantity pre-filled
- [x] Product images displayed
- [x] Regular tags selected
- [x] Hierarchical tags selected
- [x] Categories selected
- [x] Product specifications loaded

### Variant Products
- [x] Product name, description, SKU pre-filled
- [x] Brand dropdown shows selected brand
- [x] All variants loaded with correct prices and quantities
- [x] Variant images displayed
- [x] Attribute options pre-selected (e.g., Color, Size)
- [x] Default variant marked correctly
- [x] Regular tags selected
- [x] Hierarchical tags selected
- [x] Categories selected

## Console Logs Added

For debugging, console logs have been added to track:
```javascript
console.log("Loaded product:", product);
console.log("Product variants:", product.variants);
console.log("Product brand:", product.brand);
console.log("Product tags:", product.tags);
console.log("Product mode set to:", hasMultipleVariants ? "variants" : "simple");
console.log("Formatted variants:", formattedVariants);
console.log("Selected attribute options:", selectedOptions);
console.log("Category IDs set to:", productCategoryIds);
console.log("Price:", productPrice, "Quantity:", productQuantity);
console.log("Brand ID:", productBrandId);
console.log("Form reset with values");
console.log("Images set:", existingImages.length);
console.log("Tags set:", tagsToSet);
```

These logs help verify that data is being loaded and populated correctly.

## How to Verify

1. Navigate to any product edit page: `/edit-product/{productId}`
2. Open browser console (F12)
3. Check console logs to see loaded data
4. Verify all fields are pre-populated:
   - Brand dropdown shows selected brand
   - Images are displayed
   - Tags are selected
   - Stock/quantity shows correct value
   - For variant products: all variants with attributes are shown

## Debug Panel Added

A development-only debug panel has been added at the top of the edit page showing:
- Number of images loaded
- Number of tags selected
- Number of hierarchical tags selected
- Number of variants
- Product mode (simple/variants)
- Brand ID
- Number of categories selected

This panel only shows in development mode and helps verify data is loading correctly.

## Result

✅ **All fields now properly pre-populate when editing a product!**

- ✅ Brand dropdown shows the correct selected brand
- ✅ Product images are displayed in the upload field
- ✅ Tags (both regular and hierarchical) are pre-selected
- ✅ Stock/quantity shows the correct value
- ✅ Variants with attributes are fully loaded and displayed
- ✅ The form maintains the same beautiful UI and UX as the add product page

## If Images/Tags Still Don't Show

1. **Check Browser Console** - Look for the console.log messages:
   - "Loaded product:" - Shows full product data
   - "Images set: X" - Shows number of images loaded
   - "Tags set: [...]" - Shows which tags were set
   - "Initializing existing images:" - From ImageUploadField

2. **Check Debug Panel** - At the top of the page (development mode only):
   - Images count should match product images
   - Tags count should match selected tags
   - Brand ID should be populated

3. **Check Network Tab**:
   - API call to `/api/v1/products/{id}?include=categories,brand,variants,inventory,tags,specs&fields=detailed`
   - Response should contain `brand`, `tags`, `ProductImages`, etc.

4. **Common Issues**:
   - If images is 0 but product has images → Check API response format
   - If tags is 0 but product has tags → Check if tags are strings or objects
   - If brand dropdown empty → Check if `product.brand.id` or `product.brandId` exists

