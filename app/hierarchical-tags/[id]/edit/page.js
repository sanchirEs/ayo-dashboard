"use client";
import Layout from "@/components/layout/Layout";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import GetToken from "@/lib/GetTokenClient";
import { getTagGroup, updateTagGroup } from "@/lib/api/hierarchicalTags";

export default function EditTagGroupPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);
  const token = GetToken();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!id) return;
      setLoading(true);
      const data = await getTagGroup(id);
      if (mounted && data) {
        setForm({ 
          name: data.name, 
          description: data.description || "" 
        });
      }
      setLoading(false);
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!token) return setError("Not authenticated");
    if (!form.name.trim()) return setError("Name is required");
    
    setSaving(true);
    setError("");
    
    const ok = await updateTagGroup(
      id, 
      { 
        name: form.name.trim(), 
        description: form.description.trim() || undefined 
      }, 
      token
    );
    
    setSaving(false);
    
    if (!ok) return setError("Failed to update tag group");
    
    router.push(`/hierarchical-tags/${id}/options`);
  }

  if (loading) {
    return (
      <Layout breadcrumbTitleParent="Hierarchical Tags" breadcrumbTitle="Edit Group">
        <div className="wg-box">
          <div className="body-text">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout breadcrumbTitleParent="Hierarchical Tags" breadcrumbTitle="Edit Tag Group">
      <div className="wg-box">
        <form className="form-new-product form-style-1" onSubmit={onSubmit}>
          <fieldset className="name">
            <div className="body-title">Group Name</div>
            <input
              className="flex-grow"
              type="text"
              placeholder="e.g., Уруул, Нүд, Арьс"
              name="name"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            />
          </fieldset>
          <fieldset className="name">
            <div className="body-title">Description (optional)</div>
            <textarea
              className="flex-grow"
              placeholder="e.g., Уруулын бүтээгдэхүүн"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
            />
          </fieldset>
          
          {error && (
            <div className="alert alert-danger mb-4" style={{ 
              color: "red", 
              padding: 10, 
              border: "1px solid red", 
              borderRadius: 4 
            }}>
              {error}
            </div>
          )}
          
          <div className="bot">
            <Link className="tf-button style-3 w208" href={`/hierarchical-tags/${id}/options`}>
              Cancel
            </Link>
            <button className="tf-button w208" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Update Group"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
