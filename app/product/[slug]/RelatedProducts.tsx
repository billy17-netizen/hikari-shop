import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '../../../types/product';
import { formatRupiah } from '../../../lib/utils/format';
import WishlistButton from '../../components/wishlist/WishlistButton';

interface RelatedProductsProps {
  products: Product[];
}

export default function RelatedProducts({ products }: RelatedProductsProps) {
  if (!products.length) {
    return null;
  }

  return (
    <div className="py-16 bg-neutral-50">
      <div className="w-full max-w-full px-4 sm:px-8">
        <h2 className="text-xl md:text-2xl font-monument mb-2 text-center">You May Also Like</h2>
        <div className="h-px w-10 bg-neutral-300 mx-auto mb-12"></div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {products.map(product => (
            <div key={product.id} className="group relative">
              <div className="relative aspect-square overflow-hidden bg-neutral-50">
                <Link href={`/product/${product.slug}`}>
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </Link>
                
                {/* Wishlist Button */}
                <WishlistButton product={product} />
                
                {/* Hover Effect */}
                <div className="absolute inset-0 bg-black opacity-0 transition-opacity duration-500 group-hover:opacity-5"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 transform translate-y-4 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:translate-y-0">
                  <Link 
                    href={`/product/${product.slug}`}
                    className="block bg-white bg-opacity-90 text-center py-2.5 text-xs tracking-wider uppercase"
                  >
                    Quick Shop
                  </Link>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-normal font-monument truncate">{product.name}</h3>
                  <p className="text-sm">{formatRupiah(product.price)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 