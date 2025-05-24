import React from 'react';
import { getAllProducts } from '../../lib/utils/database';
import ClientFilter from './ClientFilter';
import Link from 'next/link';
import Image from 'next/image';

// Fetch products server-side
export async function getProductData() {
  try {
    const products = await getAllProducts();
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

// Featured Collection Data
const featuredCollections = [
  {
    id: 1,
    name: "Summer Collection",
    description: "Light, breathable fabrics for warm days",
    image: "/images/about-banner.png",
    url: "/shop?sort=newest"
  },
  {
    id: 2,
    name: "Minimalist Essentials",
    description: "Timeless pieces for your everyday wardrobe",
    image: "/images/dual-image-left.png",
    url: "/shop?sort=price-low"
  },
  {
    id: 3,
    name: "New Arrivals",
    description: "Fresh styles just added to our collection",
    image: "/images/dual-image-right.png",
    url: "/shop?sort=newest"
  }
];

export default async function ShopPage() {
  const products = await getProductData();
  
  return (
    <div className="min-h-screen bg-white font-karla">
      {/* Shop Hero Banner */}
      <div className="relative w-full h-[40vh] md:h-[50vh] overflow-hidden">
        <Image
          src="/images/about-banner.png"
          alt="HIKARI Shop"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/40 flex flex-col justify-center px-4 md:px-12">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h1 className="text-3xl md:text-5xl font-monument mb-4">Our Collection</h1>
            <p className="text-sm md:text-base text-white/90 max-w-xl mx-auto leading-relaxed">
              Discover our meticulously curated selection of premium fashion pieces, designed with attention to detail and quality craftsmanship.
            </p>
          </div>
        </div>
      </div>
      
      {/* Shop Navigation & Breadcrumbs */}
      <div className="w-full px-4 md:px-8 py-6 bg-neutral-50 border-b border-neutral-200">
        <div className="w-full">
        {/* Breadcrumbs */}
          <div className="flex items-center text-sm text-neutral-500">
          <Link href="/" className="hover:text-neutral-900 transition-colors">Home</Link>
          <span className="mx-2">/</span>
            <span className="text-neutral-900 font-medium">Shop</span>
            
            {/* Product count */}
            <span className="ml-auto text-xs text-neutral-500">
              {products.length} {products.length === 1 ? 'product' : 'products'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Featured Collections */}
      <div className="w-full px-4 md:px-8 py-12 border-b border-neutral-100">
        <div className="w-full">
          <h2 className="text-xl md:text-2xl font-monument mb-8">Featured Collections</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredCollections.map((collection) => (
              <Link 
                key={collection.id} 
                href={collection.url}
                className="group block relative h-60 md:h-80 overflow-hidden rounded-sm bg-neutral-50"
              >
                <Image
                  src={collection.image}
                  alt={collection.name}
                  fill
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col justify-end p-6 text-white">
                  <h3 className="text-lg md:text-xl font-monument mb-1">{collection.name}</h3>
                  <p className="text-sm text-white/80 mb-4">{collection.description}</p>
                  <span className="inline-block text-sm tracking-wider uppercase group-hover:underline">Shop Now</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      
      {/* Main Shop Section */}
      <div className="w-full pt-8">
        <div className="w-full px-4 md:px-8">
          <h2 className="text-2xl md:text-3xl font-monument mb-2">Shop All</h2>
          <div className="h-px w-12 bg-neutral-300 mb-8"></div>
      
      {/* Client-side Filter Component */}
      <ClientFilter products={products} />
        </div>
      </div>
    </div>
  );
} 