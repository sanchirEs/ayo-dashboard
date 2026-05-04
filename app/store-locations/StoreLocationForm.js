"use client";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createStoreLocation, updateStoreLocation } from "@/lib/api/storeLocations";

const schema = z.object({
  name: z.string().min(2, "Нэр хамгийн багадаа 2 тэмдэгт байна"),
  district: z.string().min(1, "Дүүрэг оруулна уу"),
  address: z.string().min(5, "Хаяг хамгийн багадаа 5 тэмдэгт байна"),
  hours: z.string().min(1, "Цагийн хуваарь оруулна уу"),
  lunchBreak: z.string().optional(),
  phone: z.string().min(8, "Утасны дугаар буруу байна"),
  closedDay: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export default function StoreLocationForm({ existing }) {
  const isEdit = Boolean(existing);
  const router = useRouter();
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(existing?.image || null);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: existing?.name || "",
      district: existing?.district || "",
      address: existing?.address || "",
      hours: existing?.hours || "",
      lunchBreak: existing?.lunchBreak || "",
      phone: existing?.phone || "",
      closedDay: existing?.closedDay || "",
      sortOrder: existing?.sortOrder ?? 0,
    },
  });

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  }

  function onSubmit(values) {
    setError("");
    setSuccess("");

    startTransition(async () => {
      const token = session?.user?.accessToken || null;
      const payload = {
        ...values,
        image: imageFile || undefined,
      };

      const result = isEdit
        ? await updateStoreLocation(existing.id, payload, token)
        : await createStoreLocation(payload, token);

      if (result.success) {
        setSuccess(isEdit ? "Салбар амжилттай шинэчлэгдлээ!" : "Салбар амжилттай нэмэгдлээ!");
        setTimeout(() => router.push("/store-locations"), 1500);
      } else {
        setError(result.message || "Алдаа гарлаа");
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="form-new-product form-style-1">
      {error && (
        <div style={{ color: "#dc2626", padding: "12px 16px", border: "1px solid #fecaca", borderRadius: "8px", backgroundColor: "#fef2f2", marginBottom: "16px" }}>
          <i className="icon-alert-circle" style={{ marginRight: "8px" }} />
          {error}
        </div>
      )}
      {success && (
        <div style={{ color: "#059669", padding: "12px 16px", border: "1px solid #a7f3d0", borderRadius: "8px", backgroundColor: "#ecfdf5", marginBottom: "16px" }}>
          <i className="icon-check-circle" style={{ marginRight: "8px" }} />
          {success}
        </div>
      )}

      <div className="flex gap20 flex-wrap">
        <div style={{ flex: "1 1 300px" }}>
          <fieldset>
            <div className="body-title">Салбарын нэр <span className="tf-color-1">*</span></div>
            <input {...form.register("name")} className="flex-grow" type="text" placeholder="ТӨВ САЛБАР / Peace mall /" />
            {form.formState.errors.name && <div className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</div>}
          </fieldset>

          <fieldset>
            <div className="body-title">Дүүрэг / Хот <span className="tf-color-1">*</span></div>
            <input {...form.register("district")} className="flex-grow" type="text" placeholder="Улаанбаатар" />
            {form.formState.errors.district && <div className="text-red-500 text-sm mt-1">{form.formState.errors.district.message}</div>}
          </fieldset>

          <fieldset>
            <div className="body-title">Хаяг <span className="tf-color-1">*</span></div>
            <textarea {...form.register("address")} className="flex-grow" rows={3} placeholder="Дэлгэрэнгүй хаяг..." style={{ resize: "vertical" }} />
            {form.formState.errors.address && <div className="text-red-500 text-sm mt-1">{form.formState.errors.address.message}</div>}
          </fieldset>

          <fieldset>
            <div className="body-title">Утасны дугаар <span className="tf-color-1">*</span></div>
            <input {...form.register("phone")} className="flex-grow" type="text" placeholder="80940575" />
            {form.formState.errors.phone && <div className="text-red-500 text-sm mt-1">{form.formState.errors.phone.message}</div>}
          </fieldset>
        </div>

        <div style={{ flex: "1 1 300px" }}>
          <fieldset>
            <div className="body-title">Ажиллах цаг <span className="tf-color-1">*</span></div>
            <input {...form.register("hours")} className="flex-grow" type="text" placeholder="11:00–19:00" />
            {form.formState.errors.hours && <div className="text-red-500 text-sm mt-1">{form.formState.errors.hours.message}</div>}
          </fieldset>

          <fieldset>
            <div className="body-title">Цайны цаг</div>
            <input {...form.register("lunchBreak")} className="flex-grow" type="text" placeholder="Цайны цаг: 14:00–15:00" />
          </fieldset>

          <fieldset>
            <div className="body-title">Амрах өдөр</div>
            <input {...form.register("closedDay")} className="flex-grow" type="text" placeholder="Даваа: Амарна" />
          </fieldset>

          <fieldset>
            <div className="body-title">Дараалал</div>
            <input {...form.register("sortOrder")} className="flex-grow" type="number" min="0" placeholder="0" />
            <div className="text-tiny" style={{ color: "#6b7280", marginTop: "4px" }}>Жижиг тоо эхэнд харагдана</div>
          </fieldset>
        </div>
      </div>

      <fieldset>
        <div className="body-title">Зураг</div>
        {imagePreview ? (
          <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px", border: "2px solid #e5e7eb", borderRadius: "8px", backgroundColor: "#f9fafb" }}>
            <Image
              src={imagePreview}
              alt="Preview"
              width={120}
              height={90}
              style={{ objectFit: "cover", borderRadius: "8px", width: "120px", height: "90px" }}
              unoptimized={imagePreview.startsWith("data:")}
            />
            <div>
              <button
                type="button"
                onClick={() => { setImageFile(null); setImagePreview(existing?.image || null); }}
                className="text-tiny"
                style={{ color: "#dc2626" }}
              >
                {imageFile ? "Зураг хасах" : "Өөрчлөх"}
              </button>
              {!imageFile && (
                <label htmlFor="imageFile" style={{ display: "block", marginTop: "8px", cursor: "pointer", color: "#6366f1", fontSize: "13px" }}>
                  Шинэ зураг сонгох
                  <input type="file" id="imageFile" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
                </label>
              )}
            </div>
          </div>
        ) : (
          <label htmlFor="imageFile" style={{ display: "block", padding: "32px", border: "2px dashed #d1d5db", borderRadius: "8px", textAlign: "center", cursor: "pointer", backgroundColor: "#f9fafb" }}>
            <i className="icon-upload-cloud" style={{ fontSize: "32px", color: "#6b7280", display: "block", marginBottom: "8px" }} />
            <span className="text-tiny">Зураг оруулах буюу <span className="tf-color">товших</span></span>
            <div className="text-tiny" style={{ color: "#9ca3af", marginTop: "4px" }}>PNG, JPG, WEBP — 2MB хүртэл</div>
            <input type="file" id="imageFile" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
          </label>
        )}
      </fieldset>

      <div className="bot">
        <button type="button" className="tf-button style-2 w208" onClick={() => router.push("/store-locations")}>
          Буцах
        </button>
        <button className="tf-button w208" type="submit" disabled={isPending}>
          {isPending ? (
            <><i className="icon-loader" style={{ marginRight: "8px" }} />Хадгалж байна...</>
          ) : (
            <><i className="icon-check" style={{ marginRight: "8px" }} />{isEdit ? "Хадгалах" : "Нэмэх"}</>
          )}
        </button>
      </div>
    </form>
  );
}
