"use client";

import "./premium-product-form.css";
import "../../../components/customui/CategorySelector.css";
import { editProductsSchema } from "@/schemas/productSchema";
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
import { getProductById, updateProduct } from "@/lib/api/products";
import { getTagPresets, getTags } from "@/lib/api/tags";
import { getTagGroups, replaceProductHierarchicalTags, getProductHierarchicalTags } from "@/lib/api/hierarchicalTags";
import { getBrandsClient } from "@/lib/api/brands";
import { getAttributes } from "@/lib/api/attributes";
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
import toastManager from "@/lib/toast";

/**
 * EditProductComponent - Premium UI matching AddProductComponent design exactly with pre-filled data
 */
export default function EditProductComponent({ id }) {
  // State management
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [tagPresets, setTagPresets] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  // Hierarchical tags state
  const [tagGroups, setTagGroups] = useState([]);
  const [selectedHierarchicalTags, setSelectedHierarchicalTags] = useState(new Set());
  const [hierarchicalTagsDialogOpen, setHierarchicalTagsDialogOpen] = useState(false);
  const [loadingTagGroups, setLoadingTagGroups] = useState(true);
  const [attributes, setAttributes] = useState([]);
  const [loadingAttributes, setLoadingAttributes] = useState(true);
  
  // Product mode: "simple" or "variants"
  const [productMode, setProductMode] = useState("simple");
  
  // Image preview handling - same as AddProductComponent
  const [previewImages, setPreviewImages] = useState([]);
  
  // Enhanced image upload state - exact match to AddProductComponent
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [imageUploadErrors, setImageUploadErrors] = useState([]);
  const [existingImages, setExistingImages] = useState([]); // {id, url}
  const [removeImageIds, setRemoveImageIds] = useState([]);
  
  // Variant management
  const [variants, setVariants] = useState([]);
  const [selectedAttributeOptions, setSelectedAttributeOptions] = useState({});
  
  // Product specifications state
  const [productSpecs, setProductSpecs] = useState([]);
  
  // Advanced features toggle
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);
  
  const TOKEN = GetToken();
  const VENDOR_ID_STATIC = 1;

  // Form setup with pre-filled values
  const form = useForm({
    resolver: zodResolver(editProductsSchema),
    defaultValues: {
      name: "",
      description: "",
      howToUse: "",
      ingredients: "",
      sku: "",
      categoryId: "",
      categoryIds: [],
      vendorId: VENDOR_ID_STATIC?.toString() || "1",
      brandId: "",
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

  // Load initial data and product data for editing
  useEffect(() => {
    async function loadInitialData() {
      if (!TOKEN || !id) return;
      
      try {
        const [categoriesData, tagPresetsData, tagGroupsData, attributesData, brandsData, productData] = await Promise.all([
          getCategoriesClient(TOKEN, true),
          getTagPresets(),
          getTagGroups(),
          getAttributes(),
          getBrandsClient(TOKEN),
          getProductById(id, TOKEN), // Load the product to edit
        ]);
        
        setCategories(categoriesData);
        setTagPresets(tagPresetsData);
        setTagGroups(tagGroupsData);
        setAttributes(attributesData.filter(attr => 
          Array.isArray(attr.options) && attr.options.length > 0
        ));
        setBrands(brandsData);

        // Pre-fill form with existing product data
        if (productData) {
          // Set basic product information
          form.setValue("name", productData.name || "");
          form.setValue("description", productData.description || "");
          form.setValue("howToUse", productData.howToUse || "");
          form.setValue("ingredients", productData.ingredients || "");
          form.setValue("sku", productData.sku || "");
          form.setValue("brandId", productData.brandId?.toString() || "");
          
          // Set categories
          if (productData.categories && productData.categories.length > 0) {
            const categoryIds = productData.categories.map(cat => cat.id);
            setSelectedCategoryIds(categoryIds);
            form.setValue("categoryIds", categoryIds);
          }

          // Set tags
          if (productData.tags) {
            const tagNames = productData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
            setSelectedTags(tagNames);
            form.setValue("tagsCsv", productData.tags);
          }

          // Load and set hierarchical tags
          try {
            const hierarchicalTagsData = await getProductHierarchicalTags(id);
            if (hierarchicalTagsData && hierarchicalTagsData.length > 0) {
              const selectedHierarchicalTagIds = new Set(
                hierarchicalTagsData.map(tag => tag.hierarchicalTagOptionId)
              );
              setSelectedHierarchicalTags(selectedHierarchicalTagIds);
            }
          } catch (error) {
            console.error("Failed to load hierarchical tags:", error);
          }

          // Set existing images
          if (productData.images && productData.images.length > 0) {
            setExistingImages(productData.images.map(img => ({
              id: img.id,
              url: img.imageUrl,
              isPrimary: img.isPrimary
            })));
            setPreviewImages(productData.images);
            form.setValue("images", productData.images.map(img => img.imageUrl));
          }

          // Set product specs
          if (productData.specifications && Array.isArray(productData.specifications)) {
            setProductSpecs(productData.specifications);
          }

          // Determine product mode and set pricing data
          if (productData.variants && productData.variants.length > 1) {
            setProductMode("variants");
            setVariants(productData.variants.map(variant => ({
              id: variant.id,
              sku: variant.sku || "",
              price: variant.price?.toString() || "",
              inventory: { quantity: variant.inventory?.quantity || 0 },
              attributes: variant.attributes || [],
              images: variant.images || [],
              isDefault: variant.isDefault || false
            })));
          } else if (productData.variants && productData.variants.length === 1) {
            setProductMode("simple");
            const mainVariant = productData.variants[0];
            form.setValue("price", mainVariant.price?.toString() || "");
            form.setValue("quantity", mainVariant.inventory?.quantity?.toString() || "");
          }

          // Set advanced features
          if (productData.flashSale || productData.discountId || productData.promotionId) {
            setShowAdvancedFeatures(true);
            form.setValue("flashSale", productData.flashSale || false);
            form.setValue("flashSaleEndDate", productData.flashSaleEndDate || "");
            form.setValue("discountId", productData.discountId?.toString() || "");
            form.setValue("promotionId", productData.promotionId?.toString() || "");
          }
        }
        
      } catch (error) {
        console.error("Failed to load initial data:", error);
        setError("Өгөгдөл ачаалахад алдаа гарлаа");
      } finally {
        setLoadingCategories(false);
        setLoadingAttributes(false);
        setLoadingBrands(false);
        setLoadingTagGroups(false);
        setLoading(false);
      }
    }

    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, TOKEN]);

  // Tag management helpers - exact match to AddProductComponent
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
      const newTags = exists ? prev.filter(t => t !== tagName) : [...prev, tagName];
      form.setValue("tagsCsv", newTags.join(", "));
      return newTags;
    });
  }, [form]);

  // Category management helpers - exact match to AddProductComponent
  const toggleCategory = useCallback((categoryId) => {
    setSelectedCategoryIds(prev => {
      const exists = prev.includes(categoryId);
      const newIds = exists 
        ? prev.filter(id => id !== categoryId) 
        : [...prev, categoryId];
      form.setValue("categoryIds", newIds);
      return newIds;
    });
  }, [form]);

  const clearAllCategories = useCallback(() => {
    setSelectedCategoryIds([]);
    form.setValue("categoryIds", []);
  }, [form]);

  // Hierarchical tags management helpers - exact match to AddProductComponent
  const toggleHierarchicalTag = useCallback((optionId) => {
    setSelectedHierarchicalTags(prev => {
      const newSet = new Set(prev);
      if (newSet.has(optionId)) {
        newSet.delete(optionId);
      } else {
        newSet.add(optionId);
      }
      return newSet;
    });
  }, []);

  const getSelectedHierarchicalTagsDisplay = () => {
    const result = [];
    selectedHierarchicalTags.forEach(optionId => {
      for (const group of tagGroups) {
        if (group.options) {
          const option = group.options.find(opt => opt.id === optionId);
          if (option) {
            result.push({
              id: optionId,
              name: option.name,
              groupName: group.name
            });
            break;
          }
        }
      }
    });
    return result;
  };

  // Image upload handlers - exact match to AddProductComponent
  const handleUploadComplete = useCallback((uploadedUrls) => {
    setUploadedImages(prev => [...prev, ...uploadedUrls]);
    setImageUploadProgress(0);
    setPreviewImages(prev => [...prev, ...uploadedUrls.map(url => ({ imageUrl: url }))]);
  }, []);

  const handleUploadError = useCallback((errors) => {
    setImageUploadErrors(prev => [...prev, ...errors]);
    setImageUploadProgress(0);
  }, []);

  const handlePrimaryImageChange = useCallback((primaryImageUrl) => {
    // Handle primary image selection
    console.log("Primary image changed:", primaryImageUrl);
  }, []);

  // Remove existing image
  const removeExistingImage = useCallback((imageId) => {
    setRemoveImageIds(prev => [...prev, imageId]);
    setExistingImages(prev => prev.filter(img => img.id !== imageId));
    setPreviewImages(prev => prev.filter(img => img.id !== imageId));
  }, []);

  // Attribute and variant management - exact match to AddProductComponent
  const toggleAttributeOption = useCallback((attributeId, optionId) => {
    setSelectedAttributeOptions(prev => {
      const current = prev[attributeId] || [];
      const exists = current.includes(optionId);
      
      return {
        ...prev,
        [attributeId]: exists
          ? current.filter(id => id !== optionId)
          : [...current, optionId]
      };
    });
  }, []);

  const generateVariantCombinations = useCallback(() => {
    const attributeIds = Object.keys(selectedAttributeOptions).filter(
      attrId => selectedAttributeOptions[attrId].length > 0
    );

    if (attributeIds.length === 0) return;

    const combinations = [[]];
    
    for (const attributeId of attributeIds) {
      const optionIds = selectedAttributeOptions[attributeId];
      const newCombinations = [];
      
      for (const combination of combinations) {
        for (const optionId of optionIds) {
          newCombinations.push([
            ...combination,
            { attributeId: parseInt(attributeId), optionId }
          ]);
        }
      }
      
      combinations.splice(0, combinations.length, ...newCombinations);
    }

    const newVariants = combinations.map((attributes, index) => ({
      id: Date.now() + index,
      sku: "",
      price: "",
      inventory: { quantity: 0 },
      attributes,
      images: [],
      isDefault: index === 0
    }));

    setVariants(newVariants);
  }, [selectedAttributeOptions]);

  const updateVariant = useCallback((index, field, value) => {
    setVariants(prev => {
      const newVariants = [...prev];
      if (field === "inventory") {
        newVariants[index] = {
          ...newVariants[index],
          inventory: { ...newVariants[index].inventory, ...value }
        };
      } else {
        newVariants[index] = { ...newVariants[index], [field]: value };
      }
      return newVariants;
    });
  }, []);

  const setDefaultVariant = useCallback((index) => {
    setVariants(prev => 
      prev.map((variant, i) => ({
        ...variant,
        isDefault: i === index
      }))
    );
  }, []);

  // Product specifications management - exact match to AddProductComponent
  const addProductSpec = useCallback(() => {
    setProductSpecs(prev => [...prev, { type: "", value: "" }]);
  }, []);

  const updateProductSpec = useCallback((index, field, value) => {
    setProductSpecs(prev => {
      const newSpecs = [...prev];
      newSpecs[index] = { ...newSpecs[index], [field]: value };
      return newSpecs;
    });
  }, []);

  const removeProductSpec = useCallback((index) => {
    setProductSpecs(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Variant image upload handlers - exact match to AddProductComponent
  const handleVariantImageUpload = useCallback(async (variantIndex, event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Handle variant image upload
    // Implementation would be similar to main image upload
    console.log("Variant image upload:", variantIndex, files);
  }, []);

  const removeVariantImage = useCallback((variantIndex, imageIndex) => {
    setVariants(prev => {
      const newVariants = [...prev];
      newVariants[variantIndex] = {
        ...newVariants[variantIndex],
        images: newVariants[variantIndex].images.filter((_, i) => i !== imageIndex)
      };
      return newVariants;
    });
  }, []);

  // Form submission - modified for editing
  const onSubmit = async (values) => {
    console.log("=== FORM SUBMISSION STARTED (EDIT) ===");
    console.log("Form values:", values);
    console.log("Product mode:", productMode);
    
    if (!TOKEN) {
      setError("Та нэвтрэх хэрэгтэй");
      return;
    }

    startTransition(async () => {
      try {
        setError("");
        setSuccess("");

        // Build payload for update
        const payload = {
          name: values.name,
          description: values.description,
          howToUse: values.howToUse || "",
          ingredients: values.ingredients || "",
          sku: values.sku,
          vendorId: parseInt(VENDOR_ID_STATIC),
          brandId: values.brandId ? parseInt(values.brandId) : null,
          categoryIds: selectedCategoryIds,
          tags: selectedTags.join(", "),
          specifications: productSpecs,
          // Remove images that were marked for removal
          removeImageIds: removeImageIds,
          // Add new images
          newImages: uploadedImages,
          // Advanced features
          flashSale: values.flashSale || false,
          flashSaleEndDate: values.flashSaleEndDate || null,
          discountId: values.discountId ? parseInt(values.discountId) : null,
          promotionId: values.promotionId ? parseInt(values.promotionId) : null,
        };

        // Add variants or simple product data
        if (productMode === "simple") {
          payload.variants = [{
            sku: values.sku,
            price: parseFloat(values.price),
            inventory: { quantity: parseInt(values.quantity) },
            isDefault: true
          }];
        } else {
          payload.variants = variants;
        }

        console.log("Update payload:", payload);
        
        // Update the product
        const result = await updateProduct(id, payload, TOKEN);
        console.log("Update result:", result);

        // Update hierarchical tags
        if (selectedHierarchicalTags.size > 0) {
          await replaceProductHierarchicalTags(id, Array.from(selectedHierarchicalTags));
        }

        setSuccess("Бараа амжилттай засварлагдлаа!");
        toastManager.success("Бараа амжилттай засварлагдлаа!");
        
        // Reset some states
        setUploadedImages([]);
        setRemoveImageIds([]);
        
      } catch (error) {
        console.error("Product update failed:", error);
        const errorMessage = error.response?.data?.message || error.message || "Алдаа гарлаа. Дахин оролдоно уу.";
        setError(errorMessage);
        toastManager.error(errorMessage);
      }
    });
  };

  // Loading state - same as original
  if (loading) return (
    <Layout
      breadcrumbTitleParent="Бараа"
      breadcrumbTitle="Бараа засах"
      pageTitle="Бараа засах"
    >
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <p className="loading-text">Бараа ачааллаж байна...</p>
      </div>
    </Layout>
  );

  return (
      <Layout
        breadcrumbTitleParent="Бараа"
        breadcrumbTitle="Бараа засах"
        pageTitle="Бараа засах"
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
                    <p className="card-subtitle">Бүтээгдэхүүний үндсэн мэдээллийг засварлана уу</p>
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
                    name="brandId"
                    render={({ field }) => (
                      <FormItem className="premium-form-item">
                        <FormLabel className="premium-label">
                          <span className="label-text">Брэнд</span>
                          <span className="label-optional">Заавал биш</span>
                          <div className="label-underline"></div>
                        </FormLabel>
                        <FormControl>
                          <div className="premium-select-wrapper">
                            <div className="input-icon">
                              <i className="icon-tag" />
                            </div>
                            <select
                              className="premium-select"
                              {...field}
                              disabled={loadingBrands}
                            >
                              <option value="">Брэнд сонгох</option>
                              {brands.map((brand) => (
                                <option key={brand.id} value={brand.id}>
                                  {brand.name}
                                </option>
                              ))}
                            </select>
                            <div className="select-chevron">
                              <i className="icon-chevron-down" />
                            </div>
                            <div className="input-border-animation"></div>
                          </div>
                        </FormControl>
                        <FormMessage className="premium-error" />
                        <FormDescription className="premium-description">
                          <i className="icon-info-circle" />
                          Бүтээгдэхүүний брэнд сонгох
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
                    {productSpecs.map((spec, index) => {
                      // Check if this type is duplicated
                      const isDuplicate = productSpecs.filter((s, i) => 
                        i !== index && s.type.trim() && s.type.trim() === spec.type.trim()
                      ).length > 0;
                      
                      return (
                      <div key={index} className="spec-row premium-form-row">
                        <div className="premium-form-col">
                          <div className={`premium-input-wrapper ${isDuplicate ? 'error' : ''}`}>
                            <div className="input-icon">
                              <i className="icon-tag" />
                            </div>
                            <Input
                              className={`premium-input ${isDuplicate ? 'error' : ''}`}
                              placeholder="Төрөл (жишээ: Үнэр)"
                              value={spec.type}
                              onChange={(e) => updateProductSpec(index, 'type', e.target.value)}
                            />
                            <div className="input-border-animation"></div>
                            {isDuplicate && (
                              <div className="input-error-indicator">
                                <i className="icon-alert-triangle" />
                              </div>
                            )}
                          </div>
                          {isDuplicate && (
                            <div className="spec-error-message">
                              Энэ төрөл давтагдаж байна
                            </div>
                          )}
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
                      );
                    })}
                    
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
                  <p className="card-subtitle">Таны бүтээгдэхүүний үзэсгэлэнт зургуудыг засварлана уу</p>
                </div>
                <div className="upload-progress-ring">
                  <div className="progress-circle">
                    <span className="progress-text">{existingImages.length + uploadedImages.length}</span>
                  </div>
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="images"
                render={({ field }) => (
                  <FormItem className="premium-form-item">
                    <FormControl>
                      <div>
                        {/* Existing Images Display */}
                        {existingImages.length > 0 && (
                          <div className="existing-images-section mb-6">
                            <h4 className="section-title mb-4">Одоо байгаа зургууд</h4>
                            <div className="existing-images-grid">
                              {existingImages.map((image) => (
                                <div className="existing-image-item" key={image.id}>
                                  <img src={require("@/lib/api/env").resolveImageUrl(image.url)} alt="existing" />
                                  <div className="image-overlay">
                                    <Button 
                                      type="button" 
                                      size="sm" 
                                      variant="destructive" 
                                      onClick={() => removeExistingImage(image.id)}
                                      className="remove-btn"
                                    >
                                      <i className="icon-trash" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
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
                          autoUpload={true}
                          showProgress={true}
                          onUploadComplete={handleUploadComplete}
                          onUploadError={handleUploadError}
                          onPrimaryChange={handlePrimaryImageChange}
                          className="premium-image-upload"
                        />
                      </div>
                    </FormControl>
                    
                    <FormMessage className="premium-error" />
                    
                    {/* Enhanced Upload Tips */}
                    <div className="upload-tips">
                      <div className="tips-content">
                        <i className="icon-lightbulb" />
                        <div className="tips-text">
                          <strong>Зөвлөмж:</strong> Шинэ зураг нэмэх буюу одоо байгаа зургийг солих боломжтой. Зургийн чанар сайн байх тусам илүү олон худалдан авагчийг татна.
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
                  <p className="card-subtitle">Бүтээгдэхүүнээ олдохуйц болгохын тулд холбогдох шошгуудыг засварлана уу</p>
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

            {/* Hierarchical Tags Section - New Structured Tags */}
            <div className="premium-card form-section-card hierarchical-tags-card" style={{ marginTop: 16 }}>
              <div className="card-header">
                <div className="card-icon">
                  <i className="icon-layers" />
                </div>
                <div className="card-title-group">
                  <h3 className="card-title">Бүтээгдэхүүний ангилал шошго</h3>
                  <p className="card-subtitle">Уруул, Нүд, Арьс гэх мэт ангиллаар шошго засварлана уу</p>
                </div>
                <div className="tags-counter">
                  <span className="counter-badge">{selectedHierarchicalTags.size}</span>
                </div>
              </div>
              
              <div className="hierarchical-tags-content">
                {/* Selected Hierarchical Tags Display */}
                <div className="selected-hierarchical-tags-area">
                  <div className="selected-tags-header">
                    <span className="tags-label">Сонгосон ангилал шошгууд</span>
                    {selectedHierarchicalTags.size > 0 && (
                      <button
                        type="button"
                        className="clear-all-btn"
                        onClick={() => setSelectedHierarchicalTags(new Set())}
                      >
                        <i className="icon-x-circle" />
                        Бүгдийг арилгах
                      </button>
                    )}
                  </div>
                  
                  <div className="hierarchical-tags-display">
                    {selectedHierarchicalTags.size > 0 ? (
                      <div className="hierarchical-tags-grid">
                        {getSelectedHierarchicalTagsDisplay().map((tagOption, index) => (
                          <div
                            key={tagOption.id}
                            className="premium-hierarchical-tag"
                            style={{ animationDelay: `${index * 0.1}s` }}
                          >
                            <span className="tag-group">{tagOption.groupName}</span>
                            <span className="tag-divider">:</span>
                            <span className="tag-text">{tagOption.name}</span>
                            <button
                              type="button"
                              className="tag-remove"
                              onClick={() => toggleHierarchicalTag(tagOption.id)}
                              title="Хасах"
                            >
                              <i className="icon-x" />
                            </button>
                            <div className="tag-glow"></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-hierarchical-tags-state">
                        <div className="empty-icon">
                          <i className="icon-layers" />
                        </div>
                        <p className="empty-text">Одоогоор сонгосон ангилал шошго алга байна</p>
                        <p className="empty-subtext">Доорх товчлуурыг дарж ангилал шошго нэмнэ үү</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Add Hierarchical Tags Actions */}
                <div className="hierarchical-tags-actions">
                  <Button
                    type="button"
                    className="add-hierarchical-tags-btn"
                    onClick={() => setHierarchicalTagsDialogOpen(true)}
                  >
                    <div className="btn-content">
                      <i className="icon-layers" />
                      <span>Ангилал шошго нэмэх</span>
                    </div>
                    <div className="btn-glow"></div>
                  </Button>
                </div>

                {/* Hierarchical Tags Selection Dialog */}
                <CommandDialog 
                  open={hierarchicalTagsDialogOpen} 
                  onOpenChange={setHierarchicalTagsDialogOpen}
                  className="premium-dialog hierarchical-tags-dialog"
                >
                  <CommandInput 
                    placeholder="Ангилал шошго хайж олох..." 
                    className="premium-search"
                  />
                  <CommandList className="premium-command-list">
                    <CommandEmpty className="empty-state">
                      <i className="icon-search" />
                      <p>Таны хайлтанд тохирох ангилал шошго олдсонгүй</p>
                    </CommandEmpty>
                    {loadingTagGroups ? (
                      <div className="loading-state">
                        <i className="icon-loader" />
                        <p>Ачааллаж байна...</p>
                      </div>
                    ) : (
                      tagGroups.map((group) => (
                        <CommandGroup key={group.id} heading={group.name} className="premium-command-group">
                          {group.options && group.options.length > 0 ? (
                            group.options.map((option) => {
                              const active = selectedHierarchicalTags.has(option.id);
                              return (
                                <CommandItem
                                  key={option.id}
                                  onSelect={() => toggleHierarchicalTag(option.id)}
                                  className={`premium-command-item ${active ? 'active' : ''}`}
                                >
                                  <div className="item-content">
                                    <span className="item-text">{option.name}</span>
                                    <div className="item-indicator">
                                      {active && <i className="icon-check" />}
                                    </div>
                                  </div>
                                  <div className="item-hover-effect"></div>
                                </CommandItem>
                              );
                            })
                          ) : (
                            <div className="empty-group-state">
                              <p>Энэ ангилалд сонголт алга байна</p>
                            </div>
                          )}
                        </CommandGroup>
                      ))
                    )}
                  </CommandList>
                </CommandDialog>
              </div>
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
                    <h3 className="card-title">Вариант засварлах</h3>
                    <p className="card-subtitle">Өнгө, хэмжээ гэх мэт сонголтуудыг тохируулж вариантууд засварлана уу</p>
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
                            <p className="step-description">Одоо байгаа {variants.length} вариантын үнэ болон тоо ширхэг засварлана уу</p>
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
                                      className="variant-input text-black color-black"
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
                                      value={variant.price || ''}
                                      onChange={(e) => updateVariant(index, "price", e.target.value)}
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
                                      value={variant.inventory?.quantity || ''}
                                      onChange={(e) => updateVariant(index, "inventory", { quantity: e.target.value })}
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
                          <i className="icon-edit" />
                        )}
                      </div>
                      <span className="btn-text">
                        {isPending ? "Засварлаж байна..." : success ? "Засварлагдлаа!" : "Бараа засварлах"}
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
                    Форм {
                      productMode === "simple" ? 
                        (form.formState.isValid ? "бүрэн" : "75%") : 
                        (variants.length > 0 && form.formState.isValid ? "бүрэн" : "80%")
                    } бөглөгдсөн
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
