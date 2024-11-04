"use client";

import { addProductsSchema } from "@/schemas/productSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/customui/Input"; //input-iig customui дотроос нь аваарай. энэ нь bootstrap-д зохицсон.
import LoadingButton from "@/components/customui/LoadingButton";
import Layout from "@/components/layout/Layout";
import GetToken from "@/lib/GetTokenClient";
export default function AddProduct() {
  const [error, setError] = useState(""); //Aldaa barih
  const [success, setSuccess] = useState(""); //Ur dun barih
  const [isPending, startTransition] = useTransition(); //Form submit transition process
  const TOKEN = GetToken();

  const form = useForm({
    // Form
    resolver: zodResolver(addProductsSchema),
    defaultValues: {
      // identifier: "",
      vendorId: 1,
    },
  });
  async function onSubmit(values) {
    console.log("TOKEN", TOKEN);
    setError(undefined);
    startTransition(async () => {
      //File, JSON zereg ilgeehiin tuld formdata ashiglana.
      //Uuniig body dotor ilgeene
      // console.log("submitted", values);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const formData = new FormData();
      formData.append("description", values.description);
      formData.append("categoryId", values.categoryId);
      formData.append("name", values.name);
      formData.append("price", values.price);
      formData.append("quantity", values.quantity);
      formData.append("vendorId", values.vendorId);
      formData.append("sku", values.sku);
      values.images.forEach((image, index) => {
        formData.append(`images[${index}]`, image); // Append images to FormData
      });
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/products/createproduct`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${TOKEN}`,
          },
          body: formData,
        }
      );
      const responseData = await response.json();
      console.log(responseData);
      if (response.ok) {
        // console.log("success");
        setSuccess(responseData.message);
      } else {
        setError(responseData.message || "Алдаа гарлаа");
        // console.log("error");
      }
    });
  }
  return (
    <>
      <Layout breadcrumbTitleParent="Ecommerce" breadcrumbTitle="Add product">
        {/* Shadcn Form, React hook form, Zod, this projects own css classes used together  */}
        {/* Formfield dotor name gesen attribute l ylgana. bas tusdaa shadcn component bish bol input element dotor  {...field} duudna*/}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="tf-section-2 form-add-product"
          >
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
                      {/* Tailbar */}
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
                            {...field} // Spread field props to bind the select with react-hook-form
                          >
                            <option value="">Бүтээгдэхүүн сонгоно уу</option>{" "}
                            {/* Use value to indicate unselected state */}
                            <option value={1}>Cat1</option>
                            <option value={2}>Cat2</option>
                            <option value={3}>Cat3</option>
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
            </div>
            <div className="wg-box">
              <FormField
                control={form.control}
                name="images"
                render={({ field }) => {
                  const [previewImages, setPreviewImages] = useState([]);

                  const handleFileChange = (event) => {
                    const files = Array.from(event.target.files);
                    const imagePreviews = files.map((file) => {
                      const reader = new FileReader();
                      reader.onload = () => {
                        setPreviewImages((prev) => [...prev, reader.result]);
                      };
                      reader.readAsDataURL(file);
                      return file;
                    });
                    field.onChange(imagePreviews); // Update react-hook-form state if necessary
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
                            <span className="text-tiny">
                              Drop your images here or select{" "}
                              <span className="tf-color">click to browse</span>
                            </span>
                            <FormControl>
                              <input
                                type="file"
                                id="myFile"
                                name="filename"
                                onChange={handleFileChange}
                                multiple // Allow multiple file selection
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

              {/* <div className="cols gap22">
                <fieldset className="name">
                  <div className="body-title mb-10">Add size</div>
                  <div className="select mb-10">
                    <select >
                      <option>EU - 44</option>
                      <option>EU - 40</option>
                      <option>EU - 50</option>
                    </select>
                  </div>
                  <div className="list-box-value mb-10">
                    <div className="box-value-item">
                      <div className="body-text">EU - 38.5</div>
                    </div>
                    <div className="box-value-item">
                      <div className="body-text">EU - 39</div>
                    </div>
                    <div className="box-value-item">
                      <div className="body-text">EU - 40</div>
                    </div>
                  </div>
                  <div className="list-box-value">
                    <div className="box-value-item">
                      <div className="body-text">EU - 41.5</div>
                    </div>
                    <div className="box-value-item">
                      <div className="body-text">EU - 42</div>
                    </div>
                    <div className="box-value-item">
                      <div className="body-text">EU - 43</div>
                    </div>
                  </div>
                </fieldset>
                <fieldset className="name">
                  <div className="body-title mb-10">Product date</div>
                  <div className="select">
                    <input type="date" name="date" />
                  </div>
                </fieldset>
              </div> */}
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
              <FormField
                control={form.control}
                name="vendorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="body-title mb-10">
                      Vendor ID <span className="tf-color-1">*</span>
                    </FormLabel>

                    <FormControl>
                      <Input
                        placeholder="Vendor ID оруулна уу"
                        type="number"
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
                  Add product
                </LoadingButton>
                {/* <button className="tf-button style-1 w-full" type="submit">
                  Save product
                </button> */}
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
