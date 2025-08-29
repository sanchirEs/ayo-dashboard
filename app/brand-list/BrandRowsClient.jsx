"use client";
import Link from "next/link";
import BrandRowActions from "./BrandRowActions";

export default function BrandRowsClient({ brand }) {
  return (
    <li className="attribute-item flex items-center justify-between gap20">
      <div className="name flex items-center gap-3">
        {brand.logoUrl ? (
          <div className="brand-logo" style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<i class="icon-image" style="color: #9ca3af; font-size: 18px;"></i>';
              }}
            />
          </div>
        ) : (
          <div className="brand-logo" style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f3f4f6'
          }}>
            <i className="icon-tag" style={{ color: '#9ca3af', fontSize: '18px' }} />
          </div>
        )}
        <div>
          <div className="body-title-2">{brand.name}</div>
          {brand.websiteUrl && (
            <a 
              href={brand.websiteUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-tiny text-blue-600 hover:text-blue-800"
              style={{ fontSize: '12px' }}
            >
              <i className="icon-external-link" style={{ marginRight: '4px' }} />
              Visit Website
            </a>
          )}
        </div>
      </div>
      
      <div className="body-text" style={{ 
        maxWidth: '300px',
        overflow: 'hidden', 
        textOverflow: 'ellipsis', 
        whiteSpace: 'nowrap'
      }} title={brand.description || "No description"}>
        {brand.description || "No description"}
      </div>
      
      <div className="body-text">
        {brand.websiteUrl ? (
          <a 
            href={brand.websiteUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800"
            style={{ 
              fontSize: '14px',
              maxWidth: '200px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'inline-block'
            }}
            title={brand.websiteUrl}
          >
            {brand.websiteUrl.replace(/^https?:\/\//, '')}
          </a>
        ) : (
          <span style={{ color: '#9ca3af' }}>-</span>
        )}
      </div>
      
      <div className="body-text">
        <span style={{ fontWeight: 'bold' }}>{brand.productCount || 0}</span>
        <span style={{ color: '#6b7280', fontSize: '12px', marginLeft: '4px' }}>products</span>
      </div>
      
      <div className="body-text">
        {new Date(brand.createdAt).toLocaleDateString()}
      </div>
      
      <BrandRowActions id={brand.id} productCount={brand.productCount || 0} brandName={brand.name} />
    </li>
  );
}
