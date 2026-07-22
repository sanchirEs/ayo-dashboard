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
  name:       z.string().min(2, "Нэр хамгийн багадаа 2 тэмдэгт байна"),
  district:   z.string().min(1, "Дүүрэг оруулна уу"),
  address:    z.string().min(5, "Хаяг хамгийн багадаа 5 тэмдэгт байна"),
  hours:      z.string().min(1, "Цагийн хуваарь оруулна уу"),
  lunchBreak: z.string().optional(),
  phone:      z.string().min(8, "Утасны дугаар буруу байна"),
  closedDay:  z.string().optional(),
  googleMapLink: z.string().url("Зөв холбоос оруулна уу").optional().or(z.literal("")),
  sortOrder:  z.coerce.number().int().min(0).default(0),
});

function SectionLabel({ icon, children }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "8px",
      marginBottom: "20px", paddingBottom: "12px",
      borderBottom: "1px solid #f0f0f0",
    }}>
      <span style={{
        width: "28px", height: "28px", borderRadius: "6px",
        backgroundColor: "#eff6ff", display: "flex",
        alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <i className={icon} style={{ color: "#3b82f6", fontSize: "13px" }} />
      </span>
      <span style={{ fontWeight: 600, fontSize: "13px", color: "#374151", letterSpacing: "0.01em" }}>
        {children}
      </span>
    </div>
  );
}

function Field({ label, required, hint, error, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>
        {label}
        {required && <span style={{ color: "#ef4444", marginLeft: "3px" }}>*</span>}
      </label>
      {children}
      {hint && !error && (
        <span style={{ fontSize: "11px", color: "#9ca3af" }}>{hint}</span>
      )}
      {error && (
        <span style={{ fontSize: "11px", color: "#ef4444", display: "flex", alignItems: "center", gap: "4px" }}>
          <i className="icon-alert-circle" style={{ fontSize: "11px" }} />
          {error}
        </span>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "9px 12px",
  border: "1px solid #e5e7eb", borderRadius: "8px",
  fontSize: "14px", color: "#111827",
  backgroundColor: "#fff", outline: "none",
  transition: "border-color 0.15s",
  boxSizing: "border-box",
};

const cardStyle = {
  backgroundColor: "#fff",
  border: "1px solid #f0f0f0",
  borderRadius: "12px",
  padding: "24px",
};

export default function StoreLocationForm({ existing }) {
  const isEdit = Boolean(existing);
  const router = useRouter();
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [imageFile, setImageFile]       = useState(null);
  const [imagePreview, setImagePreview] = useState(existing?.image || null);
  const [dragOver, setDragOver]         = useState(false);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name:       existing?.name       || "",
      district:   existing?.district   || "",
      address:    existing?.address    || "",
      hours:      existing?.hours      || "",
      lunchBreak: existing?.lunchBreak || "",
      phone:      existing?.phone      || "",
      closedDay:  existing?.closedDay  || "",
      googleMapLink: existing?.googleMapLink || "",
      sortOrder:  existing?.sortOrder  ?? 0,
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

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
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
      const payload = { ...values, image: imageFile || undefined };
      const result = isEdit
        ? await updateStoreLocation(existing.id, payload, token)
        : await createStoreLocation(payload, token);

      if (result.success) {
        setSuccess(isEdit ? "Салбар амжилттай шинэчлэгдлээ!" : "Салбар амжилттай нэмэгдлээ!");
        setTimeout(() => router.push("/store-locations"), 1200);
      } else {
        setError(result.message || "Алдаа гарлаа");
      }
    });
  }

  const errors = form.formState.errors;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Alerts */}
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderRadius: "10px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: "14px" }}>
          <i className="icon-alert-circle" />
          {error}
        </div>
      )}
      {success && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderRadius: "10px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", fontSize: "14px" }}>
          <i className="icon-check-circle" />
          {success}
        </div>
      )}

      {/* Main grid: left (info) + right (schedule + image) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "16px", alignItems: "start" }}>

        {/* LEFT — Location info */}
        <div style={cardStyle}>
          <SectionLabel icon="icon-map-pin">Салбарын мэдээлэл</SectionLabel>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Салбарын нэр" required error={errors.name?.message}>
                <input
                  {...form.register("name")}
                  type="text"
                  placeholder="ТӨВ САЛБАР / Peace mall /"
                  style={inputStyle}
                />
              </Field>
            </div>

            <Field label="Дүүрэг / Хот" required error={errors.district?.message}>
              <input
                {...form.register("district")}
                type="text"
                placeholder="Улаанбаатар"
                style={inputStyle}
              />
            </Field>

            <Field label="Утасны дугаар" required error={errors.phone?.message}>
              <input
                {...form.register("phone")}
                type="text"
                placeholder="80940575"
                style={inputStyle}
              />
            </Field>

            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Хаяг" required error={errors.address?.message}>
                <textarea
                  {...form.register("address")}
                  rows={3}
                  placeholder="Дэлгэрэнгүй хаяг..."
                  style={{ ...inputStyle, resize: "vertical", lineHeight: "1.5" }}
                />
              </Field>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <Field
                label="Google Map линк"
                hint="Хэрэглэгч зураг дээр дарахад шинэ табаар нээгдэнэ"
                error={errors.googleMapLink?.message}
              >
                <input
                  {...form.register("googleMapLink")}
                  type="url"
                  placeholder="https://maps.app.goo.gl/..."
                  style={inputStyle}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* RIGHT column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Schedule card */}
          <div style={cardStyle}>
            <SectionLabel icon="icon-clock">Цагийн хуваарь</SectionLabel>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <Field label="Ажиллах цаг" required error={errors.hours?.message}>
                <input
                  {...form.register("hours")}
                  type="text"
                  placeholder="Даваа–Бямба 10:00–19:00"
                  style={inputStyle}
                />
              </Field>

              <Field label="Цайны цаг">
                <input
                  {...form.register("lunchBreak")}
                  type="text"
                  placeholder="Цайны цаг: 14:00–15:00"
                  style={inputStyle}
                />
              </Field>

              <Field label="Амрах өдөр">
                <input
                  {...form.register("closedDay")}
                  type="text"
                  placeholder="Даваа: Амарна"
                  style={inputStyle}
                />
              </Field>

              <Field label="Дараалал" hint="Жижиг тоо эхэнд харагдана">
                <input
                  {...form.register("sortOrder")}
                  type="number"
                  min="0"
                  placeholder="0"
                  style={{ ...inputStyle, width: "90px" }}
                />
              </Field>
            </div>
          </div>

          {/* Image card */}
          <div style={cardStyle}>
            <SectionLabel icon="icon-image">Зураг</SectionLabel>

            {imagePreview ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ position: "relative", borderRadius: "10px", overflow: "hidden", aspectRatio: "16/9", backgroundColor: "#f3f4f6" }}>
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    style={{ objectFit: "cover" }}
                    unoptimized={imagePreview.startsWith("data:")}
                  />
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <label htmlFor="imageFile" style={{
                    flex: 1, padding: "8px 12px", borderRadius: "8px", cursor: "pointer",
                    border: "1px solid #e5e7eb", backgroundColor: "#f9fafb",
                    fontSize: "13px", color: "#374151", textAlign: "center",
                    fontWeight: 500,
                  }}>
                    <i className="icon-upload" style={{ marginRight: "6px", fontSize: "12px" }} />
                    Солих
                    <input type="file" id="imageFile" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
                  </label>
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    style={{
                      padding: "8px 12px", borderRadius: "8px", cursor: "pointer",
                      border: "1px solid #fecaca", backgroundColor: "#fef2f2",
                      fontSize: "13px", color: "#dc2626", fontWeight: 500,
                    }}
                  >
                    <i className="icon-trash-2" style={{ fontSize: "13px" }} />
                  </button>
                </div>
              </div>
            ) : (
              <label
                htmlFor="imageFile"
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", gap: "8px",
                  padding: "28px 16px",
                  border: `2px dashed ${dragOver ? "#3b82f6" : "#d1d5db"}`,
                  borderRadius: "10px", cursor: "pointer",
                  backgroundColor: dragOver ? "#eff6ff" : "#fafafa",
                  transition: "all 0.15s",
                  textAlign: "center",
                }}
              >
                <div style={{
                  width: "40px", height: "40px", borderRadius: "10px",
                  backgroundColor: "#eff6ff", display: "flex",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <i className="icon-upload-cloud" style={{ color: "#3b82f6", fontSize: "18px" }} />
                </div>
                <div>
                  <span style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>
                    Зураг оруулах
                  </span>
                  <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>
                    PNG, JPG, WEBP · 2MB хүртэл
                  </div>
                </div>
                <input type="file" id="imageFile" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
              </label>
            )}
          </div>

        </div>
      </div>

      {/* Footer actions */}
      <div style={{
        display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "12px",
        paddingTop: "8px",
      }}>
        <button
          type="button"
          onClick={() => router.push("/store-locations")}
          style={{
            padding: "10px 24px", borderRadius: "10px", cursor: "pointer",
            border: "1px solid #e5e7eb", backgroundColor: "#fff",
            fontSize: "14px", fontWeight: 500, color: "#374151",
          }}
        >
          Буцах
        </button>
        <button
          type="submit"
          disabled={isPending}
          style={{
            padding: "10px 28px", borderRadius: "10px", cursor: isPending ? "not-allowed" : "pointer",
            border: "none", backgroundColor: isPending ? "#93c5fd" : "#2563eb",
            fontSize: "14px", fontWeight: 600, color: "#fff",
            display: "flex", alignItems: "center", gap: "8px",
            transition: "background-color 0.15s",
            opacity: isPending ? 0.8 : 1,
          }}
        >
          {isPending ? (
            <><i className="icon-loader" style={{ fontSize: "14px" }} />Хадгалж байна...</>
          ) : (
            <><i className="icon-check" style={{ fontSize: "14px" }} />{isEdit ? "Хадгалах" : "Нэмэх"}</>
          )}
        </button>
      </div>

    </form>
  );
}
