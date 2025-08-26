"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import GetToken from "@/lib/GetTokenClient";
import { getBackendUrl } from "@/lib/api/env";

/**
 * Reusable ImageUpload component with drag-and-drop, progress tracking, and validation
 */
export default function ImageUpload({
  onImagesChange,
  maxFiles = 10,
  maxFileSize = 5 * 1024 * 1024, // 5MB
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  folder = 'products',
  type = 'products',
  className = '',
  disabled = false,
  showPreview = true,
  allowRemove = true,
  uploadEndpoint = '/api/v1/upload/images',
  autoUpload = false, // If true, uploads immediately; if false, returns files for manual upload
  initialImages = [],
  onUploadComplete,
  onUploadError,
  onUploadProgress
}) {
  const [images, setImages] = useState(initialImages);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState([]);
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

    // Check file name length
    if (file.name.length > 100) {
      errors.push(`${file.name}: Filename too long. Maximum 100 characters.`);
    }

    return errors;
  }, [acceptedTypes, maxFileSize]);

  // Validate multiple files
  const validateFiles = useCallback((files) => {
    const allErrors = [];
    const validFiles = [];

    // Check total count
    const totalFiles = images.length + files.length;
    if (totalFiles > maxFiles) {
      allErrors.push(`Too many files. Maximum ${maxFiles} files allowed. You have ${images.length} existing and trying to add ${files.length}.`);
      return { validFiles: [], errors: allErrors };
    }

    // Check total size
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const maxTotalSize = 50 * 1024 * 1024; // 50MB total
    if (totalSize > maxTotalSize) {
      allErrors.push(`Total file size too large. Maximum 50MB allowed.`);
      return { validFiles: [], errors: allErrors };
    }

    // Validate each file
    files.forEach(file => {
      const fileErrors = validateFile(file);
      if (fileErrors.length === 0) {
        validFiles.push(file);
      } else {
        allErrors.push(...fileErrors);
      }
    });

    return { validFiles, errors: allErrors };
  }, [images.length, maxFiles, validateFile]);

  // Handle file selection
  const handleFiles = useCallback(async (files) => {
    const fileArray = Array.from(files);
    const { validFiles, errors } = validateFiles(fileArray);

    setErrors(errors);

    if (validFiles.length === 0) {
      return;
    }

    if (autoUpload) {
      await uploadFiles(validFiles);
    } else {
      // Generate previews for manual upload
      const newImages = await Promise.all(
        validFiles.map(async (file) => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                id: `preview_${Date.now()}_${Math.random()}`,
                file,
                preview: reader.result,
                name: file.name,
                size: file.size,
                type: file.type,
                uploaded: false,
                uploading: false
              });
            };
            reader.readAsDataURL(file);
          });
        })
      );

      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      onImagesChange?.(updatedImages);
    }
  }, [validateFiles, autoUpload, images, onImagesChange]);

  // Upload files to server
  const uploadFiles = useCallback(async (files) => {
    if (!TOKEN) {
      const error = "Authentication token required for upload";
      setErrors([error]);
      onUploadError?.(error);
      return;
    }

    setUploading(true);
    setErrors([]);

    try {
      const formData = new FormData();
      
      // Add files
      files.forEach((file) => {
        formData.append('images', file);
      });

      // Add metadata
      formData.append('folder', folder);
      formData.append('type', type);

      // Upload with progress tracking
      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        // Track upload progress
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(prev => ({
              ...prev,
              overall: percentComplete
            }));
            onUploadProgress?.(percentComplete);
          }
        });

        xhr.addEventListener('load', () => {
          try {
            const response = JSON.parse(xhr.responseText);
            
            if (xhr.status === 201 && response.success) {
              const uploadedImages = response.data.images.map(img => ({
                id: img.id,
                url: img.url,
                optimized_url: img.optimized_url,
                thumbnail_url: img.thumbnail_url,
                name: img.original_filename,
                size: img.size,
                format: img.format,
                width: img.width,
                height: img.height,
                uploaded: true,
                uploading: false,
                cloudinary_public_id: img.id
              }));

              const updatedImages = [...images, ...uploadedImages];
              setImages(updatedImages);
              onImagesChange?.(updatedImages);
              onUploadComplete?.(uploadedImages);
              resolve(uploadedImages);
            } else {
              const error = response.message || 'Upload failed';
              setErrors([error]);
              onUploadError?.(error);
              reject(new Error(error));
            }
          } catch (e) {
            const error = 'Invalid response from server';
            setErrors([error]);
            onUploadError?.(error);
            reject(new Error(error));
          }
        });

        xhr.addEventListener('error', () => {
          const error = 'Network error during upload';
          setErrors([error]);
          onUploadError?.(error);
          reject(new Error(error));
        });

        xhr.addEventListener('abort', () => {
          const error = 'Upload cancelled';
          setErrors([error]);
          reject(new Error(error));
        });

        xhr.open('POST', `${getBackendUrl()}${uploadEndpoint}`);
        xhr.setRequestHeader('Authorization', `Bearer ${TOKEN}`);
        xhr.send(formData);
      });

    } catch (error) {
      const errorMessage = error.message || 'Upload failed';
      setErrors([errorMessage]);
      onUploadError?.(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  }, [TOKEN, folder, type, uploadEndpoint, images, onImagesChange, onUploadComplete, onUploadError, onUploadProgress]);

  // Remove image
  const removeImage = useCallback(async (imageId) => {
    const imageToRemove = images.find(img => img.id === imageId);
    
    if (imageToRemove?.cloudinary_public_id && imageToRemove.uploaded) {
      // Delete from Cloudinary
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
          console.warn('Failed to delete image from Cloudinary:', await response.text());
        }
      } catch (error) {
        console.warn('Error deleting image from Cloudinary:', error);
      }
    }

    const updatedImages = images.filter(img => img.id !== imageId);
    setImages(updatedImages);
    onImagesChange?.(updatedImages);
  }, [images, TOKEN, onImagesChange]);

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
      handleFiles(files);
    }
  }, [disabled, uploading, handleFiles]);

  // File input change handler
  const handleInputChange = useCallback((e) => {
    if (disabled || uploading) return;
    
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }, [disabled, uploading, handleFiles]);

  // Manual upload trigger (for non-auto upload mode)
  const triggerUpload = useCallback(async () => {
    const filesToUpload = images.filter(img => !img.uploaded && img.file);
    if (filesToUpload.length === 0) return;

    const files = filesToUpload.map(img => img.file);
    await uploadFiles(files);
  }, [images, uploadFiles]);

  // Clear all images
  const clearImages = useCallback(() => {
    setImages([]);
    setErrors([]);
    onImagesChange?.([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onImagesChange]);

  return (
    <div className={`image-upload-container ${className}`}>
      {/* Upload Area */}
      <div
        className={`upload-dropzone ${dragActive ? 'drag-active' : ''} ${disabled ? 'disabled' : ''} ${uploading ? 'uploading' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
      >
        <div className="dropzone-content">
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
          </div>
          
          <div className="upload-text">
            <h4 className="upload-title">
              {uploading ? 'Uploading...' : 'Drop images here or click to browse'}
            </h4>
            <p className="upload-description">
              {uploading ? (
                <span>
                  {uploadProgress.overall ? `${uploadProgress.overall}% complete` : 'Processing images...'}
                </span>
              ) : (
                <>
                  Support JPEG, PNG, WebP • Max {Math.round(maxFileSize / (1024 * 1024))}MB per file • Max {maxFiles} files
                </>
              )}
            </p>
          </div>

          {/* Progress Bar */}
          {uploading && uploadProgress.overall && (
            <div className="upload-progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${uploadProgress.overall}%` }}
              ></div>
            </div>
          )}
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

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="upload-errors">
          {errors.map((error, index) => (
            <div key={index} className="error-message">
              <i className="icon-alert-circle" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Grid */}
      {showPreview && images.length > 0 && (
        <div className="image-preview-section">
          <div className="preview-header">
            <h5 className="preview-title">
              Selected Images ({images.length}/{maxFiles})
            </h5>
            <div className="preview-actions">
              {!autoUpload && images.some(img => !img.uploaded) && (
                <Button
                  type="button"
                  onClick={triggerUpload}
                  disabled={uploading || disabled}
                  className="upload-trigger-btn"
                  size="sm"
                >
                  <i className="icon-upload" />
                  Upload {images.filter(img => !img.uploaded).length} image{images.filter(img => !img.uploaded).length > 1 ? 's' : ''}
                </Button>
              )}
              {allowRemove && (
                <Button
                  type="button"
                  onClick={clearImages}
                  disabled={uploading || disabled}
                  variant="outline"
                  size="sm"
                  className="clear-all-btn"
                >
                  <i className="icon-trash-2" />
                  Clear All
                </Button>
              )}
            </div>
          </div>

          <div className="image-preview-grid">
            {images.map((image, index) => (
              <div key={image.id} className="image-preview-item">
                <div className="image-wrapper">
                  <img
                    src={image.preview || image.url || image.thumbnail_url}
                    alt={image.name}
                    className="preview-image"
                    loading="lazy"
                  />
                  
                  {/* Upload Status Overlay */}
                  <div className={`image-overlay ${image.uploaded ? 'uploaded' : image.uploading ? 'uploading' : 'pending'}`}>
                    <div className="overlay-content">
                      {image.uploading ? (
                        <div className="uploading-indicator">
                          <div className="spinner-sm"></div>
                          <span>Uploading...</span>
                        </div>
                      ) : image.uploaded ? (
                        <div className="uploaded-indicator">
                          <i className="icon-check-circle" />
                          <span>Uploaded</span>
                        </div>
                      ) : (
                        <div className="pending-indicator">
                          <i className="icon-clock" />
                          <span>Pending</span>
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
                          window.open(image.preview || image.url, '_blank');
                        }}
                        title="View full size"
                      >
                        <i className="icon-eye" />
                      </button>
                      
                      {allowRemove && (
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
                      )}
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
                      {image.width && image.height && (
                        <span className="dimensions">
                          {image.width}×{image.height}
                        </span>
                      )}
                      {image.format && (
                        <span className="format">
                          {image.format.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Summary */}
      {images.length > 0 && (
        <div className="upload-summary">
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-label">Total:</span>
              <span className="stat-value">{images.length} image{images.length > 1 ? 's' : ''}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Size:</span>
              <span className="stat-value">
                {(images.reduce((sum, img) => sum + (img.size || 0), 0) / (1024 * 1024)).toFixed(1)}MB
              </span>
            </div>
            {!autoUpload && (
              <div className="stat-item">
                <span className="stat-label">Status:</span>
                <span className="stat-value">
                  {images.filter(img => img.uploaded).length} uploaded, {images.filter(img => !img.uploaded).length} pending
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .image-upload-container {
          width: 100%;
        }

        .upload-dropzone {
          border: 2px dashed #e2e8f0;
          border-radius: 12px;
          padding: 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          position: relative;
          overflow: hidden;
        }

        .upload-dropzone:hover:not(.disabled):not(.uploading) {
          border-color: #3b82f6;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        }

        .upload-dropzone.drag-active {
          border-color: #10b981;
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          transform: scale(1.02);
        }

        .upload-dropzone.disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background: #f8fafc;
        }

        .upload-dropzone.uploading {
          border-color: #f59e0b;
          background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
        }

        .dropzone-content {
          position: relative;
          z-index: 2;
        }

        .upload-icon-wrapper {
          margin-bottom: 1rem;
        }

        .upload-icon {
          font-size: 3rem;
          color: #64748b;
          transition: color 0.3s ease;
        }

        .upload-dropzone:hover .upload-icon {
          color: #3b82f6;
        }

        .loading-spinner {
          display: inline-block;
          position: relative;
        }

        .spinner-ring {
          display: inline-block;
          width: 48px;
          height: 48px;
          border: 4px solid #f3f4f6;
          border-radius: 50%;
          border-top-color: #3b82f6;
          animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .upload-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }

        .upload-description {
          color: #64748b;
          margin-bottom: 1rem;
        }

        .upload-input {
          display: none;
        }

        .upload-progress-bar {
          width: 100%;
          height: 4px;
          background: #e2e8f0;
          border-radius: 2px;
          overflow: hidden;
          margin-top: 1rem;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #10b981);
          transition: width 0.3s ease;
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
          padding: 0.5rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
        }

        .image-preview-section {
          margin-top: 1.5rem;
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .preview-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1e293b;
        }

        .preview-actions {
          display: flex;
          gap: 0.5rem;
        }

        .image-preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }

        .image-preview-item {
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          background: #fff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .image-preview-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .image-wrapper {
          position: relative;
          aspect-ratio: 1;
        }

        .preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .image-preview-item:hover .image-overlay {
          opacity: 1;
        }

        .overlay-content {
          text-align: center;
          color: white;
          margin-bottom: 1rem;
        }

        .uploaded-indicator {
          color: #10b981;
        }

        .uploading-indicator {
          color: #f59e0b;
        }

        .pending-indicator {
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
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.05);
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .remove-btn:hover {
          background: rgba(239, 68, 68, 0.8);
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

        .upload-summary {
          margin-top: 1rem;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .summary-stats {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .stat-item {
          display: flex;
          gap: 0.25rem;
        }

        .stat-label {
          font-weight: 500;
          color: #64748b;
        }

        .stat-value {
          color: #1e293b;
          font-weight: 600;
        }

        .spinner-sm {
          width: 16px;
          height: 16px;
          border: 2px solid #f3f4f6;
          border-radius: 50%;
          border-top-color: #3b82f6;
          animation: spin 1s ease-in-out infinite;
        }

        @media (max-width: 768px) {
          .image-preview-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 0.75rem;
          }
          
          .upload-dropzone {
            padding: 1.5rem;
          }
          
          .summary-stats {
            flex-direction: column;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}


