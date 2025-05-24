import React from 'react';
import { notFound } from 'next/navigation';
import ProductClient from './ProductClient';
import RelatedProducts from './RelatedProducts';
import { getProductBySlug, getRelatedProducts } from '../../../lib/utils/database';

interface ProductPageProps {
  params: {
    slug: string;
  };
}

// Server component to handle data fetching
export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductBySlug(params.slug);
  
  if (!product) {
    return notFound();
  }

  // Fetch related products
  const relatedProducts = await getRelatedProducts(product.id);

  // Pass product data to client component
  return (
    <>
      <ProductClient product={product} />
      <RelatedProducts products={relatedProducts} />
    </>
  );
} 