"use client";
import Layout from "@/components/layout/Layout";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import GetToken from "@/lib/GetTokenClient";
import { getAttribute, updateAttribute } from "@/lib/api/attributes";

export default function EditAttributePage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);
  const token = GetToken();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", type: "select", description: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!id) return;
      setLoading(true);
      const data = await getAttribute(id);
      if (mounted && data) {
        setForm({ name: data.name, type: String(data.type || "select").toLowerCase(), description: "" });
      }
      setLoading(false);
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!token) return setError("Not authenticated");
    if (!form.name) return setError("Name is required");
    if (!form.type || !["select", "text"].includes(String(form.type).toLowerCase())) {
      return setError("Type must be select or text");
    }
    setSaving(true);
    setError("");
    const ok = await updateAttribute(id, { name: form.name, type: form.type }, token);
    setSaving(false);
    if (!ok) return setError("Failed to update attribute");
    router.push(`/attributes/${id}/options`);
  }

  return (
    <Layout breadcrumbTitleParent="Attributes" breadcrumbTitle="Edit Attribute">
      <div className="wg-box">
        {loading ? (
          <div className="body-text">Loading...</div>
        ) : (
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
              <button className="tf-button w208" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}



