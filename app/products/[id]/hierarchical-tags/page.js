"use client";
import Layout from "@/components/layout/Layout";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import GetToken from "@/lib/GetTokenClient";
import {
  getTagGroups,
  getProductHierarchicalTags,
  addProductHierarchicalTags,
  replaceProductHierarchicalTags,
  removeProductHierarchicalTag,
} from "@/lib/api/hierarchicalTags";
import { getProductById } from "@/lib/api/products";

export default function ProductHierarchicalTagsPage() {
  const params = useParams();
  const productId = Number(params?.id);
  const token = GetToken();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [product, setProduct] = useState(null);
  const [tagGroups, setTagGroups] = useState([]);
  const [productTags, setProductTags] = useState(null);
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    
    const [productData, groupsData, tagsData] = await Promise.all([
      getProductById(productId, token),
      getTagGroups(),
      getProductHierarchicalTags(productId)
    ]);
    
    setProduct(productData);
    setTagGroups(Array.isArray(groupsData) ? groupsData : []);
    setProductTags(tagsData);
    
    // Initialize selected tags
    if (tagsData && tagsData.tagGroups) {
      const currentTagIds = new Set();
      tagsData.tagGroups.forEach(group => {
        group.options.forEach(option => {
          currentTagIds.add(option.id);
        });
      });
      setSelectedTags(currentTagIds);
    }
    
    setLoading(false);
  }

  useEffect(() => {
    if (productId) load();
  }, [productId]);

  function toggleTag(optionId) {
    setSelectedTags(prev => {
      const newSet = new Set(prev);
      if (newSet.has(optionId)) {
        newSet.delete(optionId);
      } else {
        newSet.add(optionId);
      }
      return newSet;
    });
  }

  async function saveTags() {
    if (!token) return setError("Not authenticated");
    
    setSaving(true);
    setError("");
    setSuccess("");
    
    const tagOptionIds = Array.from(selectedTags);
    const ok = await replaceProductHierarchicalTags(
      productId,
      { tagOptionIds },
      token
    );
    
    setSaving(false);
    
    if (!ok) return setError("Failed to save tags");
    
    setSuccess("Product tags updated successfully");
    await load();
  }

  async function removeTag(optionId) {
    if (!token) return setError("Not authenticated");
    
    const ok = await removeProductHierarchicalTag(productId, optionId, token);
    if (!ok) return setError("Failed to remove tag");
    
    setSuccess("Tag removed successfully");
    setSelectedTags(prev => {
      const newSet = new Set(prev);
      newSet.delete(optionId);
      return newSet;
    });
    await load();
  }

  if (loading) {
    return (
      <Layout breadcrumbTitleParent="Products" breadcrumbTitle="Product Tags">
        <div className="wg-box">
          <div className="body-text">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout breadcrumbTitleParent="Products" breadcrumbTitle="Product Tags">
        <div className="wg-box">
          <div className="body-text">Product not found</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout breadcrumbTitleParent="Products" breadcrumbTitle="Manage Product Tags">
      <div className="wg-box">
        <div className="flex items-center justify-between gap10 flex-wrap">
          <div>
            <div className="body-title-2">{product.name}</div>
            <div className="text-tiny">SKU: {product.sku}</div>
            <div className="text-tiny">
              {productTags?.totalTags || 0} tag{productTags?.totalTags !== 1 ? 's' : ''} assigned
            </div>
          </div>
          <div className="flex gap10">
            <Link className="tf-button style-3 w208" href={`/products/${productId}`}>
              <i className="icon-arrow-left" /> Back to Product
            </Link>
            <Link className="tf-button style-1 w208" href="/hierarchical-tags">
              <i className="icon-settings" /> Manage Groups
            </Link>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="alert alert-danger mb-4" style={{ 
            color: "red", 
            padding: 10, 
            border: "1px solid red", 
            borderRadius: 4,
            marginTop: 16 
          }}>
            {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success mb-4" style={{ 
            color: "green", 
            padding: 10, 
            border: "1px solid green", 
            borderRadius: 4,
            marginTop: 16 
          }}>
            {success}
          </div>
        )}

        {/* Current Tags */}
        {productTags && productTags.tagGroups && productTags.tagGroups.length > 0 && (
          <div className="wg-box" style={{ marginTop: 16 }}>
            <div className="body-title mb-14">Current Tags</div>
            <div className="flex flex-wrap gap10">
              {productTags.tagGroups.map(group => 
                group.options.map(option => (
                  <div 
                    key={option.id} 
                    className="tag-item"
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#f8f9fa",
                      border: "1px solid #dee2e6",
                      borderRadius: "4px",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}
                  >
                    <span>{group.groupName}: {option.name}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(option.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#dc3545",
                        cursor: "pointer",
                        padding: "0",
                        fontSize: "12px"
                      }}
                      title="Remove tag"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tag Selection */}
        <div className="wg-box" style={{ marginTop: 16 }}>
          <div className="body-title mb-14">Select Tags</div>
          
          {tagGroups.length === 0 ? (
            <div className="body-text">
              No tag groups available. 
              <Link href="/hierarchical-tags/new" className="text-primary"> Create one first</Link>.
            </div>
          ) : (
            tagGroups.map(group => (
              <div key={group.id} className="tag-group-section" style={{ marginBottom: "24px" }}>
                <div className="body-title-2 mb-10">{group.name}</div>
                {group.description && (
                  <div className="text-tiny mb-10">{group.description}</div>
                )}
                
                {group.options && group.options.length > 0 ? (
                  <div className="flex flex-wrap gap10">
                    {group.options.map(option => (
                      <label 
                        key={option.id} 
                        className="tag-option-checkbox"
                        style={{
                          padding: "8px 12px",
                          border: "1px solid #dee2e6",
                          borderRadius: "4px",
                          cursor: "pointer",
                          backgroundColor: selectedTags.has(option.id) ? "#007bff" : "#fff",
                          color: selectedTags.has(option.id) ? "#fff" : "#333",
                          fontSize: "14px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          transition: "all 0.2s"
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedTags.has(option.id)}
                          onChange={() => toggleTag(option.id)}
                          style={{ display: "none" }}
                        />
                        {option.name}
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-tiny">
                    No options available. 
                    <Link href={`/hierarchical-tags/${group.id}/options`} className="text-primary">
                      Add options
                    </Link>.
                  </div>
                )}
              </div>
            ))
          )}
          
          <div className="bot" style={{ marginTop: "24px" }}>
            <div className="text-tiny">
              {selectedTags.size} tag{selectedTags.size !== 1 ? 's' : ''} selected
            </div>
            <button 
              className="tf-button w208" 
              type="button" 
              onClick={saveTags}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Tags"}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
