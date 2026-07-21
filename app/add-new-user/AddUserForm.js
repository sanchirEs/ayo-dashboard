"use client";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { createUserByAdmin } from "@/lib/api/adminUsers";

const ROLE_OPTIONS = [
  { value: "BRANCH", label: "Салбар (зөвхөн Pickup PIN хуудас)" },
  { value: "SHEET_PICKUP", label: "Дансны Pickup баталгаажуулагч" },
  { value: "SHEET_DELIVERY", label: "Дансны Хүргэлт баталгаажуулагч" },
  { value: "SHEET_REFUND", label: "Дансны Буцаалт баталгаажуулагч" },
  { value: "ADMIN", label: "Админ (бүх хуудас)" },
  { value: "VENDOR", label: "Борлуулагч" },
];

const schema = z
  .object({
    username: z.string().min(2, "Нэр хамгийн багадаа 2 тэмдэгт байна"),
    telephone: z.string().min(8, "Утасны дугаар буруу байна"),
    password: z.string().min(6, "Нууц үг хамгийн багадаа 6 тэмдэгт байна"),
    confirmPassword: z.string(),
    role: z.enum(["BRANCH", "SHEET_PICKUP", "SHEET_DELIVERY", "SHEET_REFUND", "ADMIN", "VENDOR"]),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Нууц үг таарахгүй байна",
    path: ["confirmPassword"],
  });

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

export default function AddUserForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      telephone: "",
      password: "",
      confirmPassword: "",
      role: "BRANCH",
    },
  });

  function onSubmit(values) {
    setError("");
    setSuccess("");
    startTransition(async () => {
      const token = session?.user?.accessToken || null;
      const result = await createUserByAdmin(
        {
          username: values.username,
          telephone: values.telephone,
          password: values.password,
          role: values.role,
        },
        token
      );
      if (result.success) {
        setSuccess("Хэрэглэгч амжилттай үүслээ!");
        form.reset();
      } else {
        setError(result.message || "Алдаа гарлаа");
      }
    });
  }

  const errors = form.formState.errors;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "560px" }}
    >
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

      <div style={cardStyle}>
        <SectionLabel icon="icon-user">Шинэ бүртгэл</SectionLabel>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <Field label="Нэр" required hint="Жишээ: Peace Mall салбар" error={errors.username?.message}>
            <input {...form.register("username")} type="text" placeholder="Салбарын нэр" style={inputStyle} />
          </Field>

          <Field label="Нэвтрэх утас" required hint="Энэ дугаараар нэвтэрнэ" error={errors.telephone?.message}>
            <input {...form.register("telephone")} type="text" placeholder="80940575" style={inputStyle} />
          </Field>

          <Field label="Эрх" required error={errors.role?.message}>
            <select {...form.register("role")} style={inputStyle}>
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Нууц үг" required error={errors.password?.message}>
            <input {...form.register("password")} type="password" placeholder="Нууц үг" style={inputStyle} />
          </Field>

          <Field label="Нууц үг давтах" required error={errors.confirmPassword?.message}>
            <input {...form.register("confirmPassword")} type="password" placeholder="Нууц үг давтах" style={inputStyle} />
          </Field>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", paddingTop: "4px" }}>
        <button
          type="submit"
          disabled={isPending}
          style={{
            padding: "10px 28px", borderRadius: "10px", cursor: isPending ? "not-allowed" : "pointer",
            border: "none", backgroundColor: isPending ? "#93c5fd" : "#2563eb",
            fontSize: "14px", fontWeight: 600, color: "#fff",
            display: "flex", alignItems: "center", gap: "8px",
            opacity: isPending ? 0.8 : 1,
          }}
        >
          {isPending ? (
            <><i className="icon-loader" style={{ fontSize: "14px" }} />Хадгалж байна...</>
          ) : (
            <><i className="icon-check" style={{ fontSize: "14px" }} />Бүртгэл үүсгэх</>
          )}
        </button>
      </div>
    </form>
  );
}
