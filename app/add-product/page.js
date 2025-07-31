"use client";

import dynamic from 'next/dynamic';

// Dynamically import the component with no SSR to prevent File API issues
const AddProductComponent = dynamic(() => import('./AddProductComponent'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

export default function AddProduct() {
  return <AddProductComponent />;
}
