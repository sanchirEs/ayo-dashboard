"use server";
import Layout from "@/components/layout/Layout";
import { getBrandById } from "@/lib/api/brands";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function BrandDetail({ params }) {
  const id = Number((await params).id);
  
  try {
    const brand = await getBrandById(id);
    
    if (!brand) {
      notFound();
    }

    return (
      <>
        <Layout breadcrumbTitleParent="Бараа" breadcrumbTitle={`Брэнд: ${brand.name}`}>
          <div className="wg-box">
            <div className="flex items-start justify-between gap-6 mb-8">
              <div className="flex items-center gap-6">
                {brand.logoUrl ? (
                  <div className="brand-logo-large" style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '2px solid #e5e7eb',
                    backgroundColor: '#f9fafb'
                  }}>
                    <img
                      src={brand.logoUrl}
                      alt={`${brand.name} logo`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                ) : (
                  <div className="brand-logo-placeholder" style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '12px',
                    border: '2px dashed #d1d5db',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f9fafb'
                  }}>
                    <i className="icon-image" style={{ fontSize: '32px', color: '#9ca3af' }} />
                  </div>
                )}
                
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{brand.name}</h2>
                  {brand.description && (
                    <p className="text-gray-600 mb-4 max-w-md leading-relaxed">
                      {brand.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <i className="icon-package" />
                      <span>{brand.productCount || 0} products</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <i className="icon-calendar" />
                      <span>Created {new Date(brand.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {brand.websiteUrl && (
                    <div className="mt-3">
                      <a 
                        href={brand.websiteUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                      >
                        <i className="icon-external-link" />
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3">
                <Link href={`/edit-brand/${brand.id}`} className="tf-button style-1">
                  <i className="icon-edit-3" />
                  Edit Brand
                </Link>
                <Link href="/brand-list" className="tf-button style-2">
                  <i className="icon-arrow-left" />
                  Back to List
                </Link>
              </div>
            </div>
            
            {/* Brand Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="stat-card bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <i className="icon-package text-white text-xl" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-900">{brand.productCount || 0}</div>
                    <div className="text-blue-700">Products</div>
                  </div>
                </div>
              </div>
              
              <div className="stat-card bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                    <i className="icon-trending-up text-white text-xl" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-900">Active</div>
                    <div className="text-green-700">Status</div>
                  </div>
                </div>
              </div>
              
              <div className="stat-card bg-purple-50 border border-purple-200 rounded-lg p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                    <i className="icon-clock text-white text-xl" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-900">
                      {Math.ceil((new Date() - new Date(brand.createdAt)) / (1000 * 60 * 60 * 24))}
                    </div>
                    <div className="text-purple-700">Days Old</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                <Link 
                  href={`/product-list?search=${encodeURIComponent(brand.name)}`}
                  className="tf-button style-2"
                >
                  <i className="icon-search" />
                  View Products
                </Link>
                
                <Link 
                  href={`/add-product?brandId=${brand.id}`}
                  className="tf-button style-1"
                >
                  <i className="icon-plus" />
                  Add Product to Brand
                </Link>
                
                {brand.websiteUrl && (
                  <a 
                    href={brand.websiteUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="tf-button style-2"
                  >
                    <i className="icon-external-link" />
                    Visit Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </Layout>
      </>
    );
  } catch (error) {
    console.error('Error loading brand detail:', error);
    return (
      <Layout breadcrumbTitleParent="Бараа" breadcrumbTitle="Брэнд">
        <div className="wg-box">
          <div className="text-center py-8">
            <h3 className="text-lg font-medium text-red-600 mb-4">Error Loading Brand</h3>
            <p className="text-gray-600">{error.message}</p>
            <Link href="/brand-list" className="tf-button style-1 mt-4">
              Back to Brand List
            </Link>
          </div>
        </div>
      </Layout>
    );
  }
}
