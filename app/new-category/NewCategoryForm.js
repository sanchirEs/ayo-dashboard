"use client";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import useSWR from "swr";
import { getCategoryTreePublic } from "@/lib/api/categories";
import { useSession } from "next-auth/react";

// Category validation schema
const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100, "Name too long"),
  description: z.string().optional(),
  parentId: z.union([z.string(), z.number()]).optional().nullable(),
});

export default function NewCategoryForm({ parentId: initialParentId = null }) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();
  const { data: session } = useSession();
  const TOKEN = session?.user?.accessToken || null;

  const form = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      parentId: initialParentId,
    },
  });

  async function onSubmit(values) {
    setError("");
    setSuccess("");
    
    startTransition(async () => {
      try {
        const response = await fetch(
          `${require("@/lib/api/env").getBackendUrl()}/api/v1/categories/`,
          {
            method: "POST",
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
        );

        const responseData = await response.json();
        
        if (response.ok) {
          setSuccess("Category created successfully!");
          form.reset();
        } else {
          setError(responseData.message || "Failed to create category");
        }
      } catch (error) {
        setError("Network error occurred");
        console.error("Category creation error:", error);
      }
    });
  }

  const canCreateCategory = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPERADMIN';

  if (!canCreateCategory) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium text-red-600 mb-4">Access Denied</h3>
        <p className="text-gray-600">You don't have permission to create categories.</p>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="form-new-product form-style-1">
      {error && (
        <div className="alert alert-danger mb-4" style={{ color: 'red', padding: '10px', border: '1px solid red', borderRadius: '4px' }}>
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success mb-4" style={{ color: 'green', padding: '10px', border: '1px solid green', borderRadius: '4px' }}>
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
        {form.formState.errors.name && (
          <div className="text-red-500 text-sm mt-1">
            {form.formState.errors.name.message}
          </div>
        )}
      </fieldset>

      <fieldset className="description">
        <div className="body-title">Description</div>
        <textarea
          {...form.register("description")}
          className="flex-grow"
          placeholder="Enter category description (optional)"
          rows={4}
          style={{ resize: 'vertical' }}
        />
        {form.formState.errors.description && (
          <div className="text-red-500 text-sm mt-1">
            {form.formState.errors.description.message}
          </div>
        )}
      </fieldset>

      <fieldset className="parent">
        <div className="body-title">Parent category</div>
        <ParentCategorySelect value={form.watch("parentId")} onChange={(v)=>form.setValue("parentId", v)} />
      </fieldset>

      <div className="bot">
        <div />
        <button 
          className="tf-button w208" 
          type="submit"
          disabled={isPending}
        >
          {isPending ? "Creating..." : "Create Category"}
        </button>
      </div>
    </form>
  );
}

function ParentCategorySelect({ value, onChange }) {
  const { data, error, isLoading } = useSWR("category-tree", getCategoryTreePublic, { revalidateOnFocus: false });

  const renderOptions = (nodes, prefix = "") => {
    const arr = [];
    for (const node of nodes || []) {
      arr.push(
        <option key={node.id} value={node.id}>
          {prefix}{node.name}
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