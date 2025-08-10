"use server";
import { getDiscountableProducts, formatCurrency, isFlashSaleActive } from "@/lib/api/discounts";
import { auth } from "@/auth";
import FlashSaleActions from "./FlashSaleActions";
import SearchQuery from "@/components/SearchQueryDebounced";

export default async function FlashSalesManager({ searchParams }) {
  try {
    const session = await auth();
    const token = session?.user?.accessToken || null;
    if (!token) return null;

    const products = await getDiscountableProducts(token);

    const filteredProducts = products.filter(product => {
      const matchesSearch = !searchParams?.search || 
        product.name.toLowerCase().includes(searchParams.search.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchParams.search.toLowerCase());
      const flashSaleFilter = searchParams?.filter;
      if (flashSaleFilter === 'active') return matchesSearch && product.flashSale && isFlashSaleActive(product.flashSaleEndDate);
      if (flashSaleFilter === 'expired') return matchesSearch && product.flashSale && !isFlashSaleActive(product.flashSaleEndDate);
      if (flashSaleFilter === 'none') return matchesSearch && !product.flashSale;
      return matchesSearch;
    });

    return (
      <div className="wg-box">
        <div className="flex items-center justify-between gap10 flex-wrap mb-20">
          <h4 className="text-title">Flash Sales Management</h4>
        </div>

        <div className="flex items-center justify-between gap10 flex-wrap mb-20">
          <div className="wg-filter flex-grow">
            <SearchQuery query="search" placeholder="Search products..." />
          </div>
          <div className="filter-tabs flex gap10">
            <a href="/discounts" className={`filter-tab ${!searchParams?.filter ? 'active' : ''}`} style={{ padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontSize: '14px', backgroundColor: !searchParams?.filter ? '#3b82f6' : '#f1f5f9', color: !searchParams?.filter ? 'white' : '#64748b' }}>All Products</a>
            <a href="/discounts?filter=active" className={`filter-tab ${searchParams?.filter === 'active' ? 'active' : ''}`} style={{ padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontSize: '14px', backgroundColor: searchParams?.filter === 'active' ? '#10b981' : '#f1f5f9', color: searchParams?.filter === 'active' ? 'white' : '#64748b' }}>Active Sales</a>
            <a href="/discounts?filter=expired" className={`filter-tab ${searchParams?.filter === 'expired' ? 'active' : ''}`} style={{ padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontSize: '14px', backgroundColor: searchParams?.filter === 'expired' ? '#ef4444' : '#f1f5f9', color: searchParams?.filter === 'expired' ? 'white' : '#64748b' }}>Expired</a>
            <a href="/discounts?filter=none" className={`filter-tab ${searchParams?.filter === 'none' ? 'active' : ''}`} style={{ padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontSize: '14px', backgroundColor: searchParams?.filter === 'none' ? '#6b7280' : '#f1f5f9', color: searchParams?.filter === 'none' ? 'white' : '#64748b' }}>No Discount</a>
          </div>
        </div>

        <div className="wg-table table-flash-sales">
          <ul className="table-title flex gap20 mb-14">
            <li><div className="body-title">Product</div></li>
            <li><div className="body-title">Current Price</div></li>
            <li><div className="body-title">Flash Sale Status</div></li>
            <li><div className="body-title">End Date</div></li>
            <li><div className="body-title">Actions</div></li>
          </ul>
          <ul className="flex flex-column">
            {filteredProducts.length === 0 ? (
              <li className="text-center py-8"><div className="body-text">{searchParams?.search ? 'No products found matching your search.' : 'No products available.'}</div></li>
            ) : (
              filteredProducts.map((product) => (
                <li className="product-item gap14" key={product.id}>
                  <div className="image no-bg">
                    {product.images && product.images.length > 0 ? (
                      <img src={require("@/lib/api/env").resolveImageUrl(product.images[0].url)} alt={product.name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px' }} />
                    ) : (
                      <div style={{ width: '48px', height: '48px', borderRadius: '6px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="icon-package" style={{ color: '#6b7280' }} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap20 flex-grow">
                    <div className="name">
                      <div className="body-title-2" style={{ fontSize: '16px' }}>{product.name}</div>
                      <div className="text-tiny" style={{ color: '#6b7280' }}>SKU: {product.sku}</div>
                      {product.category && (<div className="text-tiny" style={{ color: '#6b7280' }}>Category: {product.category.name}</div>)}
                    </div>
                    <div className="body-text"><div style={{ fontWeight: 'bold', fontSize: '16px' }}>{formatCurrency(product.price)}</div></div>
                    <div className="body-text">
                      <span className="status-badge" style={{ padding: '6px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold', color: product.flashSale && isFlashSaleActive(product.flashSaleEndDate) ? '#065f46' : product.flashSale ? '#991b1b' : '#374151', backgroundColor: product.flashSale && isFlashSaleActive(product.flashSaleEndDate) ? '#d1fae5' : product.flashSale ? '#fee2e2' : '#f3f4f6' }}>
                        {product.flashSale && isFlashSaleActive(product.flashSaleEndDate) ? 'Active Sale' : product.flashSale ? 'Expired' : 'No Sale'}
                      </span>
                    </div>
                    <div className="body-text">{product.flashSaleEndDate ? (<div style={{ fontSize: '14px' }}>{new Date(product.flashSaleEndDate).toLocaleDateString()}</div>) : (<div style={{ color: '#6b7280', fontSize: '14px' }}>Not set</div>)}</div>
                    <div className="list-icon-function"><FlashSaleActions product={product} /></div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="divider" />
        <div className="flex items-center justify-between flex-wrap gap10"><div className="text-tiny">Showing {filteredProducts.length} of {products.length} products</div></div>
      </div>
    );
  } catch (error) {
    console.error('Error in FlashSalesManager:', error);
    return (<div className="wg-box"><div className="text-center py-8"><h3 className="text-lg font-medium text-red-600 mb-4">Error Loading Products</h3><p className="text-gray-600">{error.message}</p></div></div>);
  }
}
