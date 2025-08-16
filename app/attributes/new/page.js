"use client";
import Layout from "@/components/layout/Layout";
import { useState } from "react";
import { useRouter } from "next/navigation";
import GetToken from "@/lib/GetTokenClient";
import { createAttribute } from "@/lib/api/attributes";

export default function NewAttributePage() {
  const router = useRouter();
  const token = GetToken();

  const [form, setForm] = useState({ name: "", type: "select", description: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!token) return setError("Not authenticated");
    if (!form.name) return setError("Name is required");
    if (!form.type || !["select", "text"].includes(String(form.type).toLowerCase())) {
      return setError("Type must be select or text");
    }
    setSubmitting(true);
    setError("");
    const created = await createAttribute({ name: form.name, type: form.type }, token);
    setSubmitting(false);
    if (!created) {
      setError("Failed to create attribute");
      return;
    }
    router.push(`/attributes/${created.id}/options`);
  }

  return (
    <Layout breadcrumbTitleParent="Attributes" breadcrumbTitle="New Attribute">
      <div className="wg-box">
        <form className="form-new-product form-style-1" onSubmit={onSubmit}>
          <fieldset className="name">
            <div className="body-title">Name</div>
            <input
              className="flex-grow"
              type="text"
              placeholder="e.g., Color, Size, Storage"
              name="name"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            />
          </fieldset>
          <fieldset className="name">
            <div className="body-title">Type</div>
            <select
              className="flex-grow"
              value={form.type}
              onChange={(e) => setForm((s) => ({ ...s, type: e.target.value }))}
            >
              <option value="select">select</option>
              <option value="text">text</option>
            </select>
          </fieldset>
          <fieldset className="name">
            <div className="body-title">Description (optional)</div>
            <textarea
              className="flex-grow"
              placeholder="Optional description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
            />
          </fieldset>
          {error && (
            <div className="alert alert-danger mb-4" style={{ color: "red", padding: 10, border: "1px solid red", borderRadius: 4 }}>
              {error}
            </div>
          )}
          <div className="bot">
            <div />
            <button className="tf-button w208" type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create Attribute"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}



