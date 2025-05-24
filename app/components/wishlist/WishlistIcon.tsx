'use client';

import React from 'react';
import Link from 'next/link';
import { BsHeart, BsHeartFill } from 'react-icons/bs';
import { useWishlist } from '../../../contexts/WishlistContext';

export default function WishlistIcon() {
  const { wishlistItems } = useWishlist();
  
  return (
    <Link href="/wishlist" className="relative p-1 inline-flex items-center justify-center">
      <BsHeart size={20} />
      {wishlistItems.length > 0 && (
        <span className="absolute -top-1 -right-1 bg-neutral-900 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
          {wishlistItems.length > 9 ? '9+' : wishlistItems.length}
        </span>
      )}
      <span className="sr-only">Wishlist</span>
    </Link>
  );
} 