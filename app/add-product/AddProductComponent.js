"use client";

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
  const [tagPresets, setTagPresets] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [attributes, setAttributes] = useState([]);
  const [loadingAttributes, setLoadingAttributes] = useState(true);
  
  // Product mode: "simple" or "variants"
  const [productMode, setProductMode] = useState("simple");
  
  // Image preview handling
  const [previewImages, setPreviewImages] = useState([]);
  
  // Variant management
  const [variants, setVariants] = useState([]);
  const [selectedAttributeOptions, setSelectedAttributeOptions] = useState({});
  
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
      sku: "",
      categoryId: "",
      vendorId: "",
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
          getCategoriesClient(TOKEN),
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

  // File upload handling
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

  // Build payload for submission
  const buildProductPayload = (formValues) => {
    console.log("Building payload with form values:", formValues);
    
    // Build base payload matching backend structure
    const payload = {
      sku: formValues.sku,
      name: formValues.name,
      description: formValues.description,
      categoryId: Number(formValues.categoryId),
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

    // Handle variants based on mode
    if (productMode === "variants" && variants.length > 0) {
      payload.variants = variants.map(variant => ({
        sku: variant.sku,
        price: Number(variant.price),
        isDefault: variant.isDefault,
        attributes: variant.attributes,
        inventory: variant.inventory,
        images: variant.images,
      }));
    } else if (productMode === "simple") {
      // For simple products, create explicit single variant
      if (formValues.price && formValues.quantity) {
        payload.variants = [{
          sku: `${formValues.sku}-DEFAULT`,
          price: Number(formValues.price),
          isDefault: true,
          attributes: [],
          inventory: { quantity: Number(formValues.quantity) },
          images: [],
        }];
      }
    }

    console.log("Built payload:", payload);
    console.log("Payload structure:");
    console.log("- Has price field:", 'price' in payload);
    console.log("- Has variants:", 'variants' in payload);
    console.log("- Variants count:", payload.variants?.length || 0);
    return payload;
  };

  // Form submission
  const onSubmit = async (values) => {
    console.log("=== FORM SUBMISSION STARTED ===");
    console.log("Form values:", values);
    console.log("Product mode:", productMode);
    console.log("Selected tags:", selectedTags);
    console.log("Variants:", variants);
    
    if (!TOKEN) {
      setError("Та нэвтрэх хэрэгтэй");
      return;
    }

    // Validation
    if (productMode === "variants") {
      if (variants.length === 0) {
        setError("Вариант үүсгэнэ үү");
          return;
        }

      const defaultCount = variants.filter(v => v.isDefault).length;
          if (defaultCount !== 1) {
            setError("Нэг үндсэн вариант сонгоно уу");
            return;
          }
      
      if (variants.some(v => !v.sku || !v.price)) {
        setError("Бүх вариантуудад SKU болон үнэ оруулна уу");
            return;
          }
    } else {
      if (!values.price || !values.quantity) {
        setError("Энгийн бараанд үнэ болон тоо ширхэг заавал оруулна уу");
            return;
          }
    }

    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        const payload = buildProductPayload(values);
        
        // Prepare request with file upload handling
        let finalPayload;
        let headers = {
          Authorization: `Bearer ${TOKEN}`,
        };

        // Handle file uploads with FormData
        if (values.images && values.images.length > 0) {
          const formData = new FormData();
          
          // Add JSON payload
          Object.keys(payload).forEach(key => {
            const value = payload[key];
            if (Array.isArray(value)) {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, String(value));
            }
          });
          
          // Add image files
          values.images.forEach((image) => {
            formData.append("images", image);
          });
          
          finalPayload = formData;
        } else {
          // JSON payload without files
          finalPayload = JSON.stringify(payload);
          headers["Content-Type"] = "application/json";
        }

        console.log("Sending request...");

        const response = await fetch(
          `${getBackendUrl()}/api/v1/products/createproduct`,
          {
            method: "POST",
            headers: headers,
            body: finalPayload,
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
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="tf-section-2 form-add-product">
            {/* Basic Product Information */}
              <div className="wg-box">
              <h3 className="body-title mb-4">Үндсэн мэдээлэл</h3>
              
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="body-title mb-10">
                        Бүтээгдэхүүний нэр <span className="tf-color-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Бүтээгдэхүүний нэр оруулна уу"
                          type="text"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                      <FormDescription>
                      20 тэмдэгтээс бага байх ёстой
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <div className="flex gap-10">
                  <div className="w-1/2">
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="body-title mb-5">
                          Бүтээгдэхүүний ангилал <span className="tf-color-1">*</span>
                          </FormLabel>
                          <FormControl>
                          <select {...field} disabled={loadingCategories}>
                              <option value="">
                              {loadingCategories ? "Ачааллаж байна..." : "Ангилал сонгоно уу"}
                              </option>
                              {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                <div className="w-1/2">
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="body-title mb-10">
                          SKU <span className="tf-color-1">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="SKU оруулна уу"
                            type="text"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="body-title mb-5">
                        Тайлбар <span className="tf-color-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          className="mb-10"
                          placeholder="Тайлбар оруулна уу"
                        rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>

            {/* Images Section - File Upload */}
            <div className="wg-box">
              <FormField
                control={form.control}
                name="images"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="body-title mb-5">
                      Зураг байршуулах <span className="tf-color-1">*</span>
                    </FormLabel>

                    <div className="upload-image mb-16">
                      {previewImages.map((imageSrc, index) => (
                        <div className="item" key={index}>
                          <img
                            src={imageSrc}
                            alt={`Upload preview ${index + 1}`}
                          />
                        </div>
                      ))}
                      <div className="item up-load">
                        <label className="uploadfile" htmlFor="myFile">
                          <span className="icon">
                            <i className="icon-upload-cloud" />
                          </span>
                          <span className="text-tiny">
                            Энд зураг чирж оруулна уу эсвэл{" "}
                            <span className="tf-color">дарж сонгох</span>
                          </span>
                          <FormControl>
                            <input
                              type="file"
                              id="myFile"
                              name="filename"
                              onChange={(e) =>
                                handleImageFilesSelected(e, field.onChange)
                              }
                              multiple
                              accept="image/*"
                            />
                          </FormControl>
                        </label>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tags Section */}
            <div className="wg-box">
              <h3 className="body-title mb-4">Шошгууд</h3>
              
                <FormField
                  control={form.control}
                  name="tagsCsv"
                  render={() => (
                    <FormItem>
                      <FormLabel className="body-title mb-5">
                        Бүтээгдэхүүний шошгууд
                      </FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-3">
                            {selectedTags.length ? (
                              selectedTags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="primary"
                                  className="rounded-full px-4 py-2 text-lg flex items-center gap-2"
                                >
                                  {tag}
                                  <span
                                    role="button"
                                    onClick={() => toggleTag(tag)}
                                  className="cursor-pointer"
                                  >
                                    <i className="icon-x" />
                                  </span>
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground">
                                Одоогоор сонгосон шошго алга
                              </span>
                            )}
                          </div>
                        
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setTagDialogOpen(true)}
                            >
                              <i className="icon-plus mr-1" /> Шошго нэмэх
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                            onClick={() => setSelectedTags([])}
                            >
                              Арилгах
                            </Button>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />

                    <CommandDialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
                        <CommandInput placeholder="Шошго хайх..." />
                        <CommandList>
                          <CommandEmpty>Шошго олдсонгүй</CommandEmpty>
                          {sortedTypes.map((t) => (
                            <CommandGroup key={t} heading={typeLabel(t)}>
                              {tagPresets
                              .filter(p => String(p.type || "").toLowerCase() === String(t).toLowerCase())
                                .map((p) => {
                                  const active = selectedTags.includes(p.name);
                                  return (
                                    <CommandItem
                                      key={p.id}
                                      onSelect={() => toggleTag(p.name)}
                                    >
                                      <span className="flex-1">{p.name}</span>
                                      {active && <i className="icon-check" />}
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

            {/* Product Mode Selection */}
              <div className="wg-box">
              <h3 className="body-title mb-4">Барааны төрөл</h3>
              
              <div className="space-y-4">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="productMode"
                      value="simple"
                      checked={productMode === "simple"}
                      onChange={(e) => setProductMode(e.target.value)}
                    />
                    <span>Энгийн бараа</span>
                  </label>
                  <label className="flex items-center gap-2">
                                <input
                      type="radio"
                      name="productMode"
                      value="variants"
                      checked={productMode === "variants"}
                      onChange={(e) => setProductMode(e.target.value)}
                    />
                    <span>Вариант бүхий бараа</span>
                            </label>
                          </div>
                
                <p className="text-sm text-gray-600">
                  {productMode === "simple" 
                    ? "Энгийн бараа: Ганц үнэ, тоо ширхэгтэй. Автоматаар үндсэн вариант үүсгэнэ."
                    : "Вариант бүхий бараа: Өнгө, хэмжээ гэх мэт олон сонголттой бараа."}
                </p>
                        </div>
            </div>

            {/* Simple Product Fields */}
            {productMode === "simple" && (
              <div className="wg-box">
                <h3 className="body-title mb-4">Үнэ болон тоо ширхэг</h3>
                
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="body-title mb-10">
                          Үнэ <span className="tf-color-1">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                            placeholder="Үнэ оруулна уу"
                              type="number"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  
                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="body-title mb-5">
                              Тоо ширхэг <span className="tf-color-1">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Тоо ширхэг оруулна уу"
                                type="number"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
              </div>
            )}

            {/* Variants Section */}
            {productMode === "variants" && (
              <div className="wg-box">
                <h3 className="body-title mb-4">Вариантууд</h3>
                
                {loadingAttributes ? (
                  <p>Ачааллаж байна...</p>
                ) : attributes.length === 0 ? (
                  <p className="text-gray-600">Сонголттой аттрибут алга. Эхлээд аттрибут нэмнэ үү.</p>
                ) : (
                  <div className="space-y-4">
                    {/* Attribute Selection */}
                      <div>
                      <h4 className="font-medium mb-3">Аттрибутууд сонгох</h4>
                      {attributes.map((attr) => (
                        <div key={attr.id} className="border p-4 rounded mb-4">
                          <h5 className="font-medium mb-2">{attr.name}</h5>
                          <div className="flex flex-wrap gap-2">
                            {attr.options.map((option) => {
                              const selected = (selectedAttributeOptions[attr.id] || []).includes(option.id);
                              return (
                                <Button
                                  key={option.id}
                        type="button"
                                  variant={selected ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => toggleAttributeOption(attr.id, option.id)}
                                >
                                  {option.value}
                                </Button>
                              );
                            })}
                    </div>
                        </div>
                      ))}
                      
                      <Button
                        type="button"
                        onClick={generateVariantCombinations}
                        className="w-full mb-4"
                      >
                        Вариантууд үүсгэх
                      </Button>
                            </div>

                    {/* Generated Variants */}
                    {variants.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">Үүссэн вариантууд ({variants.length})</h4>
                        <div className="space-y-4">
                          {variants.map((variant, index) => (
                            <div key={index} className="border p-4 rounded">
                              <div className="flex items-center gap-2 mb-2">
                                <input
                                  type="radio"
                                  name="defaultVariant"
                                  checked={variant.isDefault}
                                  onChange={() => setDefaultVariant(index)}
                                />
                                <label className="font-medium">Үндсэн вариант</label>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-sm font-medium mb-1">SKU</label>
                                  <Input
                                    value={variant.sku}
                                    onChange={(e) => updateVariant(index, "sku", e.target.value)}
                                />
                              </div>
                                
                                <div>
                                  <label className="block text-sm font-medium mb-1">Үнэ</label>
                                  <Input
                                  type="number"
                                    value={variant.price}
                                    onChange={(e) => updateVariant(index, "price", Number(e.target.value))}
                                />
                              </div>
                                
                                <div>
                                  <label className="block text-sm font-medium mb-1">Тоо ширхэг</label>
                                  <Input
                                    type="number"
                                    value={variant.inventory?.quantity || 0}
                                    onChange={(e) => updateVariant(index, "inventory", { quantity: Number(e.target.value) })}
                                  />
                                    </div>
                                </div>
                              
                              <div className="mt-2 text-sm text-gray-600">
                                Аттрибутууд: {variant.attributes.map(attr => {
                                  const attribute = attributes.find(a => a.id === attr.attributeId);
                                  const option = attribute?.options.find(o => o.id === attr.optionId);
                                  return `${attribute?.name}: ${option?.value}`;
                                }).join(", ")}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    </div>
                )}
                  </div>
                )}

            {/* Advanced Features (Collapsible) */}
            <div className="wg-box">
              <div className="flex items-center justify-between mb-4">
                <h3 className="body-title">Нэмэлт тохиргоо</h3>
                  <Button
                    type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedFeatures(!showAdvancedFeatures)}
                >
                  {showAdvancedFeatures ? "Нуух" : "Харуулах"}
                  <i className={`ml-1 icon-${showAdvancedFeatures ? 'minus' : 'plus'}`} />
                  </Button>
              </div>
              
              {showAdvancedFeatures && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="flashSale"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Flash Sale идэвхжүүлэх</FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("flashSale") && (
                    <FormField
                      control={form.control}
                      name="flashSaleEndDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Flash Sale дуусах огноо</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="discountId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Хямдрал ID (заавал биш)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Хямдралын ID"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="promotionId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Урамшуулал ID (заавал биш)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Урамшууллын ID"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Section */}
            <div className="wg-box">
              <div className="flex flex-col gap-4">
                {error && (
                  <div className="text-center text-destructive bg-red-50 p-3 rounded border border-red-200">
                    <p className="font-medium">Алдаа:</p>
                    <p>{error}</p>
                  </div>
                )}
                
                {success && (
                  <div className="text-center text-green-600 bg-green-50 p-3 rounded border border-green-200">
                    <p className="font-medium">Амжилттай:</p>
                    <p>{success}</p>
                  </div>
                )}
                
                  <Button
                    type="submit"
                    disabled={isPending}
                  className="w-full tf-button"
                  >
                    {isPending ? "Нэмж байна..." : "Бараа нэмэх"}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </Layout>
  );
}