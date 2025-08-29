"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { editProductsSchema } from "@/schemas/productSchema";
import { getCategoriesClient } from "@/lib/api/categories";
import { getProductById, updateProduct } from "@/lib/api/products";
import { getTagPresets, getTags } from "@/lib/api/tags";
import { getBrandsClient } from "@/lib/api/brands";
import Layout from "@/components/layout/Layout";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/customui/Input";
import LoadingButton from "@/components/customui/LoadingButton";
import GetToken from "@/lib/GetTokenClient";

export default function EditProductComponent({ id }) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [brands, setBrands] = useState([]);
  const [tagPresets, setTagPresets] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]); // {id, url}
  const [removeImageIds, setRemoveImageIds] = useState([]);
  const [productSpecs, setProductSpecs] = useState([]);
  const TOKEN = GetToken();

  const form = useForm({
    resolver: zodResolver(editProductsSchema),
    defaultValues: {
      name: "",
      description: "",
      howToUse: "",
      ingredients: "",
      price: "",
      categoryId: "",
      brandId: "",
      quantity: "",
      sku: "",
      images: [],
      tagsCsv: "",
    },
  });

  useEffect(() => {
    async function loadAll() {
      try {
        const [product, categoriesData, presets, tagResp, brandsData] = await Promise.all([
          getProductById(id, TOKEN),
          TOKEN ? getCategoriesClient(TOKEN, true) : Promise.resolve([]), // Get ALL categories for product editing
          getTagPresets(),
          getTags(id),
          getBrandsClient(TOKEN),
        ]);

        if (!product) throw new Error("Product not found");

        // Prefill form
        form.reset({
          name: product.name || "",
          description: product.description || "",
          howToUse: product.howToUse || "",
          ingredients: product.ingredients || "",
          price: String(product.price ?? ""),
          categoryId: String(product.categoryId || ""),
          categoryIds: product.categoryIds || [],
          brandId: String(product.brandId || ""),
          quantity: String(product.stock ?? ""),
          sku: product.sku || "",
          images: [],
          tagsCsv: (tagResp?.tags || []).map((t) => t.tag).join(","),
        });

        // Set selected categories from product data
        setSelectedCategoryIds(product.categoryIds || (product.categoryId ? [product.categoryId] : []));

        setExistingImages(product.images || []);
        setProductSpecs(product.specs || []);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setTagPresets(presets || []);
        setSelectedTags((tagResp?.tags || []).map((t) => t.tag));
        setBrands(brandsData || []);
      } catch (e) {
        console.error(e);
        setError("Өгөгдөл ачаалахад алдаа гарлаа");
      } finally {
        setLoading(false);
      }
    }
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, TOKEN]);

  function toggleTag(tagName) {
    setSelectedTags((prev) => {
      const exists = prev.includes(tagName);
      const next = exists ? prev.filter((t) => t !== tagName) : [...prev, tagName];
      return next;
    });
  }

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

  useEffect(() => {
    const csv = Array.from(new Set(selectedTags)).join(",");
    form.setValue("tagsCsv", csv, { shouldDirty: true, shouldTouch: true });
  }, [selectedTags, form]);

  const TYPE_LABELS = {
    Color: "Өнгө",
    Size: "Хэмжээ",
    Material: "Материал",
    Season: "Улирал",
    Style: "Загвар",
  };
  const typeLabel = (t) => TYPE_LABELS[t] || t || "Бусад";
  const typeOrder = ["Color", "Size", "Material", "Season", "Style"];
  const typesFromData = useMemo(() => Array.from(new Set((tagPresets || []).map((p) => String(p.type || "")).filter(Boolean))), [tagPresets]);
  const sortedTypes = useMemo(() => [
    ...typeOrder.filter((t) => typesFromData.includes(t)),
    ...typesFromData.filter((t) => !typeOrder.includes(t)),
  ], [typesFromData]);

  const handleFileChange = (event) => {
    try {
      const files = Array.from(event.target.files || []);
      const previews = [];
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewImages((prev) => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
        previews.push(file);
      });
      const existing = form.getValues("images") || [];
      form.setValue("images", [...existing, ...previews], { shouldDirty: true });
    } catch (e) {
      console.warn("image read error", e);
    }
  };

  const removeExistingImage = (imgId) => {
    setRemoveImageIds((prev) => Array.from(new Set([...(prev || []), imgId])));
    setExistingImages((prev) => prev.filter((i) => i.id !== imgId));
  };

  // No parent/child selection in edit; a single category dropdown is used

  async function onSubmit(values) {
    setError("");
    startTransition(async () => {
      try {
        const tagsCsv = values.tagsCsv || "";
        const tagList = tagsCsv
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        const res = await updateProduct(
          id,
          {
            name: values.name,
            description: values.description,
            howToUse: values.howToUse || "",
            ingredients: values.ingredients || "",
            specs: productSpecs.filter(spec => spec.type.trim() && spec.value.trim()),
            price: Number(values.price),
            categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : (values.categoryId ? [Number(values.categoryId)] : []),
            brandId: values.brandId ? Number(values.brandId) : null,
            sku: values.sku,
            quantity: Number(values.quantity),
            removeImageIds,
            images: values.images || [],
          },
          TOKEN
        );

        if (!res.success) {
          setError(res.message || "Алдаа гарлаа");
          return;
        }

        // Replace tags if changed
        if (tagList) {
          try {
            await fetch(`${require("@/lib/api/env").getBackendUrl()}/api/v1/tags/${id}` ,{
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${TOKEN}`,
              },
              body: JSON.stringify({ tags: tagList })
            });
          } catch (e) {
            console.warn('Failed to replace tags', e);
          }
        }

        setSuccess("Амжилттай шинэчлэгдлээ");
      } catch (e) {
        setError("Алдаа гарлаа");
      }
    });
  }

  if (loading) return <Layout breadcrumbTitleParent="Ecommerce" breadcrumbTitle="Edit product"><div className="wg-box">Loading...</div></Layout>;

  return (
    <Layout breadcrumbTitleParent="Ecommerce" breadcrumbTitle="Edit product">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="tf-section-2 form-add-product">
          <div className="wg-box">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="body-title mb-10">Бүтээгдэхүүний нэр <span className="tf-color-1">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Бүтээгдэхүүний нэр оруулна уу" type="text" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-10">
              <div className="w-1/2">
                <FormField
                  control={form.control}
                  name="categoryIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="body-title mb-5">Бүтээгдэхүүний ангилал</FormLabel>
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
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                      <FormDescription>
                        Бүтээгдэхүүнд олон ангилал оноож болно
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>
              <div className="w-1/2">
                <FormField
                  control={form.control}
                  name="brandId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="body-title mb-5">Брэнд</FormLabel>
                      <FormControl>
                        <div className="select">
                          <select {...field} className="tf-select">
                            <option value="">Брэнд сонгох</option>
                            {brands.map((brand) => (
                              <option key={brand.id} value={brand.id}>
                                {brand.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </FormControl>
                      <FormMessage />
                      <FormDescription>
                        Бүтээгдэхүүний брэнд (заавал биш)
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="w-1/2">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="body-title mb-5">Тоо ширхэг <span className="tf-color-1">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Тоо ширхэг оруулна уу" type="number" {...field} />
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
                  <FormLabel className="body-title mb-5">Тайлбар <span className="tf-color-1">*</span></FormLabel>
                  <FormControl>
                    <textarea {...field} className="mb-10" placeholder="Тайлбар оруулна уу" />
                  </FormControl>
                  <FormMessage />

                  <CommandDialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
                    <CommandInput placeholder="Шошго хайх..." />
                    <CommandList>
                      <CommandEmpty>Шошго олдсонгүй</CommandEmpty>
                      {sortedTypes.map((t) => (
                        <CommandGroup key={t} heading={typeLabel(t)}>
                          {(tagPresets || [])
                            .filter((p) => String(p.type || "").toLowerCase() === String(t).toLowerCase())
                            .map((p) => {
                              const active = selectedTags.includes(p.name);
                              return (
                                <CommandItem key={p.id} onSelect={() => toggleTag(p.name)} data-selected={active}>
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

            {/* How to Use Field */}
            <FormField
              control={form.control}
              name="howToUse"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="body-title mb-5">Хэрэглэх арга</FormLabel>
                  <FormControl>
                    <textarea {...field} className="mb-10" placeholder="Хэрэглэх арга талаар тайлбар..." rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Ingredients Field */}
            <FormField
              control={form.control}
              name="ingredients"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="body-title mb-5">Найрлага</FormLabel>
                  <FormControl>
                    <textarea {...field} className="mb-10" placeholder="Бүтээгдэхүүний найрлага..." rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Product Specifications */}
            <div className="mb-24">
              <FormLabel className="body-title mb-5">Техникийн тодорхойлолт</FormLabel>
              <div className="specs-container">
                {productSpecs.map((spec, index) => (
                  <div key={index} className="flex gap-4 items-end mb-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <FormLabel className="mb-2">Төрөл</FormLabel>
                      <Input
                        placeholder="жишээ: Үнэр"
                        value={spec.type}
                        onChange={(e) => updateProductSpec(index, 'type', e.target.value)}
                      />
                    </div>
                    <div className="flex-1">
                      <FormLabel className="mb-2">Утга</FormLabel>
                      <Input
                        placeholder="жишээ: Лаванда"
                        value={spec.value}
                        onChange={(e) => updateProductSpec(index, 'value', e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeProductSpec(index)}
                      className="mb-0"
                    >
                      <i className="icon-trash-2" />
                    </Button>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addProductSpec}
                  className="w-full"
                >
                  <i className="icon-plus mr-2" />
                  Тодорхойлолт нэмэх
                </Button>
              </div>
            </div>

            {/* Tags */}
            <FormField
              control={form.control}
              name="tagsCsv"
              render={() => (
                <FormItem>
                  <FormLabel className="body-title mb-5">Бүтээгдэхүүний шошгууд <span className="tf-color-1">*</span></FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-3">
                        {selectedTags.length ? (
                          selectedTags.map((tag) => (
                            <Badge key={tag} variant="primary" className="rounded-full px-4 py-2 text-lg flex items-center gap-2">
                              {tag}
                              <span role="button" aria-label="remove" onClick={() => toggleTag(tag)} className="cursor-pointer opacity-100 hover:opacity-100">
                                <i className="icon-x" />
                              </span>
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">Одоогоор сонгосон шошго алга</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" size="sm" variant="outline" className="tf-button style-1 rounded-full h-10 px-5 py-0" onClick={() => setTagDialogOpen(true)}>
                          <i className="icon-plus mr-1" /> Шошго нэмэх
                        </Button>
                        <Button type="button" size="sm" variant="ghost" className="tf-button rounded-full h-10 px-5 py-0" onClick={() => setSelectedTags([])}>
                          Арилгах
                        </Button>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="wg-box">
            {/* Image uploader */}
            <FormField
              control={form.control}
              name="images"
              render={() => (
                <FormItem>
                  <FormLabel className="body-title mb-5">Зураг байршуулах</FormLabel>
                  <div className="upload-image mb-16 ">
                    {existingImages.map((image) => (
                      <div className="item" key={image.id}>
                        <img src={require("@/lib/api/env").resolveImageUrl(image.url)} alt="existing" />
                        <div className="mt-2 text-center">
                          <Button type="button" size="sm" variant="destructive" onClick={() => removeExistingImage(image.id)}>Remove</Button>
                        </div>
                      </div>
                    ))}
                    {previewImages.map((src, idx) => (
                      <div className="item" key={`new-${idx}`}>
                        <img src={src} alt={`preview-${idx}`} />
                      </div>
                    ))}
                    <div className="item up-load">
                      <label className="uploadfile" htmlFor="editFiles">
                        <span className="icon"><i className="icon-upload-cloud" /></span>
                        <span className="text-tiny">Drop your images here or select <span className="tf-color">click to browse</span></span>
                        <input id="editFiles" type="file" multiple accept="image/*" onChange={handleFileChange} />
                      </label>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="body-title mb-10">Бүтээгдэхүүний үнэ <span className="tf-color-1">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Бүтээгдэхүүний үнэ оруулна уу" type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="body-title mb-10">Sku <span className="tf-color-1">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Sku оруулна уу" type="text" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="cols gap10">
              <LoadingButton loading={isPending} className="tf-button w-full" type="submit">Update product</LoadingButton>
            </div>
            {error && <p className="text-center text-destructive">{error}</p>}
            {success && <p className="text-center text-green-600">{success}</p>}
          </div>
        </form>
      </Form>
    </Layout>
  );
}


