'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '../types/product';

// Define types for our context
interface WishlistContextType {
  wishlistItems: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;
  clearWishlist: () => void;
}

// Create the context with default values
const WishlistContext = createContext<WishlistContextType>({
  wishlistItems: [],
  addToWishlist: () => {},
  removeFromWishlist: () => {},
  isInWishlist: () => false,
  clearWishlist: () => {},
});

// Custom hook to use the wishlist context
export const useWishlist = () => useContext(WishlistContext);

// Provider component
export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [mounted, setMounted] = useState(false);

  // Load wishlist from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const storedWishlist = localStorage.getItem('hikari-wishlist');
    if (storedWishlist) {
      try {
        setWishlistItems(JSON.parse(storedWishlist));
      } catch (error) {
        console.error('Failed to parse wishlist from localStorage:', error);
        localStorage.removeItem('hikari-wishlist');
      }
    }
  }, []);

  // Save wishlist to localStorage when it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('hikari-wishlist', JSON.stringify(wishlistItems));
    }
  }, [wishlistItems, mounted]);

  // Add a product to wishlist
  const addToWishlist = (product: Product) => {
    setWishlistItems(prev => {
      // Check if product is already in wishlist
      if (prev.some(item => item.id === product.id)) {
        return prev;
      }
      return [...prev, product];
    });
  };

  // Remove a product from wishlist
  const removeFromWishlist = (productId: number) => {
    setWishlistItems(prev => prev.filter(item => item.id !== productId));
  };

  // Check if a product is in wishlist
  const isInWishlist = (productId: number) => {
    return wishlistItems.some(item => item.id === productId);
  };

  // Clear the entire wishlist
  const clearWishlist = () => {
    setWishlistItems([]);
  };

  const value = {
    wishlistItems,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}; 