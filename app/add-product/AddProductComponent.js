"use client";

import { addProductsSchema } from "@/schemas/productSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { getCategoriesClient } from "@/lib/api/categories";
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
import { useSession } from "next-auth/react";

export default function AddProductComponent() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [tagPresets, setTagPresets] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const { data: session } = useSession();
  const TOKEN = session?.user?.accessToken || null;

  const form = useForm({
    resolver: zodResolver(addProductsSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      categoryId: "",
      quantity: "",
      sku: "",
      vendorId: "",
      images: [],
      tagsCsv: "",
    },
  });

  useEffect(() => {
    async function loadCategories() {
      if (TOKEN) {
        try {
          const categoriesData = await getCategoriesClient(TOKEN);
          setCategories(categoriesData);
          const presets = await getTagPresets();
          setTagPresets(presets);
          const existingCsv = form.getValues("tagsCsv") || "";
          const initial = existingCsv
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          setSelectedTags(initial);
        } catch (error) {
          console.error('Failed to load categories:', error);
          setError('Categories заграхад алдаа гарлаа');
        } finally {
          setLoadingCategories(false);
        }
      } else {
        setLoadingCategories(false);
      }
    }
    loadCategories();
  }, [TOKEN]);

  const TYPE_LABELS = {
    Color: "Өнгө",
    Size: "Хэмжээ",
    Material: "Материал",
    Season: "Улирал",
    Style: "Загвар",
  };
  const typeLabel = (t) => TYPE_LABELS[t] || t || "Бусад";
  const typeOrder = ["Color", "Size", "Material", "Season", "Style"];
  const typesFromData = Array.from(new Set((tagPresets || []).map((p) => String(p.type || "")).filter(Boolean)));
  const sortedTypes = [
    ...typeOrder.filter((t) => typesFromData.includes(t)),
    ...typesFromData.filter((t) => !typeOrder.includes(t)),
  ];

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
  
  async function onSubmit(values) {
    setError(undefined);
    startTransition(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (typeof FormData === 'undefined') {
        setError("FormData is not supported in this environment");
        return;
      }

      const vendorId = 1;

      const formData = new FormData();
      formData.append("description", values.description);
      formData.append("categoryId", values.categoryId);
      formData.append("name", values.name);
      formData.append("price", values.price);
      formData.append("quantity", values.quantity);
      formData.append("vendorId", String(vendorId));
      formData.append("sku", values.sku);
      const tagsCsv = form.getValues("tagsCsv");
      const tagList = (tagsCsv || "")
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      if (tagList.length) {
        formData.append("tags", JSON.stringify(tagList));
        formData.append("tagsCsv", tagsCsv);
      }
      values.images.forEach((image) => {
        formData.append('images', image);
      });
      const response = await fetch(
        `${require("@/lib/api/env").getBackendUrl()}/api/v1/products/createproduct`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${TOKEN}`,
          },
          body: formData,
        }
      );
      const responseData = await response.json();
      if (response.ok) {
        setSuccess(responseData.message);
        setPreviewImages([]);
        setSelectedTags([]);
        form.reset({
          name: "",
          description: "",
          price: "",
          categoryId: "",
          quantity: "",
          sku: "",
          vendorId: "",
          images: [],
          tagsCsv: "",
        });
      } else {
        setError(responseData.message || "Алдаа гарлаа");
      }
    });
  }
  
  return (
    <>
      <Layout breadcrumbTitleParent="Бараа" breadcrumbTitle="Бараа нэмэх" pageTitle="Бараа нэмэх">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="tf-section-2 form-add-product">
            <div className="wg-box">
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
                      Do not exceed 20 characters when entering the product
                      name.
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
                          Бүтээгдэхүүний ангилал
                          <span className="tf-color-1">*</span>
                        </FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            disabled={loadingCategories}
                          >
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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tagsCsv"
                render={() => (
                  <FormItem>
                    <FormLabel className="body-title mb-5">
                      Бүтээгдэхүүний шошгууд <span className="tf-color-1">*</span>
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
                                  aria-label="remove"
                                  onClick={() => toggleTag(tag)}
                                  className="cursor-pointer opacity-100 hover:opacity-100"
                                >
                                  <i className="icon-x" />
                                </span>
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground">Одоогоор сонгосон шошго алга</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="tf-button style-1 rounded-full h-10 px-5 py-0"
                            onClick={() => setTagDialogOpen(true)}
                          >
                            <i className="icon-plus mr-1" /> Шошго нэмэх
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="tf-button rounded-full h-10 px-5 py-0"
                            onClick={() => {
                              setSelectedTags([]);
                            }}
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
                              .filter(
                                (p) => String(p.type || "").toLowerCase() === String(t).toLowerCase()
                              )
                              .map((p) => {
                                const active = selectedTags.includes(p.name);
                                return (
                                  <CommandItem
                                    key={p.id}
                                    onSelect={() => toggleTag(p.name)}
                                    data-selected={active}
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
            <div className="wg-box">
              <FormField
                control={form.control}
                name="images"
                render={({ field }) => {
                  const handleFileChange = (event) => {
                    if (typeof File === 'undefined' || typeof FileReader === 'undefined' || typeof Array === 'undefined') {
                      console.warn('Required APIs not supported in this environment');
                      return;
                    }
                    try {
                      const files = Array.from(event.target.files || []);
                      const imagePreviews = files.map((file) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                          setPreviewImages((prev) => [...prev, reader.result]);
                        };
                        reader.readAsDataURL(file);
                        return file;
                      });
                      field.onChange(imagePreviews);
                    } catch (error) {
                      console.warn('Error processing files:', error);
                    }
                  };

                  return (
                    <FormItem>
                      <FormLabel className="body-title mb-5">
                        Зураг байршуулах <span className="tf-color-1">*</span>
                      </FormLabel>

                      <div className="upload-image mb-16 ">
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
                             <span className="text-tiny">Энд зураг чирж оруулна уу эсвэл <span className="tf-color">дарж сонгох</span></span>
                            <FormControl>
                              <input
                                type="file"
                                id="myFile"
                                name="filename"
                                onChange={handleFileChange}
                                multiple
                                accept="image/*"
                              />
                            </FormControl>
                          </label>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                   <FormItem>
                    <FormLabel className="body-title mb-10">
                      Бүтээгдэхүүний үнэ <span className="tf-color-1">*</span>
                    </FormLabel>

                    <FormControl>
                      <Input
                        placeholder="Бүтээгдэхүүний үнэ оруулна уу"
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
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="body-title mb-10">
                      Sku <span className="tf-color-1">*</span>
                    </FormLabel>

                    <FormControl>
                      <Input
                        placeholder="Sku оруулна уу"
                        type="text"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="cols gap10">
                 <LoadingButton
                  loading={isPending}
                  className="tf-button w-full"
                  type="submit"
                >
                   Бараа нэмэх
                </LoadingButton>
              </div>
              {error && <p className="text-center text-destructive">{error}</p>}
              {success && (
                <p className="text-center text-green-600">{success}</p>
              )}
            </div>
          </form>
        </Form>
      </Layout>
    </>
  );
} 