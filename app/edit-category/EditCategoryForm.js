"use client";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import GetToken, { GetSession } from "@/lib/GetTokenClient";
import useSWR from "swr";
import { getCategoryTreePublic } from "@/lib/api/categories";
import { fetchWithAuthHandling } from "@/lib/api/fetch-with-auth";

const schema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  parentId: z.union([z.string(), z.number()]).optional().nullable(),
});

export default function EditCategoryForm({ categoryId }) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();
  const TOKEN = GetToken();
  const session = GetSession();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", parentId: null },
  });

  // Load category details
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `${require("@/lib/api/env").getBackendUrl()}/api/v1/categories/${categoryId}/detail`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (res.ok && data?.data) {
          form.reset({
            name: data.data.name || "",
            description: data.data.description || "",
            parentId: data.data.parentId || null,
          });
        } else {
          setError(data?.message || "Failed to load category");
        }
      } catch (e) {
        setError("Network error");
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  async function onSubmit(values) {
    setError("");
    setSuccess("");
    startTransition(async () => {
      try {
        const response = await fetchWithAuthHandling(
          `${require("@/lib/api/env").getBackendUrl()}/api/v1/categories/${categoryId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${TOKEN}`,
            },
            body: JSON.stringify({
              name: values.name,
              description: values.description || "",
              parentId: values.parentId ? Number(values.parentId) : null,
            }),
          }
        , "EditCategoryForm.updateCategory");
        const responseData = await response.json();
        if (response.ok) {
          setSuccess("Category updated successfully!");
        } else {
          setError(responseData.message || "Failed to update category");
        }
      } catch (e) {
        setError("Network error occurred");
      }
    });
  }

  const canEdit = session?.user?.role === "ADMIN" || session?.user?.role === "SUPERADMIN";
  if (!canEdit) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium text-red-600 mb-4">Access Denied</h3>
        <p className="text-gray-600">You don't have permission to edit categories.</p>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="form-new-product form-style-1">
      {error && (
        <div className="alert alert-danger mb-4" style={{ color: "red", padding: 10, border: "1px solid red", borderRadius: 4 }}>
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success mb-4" style={{ color: "green", padding: 10, border: "1px solid green", borderRadius: 4 }}>
          {success}
        </div>
      )}

      <fieldset className="name">
        <div className="body-title">
          Category name <span className="tf-color-1">*</span>
        </div>
        <input
          {...form.register("name")}
          className="flex-grow"
          type="text"
          placeholder="Enter category name"
          tabIndex={0}
          aria-required="true"
        />
      </fieldset>

      <fieldset className="description">
        <div className="body-title">Description</div>
        <textarea
          {...form.register("description")}
          className="flex-grow"
          placeholder="Enter category description (optional)"
          rows={4}
          style={{ resize: "vertical" }}
        />
      </fieldset>

      <fieldset className="parent">
        <div className="body-title">Parent category</div>
        <ParentSelect value={form.watch("parentId")} onChange={(v)=>form.setValue("parentId", v)} currentId={categoryId} />
      </fieldset>

      <div className="bot">
        <div />
        <button className="tf-button w208" type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

function ParentSelect({ value, onChange, currentId }) {
  const { data, error, isLoading } = useSWR("category-tree-edit", getCategoryTreePublic, { revalidateOnFocus: false });

  const renderOptions = (nodes, prefix = "") => {
    const arr = [];
    for (const node of nodes || []) {
      // prevent selecting itself or its descendants (best-effort on client; server already enforces)
      arr.push(
        <option key={node.id} value={node.id} disabled={node.id === currentId}>
          {prefix}
          {node.name}
        </option>
      );
      if (node.children && node.children.length) {
        arr.push(...renderOptions(node.children, prefix + "— "));
      }
    }
    return arr;
  };

  return (
    <div className="select">
      <select className="tf-select" value={value ?? ""} onChange={(e)=>onChange(e.target.value || null)}>
        <option value="">No parent (root)</option>
        {isLoading ? <option disabled>Loading...</option> : null}
        {error ? <option disabled>Error loading categories</option> : null}
        {!isLoading && !error && renderOptions(data)}
      </select>
    </div>
  );
}


