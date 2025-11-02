"use client";

import dynamic from 'next/dynamic';
import { use } from 'react';

const EditProductComponent = dynamic(() => import('./EditProductComponent_Complete'), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

export default function EditProductPage({ params }) {
  const resolved = use(params);
  const id = resolved?.id;
  return <EditProductComponent id={Number(id)} />;
}


