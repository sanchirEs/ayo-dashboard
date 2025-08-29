"use client";
import { useState, useEffect } from "react";
import { getBrandsClient } from "@/lib/api/brands";
import GetToken from "@/lib/GetTokenClient";

export default function BrandSelector({ value, onChange, disabled = false, className = "" }) {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const TOKEN = GetToken();

  useEffect(() => {
    async function loadBrands() {
      if (!TOKEN) return;
      
      try {
        setLoading(true);
        const brandsData = await getBrandsClient(TOKEN);
        setBrands(brandsData || []);
      } catch (err) {
        console.error("Error loading brands:", err);
        setError("Failed to load brands");
      } finally {
        setLoading(false);
      }
    }

    loadBrands();
  }, [TOKEN]);

  if (error) {
    return (
      <div className="text-red-500 text-sm">
        <i className="icon-alert-circle mr-2" />
        {error}
      </div>
    );
  }

  return (
    <div className={`brand-selector ${className}`}>
      <select
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value || null)}
        disabled={disabled || loading}
        className="tf-select w-full"
      >
        <option value="">
          {loading ? "Loading brands..." : "Select brand (optional)"}
        </option>
        {brands.map((brand) => (
          <option key={brand.id} value={brand.id}>
            {brand.name}
          </option>
        ))}
      </select>
      
      {brands.length === 0 && !loading && (
        <div className="text-sm text-gray-500 mt-1">
          <i className="icon-info mr-1" />
          No brands available. 
          <a href="/new-brand" className="text-blue-600 hover:text-blue-800 ml-1">
            Create one?
          </a>
        </div>
      )}
    </div>
  );
}
