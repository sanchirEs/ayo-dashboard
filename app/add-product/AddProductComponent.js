"use client";

import "./premium-product-form.css";
import "../../components/customui/CategorySelector.css";
import { addProductsSchema } from "@/schemas/productSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useState,
  useTransition,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useForm } from "react-hook-form";
import { getCategoriesClient } from "@/lib/api/categories";
import { getAttributes } from "@/lib/api/attributes";
import { getTagPresets } from "@/lib/api/tags";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/customui/Input";
import LoadingButton from "@/components/customui/LoadingButton";
import Layout from "@/components/layout/Layout";
import GetToken from "@/lib/GetTokenClient";
import { getBackendUrl } from "@/lib/api/env";
import ImageUploadField from "@/components/upload/ImageUploadField";
import CategorySelector from "@/components/customui/CategorySelector";
import toastManager from "@/lib/toast";

/**
 * AddProductComponent - Simplified with file uploads and optional advanced features
 */
export default function AddProductComponent() {
  // State management
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [tagPresets, setTagPresets] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [attributes, setAttributes] = useState([]);
  const [loadingAttributes, setLoadingAttributes] = useState(true);
  
  // Product mode: "simple" or "variants"
  const [productMode, setProductMode] = useState("simple");
  
  // Image preview handling
  const [previewImages, setPreviewImages] = useState([]);
  
  // Enhanced image upload state
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [imageUploadErrors, setImageUploadErrors] = useState([]);
  
  // Variant management
  const [variants, setVariants] = useState([]);
  const [selectedAttributeOptions, setSelectedAttributeOptions] = useState({});
  
  // Product specifications state
  const [productSpecs, setProductSpecs] = useState([]);
  
  // Advanced features toggle
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);
  
  const TOKEN = GetToken();
  const VENDOR_ID_STATIC = 1;

  // Form setup
  const form = useForm({
    resolver: zodResolver(addProductsSchema),
    defaultValues: {
      name: "",
      description: "",
      howToUse: "",
      ingredients: "",
      sku: "",
      categoryId: "",
      categoryIds: [],
      vendorId: VENDOR_ID_STATIC?.toString() || "1", // Set default vendor ID
      images: [],
      tagsCsv: "",
      // Simple product fields
      price: "",
      quantity: "",
      // Advanced features (hidden by default)
      flashSale: false,
      flashSaleEndDate: "",
      discountId: "",
      promotionId: "",
    },
    mode: "onChange",
  });

  // Load initial data
  useEffect(() => {
    async function loadInitialData() {
      if (!TOKEN) return;
      
      try {
        const [categoriesData, tagPresetsData, attributesData] = await Promise.all([
          getCategoriesClient(TOKEN, true), // Get ALL categories for product creation
          getTagPresets(),
          getAttributes(),
        ]);
        
          setCategories(categoriesData);
        setTagPresets(tagPresetsData);
        setAttributes(attributesData.filter(attr => 
          Array.isArray(attr.options) && attr.options.length > 0
        ));
        } catch (error) {
        console.error("Failed to load initial data:", error);
        setError("Өгөгдөл ачаалахад алдаа гарлаа");
        } finally {
          setLoadingCategories(false);
        setLoadingAttributes(false);
      }
    }

    loadInitialData();
  }, [TOKEN]);

  // Tag management helpers
  const TYPE_LABELS = useMemo(() => ({
      Color: "Өнгө",
      Size: "Хэмжээ",
      Material: "Материал",
      Season: "Улирал",
      Style: "Загвар",
  }), []);

  const typeLabel = useCallback((t) => TYPE_LABELS[t] || t || "Бусад", [TYPE_LABELS]);
  
  const sortedTypes = useMemo(() => {
    const typesFromData = Array.from(
      new Set((tagPresets || []).map(p => String(p.type || "")).filter(Boolean))
    );
    const typeOrder = ["Color", "Size", "Material", "Season", "Style"];
    return [
      ...typeOrder.filter(t => typesFromData.includes(t)),
      ...typesFromData.filter(t => !typeOrder.includes(t)),
    ];
  }, [tagPresets]);

  const toggleTag = useCallback((tagName) => {
    setSelectedTags(prev => {
      const exists = prev.includes(tagName);
      return exists ? prev.filter(t => t !== tagName) : [...prev, tagName];
    });
  }, []);

  // Sync selected tags with form
  useEffect(() => {
    const csv = Array.from(new Set(selectedTags)).join(",");
    form.setValue("tagsCsv", csv, { shouldDirty: true, shouldTouch: true });
  }, [selectedTags, form]);

  // Sync uploaded images with form - separate effect to prevent render cycle issues
  useEffect(() => {
    if (uploadedImages.length > 0) {
      const formattedImages = uploadedImages.map(img => ({
        imageUrl: img.url || img.optimized_url || img.src,
        altText: img.name || img.alt || '',
        isPrimary: img.isPrimary || false
      }));
      
      form.setValue("images", formattedImages, { shouldDirty: true });
    }
  }, [uploadedImages, form]);

  // Enhanced image upload handlers
  const handleImagesChange = useCallback((images) => {
    // Update form with files (for manual upload mode)
    const files = images.filter(img => img.file).map(img => img.file);
    form.setValue("images", files, { shouldDirty: true, shouldTouch: true });
    
    // Update preview state
    setPreviewImages(images.map(img => img.src || img.preview));
  }, [form]);

  const handleUploadComplete = useCallback((uploadedImages) => {
    console.log("Images uploaded successfully:", uploadedImages);
    
    // Update uploaded images state first
    setUploadedImages(prev => [...prev, ...uploadedImages]);
    setImageUploadErrors([]);
    
    // Show success notification
    toastManager?.success(
      `${uploadedImages.length} зураг амжилттай байршуулагдлаа`,
      { title: 'Зураг байршуулалт' }
    );
  }, []);

  const handleUploadError = useCallback((error) => {
    console.error("Image upload error:", error);
    setImageUploadErrors([error]);
    setError(error);
    
    // Show error notification
    toastManager?.error(error, { title: 'Зураг байршуулалтын алдаа' });
  }, []);

  const handleUploadProgress = useCallback((progress) => {
    setImageUploadProgress(progress);
  }, []);

  const handlePrimaryImageChange = useCallback((images) => {
    // Update uploadedImages state to reflect primary changes
    // The useEffect above will handle form updates
    setUploadedImages(images);
  }, []);

  // Legacy file upload handling (keeping for backward compatibility)
  const handleImageFilesSelected = useCallback((event, onChange) => {
    try {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;

      // Generate previews
      setPreviewImages([]);
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewImages((prev) => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
      });

      // Update form
      onChange(files);
    } catch (e) {
      console.warn("Error processing files:", e);
    }
  }, []);

  // Variant management
  const generateVariantCombinations = () => {
    const attributeEntries = Object.entries(selectedAttributeOptions)
      .map(([attrId, optionIds]) => ({
        attributeId: parseInt(attrId),
        options: optionIds.map(id => parseInt(id))
      }))
      .filter(entry => entry.options.length > 0);

    if (attributeEntries.length === 0) {
      setVariants([]);
      return;
    }

    // Generate cartesian product
    let combinations = [[]];
    for (const { attributeId, options } of attributeEntries) {
      const newCombinations = [];
      for (const combination of combinations) {
        for (const optionId of options) {
          newCombinations.push([...combination, { attributeId, optionId }]);
        }
      }
      combinations = newCombinations;
    }

    // Convert combinations to variants
    const baseSku = form.getValues("sku") || "PROD";
    const basePrice = form.getValues("price") || 0;

    const newVariants = combinations.map((attrs, index) => {
      const attributeNames = attrs.map(({ attributeId, optionId }) => {
        const attribute = attributes.find(a => a.id === attributeId);
        const option = attribute?.options.find(o => o.id === optionId);
        return `${attribute?.name}-${option?.value}`;
      });
      
      const skuSuffix = attributeNames.join("-").toUpperCase().replace(/\s+/g, "-");
      const variantSku = `${baseSku}-${skuSuffix}`;

      return {
        sku: variantSku,
        price: Number(basePrice),
        isDefault: index === 0,
        attributes: attrs,
        inventory: { quantity: 0 },
        images: [],
      };
    });

    setVariants(newVariants);
  };

  const updateVariant = (index, field, value) => {
    setVariants(prev => prev.map((variant, i) => 
      i === index ? { ...variant, [field]: value } : variant
    ));
  };

  const handleVariantImageUpload = (variantIndex, event) => {
    try {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;

      const imageObjects = [];
      let processedCount = 0;
      
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          // Create proper image object structure that matches backend schema
          const imageObject = {
            imageUrl: reader.result, // base64 data URL for preview
            altText: file.name || "",
            isPrimary: false,
            // Store file reference for potential upload
            _file: file,
            _isPreview: true // Flag to indicate this is preview data
          };
          
          imageObjects.push(imageObject);
          processedCount++;
          
          if (processedCount === files.length) {
            // Update variant with proper image objects
            const currentImages = variants[variantIndex].images || [];
            updateVariant(variantIndex, 'images', [...currentImages, ...imageObjects]);
          }
        };
        reader.readAsDataURL(file);
      });
    } catch (e) {
      console.warn("Error processing variant images:", e);
    }
  };

  const removeVariantImage = (variantIndex, imageIndex) => {
    const currentImages = variants[variantIndex].images || [];
    const newImages = currentImages.filter((_, i) => i !== imageIndex);
    updateVariant(variantIndex, 'images', newImages);
  };

  // Product specifications functions
  const addProductSpec = () => {
    setProductSpecs([...productSpecs, { type: "", value: "" }]);
  };

  const removeProductSpec = (index) => {
    setProductSpecs(productSpecs.filter((_, i) => i !== index));
  };

  const updateProductSpec = (index, field, value) => {
    const updatedSpecs = [...productSpecs];
    updatedSpecs[index][field] = value;
    setProductSpecs(updatedSpecs);
  };

  const setDefaultVariant = (index) => {
    setVariants(prev => prev.map((variant, i) => ({
      ...variant,
      isDefault: i === index
    })));
  };

  const toggleAttributeOption = (attributeId, optionId) => {
    setSelectedAttributeOptions(prev => {
      const current = new Set(prev[attributeId] || []);
      if (current.has(optionId)) {
        current.delete(optionId);
              } else {
        current.add(optionId);
      }
      return { ...prev, [attributeId]: Array.from(current) };
    });
  };

  // Category management functions
  const toggleCategory = (categoryId) => {
    setSelectedCategoryIds(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const clearAllCategories = () => {
    setSelectedCategoryIds([]);
  };

  const getSelectedCategoriesDisplay = () => {
    return selectedCategoryIds.map(id => {
      const category = categories.find(cat => cat.id === id);
      return category ? category.name : `Category ${id}`;
    }).join(', ');
  };

  // Build payload for submission
  const buildProductPayload = (formValues) => {
    console.log("Building payload with form values:", formValues);
    console.log("Uploaded images from main form:", uploadedImages);
    console.log("Preview images:", previewImages);
    
    // Build base payload matching backend structure
    const payload = {
      sku: formValues.sku,
      name: formValues.name,
      description: formValues.description,
      howToUse: formValues.howToUse || "",
      ingredients: formValues.ingredients || "",
      specs: productSpecs.filter(spec => spec.type.trim() && spec.value.trim()),
      categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : (formValues.categoryId ? [Number(formValues.categoryId)] : []),
      vendorId: Number(formValues.vendorId || VENDOR_ID_STATIC),
      tags: selectedTags,
    };

    // Add price at product level based on mode
    if (productMode === "simple") {
      // For simple products, include price in main payload
      if (formValues.price) {
        payload.price = Number(formValues.price);
      } else {
        payload.price = 0;
      }
      console.log("✅ Simple mode: Price included in main payload");
    } else if (productMode === "variants") {
      // For variant products, use default variant's price as product price
      // (Database requires a price field, but actual pricing is in variants)
      if (variants.length > 0) {
        const defaultVariant = variants.find(v => v.isDefault);
        if (defaultVariant) {
          payload.price = Number(defaultVariant.price);
          console.log("✅ Variant mode: Using default variant price as product price:", payload.price);
        } else {
          payload.price = Number(variants[0]?.price || 0);
          console.log("✅ Variant mode: Using first variant price as product price:", payload.price);
        }
      } else {
        payload.price = 0;
        console.log("✅ Variant mode: No variants, setting product price to 0");
      }
    }

    // Add optional advanced features only if they have values
    if (showAdvancedFeatures) {
      if (formValues.flashSale) {
        payload.flashSale = true;
        if (formValues.flashSaleEndDate) {
          payload.flashSaleEndDate = formValues.flashSaleEndDate;
        }
      }

      if (formValues.discountId && formValues.discountId !== "") {
        payload.discountId = Number(formValues.discountId);
      }

      if (formValues.promotionId && formValues.promotionId !== "") {
        payload.promotionId = Number(formValues.promotionId);
      }
    }

    // Prepare images for variants
    // Priority: 1) Uploaded images from main form, 2) Variant-specific uploaded images, 3) Empty array
    const getVariantImages = (variant, variantIndex) => {
      // First, check if this variant has its own uploaded images (from variant-specific upload)
      const variantUploadedImages = (variant.images || []).filter(img => 
        img.imageUrl && 
        (img.imageUrl.startsWith('http://') || img.imageUrl.startsWith('https://')) &&
        !img._isPreview
      );
      
      if (variantUploadedImages.length > 0) {
        console.log(`✅ Variant ${variantIndex}: Using variant-specific images (${variantUploadedImages.length})`);
        return variantUploadedImages;
      }
      
      // If no variant-specific images, use main form uploaded images
      if (uploadedImages.length > 0) {
        console.log(`✅ Variant ${variantIndex}: Using main form images (${uploadedImages.length})`);
        return uploadedImages.map(img => ({
          imageUrl: img.url || img.secure_url || img,
          altText: `${formValues.name} - Variant ${variantIndex + 1}`,
          isPrimary: variantIndex === 0 // First variant gets primary image
        }));
      }
      
      console.log(`⚠️ Variant ${variantIndex}: No images available`);
      return [];
    };

    // Handle variants based on mode
    if (productMode === "variants" && variants.length > 0) {
      payload.variants = variants.map((variant, index) => {
        const variantImages = getVariantImages(variant, index);
        
        return {
          sku: variant.sku,
          price: Number(variant.price),
          isDefault: variant.isDefault,
          attributes: variant.attributes,
          inventory: variant.inventory,
          images: variantImages,
        };
      });
      console.log("✅ Variants created with images:", payload.variants.map((v, i) => `Variant ${i}: ${v.images.length} images`));
    } else if (productMode === "simple") {
      // For simple products, create explicit single variant with main form images
      const simpleProductImages = uploadedImages.length > 0 ? 
        uploadedImages.map((img, index) => ({
          imageUrl: img.url || img.secure_url || img,
          altText: `${formValues.name}`,
          isPrimary: index === 0
        })) : [];
      
      if (formValues.price && formValues.quantity) {
        payload.variants = [{
          sku: `${formValues.sku}-DEFAULT`,
          price: Number(formValues.price),
          isDefault: true,
          attributes: [],
          inventory: { quantity: Number(formValues.quantity) },
          images: simpleProductImages,
        }];
        console.log(`✅ Simple product created with ${simpleProductImages.length} images`);
      }
    }

    console.log("Built payload:", payload);
    console.log("Payload structure:");
    console.log("- Has price field:", 'price' in payload);
    console.log("- Has variants:", 'variants' in payload);
    console.log("- Variants count:", payload.variants?.length || 0);
    console.log("- Total images across all variants:", payload.variants?.reduce((sum, v) => sum + v.images.length, 0) || 0);
    return payload;
  };

  // Form submission
  const onSubmit = async (values) => {
    console.log("=== FORM SUBMISSION STARTED ===");
    console.log("Form values:", values);
    console.log("Product mode:", productMode);
    
    if (!TOKEN) {
      setError("Та нэвтрэх хэрэгтэй");
      return;
    }
    
    console.log("✅ TOKEN validated, continuing...");

    // Validation
    console.log("🔍 Starting validation...");
    console.log("Product mode:", productMode);
    
    if (productMode === "variants") {
      console.log("📋 Validating variants mode...");
      console.log("Variants count:", variants.length);
      
      if (variants.length === 0) {
        console.log("❌ No variants found");
        setError("Вариант үүсгэнэ үү");
        return;
      }

      const defaultCount = variants.filter(v => v.isDefault).length;
      console.log("Default variants count:", defaultCount);
      
      if (defaultCount !== 1) {
        console.log("❌ Invalid default count:", defaultCount);
        setError("Нэг үндсэн вариант сонгоно уу");
        return;
      }
      
      const invalidVariants = variants.filter(v => !v.sku || !v.price);
      if (invalidVariants.length > 0) {
        console.log("❌ Invalid variants:", invalidVariants);
        setError("Бүх вариантуудад SKU болон үнэ оруулна уу");
        return;
      }
      
      console.log("✅ Variants validation passed");
    } else {
      console.log("📋 Validating simple mode...");
      console.log("Price:", values.price, "Quantity:", values.quantity);
      
      if (!values.price || !values.quantity) {
        console.log("❌ Missing price or quantity - Price:", values.price, "Quantity:", values.quantity);
        setError("Энгийн бараанд үнэ болон тоо ширхэг заавал оруулна уу");
        return;
      }
      
      console.log("✅ Simple mode validation passed");
    }

    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        const payload = buildProductPayload(values);
        
        // Since we're using auto-upload, images are already uploaded to Cloudinary
        // and their URLs are included in the payload. Send as JSON.
        const headers = {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        };

        console.log("Sending request with payload:", payload);

        const response = await fetch(
          `${getBackendUrl()}/api/v1/products/createproduct`,
          {
            method: "POST",
            headers: headers,
            body: JSON.stringify(payload),
          }
        );
        
        const responseData = await response.json();
        console.log("Response:", responseData);
        
        if (response.ok) {
          setSuccess(responseData.message || "Бараа амжилттай нэмэгдлээ");
          
          // Reset form
          form.reset();
          setSelectedTags([]);
          setPreviewImages([]);
          setUploadedImages([]);
          setImageUploadErrors([]);
          setImageUploadProgress(0);
          setVariants([]);
          setSelectedAttributeOptions({});
          setProductMode("simple");
          setShowAdvancedFeatures(false);
        } else {
          setError(responseData.message || "Алдаа гарлаа");
        }
      } catch (error) {
        console.error("Submit error:", error);
        setError("Системийн алдаа гарлаа. Дахин оролдоно уу.");
      }
    });
  };

  return (
      <Layout
        breadcrumbTitleParent="Бараа"
        breadcrumbTitle="Бараа нэмэх"
        pageTitle="Бараа нэмэх"
      >


        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="premium-form-container">
            <div className="form-sections-grid">
            {/* Basic Product Information - Premium Card */}
              <div className="premium-card form-section-card">
                <div className="card-header">
                  <div className="card-icon">
                    <i className="icon-info" />
                  </div>
                  <div className="card-title-group">
                    <h3 className="card-title">Үндсэн мэдээлэл</h3>
                    <p className="card-subtitle">Бүтээгдэхүүний үндсэн мэдээллийг оруулна уу</p>
                  </div>
                </div>
                <div className="card-content">
              
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="premium-form-item">
                      <FormLabel className="premium-label">
                        <span className="label-text">Бүтээгдэхүүний нэр</span>
                        <span className="label-required">*</span>
                        <div className="label-underline"></div>
                      </FormLabel>
                      <FormControl>
                        <div className="premium-input-wrapper">
                          <div className="input-icon">
                            <i className="icon-tag" />
                          </div>
                          <Input
                            className="premium-input"
                            placeholder="Бүтээгдэхүүний нэр оруулна уу"
                            type="text"
                            {...field}
                          />
                          <div className="input-border-animation"></div>
                        </div>
                      </FormControl>
                      <FormMessage className="premium-error" />
                      <FormDescription className="premium-description">
                        <i className="icon-info-circle" />
                        20 тэмдэгтээс бага байх ёстой
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <div className="premium-form-row">
                  <div className="premium-form-col">
                    <FormField
                      control={form.control}
                      name="categoryIds"
                      render={({ field }) => (
                        <FormItem className="premium-form-item">
                          <FormLabel className="premium-label">
                            <span className="label-text">Бүтээгдэхүүний ангилал</span>
                            <span className="label-optional">Олон ангилал сонгож болно</span>
                            <div className="label-underline"></div>
                          </FormLabel>
                          <FormControl>
                            <div className="categories-selection-area">
                              {/* Selected Categories Display */}
                              <div className="selected-categories-display">
                                {selectedCategoryIds.length > 0 ? (
                                  <div className="selected-categories-grid">
                                    {selectedCategoryIds.map(categoryId => {
                                      const category = categories.find(cat => cat.id === categoryId);
                                      return (
                                        <div key={categoryId} className="selected-category-chip">
                                          <span className="category-name">
                                            {category ? category.name : `Category ${categoryId}`}
                                          </span>
                                          <button
                                            type="button"
                                            className="category-remove-btn"
                                            onClick={() => toggleCategory(categoryId)}
                                          >
                                            <i className="icon-x" />
                                          </button>
                                        </div>
                                      );
                                    })}
                                    <button
                                      type="button"
                                      className="clear-all-categories-btn"
                                      onClick={clearAllCategories}
                                    >
                                      <i className="icon-trash" />
                                      Бүгдийг арилгах
                                    </button>
                                  </div>
                                ) : (
                                  <div className="empty-categories-state">
                                    <i className="icon-grid" />
                                    <span>Ангилал сонгогдоогүй</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Available Categories */}
                              <div className="available-categories-section">
                                <div className="section-header">
                                  <span className="section-title">Боломжтой ангиллууд</span>
                                  <span className="selected-count">
                                    {selectedCategoryIds.length} сонгогдсон
                                  </span>
                                </div>
                                
                                {loadingCategories ? (
                                  <div className="loading-categories">
                                    <div className="loading-spinner" />
                                    <span>Ачааллаж байна...</span>
                                  </div>
                                ) : (
                                  <div className="categories-grid">
                                    {categories.map((category) => {
                                      const isSelected = selectedCategoryIds.includes(category.id);
                                      return (
                                        <button
                                          key={category.id}
                                          type="button"
                                          className={`category-option-chip ${isSelected ? 'selected' : ''}`}
                                          onClick={() => toggleCategory(category.id)}
                                        >
                                          <span className="chip-text">{category.name}</span>
                                          <div className="chip-indicator">
                                            {isSelected && <i className="icon-check" />}
                                          </div>
                                          <div className="chip-glow"></div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage className="premium-error" />
                          <FormDescription className="premium-description">
                            <i className="icon-info-circle" />
                            Бүтээгдэхүүнд олон ангилал оноож болно
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>

                <div className="premium-form-col">
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem className="premium-form-item">
                        <FormLabel className="premium-label">
                          <span className="label-text">SKU</span>
                          <span className="label-required">*</span>
                          <div className="label-underline"></div>
                        </FormLabel>
                        <FormControl>
                          <div className="premium-input-wrapper">
                            <div className="input-icon">
                              <i className="icon-hash" />
                            </div>
                            <Input
                              className="premium-input"
                              placeholder="SKU оруулна уу"
                              type="text"
                              {...field}
                            />
                            <div className="input-border-animation"></div>
                          </div>
                        </FormControl>
                        <FormMessage className="premium-error" />
                        <FormDescription className="premium-description">
                          <i className="icon-info-circle" />
                          Дахин давтагдахгүй байх ёстой
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="premium-form-item">
                      <FormLabel className="premium-label">
                        <span className="label-text">Тайлбар</span>
                        <span className="label-required">*</span>
                        <div className="label-underline"></div>
                      </FormLabel>
                      <FormControl>
                        <div className="premium-textarea-wrapper">
                          <div className="textarea-icon">
                            <i className="icon-file-text" />
                          </div>
                          <textarea
                            {...field}
                            className="premium-textarea"
                            placeholder="Бүтээгдэхүүний дэлгэрэнгүй тайлбарыг энд бичнэ үү..."
                            rows={4}
                          />
                          <div className="input-border-animation"></div>
                          <div className="textarea-resize-indicator">
                            <i className="icon-corner-down-right" />
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage className="premium-error" />
                      <FormDescription className="premium-description">
                        <i className="icon-info-circle" />
                        Худалдан авагчдад тус бүтээгдэхүүний талаар илүү мэдээлэл өгөх
                      </FormDescription>
                    </FormItem>
                  )}
                />

                {/* How to Use Field */}
                <FormField
                  control={form.control}
                  name="howToUse"
                  render={({ field }) => (
                    <FormItem className="premium-form-item">
                      <FormLabel className="premium-label">
                        <span className="label-text">Хэрэглэх арга</span>
                        <div className="label-underline"></div>
                      </FormLabel>
                      <FormControl>
                        <div className="premium-textarea-wrapper">
                          <div className="textarea-icon">
                            <i className="icon-help-circle" />
                          </div>
                          <textarea
                            {...field}
                            className="premium-textarea"
                            placeholder="Энэ бүтээгдэхүүнийг хэрхэн ашиглах талаарх зааварчилгааг бичнэ үү..."
                            rows={3}
                          />
                          <div className="input-border-animation"></div>
                          <div className="textarea-resize-indicator">
                            <i className="icon-corner-down-right" />
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage className="premium-error" />
                      <FormDescription className="premium-description">
                        <i className="icon-info-circle" />
                        Хэрэглэгчдэд бүтээгдэхүүнийг хэрхэн ашиглах талаар зааварчилгаа өгнө үү
                      </FormDescription>
                    </FormItem>
                  )}
                />

                {/* Ingredients Field */}
                <FormField
                  control={form.control}
                  name="ingredients"
                  render={({ field }) => (
                    <FormItem className="premium-form-item">
                      <FormLabel className="premium-label">
                        <span className="label-text">Найрлага</span>
                        <div className="label-underline"></div>
                      </FormLabel>
                      <FormControl>
                        <div className="premium-textarea-wrapper">
                          <div className="textarea-icon">
                            <i className="icon-layers" />
                          </div>
                          <textarea
                            {...field}
                            className="premium-textarea"
                            placeholder="Бүтээгдэхүүний найрлага, тус бүрийн орцыг жагсаана уу..."
                            rows={3}
                          />
                          <div className="input-border-animation"></div>
                          <div className="textarea-resize-indicator">
                            <i className="icon-corner-down-right" />
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage className="premium-error" />
                      <FormDescription className="premium-description">
                        <i className="icon-info-circle" />
                        Бүтээгдэхүүнд орсон бүрэлдэхүүн хэсгүүдийг тайлбарлана уу
                      </FormDescription>
                    </FormItem>
                  )}
                />

                {/* Product Specifications Section */}
                <div className="premium-form-item">
                  <div className="premium-label">
                    <span className="label-text">Техникийн тодорхойлолт</span>
                    <div className="label-underline"></div>
                  </div>
                  <div className="specs-container">
                    {productSpecs.map((spec, index) => (
                      <div key={index} className="spec-row premium-form-row">
                        <div className="premium-form-col">
                          <div className="premium-input-wrapper">
                            <div className="input-icon">
                              <i className="icon-tag" />
                            </div>
                            <Input
                              className="premium-input"
                              placeholder="Төрөл (жишээ: Үнэр)"
                              value={spec.type}
                              onChange={(e) => updateProductSpec(index, 'type', e.target.value)}
                            />
                            <div className="input-border-animation"></div>
                          </div>
                        </div>
                        <div className="premium-form-col">
                          <div className="premium-input-wrapper">
                            <div className="input-icon">
                              <i className="icon-type" />
                            </div>
                            <Input
                              className="premium-input"
                              placeholder="Утга (жишээ: Лаванда)"
                              value={spec.value}
                              onChange={(e) => updateProductSpec(index, 'value', e.target.value)}
                            />
                            <div className="input-border-animation"></div>
                          </div>
                        </div>
                        <div className="spec-actions">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeProductSpec(index)}
                            className="premium-button-secondary"
                          >
                            <i className="icon-trash-2" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addProductSpec}
                      className="premium-button-outline add-spec-button"
                    >
                      <i className="icon-plus" />
                      Тодорхойлолт нэмэх
                    </Button>
                  </div>
                  <div className="premium-description">
                    <i className="icon-info-circle" />
                    Бүтээгдэхүүний техникийн тодорхойлолт (үнэр, хэмжээ, өнгө гэх мэт)
                  </div>
                </div>
                </div>
            </div>

            {/* Images Section - Revolutionary Upload Experience */}
            <div className="premium-card form-section-card image-upload-card">
              <div className="card-header">
                <div className="card-icon">
                  <i className="icon-image" />
                </div>
                <div className="card-title-group">
                  <h3 className="card-title">Зургийн галерей</h3>
                  <p className="card-subtitle">Таны бүтээгдэхүүний үзэсгэлэнт зургуудыг байршуулна уу</p>
                </div>
                <div className="upload-progress-ring">
                  <div className="progress-circle">
                    <span className="progress-text">{previewImages.length}</span>
                  </div>
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="images"
                render={({ field }) => (
                  <FormItem className="premium-form-item">
                    <FormControl>
                      <ImageUploadField
                        value={field.value || []}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        disabled={isPending}
                        maxFiles={10}
                        maxFileSize={5 * 1024 * 1024} // 5MB
                        acceptedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
                        folder="products"
                        type="products"
                        autoUpload={true} // Enable auto-upload to Cloudinary
                        showProgress={true}
                        onUploadComplete={handleUploadComplete}
                        onUploadError={handleUploadError}
                        onPrimaryChange={handlePrimaryImageChange}
                        className="premium-image-upload"
                      />
                    </FormControl>
                    
                    <FormMessage className="premium-error" />
                    
                    {/* Enhanced Upload Tips */}
                    <div className="upload-tips">
                      <div className="tips-content">
                        <i className="icon-lightbulb" />
                        <div className="tips-text">
                          <strong>Зөвлөмж:</strong> Эхний зураг нь үндсэн зураг болно. Зургийн чанар сайн байх тусам илүү олон худалдан авагчийг татна.
                        </div>
                      </div>
                      
                      {/* Upload Progress Indicator */}
                      {imageUploadProgress > 0 && (
                        <div className="upload-progress-info">
                          <div className="progress-bar-wrapper">
                            <div className="progress-label">
                              <i className="icon-upload" />
                              <span>Зураг байршуулж байна... {imageUploadProgress}%</span>
                            </div>
                            <div className="progress-bar">
                              <div 
                                className="progress-fill"
                                style={{ width: `${imageUploadProgress}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Upload Errors */}
                      {imageUploadErrors.length > 0 && (
                        <div className="upload-errors">
                          {imageUploadErrors.map((error, index) => (
                            <div key={index} className="error-item">
                              <i className="icon-alert-triangle" />
                              <span>{error}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Tags Section - Delightful Selection Experience */}
            <div className="premium-card form-section-card tags-card">
              <div className="card-header">
                <div className="card-icon">
                  <i className="icon-tag" />
                </div>
                <div className="card-title-group">
                  <h3 className="card-title">Шошго ба ангилал</h3>
                  <p className="card-subtitle">Бүтээгдэхүүнээ олдохуйц болгохын тулд холбогдох шошгуудыг нэмнэ үү</p>
                </div>
                <div className="tags-counter">
                  <span className="counter-badge">{selectedTags.length}</span>
                </div>
              </div>
              
                <FormField
                  control={form.control}
                  name="tagsCsv"
                  render={() => (
                    <FormItem className="premium-form-item">
                      <div className="tags-management-area">
                        {/* Selected Tags Display */}
                        <div className="selected-tags-area">
                          <div className="selected-tags-header">
                            <span className="tags-label">Сонгосон шошгууд</span>
                            {selectedTags.length > 0 && (
                              <button
                                type="button"
                                className="clear-all-btn"
                                onClick={() => setSelectedTags([])}
                              >
                                <i className="icon-x-circle" />
                                Бүгдийг арилгах
                              </button>
                            )}
                          </div>
                          
                          <div className="tags-display">
                            {selectedTags.length > 0 ? (
                              <div className="tags-grid">
                                {selectedTags.map((tag, index) => (
                                  <div
                                    key={tag}
                                    className="premium-tag"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                  >
                                    <span className="tag-text">{tag}</span>
                                    <button
                                      type="button"
                                      className="tag-remove"
                                      onClick={() => toggleTag(tag)}
                                      title="Хасах"
                                    >
                                      <i className="icon-x" />
                                    </button>
                                    <div className="tag-glow"></div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="empty-tags-state">
                                <div className="empty-icon">
                                  <i className="icon-tag" />
                                </div>
                                <p className="empty-text">Одоогоор сонгосон шошго алга байна</p>
                                <p className="empty-subtext">Доорх товчлуурыг дарж шошго нэмнэ үү</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Add Tags Actions */}
                        <div className="tags-actions">
                          <Button
                            type="button"
                            className="add-tags-btn"
                            onClick={() => setTagDialogOpen(true)}
                          >
                            <div className="btn-content">
                              <i className="icon-plus" />
                              <span>Шошго нэмэх</span>
                            </div>
                            <div className="btn-glow"></div>
                          </Button>
                        </div>
                      </div>
                      
                      <FormMessage className="premium-error" />

                    {/* Premium Tag Selection Dialog */}
                    <CommandDialog 
                      open={tagDialogOpen} 
                      onOpenChange={setTagDialogOpen}
                      className="premium-dialog"
                    >
                      {/* <div className="dialog-header">
                        <h3>Шошго сонгох</h3>
                        <p>Бүтээгдэхүүндээ тохирох шошгуудыг сонгоно уу</p>
                      </div> */}
                      <CommandInput 
                        placeholder="Шошго хайж олох..." 
                        className="premium-search"
                      />
                      <CommandList className="premium-command-list">
                        <CommandEmpty className="empty-state">
                          <i className="icon-search" />
                          <p>Таны хайлтанд тохирох шошго олдсонгүй</p>
                        </CommandEmpty>
                        {sortedTypes.map((t) => (
                          <CommandGroup key={t} heading={typeLabel(t)} className="premium-command-group">
                            {tagPresets
                            .filter(p => String(p.type || "").toLowerCase() === String(t).toLowerCase())
                              .map((p) => {
                                const active = selectedTags.includes(p.name);
                                return (
                                  <CommandItem
                                    key={p.id}
                                    onSelect={() => toggleTag(p.name)}
                                    className={`premium-command-item ${active ? 'active' : ''}`}
                                  >
                                    <div className="item-content">
                                      <span className="item-text">{p.name}</span>
                                      <div className="item-indicator">
                                        {active && <i className="icon-check" />}
                                      </div>
                                    </div>
                                    <div className="item-hover-effect"></div>
                                  </CommandItem>
                                );
                              })}
                          </CommandGroup>
                        ))}
                      </CommandList>
                    </CommandDialog>
                    </FormItem>
                  )}
                  />
                </div>

            {/* Product Mode Selection - Premium Toggle */}
              <div className="premium-card form-section-card product-mode-card">
                <div className="card-header">
                  <div className="card-icon">
                    <i className="icon-layers" />
                  </div>
                  <div className="card-title-group">
                    <h3 className="card-title">Барааны төрөл</h3>
                    <p className="card-subtitle">Таны бүтээгдэхүүний үнэ болон вариантын тохиргоо</p>
                  </div>
                </div>
                
                <div className="product-mode-selection">
                  <div className="mode-toggle-container">
                    <div className="mode-options">
                      <div 
                        className={`mode-option ${productMode === "simple" ? "active" : ""}`}
                        onClick={() => setProductMode("simple")}
                      >
                        <div className="option-content">
                          <div className="option-icon">
                            <i className="icon-package" />
                          </div>
                          <div className="option-info">
                            <h4 className="option-title">Энгийн бараа</h4>
                            <p className="option-description">Ганц үнэ, тоо ширхэгтэй</p>
                          </div>
                        </div>
                        <div className="option-radio">
                          <div className="radio-dot"></div>
                        </div>
                        <div className="option-glow"></div>
                      </div>
                      
                      <div 
                        className={`mode-option ${productMode === "variants" ? "active" : ""}`}
                        onClick={() => setProductMode("variants")}
                      >
                        <div className="option-content">
                          <div className="option-icon">
                            <i className="icon-grid" />
                          </div>
                          <div className="option-info">
                            <h4 className="option-title">Вариант бүхий бараа</h4>
                            <p className="option-description">Өнгө, хэмжээ гэх мэт олон сонголт</p>
                          </div>
                        </div>
                        <div className="option-radio">
                          <div className="radio-dot"></div>
                        </div>
                        <div className="option-glow"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Dynamic Content Based on Selection */}
                  <div className="mode-explanation">
                    <div className={`explanation-panel ${productMode === "simple" ? "active" : ""}`}>
                      <div className="panel-content">
                        <div className="panel-icon">
                          <i className="icon-check-circle" />
                        </div>
                        <div className="panel-text">
                          <strong>Энгийн бараа:</strong> Ганц үнэ, тоо ширхэгтэй. Системд автоматаар үндсэн вариант үүсгэнэ.
                        </div>
                      </div>
                    </div>
                    
                    <div className={`explanation-panel ${productMode === "variants" ? "active" : ""}`}>
                      <div className="panel-content">
                        <div className="panel-icon">
                          <i className="icon-zap" />
                        </div>
                        <div className="panel-text">
                          <strong>Вариант бүхий бараа:</strong> Өнгө, хэмжээ, материал гэх мэт олон сонголттой. Вариант бүрийн үнэ, тоо ширхэг тусад нь тохируулна.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            </div>

            {/* Simple Product Fields - Premium Pricing */}
            {productMode === "simple" && (
              <div className="premium-card form-section-card pricing-card animate-slide-in">
                <div className="card-header">
                  <div className="card-icon">
                    <i className="icon-dollar-sign" />
                  </div>
                  <div className="card-title-group">
                    <h3 className="card-title">Үнэ болон тоо ширхэг</h3>
                    <p className="card-subtitle">Энгийн барааны үнэ болон агуулахын тоо ширхэг</p>
                  </div>
                  <div className="pricing-indicator">
                    <span className="indicator-label">Энгийн</span>
                  </div>
                </div>
                
                <div className="premium-pricing-grid pt-4 px-10">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem className="premium-form-item">
                          <FormLabel className="premium-label">
                            <span className="label-text">Үнэ</span>
                            <span className="label-required">*</span>
                            <div className="label-underline"></div>
                          </FormLabel>
                          <FormControl>
                            <div className="premium-input-wrapper currency-input">
                              <div className="input-icon">
                                <i className="icon-dollar-sign" />
                              </div>
                              <Input
                                className="premium-input"
                                placeholder="0.00"
                                type="number"
                                step="0.01"
                                min="0"
                                {...field}
                              />
                              <div className="currency-suffix">₮</div>
                              <div className="input-border-animation"></div>
                            </div>
                          </FormControl>
                          <FormMessage className="premium-error" />
                          <FormDescription className="premium-description">
                            <i className="icon-info-circle" />
                            Худалдан авагчдад харагдах үнэ
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  
                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem className="premium-form-item">
                            <FormLabel className="premium-label">
                              <span className="label-text">Тоо ширхэг</span>
                              <span className="label-required">*</span>
                              <div className="label-underline"></div>
                            </FormLabel>
                            <FormControl>
                              <div className="premium-input-wrapper quantity-input">
                                <div className="input-icon">
                                  <i className="icon-package" />
                                </div>
                                <Input
                                  className="premium-input"
                                  placeholder="0"
                                  type="number"
                                  min="0"
                                  {...field}
                                />
                                <div className="quantity-controls">
                                  <button
                                    type="button"
                                    className="quantity-btn"
                                    onClick={() => {
                                      const current = parseInt(field.value || "0");
                                      field.onChange(Math.max(0, current - 1).toString());
                                    }}
                                  >
                                    <i className="icon-minus" />
                                  </button>
                                  <button
                                    type="button"
                                    className="quantity-btn"
                                    onClick={() => {
                                      const current = parseInt(field.value || "0");
                                      field.onChange((current + 1).toString());
                                    }}
                                  >
                                    <i className="icon-plus" />
                                  </button>
                                </div>
                                <div className="input-border-animation"></div>
                              </div>
                            </FormControl>
                            <FormMessage className="premium-error" />
                            <FormDescription className="premium-description">
                              <i className="icon-info-circle" />
                              Агуулахад байгаа тоо хэмжээ
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* Pricing Summary */}
                    <div className="pricing-summary">
                      <div className="summary-content">
                        <div className="summary-item">
                          <span className="summary-label">Нэгж үнэ:</span>
                          <span className="summary-value">
                            {form.watch("price") ? `${form.watch("price")}₮` : "0₮"}
                          </span>
                        </div>
                        <div className="summary-item">
                          <span className="summary-label">Нийт тоо:</span>
                          <span className="summary-value">
                            {form.watch("quantity") || "0"} ширхэг
                          </span>
                        </div>
                        <div className="summary-divider"></div>
                        <div className="summary-item total">
                          <span className="summary-label">Нийт үнийн дүн:</span>
                          <span className="summary-value">
                            {(parseFloat(form.watch("price") || "0") * parseFloat(form.watch("quantity") || "0")).toLocaleString()}₮
                          </span>
                        </div>
                      </div>
                    </div>
              </div>
            )}

            {/* Variants Section - Visual Process */}
            {productMode === "variants" && (
              <div className="premium-card form-section-card variants-card animate-slide-in">
                <div className="card-header">
                  <div className="card-icon">
                    <i className="icon-grid" />
                  </div>
                  <div className="card-title-group">
                    <h3 className="card-title">Вариант бүтээх</h3>
                    <p className="card-subtitle">Өнгө, хэмжээ гэх мэт сонголтуудыг тохируулж вариантууд үүсгэнэ үү</p>
                  </div>
                  <div className="variants-progress">
                    <div className="progress-steps">
                      <div className={`step ${Object.keys(selectedAttributeOptions).length > 0 ? 'active' : ''}`}>1</div>
                      <div className="step-line"></div>
                      <div className={`step ${variants.length > 0 ? 'active' : ''}`}>2</div>
                    </div>
                  </div>
                </div>
                
                {loadingAttributes ? (
                  <div className="loading-state">
                    <div className="loading-spinner">
                      <div className="spinner-ring"></div>
                      <div className="spinner-ring"></div>
                      <div className="spinner-ring"></div>
                    </div>
                    <p className="loading-text">Аттрибутууд ачааллаж байна...</p>
                  </div>
                ) : attributes.length === 0 ? (
                  <div className="empty-attributes-state">
                    <div className="empty-icon">
                      <i className="icon-settings" />
                    </div>
                    <h4 className="empty-title">Аттрибут байхгүй байна</h4>
                    <p className="empty-description">Вариант үүсгэхийн тулд эхлээд аттрибут нэмэх хэрэгтэй.</p>
                    <Button className="add-attribute-btn" type="button">
                      <i className="icon-plus" />
                      Аттрибут нэмэх
                    </Button>
                  </div>
                ) : (
                  <div className="variants-creation-flow">
                    {/* Step 1: Attribute Selection */}
                    <div className="creation-step">
                      <div className="step-header">
                        <div className="step-number">1</div>
                        <div className="step-info">
                          <h4 className="step-title">Аттрибутууд сонгох</h4>
                          <p className="step-description">Барааны ялгаатай шинж чанаруудыг сонгоно уу</p>
                        </div>
                      </div>
                      
                      <div className="attributes-selection">
                        {attributes.map((attr) => (
                          <div key={attr.id} className="attribute-group">
                            <div className="attribute-header">
                              <div className="attribute-icon">
                                <i className="icon-layers" />
                              </div>
                              <h5 className="attribute-name">{attr.name}</h5>
                              <div className="selected-count">
                                {(selectedAttributeOptions[attr.id] || []).length} сонгосон
                              </div>
                            </div>
                            
                            <div className="attribute-options">
                              {attr.options.map((option) => {
                                const selected = (selectedAttributeOptions[attr.id] || []).includes(option.id);
                                return (
                                  <button
                                    key={option.id}
                                    type="button"
                                    className={`option-chip ${selected ? 'selected' : ''}`}
                                    onClick={() => toggleAttributeOption(attr.id, option.id)}
                                  >
                                    <span className="chip-text">{option.value}</span>
                                    <div className="chip-indicator">
                                      {selected && <i className="icon-check" />}
                                    </div>
                                    <div className="chip-glow"></div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {Object.keys(selectedAttributeOptions).length > 0 && (
                        <div className="generate-section">
                          <Button
                            type="button"
                            onClick={generateVariantCombinations}
                            className="generate-variants-btn"
                          >
                            <div className="btn-content">
                              <i className="icon-zap" />
                              <span>Үүсгэх</span>
                            </div>
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Step 2: Generated Variants */}
                    {variants.length > 0 && (
                      <div className="creation-step variants-step">
                        <div className="step-header">
                          <div className="step-number">2</div>
                          <div className="step-info">
                            <h4 className="step-title">Вариантуудыг тохируулах</h4>
                            <p className="step-description">Үүссэн {variants.length} вариантын үнэ болон тоо ширхэг оруулна уу</p>
                          </div>
                        </div>
                        
                        <div className="variants-grid">
                          {variants.map((variant, index) => (
                            <div key={index} className="variant-card">
                              <div className="variant-header">
                                <div className="variant-info">
                                  <div className="variant-number">#{index + 1}</div>
                                  <div className="variant-attributes">
                                    {variant.attributes.map(attr => {
                                      const attribute = attributes.find(a => a.id === attr.attributeId);
                                      const option = attribute?.options.find(o => o.id === attr.optionId);
                                      return (
                                        <span key={attr.attributeId} className="attribute-badge">
                                          {option?.value}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                                
                                <div className="variant-default-toggle">
                                  <label className="default-switch">
                                    <input
                                      type="radio"
                                      name="defaultVariant"
                                      checked={variant.isDefault}
                                      onChange={() => setDefaultVariant(index)}
                                    />
                                    <span className="switch-slider">
                                      <span className="switch-text">
                                        {variant.isDefault ? 'Үндсэн' : 'Үндсэн болгох'}
                                      </span>
                                    </span>
                                  </label>
                                </div>
                              </div>
                              
                              <div className="variant-fields">
                                <div className="variant-field">
                                  <label className="field-label">SKU</label>
                                  <div className="field-input-wrapper">
                                    <Input
                                      className="variant-input"
                                      value={variant.sku}
                                      onChange={(e) => updateVariant(index, "sku", e.target.value)}
                                      placeholder="SKU кодыг оруулна уу"
                                    />
                                  </div>
                                </div>
                                
                                <div className="variant-field">
                                  <label className="field-label">Үнэ</label>
                                  <div className="field-input-wrapper currency">
                                    <Input
                                      className="variant-input"
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={variant.price}
                                      onChange={(e) => updateVariant(index, "price", Number(e.target.value))}
                                      placeholder="0.00"
                                    />
                                    <span className="currency-symbol">₮</span>
                                  </div>
                                </div>
                                
                                <div className="variant-field">
                                  <label className="field-label">Тоо ширхэг</label>
                                  <div className="field-input-wrapper quantity">
                                    <Input
                                      className="variant-input"
                                      type="number"
                                      min="0"
                                      value={variant.inventory?.quantity || 0}
                                      onChange={(e) => updateVariant(index, "inventory", { quantity: Number(e.target.value) })}
                                      placeholder="0"
                                    />
                                    <div className="quantity-controls">
                                      <button
                                        type="button"
                                        className="quantity-btn"
                                        onClick={() => {
                                          const current = variant.inventory?.quantity || 0;
                                          updateVariant(index, "inventory", { quantity: Math.max(0, current - 1) });
                                        }}
                                      >
                                        <i className="icon-minus" />
                                      </button>
                                      <button
                                        type="button"
                                        className="quantity-btn"
                                        onClick={() => {
                                          const current = variant.inventory?.quantity || 0;
                                          updateVariant(index, "inventory", { quantity: current + 1 });
                                        }}
                                      >
                                        <i className="icon-plus" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Variant Images */}
                                <div className="variant-field variant-images-field">
                                  <label className="field-label">
                                    <i className="icon-image" />
                                    Зураг
                                  </label>
                                  
                                  {/* Existing Images */}
                                  {variant.images && variant.images.length > 0 && (
                                    <div className="variant-images-preview">
                                      {variant.images.map((imageObj, imgIndex) => (
                                        <div key={imgIndex} className="variant-image-item">
                                          <img
                                            src={imageObj.imageUrl || imageObj}
                                            alt={`Variant ${index + 1} image ${imgIndex + 1}`}
                                            className="variant-image"
                                          />
                                          <button
                                            type="button"
                                            className="remove-image-btn"
                                            onClick={() => removeVariantImage(index, imgIndex)}
                                            title="Зураг хасах"
                                          >
                                            <i className="icon-x" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {/* Upload Button */}
                                  <label className="variant-image-upload">
                                    <input
                                      type="file"
                                      className="upload-input"
                                      accept="image/*"
                                      multiple
                                      onChange={(e) => handleVariantImageUpload(index, e)}
                                    />
                                    <div className="upload-content">
                                      <i className="icon-plus" />
                                      <span>Зураг нэмэх</span>
                                    </div>
                                  </label>
                                </div>
                              </div>
                              
                              <div className="variant-summary">
                                <div className="summary-item">
                                  <span className="summary-label">Нийт дүн:</span>
                                  <span className="summary-value">
                                    {((variant.price || 0) * (variant.inventory?.quantity || 0)).toLocaleString()}₮
                                  </span>
                                </div>
                              </div>
                              
                              <div className="variant-border-glow"></div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Variants Summary */}
                        <div className="variants-summary">
                          <div className="summary-card">
                            <h5 className="summary-title">Вариантын хураангуй</h5>
                            <div className="summary-stats">
                              <div className="stat-item">
                                <span className="stat-label">Нийт вариант:</span>
                                <span className="stat-value">{variants.length}</span>
                              </div>
                              <div className="stat-item">
                                <span className="stat-label">Нийт тоо ширхэг:</span>
                                <span className="stat-value">
                                  {variants.reduce((sum, v) => sum + (v.inventory?.quantity || 0), 0)}
                                </span>
                              </div>
                              <div className="stat-item total">
                                <span className="stat-label">Нийт үнийн дүн:</span>
                                <span className="stat-value">
                                  {variants.reduce((sum, v) => sum + ((v.price || 0) * (v.inventory?.quantity || 0)), 0).toLocaleString()}₮
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    </div>
                )}
                  </div>
                )}

            {/* Advanced Features - Cinematic Expandable Panel */}
            <div className="premium-card form-section-card advanced-features-card">
              <div className="card-header expandable-header">
                <div className="card-icon">
                  <i className="icon-settings" />
                </div>
                <div className="card-title-group">
                  <h3 className="card-title">Нэмэлт тохиргоо</h3>
                  <p className="card-subtitle">Flash Sale, хямдрал, урамшуулал гэх мэт тусгай функцууд</p>
                </div>
                <button
                  type="button"
                  className="expand-toggle-btn"
                  onClick={() => setShowAdvancedFeatures(!showAdvancedFeatures)}
                >
                  <span className="toggle-text">
                    {showAdvancedFeatures ? "Нуух" : "Харуулах"}
                  </span>
                  <div className={`toggle-icon ${showAdvancedFeatures ? 'expanded' : ''}`}>
                    <i className="icon-chevron-down" />
                  </div>
                  <div className="toggle-glow"></div>
                </button>
              </div>
              
              <div className={`advanced-content ${showAdvancedFeatures ? 'expanded' : 'collapsed'}`}>
                <div className="advanced-features-grid">
                  {/* Flash Sale Section */}
                  <div className="feature-section flash-sale-section">
                    <FormField
                      control={form.control}
                      name="flashSale"
                      render={({ field }) => (
                        <FormItem className="premium-checkbox-item">
                          <div className="checkbox-wrapper">
                            <FormControl>
                              <label className="premium-checkbox">
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="checkbox-input"
                                />
                                <span className="checkbox-indicator">
                                  <i className="icon-check" />
                                </span>
                                <div className="checkbox-content">
                                  <span className="checkbox-label">Flash Sale идэвхжүүлэх</span>
                                  <span className="checkbox-description">Хязгаарлагдмал хугацаатай хямдралтай борлуулалт</span>
                                </div>
                              </label>
                            </FormControl>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <div className={`flash-sale-details ${form.watch("flashSale") ? 'active' : ''}`}>
                      {form.watch("flashSale") && (
                        <FormField
                          control={form.control}
                          name="flashSaleEndDate"
                          render={({ field }) => (
                            <FormItem className="premium-form-item">
                              <FormLabel className="premium-label">
                                <span className="label-text">Дуусах огноо</span>
                                <div className="label-underline"></div>
                              </FormLabel>
                              <FormControl>
                                <div className="premium-input-wrapper datetime-input">
                                  <div className="input-icon">
                                    <i className="icon-calendar" />
                                  </div>
                                  <Input
                                    className="premium-input"
                                    type="datetime-local"
                                    {...field}
                                  />
                                  <div className="input-border-animation"></div>
                                </div>
                              </FormControl>
                              <FormMessage className="premium-error" />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>
                  
                  {/* Discount and Promotion IDs */}
                  <div className="feature-section ids-section">
                    <h4 className="section-title">
                      <i className="icon-percent" />
                      Хямдрал & Урамшуулал
                    </h4>
                    
                    <div className="ids-grid">
                      <FormField
                        control={form.control}
                        name="discountId"
                        render={({ field }) => (
                          <FormItem className="premium-form-item">
                            <FormLabel className="premium-label">
                              <span className="label-text">Хямдрал ID</span>
                              <span className="label-optional">(заавал биш)</span>
                              <div className="label-underline"></div>
                            </FormLabel>
                            <FormControl>
                              <div className="premium-input-wrapper">
                                <div className="input-icon">
                                  <i className="icon-percent" />
                                </div>
                                <Input
                                  className="premium-input"
                                  type="number"
                                  placeholder="Хямдралын ID оруулна уу"
                                  {...field}
                                />
                                <div className="input-border-animation"></div>
                              </div>
                            </FormControl>
                            <FormMessage className="premium-error" />
                            <FormDescription className="premium-description">
                              <i className="icon-info-circle" />
                              Урьдчилан үүсгэсэн хямдралын ID
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="promotionId"
                        render={({ field }) => (
                          <FormItem className="premium-form-item">
                            <FormLabel className="premium-label">
                              <span className="label-text">Урамшуулал ID</span>
                              <span className="label-optional">(заавал биш)</span>
                              <div className="label-underline"></div>
                            </FormLabel>
                            <FormControl>
                              <div className="premium-input-wrapper">
                                <div className="input-icon">
                                  <i className="icon-gift" />
                                </div>
                                <Input
                                  className="premium-input"
                                  type="number"
                                  placeholder="Урамшууллын ID оруулна уу"
                                  {...field}
                                />
                                <div className="input-border-animation"></div>
                              </div>
                            </FormControl>
                            <FormMessage className="premium-error" />
                            <FormDescription className="premium-description">
                              <i className="icon-info-circle" />
                              Урьдчилан үүсгэсэн урамшууллын ID
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Section - Confidence & Celebration */}
            <div className="premium-card form-section-card submit-card">
              <div className="submit-content">
                {/* Status Messages */}
                <div className="status-messages">
                  {error && (
                    <div className="status-message error-message">
                      <div className="message-icon">
                        <i className="icon-alert-circle" />
                      </div>
                      <div className="message-content">
                        <h4 className="message-title">Алдаа гарлаа</h4>
                        <p className="message-text">{error}</p>
                      </div>
                      <button
                        type="button"
                        className="message-close"
                        onClick={() => setError("")}
                      >
                        <i className="icon-x" />
                      </button>
                      <div className="message-progress"></div>
                    </div>
                  )}
                  
                  {success && (
                    <div className="status-message success-message">
                      <div className="message-icon">
                        <i className="icon-check-circle" />
                      </div>
                      <div className="message-content">
                        <h4 className="message-title">Амжилттай!</h4>
                        <p className="message-text">{success}</p>
                      </div>
                      <div className="success-celebration">
                        <div className="celebration-particle"></div>
                        <div className="celebration-particle"></div>
                        <div className="celebration-particle"></div>
                      </div>
                      <div className="message-progress success"></div>
                    </div>
                  )}
                </div>
                
                {/* Submission Actions */}
                <div className="submit-actions">
                  <div className="submit-info">
                    <div className="info-stats">
                      <div className="stat">
                        <span className="stat-label">Алхам:</span>
                        <span className="stat-value">
                          {productMode === "simple" ? "4/4" : variants.length > 0 ? "5/5" : "4/5"}
                        </span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Төрөл:</span>
                        <span className="stat-value">
                          {productMode === "simple" ? "Энгийн" : "Вариант"}
                        </span>
                      </div>
                      {productMode === "variants" && variants.length > 0 && (
                        <div className="stat">
                          <span className="stat-label">Вариант:</span>
                          <span className="stat-value">{variants.length}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isPending}

                    className={`premium-submit-btn ${isPending ? 'submitting' : ''} ${success ? 'success' : ''}`}
                  >
                    <div className="btn-background"></div>
                    <div className="btn-content">
                      <div className="btn-icon">
                        {isPending ? (
                          <div className="loading-spinner-sm">
                            <div className="spinner-ring-sm"></div>
                          </div>
                        ) : success ? (
                          <i className="icon-check" />
                        ) : (
                          <i className="icon-plus" />
                        )}
                      </div>
                      <span className="btn-text">
                        {isPending ? "Нэмж байна..." : success ? "Нэмэгдлээ!" : "Бараа нэмэх"}
                      </span>
                    </div>
                    <div className="btn-glow"></div>
                    <div className="btn-ripple"></div>
                  </button>
                </div>
                
                {/* Form Progress Indicator */}
                <div className="form-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${
                          productMode === "simple" ? 
                            (form.formState.isValid ? 100 : 75) : 
                            (variants.length > 0 && form.formState.isValid ? 100 : 80)
                        }%` 
                      }}
                    ></div>
                  </div>
                  <div className="progress-text">
                    {form.formState.isValid ? 
                      (productMode === "variants" && variants.length === 0 ? 
                        "Вариант үүсгэнэ үү" : "Бэлэн болсон") 
                      : "Талбаруудыг бөглөнө үү"}
                  </div>
                </div>
              </div>
            </div>
            </div>
          </form>
        </Form>
      </Layout>
  );
}