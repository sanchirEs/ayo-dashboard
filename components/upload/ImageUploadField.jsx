"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import GetToken from "@/lib/GetTokenClient";
import { getBackendUrl } from "@/lib/api/env";
import toastManager from "@/lib/toast";

/**
 * Enhanced ImageUploadField component that integrates with react-hook-form
 * Provides drag-and-drop, progress tracking, and real-time upload capabilities
 */
export default function ImageUploadField({
  value = [], // Current form value (array of files)
  onChange, // Form onChange handler
  onBlur, // Form onBlur handler
  disabled = false,
  maxFiles = 10,
  maxFileSize = 5 * 1024 * 1024, // 5MB
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  folder = 'products',
  type = 'products',
  className = '',
  showProgress = true,
  autoUpload = false, // If true, uploads to Cloudinary immediately
  onUploadComplete,
  onUploadError,
  onPrimaryChange // Callback when primary image changes
}) {
  const [previewImages, setPreviewImages] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadErrors, setUploadErrors] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [primaryImageId, setPrimaryImageId] = useState(null); // Track primary image
  const fileInputRef = useRef(null);
  const TOKEN = GetToken();

  // File validation
  const validateFile = useCallback((file) => {
    const errors = [];

    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      errors.push(`${file.name}: Invalid file type. Only JPEG, PNG, and WebP images are allowed.`);
    }

    // Check file size
    if (file.size > maxFileSize) {
      const sizeMB = Math.round(maxFileSize / (1024 * 1024));
      errors.push(`${file.name}: File too large. Maximum size is ${sizeMB}MB.`);
    }

    return errors;
  }, [acceptedTypes, maxFileSize]);

  // Handle file selection with enhanced validation
  const handleFileSelection = useCallback(async (files) => {
    const fileArray = Array.from(files);
    const allErrors = [];
    const validFiles = [];

    // Check total count
    const totalFiles = value.length + fileArray.length;
    if (totalFiles > maxFiles) {
      allErrors.push(`Too many files. Maximum ${maxFiles} files allowed.`);
      setUploadErrors(allErrors);
      return;
    }

    // Validate each file
    fileArray.forEach(file => {
      const fileErrors = validateFile(file);
      if (fileErrors.length === 0) {
        validFiles.push(file);
      } else {
        allErrors.push(...fileErrors);
      }
    });

    setUploadErrors(allErrors);

    if (validFiles.length === 0) {
      return;
    }

    if (autoUpload && TOKEN) {
      // Upload to Cloudinary immediately
      await uploadToCloudinary(validFiles);
    } else {
      // Generate previews and add to form
      generatePreviews(validFiles);
      
      // Update form with new files
      const updatedFiles = [...value, ...validFiles];
      onChange(updatedFiles);
    }
  }, [value, maxFiles, validateFile, autoUpload, TOKEN, onChange]);

  // Set primary image
  const setPrimaryImage = useCallback((imageId) => {
    setPrimaryImageId(imageId);
    
    // Update the previewImages to mark primary status
    setPreviewImages(prev => {
      const updated = prev.map(img => ({
        ...img,
        isPrimary: img.id === imageId
      }));
      
      // Defer callback to avoid setState during render
      setTimeout(() => {
        onPrimaryChange?.(updated);
      }, 0);
      
      return updated;
    });
  }, [onPrimaryChange]);

  // Generate preview images
  const generatePreviews = useCallback((files) => {
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const newImage = {
          id: `${file.name}_${Date.now()}_${Math.random()}`,
          src: reader.result,
          name: file.name,
          size: file.size,
          type: file.type,
          file: file,
          uploaded: false,
          isPrimary: false
        };
        
        setPreviewImages(current => {
          const updated = [...current, newImage];
          // Set first image as primary if none selected
          if (!primaryImageId && updated.length === 1) {
            newImage.isPrimary = true;
            // Defer setState to avoid render cycle issues
            setTimeout(() => {
              setPrimaryImageId(newImage.id);
            }, 0);
          }
          return updated;
        });
      };
      reader.readAsDataURL(file);
    });
  }, [primaryImageId]);

  // Upload to Cloudinary with progress tracking
  const uploadToCloudinary = useCallback(async (files) => {
    if (!TOKEN) {
      setUploadErrors(['Authentication required for upload']);
      onUploadError?.('Authentication required');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadErrors([]);

    try {
      const formData = new FormData();
      
      files.forEach((file) => {
        formData.append('images', file);
      });
      
      formData.append('folder', folder);
      formData.append('type', type);

      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(percentComplete);
          }
        });

        xhr.addEventListener('load', () => {
          try {
            const response = JSON.parse(xhr.responseText);
            
            if (xhr.status === 201 && response.success) {
              const cloudinaryImages = response.data.images.map((img, index) => ({
                id: img.id,
                src: img.optimized_url || img.url, // Use optimized URL or fallback to regular URL
                name: img.original_filename,
                size: img.size,
                type: img.format,
                uploaded: true,
                cloudinary_public_id: img.id,
                url: img.url,
                thumbnail_url: img.thumbnail_url,
                isPrimary: false // Will be set later if needed
              }));

              // Update uploaded images state
              setUploadedImages(prev => [...prev, ...cloudinaryImages]);
              
              // Update preview images
              const updatedImages = [...previewImages, ...cloudinaryImages];
              
              // Handle primary image logic separately to avoid setState during render
              let finalImages = updatedImages;
              if (!primaryImageId && updatedImages.length > 0) {
                const firstImage = updatedImages[0];
                firstImage.isPrimary = true;
                // Use setTimeout to defer setState calls
                setTimeout(() => {
                  setPrimaryImageId(firstImage.id);
                }, 0);
              }
              
              setPreviewImages(finalImages);
              
              // Defer callback to avoid setState during render
              setTimeout(() => {
                onPrimaryChange?.(finalImages);
              }, 0);
              
              // Show success toast
              toastManager?.success(
                `Successfully uploaded ${cloudinaryImages.length} image${cloudinaryImages.length > 1 ? 's' : ''}`,
                { title: 'Upload Complete' }
              );
              
              onUploadComplete?.(cloudinaryImages);
              resolve(cloudinaryImages);
            } else {
              const error = response.message || 'Upload failed';
              setUploadErrors([error]);
              
              // Show error toast
              toastManager?.error(error, { title: 'Upload Failed' });
              
              onUploadError?.(error);
              reject(new Error(error));
            }
          } catch (e) {
            const error = 'Invalid response from server';
            setUploadErrors([error]);
            onUploadError?.(error);
            reject(new Error(error));
          }
        });

        xhr.addEventListener('error', () => {
          const error = 'Network error during upload';
          setUploadErrors([error]);
          toastManager?.error(error, { title: 'Upload Failed' });
          onUploadError?.(error);
          reject(new Error(error));
        });

        xhr.open('POST', `${getBackendUrl()}/api/v1/upload/images`);
        xhr.setRequestHeader('Authorization', `Bearer ${TOKEN}`);
        xhr.send(formData);
      });

      await uploadPromise;
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [TOKEN, folder, type, onUploadComplete, onUploadError, onPrimaryChange, primaryImageId]);

  // Remove image
  const removeImage = useCallback(async (imageId) => {
    const imageToRemove = previewImages.find(img => img.id === imageId);
    
    // If it's uploaded to Cloudinary, delete it
    if (imageToRemove?.uploaded && imageToRemove.cloudinary_public_id && TOKEN) {
      try {
        const response = await fetch(
          `${getBackendUrl()}/api/v1/upload/images/${imageToRemove.cloudinary_public_id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          console.warn('Failed to delete image from Cloudinary');
          toastManager?.warning('Failed to delete image from cloud storage', { title: 'Delete Warning' });
        } else {
          toastManager?.success('Image deleted successfully', { title: 'Image Removed' });
        }
      } catch (error) {
        console.warn('Error deleting image:', error);
      }
    }

    // Remove from previews
    const updatedPreviews = previewImages.filter(img => img.id !== imageId);
    setPreviewImages(updatedPreviews);

    // If this was the primary image, set a new primary
    if (primaryImageId === imageId && updatedPreviews.length > 0) {
      const newPrimary = updatedPreviews[0];
      setPrimaryImageId(newPrimary.id);
      setPreviewImages(prev => prev.map(img => ({
        ...img,
        isPrimary: img.id === newPrimary.id
      })));
    } else if (updatedPreviews.length === 0) {
      setPrimaryImageId(null);
    }

    // Update form value (remove file from form)
    if (!autoUpload && imageToRemove?.file) {
      const updatedFiles = value.filter(file => file !== imageToRemove.file);
      onChange(updatedFiles);
    }
  }, [previewImages, value, onChange, autoUpload, TOKEN, primaryImageId]);

  // Drag and drop handlers
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled || uploading) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelection(files);
    }
  }, [disabled, uploading, handleFileSelection]);

  // File input change handler
  const handleInputChange = useCallback((e) => {
    if (disabled || uploading) return;
    
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files);
    }
  }, [disabled, uploading, handleFileSelection]);

  // Clear all images
  const clearAllImages = useCallback(() => {
    setPreviewImages([]);
    setUploadedImages([]);
    setUploadErrors([]);
    setPrimaryImageId(null);
    onChange([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onChange]);

  return (
    <div className={`enhanced-image-upload ${className}`}>
      {/* Upload Zone */}
      <div
        className={`upload-zone ${dragActive ? 'drag-active' : ''} ${disabled ? 'disabled' : ''} ${uploading ? 'uploading' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
      >
        <div className="upload-content">
          <div className="upload-animation">
            <div className="upload-icon-wrapper">
              <div className="upload-icon">
                {uploading ? (
                  <div className="loading-spinner">
                    <div className="spinner-ring"></div>
                  </div>
                ) : (
                  <i className="icon-upload-cloud" />
                )}
              </div>
              <div className="upload-pulse"></div>
            </div>
          </div>
          
          <div className="upload-text-content">
            <h4 className="upload-title">
              {uploading ? 'Uploading Images...' : 'Drop images here or click to browse'}
            </h4>
            <p className="upload-description">
              {uploading ? (
                showProgress && uploadProgress > 0 ? (
                  <span>Upload progress: {uploadProgress}%</span>
                ) : (
                  <span>Processing images...</span>
                )
              ) : (
                <>
                  Support JPEG, PNG, WebP • Max {Math.round(maxFileSize / (1024 * 1024))}MB per file • Max {maxFiles} files
                </>
              )}
            </p>
            
            {/* Progress Bar */}
            {uploading && showProgress && uploadProgress > 0 && (
              <div className="upload-progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="upload-input"
          accept={acceptedTypes.join(',')}
          multiple
          onChange={handleInputChange}
          disabled={disabled || uploading}
        />
      </div>

      {/* Upload Errors */}
      {uploadErrors.length > 0 && (
        <div className="upload-errors">
          {uploadErrors.map((error, index) => (
            <div key={index} className="error-message">
              <i className="icon-alert-circle" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Grid */}
      {previewImages.length > 0 && (
        <div className="image-preview-section">
          <div className="preview-header">
            <div className="preview-info">
              <span className="image-count">{previewImages.length} image{previewImages.length > 1 ? 's' : ''} selected</span>
              {autoUpload && (
                <span className="upload-status">
                  {uploadedImages.length} uploaded, {previewImages.length - uploadedImages.length} pending
                </span>
              )}
            </div>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearAllImages}
              disabled={uploading}
              className="clear-btn"
            >
              <i className="icon-trash-2" />
              Clear All
            </Button>
          </div>

          <div className="image-grid">
            {previewImages.map((image, index) => (
              <div key={image.id} className={`image-item ${image.isPrimary ? 'primary-image' : ''}`}>
                {/* Primary Badge */}
                {image.isPrimary && (
                  <div className="primary-badge">
                    <i className="icon-star" />
                    <span>Primary</span>
                  </div>
                )}
                
                <div className="image-wrapper">
                  <img
                    src={image.src}
                    alt={image.name}
                    className="preview-image"
                    loading="lazy"
                  />
                  
                  {/* Status Overlay */}
                  <div className={`image-overlay ${image.uploaded ? 'uploaded' : 'pending'}`}>
                    <div className="overlay-content">
                      {image.uploaded ? (
                        <div className="status-indicator uploaded">
                          <i className="icon-check-circle" />
                          <span>Uploaded</span>
                        </div>
                      ) : uploading ? (
                        <div className="status-indicator uploading">
                          <div className="spinner-sm"></div>
                          <span>Uploading...</span>
                        </div>
                      ) : (
                        <div className="status-indicator pending">
                          <i className="icon-clock" />
                          <span>Ready</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="overlay-actions">
                      <button
                        type="button"
                        className="action-btn view-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(image.src, '_blank');
                        }}
                        title="View full size"
                      >
                        <i className="icon-eye" />
                      </button>
                      
                      {!image.isPrimary && (
                        <button
                          type="button"
                          className="action-btn primary-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPrimaryImage(image.id);
                          }}
                          title="Set as primary image"
                        >
                          <i className="icon-star" />
                        </button>
                      )}
                      
                      <button
                        type="button"
                        className="action-btn remove-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(image.id);
                        }}
                        disabled={uploading}
                        title="Remove image"
                      >
                        <i className="icon-x" />
                      </button>
                    </div>
                  </div>

                  {/* Image Info */}
                  <div className="image-info">
                    <div className="image-name" title={image.name}>
                      {image.name}
                    </div>
                    <div className="image-details">
                      <span className="file-size">
                        {(image.size / (1024 * 1024)).toFixed(1)}MB
                      </span>
                      <span className="file-type">
                        {image.type?.split('/')[1]?.toUpperCase() || 'IMG'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .enhanced-image-upload {
          width: 100%;
        }

        .upload-zone {
          border: 2px dashed #e2e8f0;
          border-radius: 12px;
          padding: 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          position: relative;
          overflow: hidden;
        }

        .upload-zone::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, transparent 30%, rgba(59, 130, 246, 0.05) 50%, transparent 70%);
          transform: translateX(-100%);
          transition: transform 0.6s ease;
        }

        .upload-zone:hover::before {
          transform: translateX(100%);
        }

        .upload-zone:hover:not(.disabled):not(.uploading) {
          border-color: #3b82f6;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
        }

        .upload-zone.drag-active {
          border-color: #10b981;
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          transform: scale(1.02);
          box-shadow: 0 12px 35px rgba(16, 185, 129, 0.2);
        }

        .upload-zone.disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background: #f8fafc;
        }

        .upload-zone.uploading {
          border-color: #f59e0b;
          background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
          cursor: not-allowed;
        }

        .upload-content {
          position: relative;
          z-index: 2;
        }

        .upload-animation {
          margin-bottom: 1.5rem;
        }

        .upload-icon-wrapper {
          position: relative;
          display: inline-block;
        }

        .upload-icon {
          font-size: 3rem;
          color: #64748b;
          transition: all 0.3s ease;
        }

        .upload-zone:hover .upload-icon {
          color: #3b82f6;
          transform: scale(1.1);
        }

        .upload-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100%;
          height: 100%;
          border: 2px solid #3b82f6;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          opacity: 0;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
          }
        }

        .loading-spinner {
          display: inline-block;
        }

        .spinner-ring {
          width: 48px;
          height: 48px;
          border: 4px solid #f3f4f6;
          border-radius: 50%;
          border-top-color: #3b82f6;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .upload-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.5rem;
          transition: color 0.3s ease;
        }

        .upload-zone:hover .upload-title {
          color: #3b82f6;
        }

        .upload-description {
          color: #64748b;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .upload-progress-bar {
          width: 100%;
          height: 6px;
          background: rgba(226, 232, 240, 0.5);
          border-radius: 3px;
          overflow: hidden;
          margin-top: 1rem;
          backdrop-filter: blur(10px);
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #10b981);
          border-radius: 3px;
          transition: width 0.3s ease;
          position: relative;
        }

        .progress-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          animation: shimmer 2s ease-in-out infinite;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .upload-input {
          display: none;
        }

        .upload-errors {
          margin-top: 1rem;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #dc2626;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
          padding: 0.75rem;
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
          border: 1px solid #fecaca;
          border-radius: 8px;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .image-preview-section {
          margin-top: 1.5rem;
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .preview-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .image-count {
          font-weight: 600;
          color: #1e293b;
        }

        .upload-status {
          font-size: 0.875rem;
          color: #64748b;
        }

        .image-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 1rem;
        }

        .image-item {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          background: #fff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .image-item:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .image-item.primary-image {
          border: 2px solid #f59e0b;
          box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
        }

        .image-item.primary-image:hover {
          box-shadow: 0 8px 25px rgba(245, 158, 11, 0.4);
        }

        .primary-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
          color: white;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 4px;
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
        }

        .image-wrapper {
          position: relative;
          aspect-ratio: 1;
        }

        .preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .image-item:hover .preview-image {
          transform: scale(1.05);
        }

        .image-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.5) 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          opacity: 0;
          transition: opacity 0.3s ease;
          backdrop-filter: blur(2px);
        }

        .image-item:hover .image-overlay {
          opacity: 1;
        }

        .overlay-content {
          text-align: center;
          color: white;
          margin-bottom: 1rem;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .status-indicator.uploaded {
          color: #10b981;
        }

        .status-indicator.uploading {
          color: #f59e0b;
        }

        .status-indicator.pending {
          color: #64748b;
        }

        .overlay-actions {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 0.5rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          backdrop-filter: blur(10px);
        }

        .action-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.1);
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .remove-btn:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.8);
          border-color: rgba(239, 68, 68, 0.9);
        }

        .primary-btn:hover:not(:disabled) {
          background: rgba(245, 158, 11, 0.8);
          border-color: rgba(245, 158, 11, 0.9);
        }

        .image-info {
          padding: 0.75rem;
          background: white;
        }

        .image-name {
          font-weight: 500;
          font-size: 0.875rem;
          color: #1e293b;
          margin-bottom: 0.25rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .image-details {
          display: flex;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: #64748b;
        }

        .file-size, .file-type {
          padding: 0.125rem 0.375rem;
          background: #f1f5f9;
          border-radius: 4px;
          font-weight: 500;
        }

        .spinner-sm {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s linear infinite;
        }

        .clear-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .image-grid {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 0.75rem;
          }
          
          .upload-zone {
            padding: 1.5rem;
          }
          
          .upload-title {
            font-size: 1.1rem;
          }
          
          .upload-description {
            font-size: 0.8rem;
          }
          
          .preview-header {
            flex-direction: column;
            gap: 0.75rem;
            align-items: stretch;
          }
        }

        @media (max-width: 480px) {
          .image-grid {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 0.5rem;
          }
          
          .upload-zone {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
