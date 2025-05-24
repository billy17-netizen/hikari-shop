'use client';

import React from 'react';
import { useWishlist } from '../../../contexts/WishlistContext';
import { Product } from '../../../types/product';

interface WishlistButtonProps {
  product: Product;
  variant?: 'icon' | 'button' | 'text';
  className?: string;
}

export default function WishlistButton({ 
  product, 
  variant = 'icon',
  className = '',
}: WishlistButtonProps) {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const inWishlist = isInWishlist(product.id);
  
  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation if button is in a link
    e.stopPropagation(); // Prevent event bubbling
    
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };
  
  // Icon-only variant (for product cards)
  if (variant === 'icon') {
    return (
      <button
        onClick={handleToggleWishlist}
        className={`absolute z-10 top-3 right-3 p-2 rounded-full bg-white bg-opacity-80 backdrop-blur-sm hover:bg-opacity-100 transition-all duration-300 ${className}`}
        aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="18" 
          height="18" 
          fill={inWishlist ? 'currentColor' : 'none'} 
          stroke={inWishlist ? 'none' : 'currentColor'} 
          viewBox="0 0 16 16"
          className={inWishlist ? 'text-red-500' : 'text-neutral-700'}
        >
          <path 
            strokeWidth="1" 
            fillRule="evenodd" 
            d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"
          />
        </svg>
      </button>
    );
  }
  
  // Button variant (for product details)
  if (variant === 'button') {
    return (
      <button
        onClick={handleToggleWishlist}
        className={`flex items-center justify-center px-4 py-2 text-sm border ${
          inWishlist 
            ? 'border-neutral-300 bg-neutral-100 text-neutral-800' 
            : 'border-neutral-300 hover:bg-neutral-50 text-neutral-700'
        } transition-colors ${className}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill={inWishlist ? 'currentColor' : 'none'}
          stroke={inWishlist ? 'none' : 'currentColor'}
          viewBox="0 0 16 16"
          className={`mr-2 ${inWishlist ? 'text-red-500' : ''}`}
        >
          <path
            strokeWidth="1"
            fillRule="evenodd"
            d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"
          />
        </svg>
        <span>{inWishlist ? 'Saved to Wishlist' : 'Add to Wishlist'}</span>
      </button>
    );
  }
  
  // Text variant
  return (
    <button
      onClick={handleToggleWishlist}
      className={`flex items-center text-sm ${
        inWishlist ? 'text-red-500' : 'text-neutral-700 hover:text-neutral-900'
      } transition-colors ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill={inWishlist ? 'currentColor' : 'none'}
        stroke={inWishlist ? 'none' : 'currentColor'}
        viewBox="0 0 16 16"
        className="mr-1.5"
      >
        <path
          strokeWidth="1"
          fillRule="evenodd"
          d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"
        />
      </svg>
      <span>{inWishlist ? 'Saved' : 'Save for later'}</span>
    </button>
  );
} 