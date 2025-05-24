'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useWishlist } from '../../contexts/WishlistContext';
import { useCart } from '../../contexts/CartContext';
import { formatRupiah } from '../../lib/utils/format';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../../types/product';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

// Extend the Product type to include category
interface EnhancedProduct extends Product {
  category?: string;
}

export default function WishlistPage() {
  const { wishlistItems, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [itemToRemove, setItemToRemove] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [addedToCart, setAddedToCart] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAddToCart = (product: EnhancedProduct) => {
    // Pass product and necessary parameters directly
    addToCart(
      product, 
      1, 
      product.colors?.[0] || undefined, 
      product.sizes?.[0] || undefined
    );
    
    // Show toast notification
    toast.success(`${product.name} added to cart`, {
      position: 'top-right',
      duration: 2000,
    });
    
    setAddedToCart(product.id);
    setTimeout(() => setAddedToCart(null), 1500);
  };

  const confirmRemove = (id: number) => {
    setItemToRemove(id);
  };

  const handleRemove = () => {
    if (itemToRemove !== null) {
      removeFromWishlist(itemToRemove);
      setItemToRemove(null);
    }
  };

  const handleCancelRemove = () => {
    setItemToRemove(null);
  };

  const confirmClearAll = () => {
    if (window.confirm('Are you sure you want to clear your entire wishlist?')) {
      clearWishlist();
    }
  };

  // Sort wishlist items based on selected sort criteria
  const sortedItems = [...wishlistItems].sort((a, b) => {
    switch (sortBy) {
      case 'priceAsc':
        return parseFloat(String(a.price)) - parseFloat(String(b.price));
      case 'priceDesc':
        return parseFloat(String(b.price)) - parseFloat(String(a.price));
      case 'nameAsc':
        return a.name.localeCompare(b.name);
      case 'nameDesc':
        return b.name.localeCompare(a.name);
      case 'newest':
      default:
        return 0; // Keep original order for newest
    }
  });

  // Extract categories from wishlist items
  const categoriesArray = wishlistItems.length > 0 
    ? wishlistItems.map(item => (item as EnhancedProduct).category || 'Uncategorized')
    : [];
  
  // Create unique categories array using Array.from to avoid Set iteration issues
  const uniqueCategories = Array.from(new Set(categoriesArray)).filter(Boolean);

  if (!mounted) {
    return <div className="w-full px-4 sm:px-6 lg:px-8 py-16 md:py-24 h-screen"></div>;
  }
  
  return (
    <div className="w-full font-karla bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-monument mb-4 font-bold" style={{ lineHeight: '5.25rem' }}>Your Wishlist</h1>
            <div className="h-px w-16 bg-neutral-300 mb-4"></div>
            {wishlistItems.length > 0 && (
              <p className="text-neutral-600">
                {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
              </p>
            )}
          </div>
          
          {wishlistItems.length > 0 && (
            <div className="mt-6 md:mt-0 flex flex-col sm:flex-row gap-4">
              <div className="flex items-center">
                <label htmlFor="sort-by" className="mr-3 text-sm text-neutral-600">Sort by:</label>
                <select 
                  id="sort-by"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-neutral-300 rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white"
                >
                  <option value="newest">Newest</option>
                  <option value="priceAsc">Price: Low to High</option>
                  <option value="priceDesc">Price: High to Low</option>
                  <option value="nameAsc">Name: A to Z</option>
                  <option value="nameDesc">Name: Z to A</option>
                </select>
              </div>
              <button
                onClick={confirmClearAll}
                className="text-sm border border-neutral-300 px-4 py-2 rounded-sm hover:bg-neutral-100 transition-colors"
              >
                Clear Wishlist
              </button>
            </div>
          )}
        </div>
      
      {wishlistItems.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-16 bg-white rounded-lg shadow-sm max-w-xl mx-auto"
          >
          <svg 
              className="w-20 h-20 mx-auto text-neutral-300 mb-6" 
            fill="currentColor" 
            viewBox="0 0 16 16"
          >
            <path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/>
          </svg>
            <h2 className="text-2xl font-monument mb-4">Your wishlist is empty</h2>
            <p className="text-neutral-600 mb-8 max-w-md mx-auto">
              Items added to your wishlist will be saved here. Start browsing and save your favorite products.
            </p>
          <Link 
            href="/shop" 
              className="inline-block bg-neutral-900 text-white py-3 px-8 font-karla text-sm uppercase tracking-wider rounded-sm hover:bg-neutral-800 transition-colors"
          >
            Explore Products
          </Link>
          </motion.div>
      ) : (
        <>
            {/* Categories - horizontal scrollable on mobile */}
            {uniqueCategories.length > 1 && (
              <div className="mb-8 overflow-x-auto">
                <div className="flex space-x-2 pb-2">
                  <button 
                    className="whitespace-nowrap px-4 py-2 bg-neutral-900 text-white text-sm rounded-full"
                  >
                    All Items
                  </button>
                  {uniqueCategories.map((category, index) => (
            <button
                      key={index} 
                      className="whitespace-nowrap px-4 py-2 bg-white border border-neutral-200 text-neutral-700 text-sm rounded-full hover:bg-neutral-100 transition-colors"
            >
                      {category}
            </button>
                  ))}
                </div>
          </div>
            )}
            
            {/* Products grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              <AnimatePresence>
                {sortedItems.map(product => {
                  // Cast to enhanced product to handle possible category
                  const enhancedProduct = product as EnhancedProduct;
                  
                  return (
                    <motion.div 
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      layout
                      className="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <div className="relative aspect-square overflow-hidden">
                  <Link href={`/product/${product.slug}`}>
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  </Link>
                  
                  {/* Remove button */}
                  <button 
                          onClick={() => confirmRemove(product.id)}
                          className="absolute top-3 right-3 p-2 rounded-full bg-white bg-opacity-90 hover:bg-opacity-100 transition-all duration-300 z-10 shadow-sm"
                    aria-label="Remove from wishlist"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="16" 
                      height="16" 
                      fill="currentColor" 
                      className="text-red-500" 
                      viewBox="0 0 16 16"
                    >
                      <path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/>
                    </svg>
                  </button>
                  
                  {/* Darkening overlay */}
                  <div 
                    className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity duration-300 cursor-pointer"
                    onClick={() => router.push(`/product/${product.slug}`)}
                  ></div>
                </div>
                
                      <div className="p-3 sm:p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 mr-2">
                            <h3 
                              className="text-[11px] sm:text-xs font-medium font-monument truncate mb-1 cursor-pointer hover:underline"
                              onClick={() => router.push(`/product/${product.slug}`)}
                            >{product.name}</h3>
                            {enhancedProduct.category && (
                              <p className="text-neutral-600 text-[10px] sm:text-xs">{enhancedProduct.category}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-xs sm:text-sm font-medium">{formatRupiah(product.price)}</p>
                          <div className="flex items-center space-x-1.5">
                            <button 
                              onClick={() => handleAddToCart(enhancedProduct)}
                              className={`p-1.5 rounded-full ${addedToCart === product.id ? 'bg-green-100' : 'bg-neutral-100 hover:bg-neutral-200'} transition-colors relative`}
                              title="Add to cart"
                            >
                              {addedToCart === product.id ? (
                                <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                              )}
                            </button>
                            <button 
                              onClick={() => router.push(`/product/${product.slug}`)}
                              className="p-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors"
                              title="More options"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {/* Confirmation modal for removing items */}
      <AnimatePresence>
        {itemToRemove !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl"
            >
              <h2 className="text-xl font-medium mb-4">Remove from Wishlist</h2>
              <p className="text-neutral-600 mb-6">Are you sure you want to remove this item from your wishlist?</p>
              <div className="flex justify-end space-x-3">
                <button 
                  onClick={handleCancelRemove}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-sm hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRemove}
                  className="px-4 py-2 bg-red-500 text-white rounded-sm hover:bg-red-600 transition-colors"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </div>
      )}
      </AnimatePresence>
    </div>
  );
} 