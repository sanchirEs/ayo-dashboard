"use client";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import GetToken, { GetSession } from "@/lib/GetTokenClient";
import { createBrand } from "@/lib/api/brands";
import { useRouter } from "next/navigation";

// Brand validation schema
const brandSchema = z.object({
  name: z.string()
    .min(2, "Brand name must be at least 2 characters")
    .max(100, "Brand name too long")
    .regex(/^[a-zA-Z0-9\s\-_&.]+$/, "Brand name contains invalid characters"),
  description: z.string().max(1000, "Description too long").optional(),
  websiteUrl: z.string().url("Invalid website URL").optional().or(z.literal("")),
});

export default function NewBrandForm() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const TOKEN = GetToken();
  const session = GetSession();
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: "",
      description: "",
      websiteUrl: "",
    },
  });

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(values) {
    setError("");
    setSuccess("");
    
    startTransition(async () => {
      try {
        const brandData = {
          name: values.name,
          description: values.description || undefined,
          websiteUrl: values.websiteUrl || undefined,
          logo: logoFile || undefined,
        };

        const result = await createBrand(brandData, TOKEN);
        
        if (result.success) {
          setSuccess("Brand created successfully!");
          form.reset();
          setLogoFile(null);
          setLogoPreview(null);
          
          // Redirect to brand list after 2 seconds
          setTimeout(() => {
            router.push('/brand-list');
          }, 2000);
        } else {
          setError(result.message || "Failed to create brand");
        }
      } catch (error) {
        setError("Network error occurred");
        console.error("Brand creation error:", error);
      }
    });
  }

  // Check if user has permission to create brands
  const canCreateBrand = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPERADMIN';

  if (!canCreateBrand) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium text-red-600 mb-4">Access Denied</h3>
        <p className="text-gray-600">You don't have permission to create brands. Only administrators can manage brands.</p>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="form-new-product form-style-1">
      {error && (
        <div className="alert alert-danger mb-4" style={{ 
          color: '#dc2626', 
          padding: '12px 16px', 
          border: '1px solid #fecaca', 
          borderRadius: '8px',
          backgroundColor: '#fef2f2'
        }}>
          <i className="icon-alert-circle" style={{ marginRight: '8px' }} />
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success mb-4" style={{ 
          color: '#059669', 
          padding: '12px 16px', 
          border: '1px solid #a7f3d0', 
          borderRadius: '8px',
          backgroundColor: '#ecfdf5'
        }}>
          <i className="icon-check-circle" style={{ marginRight: '8px' }} />
          {success}
        </div>
      )}

      <fieldset className="name">
        <div className="body-title">
          Brand Name <span className="tf-color-1">*</span>
        </div>
        <input
          {...form.register("name")}
          className="flex-grow"
          type="text"
          placeholder="e.g., Apple, Samsung, Nike"
          tabIndex={0}
          aria-required="true"
        />
        <div className="text-tiny" style={{ color: '#6b7280', marginTop: '4px' }}>
          Brand name must be unique and contain only letters, numbers, spaces, hyphens, underscores, ampersands, and periods
        </div>
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
          placeholder="Enter brand description (optional)"
          rows={4}
          style={{ resize: 'vertical' }}
        />
        <div className="text-tiny" style={{ color: '#6b7280', marginTop: '4px' }}>
          Brief description about the brand (max 1000 characters)
        </div>
        {form.formState.errors.description && (
          <div className="text-red-500 text-sm mt-1">
            {form.formState.errors.description.message}
          </div>
        )}
      </fieldset>

      <fieldset className="website">
        <div className="body-title">Website URL</div>
        <input
          {...form.register("websiteUrl")}
          className="flex-grow"
          type="url"
          placeholder="https://example.com"
        />
        <div className="text-tiny" style={{ color: '#6b7280', marginTop: '4px' }}>
          Official brand website (optional)
        </div>
        {form.formState.errors.websiteUrl && (
          <div className="text-red-500 text-sm mt-1">
            {form.formState.errors.websiteUrl.message}
          </div>
        )}
      </fieldset>

      <fieldset className="logo">
        <div className="body-title">Brand Logo</div>
        <div className="upload-brand-logo">
          {logoPreview ? (
            <div className="logo-preview" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '16px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: '#f9fafb'
            }}>
              <img 
                src={logoPreview} 
                alt="Logo preview" 
                style={{
                  width: '80px',
                  height: '80px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db'
                }}
              />
              <div style={{ flex: 1 }}>
                <div className="body-title-2">{logoFile?.name}</div>
                <div className="text-tiny" style={{ color: '#6b7280' }}>
                  {(logoFile?.size / 1024).toFixed(1)} KB
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLogoFile(null);
                    setLogoPreview(null);
                  }}
                  className="text-tiny text-red-600 hover:text-red-800"
                  style={{ marginTop: '4px' }}
                >
                  Remove logo
                </button>
              </div>
            </div>
          ) : (
            <label className="uploadfile" htmlFor="logoFile" style={{
              display: 'block',
              padding: '32px',
              border: '2px dashed #d1d5db',
              borderRadius: '8px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: '#f9fafb',
              transition: 'all 0.2s ease'
            }}>
              <span className="icon" style={{ display: 'block', marginBottom: '8px' }}>
                <i className="icon-upload-cloud" style={{ fontSize: '32px', color: '#6b7280' }} />
              </span>
              <span className="text-tiny">
                Drop your brand logo here or{" "}
                <span className="tf-color">click to browse</span>
              </span>
              <div className="text-tiny" style={{ color: '#9ca3af', marginTop: '4px' }}>
                PNG, JPG, WEBP up to 2MB
              </div>
              <input 
                type="file" 
                id="logoFile" 
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleLogoChange}
                style={{ display: 'none' }}
              />
            </label>
          )}
        </div>
        <div className="text-tiny" style={{ color: '#6b7280', marginTop: '4px' }}>
          Brand logo image (optional). Recommended size: 200x200px or larger, square format works best.
        </div>
      </fieldset>

      <div className="bot">
        <div />
        <button 
          className="tf-button w208" 
          type="submit"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <i className="icon-loader" style={{ marginRight: '8px' }} />
              Creating...
            </>
          ) : (
            <>
              <i className="icon-plus" style={{ marginRight: '8px' }} />
              Create Brand
            </>
          )}
        </button>
      </div>
    </form>
  );
}
