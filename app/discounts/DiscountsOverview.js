"use server";
import Link from "next/link";
import { getFlashSaleProducts, getDiscountableProducts } from "@/lib/api/discounts";
import GetTokenServer from "@/lib/GetTokenServer";

export default async function DiscountsOverview() {
  try {
    const token = await GetTokenServer();
    
    if (!token) {
      return (
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-red-600 mb-4">Authentication Required</h3>
          <p className="text-gray-600">Please log in to view discount analytics.</p>
        </div>
      );
    }

    const [flashSaleProducts, allProducts] = await Promise.all([
      getFlashSaleProducts(token),
      getDiscountableProducts(token)
    ]);

    const activeFlashSales = flashSaleProducts.filter(product => 
      product.flashSaleEndDate && new Date() < new Date(product.flashSaleEndDate)
    );

    const expiredFlashSales = flashSaleProducts.filter(product => 
      product.flashSaleEndDate && new Date() >= new Date(product.flashSaleEndDate)
    );

    // Calculate potential savings
    const totalPotentialRevenue = allProducts.reduce((sum, product) => sum + (product.price * 10), 0); // Assume 10 units average
    const flashSaleRevenue = activeFlashSales.reduce((sum, product) => sum + (product.price * 10), 0);

    return (
      <div className="wg-box">
        <div className="flex items-center justify-between mb-20">
          <h4 className="text-title">Discounts Overview</h4>
          <div className="flex gap10">
            <Link href="/bulk-discount" className="tf-button style-2">
              <i className="icon-zap" />
              Bulk Actions
            </Link>
          </div>
        </div>

        <div className="flex gap20 flex-wrap">
          {/* Active Flash Sales */}
          <div className="overview-card flex-grow" style={{ 
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
            borderRadius: '12px',
            padding: '24px',
            color: 'white',
            minWidth: '280px'
          }}>
            <div className="flex items-center justify-between mb-10">
              <div className="icon-wrapper" style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '8px',
                padding: '8px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className="icon-zap" style={{ fontSize: '20px' }} />
              </div>
              <div className="trend" style={{ fontSize: '12px', opacity: 0.8 }}>
                Flash Sales
              </div>
            </div>
            <h3 style={{ fontSize: '28px', fontWeight: 'bold', margin: '8px 0' }}>
              {activeFlashSales.length}
            </h3>
            <p style={{ opacity: 0.8, fontSize: '14px' }}>Active Flash Sales</p>
          </div>

          {/* Total Discountable Products */}
          <div className="overview-card flex-grow" style={{ 
            background: 'linear-gradient(135deg, #a55eea 0%, #8b5cf6 100%)',
            borderRadius: '12px',
            padding: '24px',
            color: 'white',
            minWidth: '280px'
          }}>
            <div className="flex items-center justify-between mb-10">
              <div className="icon-wrapper" style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '8px',
                padding: '8px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className="icon-package" style={{ fontSize: '20px' }} />
              </div>
              <div className="trend" style={{ fontSize: '12px', opacity: 0.8 }}>
                Available
              </div>
            </div>
            <h3 style={{ fontSize: '28px', fontWeight: 'bold', margin: '8px 0' }}>
              {allProducts.length}
            </h3>
            <p style={{ opacity: 0.8, fontSize: '14px' }}>Discountable Products</p>
          </div>

          {/* Expired Flash Sales */}
          <div className="overview-card flex-grow" style={{ 
            background: 'linear-gradient(135deg, #26de81 0%, #20bf6b 100%)',
            borderRadius: '12px',
            padding: '24px',
            color: 'white',
            minWidth: '280px'
          }}>
            <div className="flex items-center justify-between mb-10">
              <div className="icon-wrapper" style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '8px',
                padding: '8px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className="icon-clock" style={{ fontSize: '20px' }} />
              </div>
              <div className="trend" style={{ fontSize: '12px', opacity: 0.8 }}>
                Need Review
              </div>
            </div>
            <h3 style={{ fontSize: '28px', fontWeight: 'bold', margin: '8px 0' }}>
              {expiredFlashSales.length}
            </h3>
            <p style={{ opacity: 0.8, fontSize: '14px' }}>Expired Sales</p>
          </div>
        </div>

                 {/* Permission Notice */}
         <div className="alert alert-warning mt-20" style={{ 
           backgroundColor: '#fff3cd', 
           border: '1px solid #ffeb3b', 
           borderRadius: '8px', 
           padding: '16px'
         }}>
           <div className="flex items-start gap10">
             <i className="icon-shield" style={{ color: '#856404', marginTop: '2px' }} />
             <div>
               <h5 style={{ color: '#856404', margin: '0 0 8px 0', fontWeight: 'bold' }}>
                 Permission Requirements
               </h5>
               <p style={{ color: '#856404', margin: '0', lineHeight: '1.5' }}>
                 <strong>Important:</strong> Only users with <code>VENDOR</code> or <code>SUPERADMIN</code> roles can update flash sales. 
                 If you're experiencing permission errors, contact your system administrator to upgrade your role.
               </p>
               <div style={{ marginTop: '12px' }}>
                 <p style={{ color: '#856404', margin: '0', fontSize: '14px' }}>
                   <strong>Current Role Limitations:</strong>
                 </p>
                 <ul style={{ color: '#856404', margin: '8px 0 0 20px', fontSize: '14px' }}>
                   <li><code>ADMIN</code>: Can view discounts but cannot modify flash sales</li>
                   <li><code>VENDOR</code>: Can create and modify flash sales for their products</li>
                   <li><code>SUPERADMIN</code>: Full access to all discount features</li>
                 </ul>
               </div>
             </div>
           </div>
         </div>

         {/* Backend Enhancement Notice */}
         <div className="alert alert-info mt-20" style={{ 
           backgroundColor: '#e0f2fe', 
           border: '1px solid #29b6f6', 
           borderRadius: '8px', 
           padding: '16px'
         }}>
           <div className="flex items-start gap10">
             <i className="icon-info" style={{ color: '#1976d2', marginTop: '2px' }} />
             <div>
               <h5 style={{ color: '#1976d2', margin: '0 0 8px 0', fontWeight: 'bold' }}>
                 Backend Enhancement Recommendations
               </h5>
               <p style={{ color: '#1565c0', margin: '0', lineHeight: '1.5' }}>
                 The current discount system uses the existing <code>flashSale</code> field. For enhanced functionality, consider adding:
               </p>
               <ul style={{ color: '#1565c0', margin: '8px 0 0 20px' }}>
                 <li><strong>Discount model</strong>: Separate table for managing various discount types</li>
                 <li><strong>Scheduled discounts</strong>: Automatic start/end date handling</li>
                 <li><strong>Category-wide discounts</strong>: Apply discounts to entire product categories</li>
                 <li><strong>Tiered pricing</strong>: Volume-based discounts</li>
                 <li><strong>Admin-level permissions</strong>: Allow ADMIN users to manage discounts</li>
               </ul>
             </div>
           </div>
         </div>
      </div>
    );
  } catch (error) {
    console.error('Error in DiscountsOverview:', error);
    return (
      <div className="wg-box">
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-red-600 mb-4">Error Loading Discount Data</h3>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }
}
