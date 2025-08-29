"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getCategoriesClient } from "@/lib/api/categories";
import GetToken from "@/lib/GetTokenClient";

const CategoryItem = ({ 
  category, 
  onSelect, 
  selectedId, 
  searchTerm 
}) => {
  // Check if this category matches the search term
  const matchesSearch = useMemo(() => {
    if (!searchTerm) return true;
    return category.name.toLowerCase().includes(searchTerm.toLowerCase());
  }, [category, searchTerm]);

  if (!matchesSearch) return null;

  const isSelected = selectedId === category.id;

  return (
    <div 
      className={`category-item ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(category)}
    >
      <div className="category-item-content">
        <div className="category-info">
          <span className="category-name">{category.name}</span>
          {category.productCount > 0 && (
            <Badge variant="secondary" className="product-count">
              {category.productCount}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export default function CategorySelector({ 
  value, 
  onValueChange, 
  placeholder = "Ангилал сонгоно уу",
  disabled = false 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);

  const TOKEN = GetToken();

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const categoriesData = await getCategoriesClient(TOKEN, true);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error loading categories:", error);
      } finally {
        setLoading(false);
      }
    };

    if (TOKEN) {
      loadCategories();
    }
  }, [TOKEN]);

  // Find selected category when value changes
  useEffect(() => {
    if (value && categories.length > 0) {
      const found = categories.find(cat => cat.id === parseInt(value));
      setSelectedCategory(found || null);
    } else {
      setSelectedCategory(null);
    }
  }, [value, categories]);

  const handleSelect = (category) => {
    onValueChange(category.id.toString());
    setSelectedCategory(category);
    setIsOpen(false);
    setSearchTerm("");
  };

  const getBreadcrumb = (category) => {
    if (!category) return "";
    return category.name;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="premium-select-wrapper">
          <div className="input-icon">
            <i className="icon-grid" />
          </div>
          <Button
            variant="outline"
            className="premium-category-trigger"
            disabled={disabled}
            type="button"
          >
            <span className="category-trigger-text">
              {selectedCategory ? getBreadcrumb(selectedCategory) : placeholder}
            </span>
            <i className="icon-chevron-down" />
          </Button>
          <div className="input-border-animation"></div>
        </div>
      </DialogTrigger>
      
      <DialogContent className="category-selector-modal">
        <DialogHeader>
          <DialogTitle>Ангилал сонгох</DialogTitle>
          <DialogDescription>
            Бүтээгдэхүүний ангиллыг сонгоно уу. Хайлтын хэсэгт бичиж хурдан олох боломжтой.
          </DialogDescription>
        </DialogHeader>
        
        <div className="category-selector-content">
          {/* Search Input */}
          <div className="search-wrapper">
            <div className="search-input-wrapper">
              <i className="icon-search" />
              <Input
                placeholder="Ангилал хайх..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button
                  className="clear-search"
                  onClick={() => setSearchTerm("")}
                  type="button"
                >
                  <i className="icon-x" />
                </button>
              )}
            </div>
          </div>

          {/* Category List */}
          <div className="category-list-container">
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner" />
                <span>Ачааллаж байна...</span>
              </div>
            ) : categories.length === 0 ? (
              <div className="empty-state">
                <i className="icon-folder" />
                <span>Ангилал олдсонгүй</span>
              </div>
            ) : (
              <div className="category-list">
                {categories.map((category) => (
                  <CategoryItem
                    key={category.id}
                    category={category}
                    onSelect={handleSelect}
                    selectedId={selectedCategory?.id}
                    searchTerm={searchTerm}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
