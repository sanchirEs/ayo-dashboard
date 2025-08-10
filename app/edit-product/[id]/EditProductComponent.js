"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { editProductsSchema } from "@/schemas/productSchema";
import Layout from "@/components/layout/Layout";
import { useSession } from "next-auth/react";
import { getCategoriesClient } from "@/lib/api/categories";
import { getProductById, updateProduct } from "@/lib/api/products";
import { getTagPresets, getTags } from "@/lib/api/tags";
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

export default function EditProductComponent({ id }) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [tagPresets, setTagPresets] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]); // {id, url}
  const [removeImageIds, setRemoveImageIds] = useState([]);
  const { data: session } = useSession();
  const TOKEN = session?.user?.accessToken || null;

  const form = useForm({
    resolver: zodResolver(editProductsSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      categoryId: "",
      quantity: "",
      sku: "",
      images: [],
      tagsCsv: "",
    },
  });

  useEffect(() => {
    async function loadAll() {
      try {
        const [product, categoriesData, presets, tagResp] = await Promise.all([
          getProductById(id),
          TOKEN ? getCategoriesClient(TOKEN) : Promise.resolve([]),
          getTagPresets(),
          getTags(id),
        ]);

        if (!product) throw new Error("Product not found");

        // Prefill form
        form.reset({
          name: product.name || "",
          description: product.description || "",
          price: String(product.price ?? ""),
          categoryId: String(product.categoryId || ""),
          quantity: String(product.stock ?? ""),
          sku: product.sku || "",
          images: [],
          tagsCsv: (tagResp?.tags || []).map((t) => t.tag).join(","),
        });

        setExistingImages(product.images || []);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setTagPresets(presets || []);
        setSelectedTags((tagResp?.tags || []).map((t) => t.tag));
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
            price: Number(values.price),
            categoryId: Number(values.categoryId),
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
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="body-title mb-5">Бүтээгдэхүүний ангилал <span className="tf-color-1">*</span></FormLabel>
                      <FormControl>
                        <select {...field}>
                          <option value="">Ангилал сонгоно уу</option>
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


