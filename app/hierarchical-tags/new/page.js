"use client";
import Layout from "@/components/layout/Layout";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import GetToken from "@/lib/GetTokenClient";
import { createTagGroup } from "@/lib/api/hierarchicalTags";

export default function NewTagGroupPage() {
  const router = useRouter();
  const token = GetToken();

  const [form, setForm] = useState({ name: "", description: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!token) return setError("Not authenticated");
    if (!form.name.trim()) return setError("Name is required");
    
    setSubmitting(true);
    setError("");
    
    const created = await createTagGroup(
      { 
        name: form.name.trim(), 
        description: form.description.trim() || undefined 
      }, 
      token
    );
    
    setSubmitting(false);
    
    if (!created) {
      setError("Failed to create tag group");
      return;
    }
    
    router.push(`/hierarchical-tags/${created.id}/options`);
  }

  return (
    <Layout breadcrumbTitleParent="Hierarchical Tags" breadcrumbTitle="New Tag Group">
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
            <Link className="tf-button style-3 w208" href="/hierarchical-tags">
              Cancel
            </Link>
            <button className="tf-button w208" type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
