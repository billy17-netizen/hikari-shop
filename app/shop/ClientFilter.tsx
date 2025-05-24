'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatRupiah } from '../../lib/utils/format';
import { Product } from '../../types/product';
import { useSearchParams, useRouter } from 'next/navigation';
import WishlistButton from '../components/wishlist/WishlistButton';
import { useCart } from '../../contexts/CartContext';
import toast from 'react-hot-toast';
import ProductModal from '../components/shop/ProductModal';
import AddToCartSheet from '../components/shop/AddToCartSheet';

function ClientFilter({ products }: { products: Product[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialSearchQuery = searchParams.get('search') || '';
  
  const [sortBy, setSortBy] = useState('newest');
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showSearch, setShowSearch] = useState(!!initialSearchQuery);
  const [hoveredProductId, setHoveredProductId] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileActiveProduct, setMobileActiveProduct] = useState<Product | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });
  const [isModalContentLoaded, setIsModalContentLoaded] = useState(false);
  
  // Modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Cart state
  const { addToCart } = useCart();

  // State for cart options panel
  const [showCartOptions, setShowCartOptions] = useState(false);
  const [quantity, setQuantity] = useState(1);
  
  // Track image loading
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  
  // Add forceful re-render state
  const [renderKey, setRenderKey] = useState(0);

  // Add state for options sheet
  const [optionsProduct, setOptionsProduct] = useState<Product | null>(null);
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);

  // Force re-render helper
  const forceRerender = () => {
    setRenderKey(prev => prev + 1);
  };

  // Reset all mobile states
  const resetMobileStates = () => {
    setShowActionSheet(false);
    setMobileActiveProduct(null);
    setShowCartOptions(false);
    setIsModalContentLoaded(false);
    setIsImageLoaded(false);
  };
  
  // Check if device is mobile - Enhanced detection with development mode optimizations
  useEffect(() => {
    const checkIfMobile = () => {
      const isMobileView = window.innerWidth < 768;
      
      // In development mode, check for user agent overrides (browser dev tools)
      const mightBeEmulated = 
        (navigator.userAgent.includes('Mobile') || 
         navigator.userAgent.includes('Android') || 
         /iPad|iPhone|iPod/.test(navigator.userAgent));
         
      if (isMobileView !== isMobile || (mightBeEmulated && !isMobile)) {
        console.log('Mobile view state changed:', isMobileView, 'Might be emulated:', mightBeEmulated);
        
        // Reset states when switching to prevent UI issues
        resetMobileStates();
        
        // Update mobile state
        setIsMobile(isMobileView || mightBeEmulated);
        
        // Force re-render to ensure all UI elements update
        forceRerender();
      }
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listeners for various changes
    window.addEventListener('resize', checkIfMobile);
    window.addEventListener('orientationchange', checkIfMobile);
    
    // Check periodically for device emulation changes
    const mobileCheckInterval = setInterval(checkIfMobile, 500);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', checkIfMobile);
      window.removeEventListener('orientationchange', checkIfMobile);
      clearInterval(mobileCheckInterval);
    };
  }, [isMobile, mobileActiveProduct]); // Add all dependencies
  
  // Lock body scroll when action sheet is open
  useEffect(() => {
    if (showActionSheet) {
      // Lock body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll
      document.body.style.overflow = '';
    }
    
    return () => {
      // Clean up by restoring body scroll when component unmounts
      document.body.style.overflow = '';
    };
  }, [showActionSheet]);
  
  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Apply search filter
  const searchFilteredProducts = React.useMemo(() => {
    if (!searchQuery) return products;
    
    const query = searchQuery.toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(query) || 
      product.description.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);
    
  // Sort products
  const sortedProducts = React.useMemo(() => {
    return [...searchFilteredProducts].sort((a, b) => {
      if (sortBy === 'price-low') {
        return parseFloat(a.price) - parseFloat(b.price);
      } else if (sortBy === 'price-high') {
        return parseFloat(b.price) - parseFloat(a.price);
      } else if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'name-desc') {
        return b.name.localeCompare(a.name);
      } else { // newest - by ID as a fallback
        return b.id - a.id;
      }
    });
  }, [searchFilteredProducts, sortBy]);
  
  // Update URL when search changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Update URL params
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    
    router.replace(`/shop?${params.toString()}`);
  };
  
  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('search');
    router.replace(`/shop?${params.toString()}`);
    if (!initialSearchQuery) {
      setShowSearch(false);
    }
  };
  
  // Use a ref to track modal visibility without re-render issues
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Handle product click for all devices (mobile & desktop)
  const handleProductClick = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    setSelectedProduct(product);
    setIsModalOpen(true);
  };
  
  // Close bottom sheet panel
  const closeActionSheet = () => {
    console.log("Closing action sheet");
    
    // First hide the panel with direct DOM manipulation for immediate effect
    if (modalRef.current) {
      modalRef.current.style.opacity = '0';
      modalRef.current.style.visibility = 'hidden';
    }
    
    // Update state
    setShowActionSheet(false);
    
    // Make sure the cart options is closed first
    setShowCartOptions(false);
    setIsModalContentLoaded(false);
    setIsImageLoaded(false);
    
    // After animation completes, remove the product from state
    setTimeout(() => {
      setMobileActiveProduct(null);
      console.log("Modal closed completely");
    }, 300);
  };
  
  // Add a function to handle direct add to cart
  const handleDirectAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Always show product modal on desktop
    if (!isMobile) {
      setSelectedProduct(product);
      setIsModalOpen(true);
      return;
    }
    
    // For mobile: show options sheet for products with options
    if (product.sizes.length > 0 || product.colors.length > 0) {
      setOptionsProduct(product);
      setShowOptionsSheet(true);
      return;
    }
    
    // For simple products on mobile, add directly
    addToCart(product, 1);
    
    // Show success message
    toast.success(`${product.name} added to cart`, {
      position: 'bottom-center',
      className: 'font-karla',
    });
  };
  
  // Close options sheet
  const handleCloseOptionsSheet = () => {
    setShowOptionsSheet(false);
    // Keep any open modals open - don't reset product
  };
  
  // Cart options panel ref
  const cartOptionsRef = useRef<HTMLDivElement>(null);
  
  // Handle cart options
  const openCartOptions = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Opening cart options");
    setQuantity(1); // Reset quantity when opening
    setShowCartOptions(true);
    
    // Direct DOM manipulation for immediate feedback
    if (cartOptionsRef.current) {
      cartOptionsRef.current.style.display = 'block';
      // Force reflow
      cartOptionsRef.current.offsetHeight;
      // Apply animation
      cartOptionsRef.current.style.transform = 'translateY(0)';
      cartOptionsRef.current.style.opacity = '1';
    }
  };
  
  const closeCartOptions = () => {
    console.log("Closing cart options");
    // Direct DOM manipulation for immediate feedback
    if (cartOptionsRef.current) {
      cartOptionsRef.current.style.transform = 'translateY(100%)';
      cartOptionsRef.current.style.opacity = '0';
    }
    
    // Update state after animation
    setTimeout(() => {
      setShowCartOptions(false);
    }, 300);
  };

  const incrementQuantity = () => {
    setQuantity(prev => Math.min(prev + 1, 10)); // Max 10 items
  };

  const decrementQuantity = () => {
    setQuantity(prev => Math.max(prev - 1, 1)); // Min 1 item
  };

  // Handle image load
  const handleImageLoad = () => {
    setIsImageLoaded(true);
    // Once image is loaded, mark content as ready
    setIsModalContentLoaded(true);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Ensure we clean up on unmount
      setShowActionSheet(false);
      setMobileActiveProduct(null);
    };
  }, []);

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setSelectedProduct(null);
    }, 300);
  };

  return (
    <div key={renderKey} className={`transition-opacity duration-500 w-full ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Search & Filter Controls */}
      <div className="mb-8 px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          {/* Left Controls - Search & View Mode */}
          <div className="flex items-center gap-4">
            {/* Search Toggle Button */}
            <button 
              onClick={() => setShowSearch(!showSearch)}
              className="flex items-center gap-1.5 text-neutral-600 hover:text-neutral-900"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-sm">{showSearch ? "Hide" : "Search"}</span>
            </button>

            {/* View Mode Toggles */}
            <div className="hidden md:flex items-center border-l border-neutral-200 pl-4">
              <button 
                onClick={() => setViewMode('grid')} 
                className={`p-1.5 ${viewMode === 'grid' ? 'text-black' : 'text-neutral-400 hover:text-neutral-600'}`}
                aria-label="Grid view"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button 
                onClick={() => setViewMode('list')} 
                className={`p-1.5 ${viewMode === 'list' ? 'text-black' : 'text-neutral-400 hover:text-neutral-600'}`}
                aria-label="List view"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Right Controls - Sort */}
          <div className="flex items-center">
            <span className="text-xs text-neutral-500 mr-2">Sort:</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs bg-transparent focus:outline-none appearance-none pl-0 pr-6 py-1"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name-asc">Name: A-Z</option>
                <option value="name-desc">Name: Z-A</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                <svg className="w-3 h-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Search Input - Collapsible */}
        {showSearch && (
          <div className="mb-6">
            <div className="relative w-full max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search products"
                className="w-full border-b border-neutral-200 py-2 pl-0 focus:outline-none text-sm"
                autoFocus
              />
              {searchQuery && (
                <button 
                  onClick={clearSearch}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-xs text-neutral-500 mt-2">
                Found {sortedProducts.length} results for "{searchQuery}"
                <button 
                  onClick={clearSearch}
                  className="ml-2 text-black underline hover:no-underline"
                >
                  Clear
                </button>
              </p>
            )}
          </div>
        )}
        
        {/* Divider */}
        <div className="h-px w-full bg-neutral-100"></div>
      </div>
      
      {/* Products Count */}
      <div className="text-xs text-neutral-500 mb-8 px-4">
        {sortedProducts.length} {sortedProducts.length === 1 ? 'product' : 'products'}
      </div>
    
      {/* Products Grid or List View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-2 md:gap-x-4 gap-y-10 md:gap-y-14 pb-16">
          {sortedProducts.map(product => (
            <div 
              key={product.id} 
              className="group relative flex flex-col h-full"
            >
              {/* Make the entire product card clickable on mobile */}
              {isMobile ? (
                <div 
                  className="block w-full h-full cursor-pointer"
                  onClick={(e) => handleProductClick(e, product)}
                >
                  <div className="relative aspect-square overflow-hidden bg-neutral-50 mb-3">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                    
                    {/* Status badge - Out of stock */}
                    {!product.inStock && (
                      <div className="absolute bottom-2 left-0 bg-white text-black text-[10px] tracking-wide px-2 py-1">
                        Out of Stock
                      </div>
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <div>
                    <h3 className="text-xs text-neutral-800 line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-neutral-900 mt-1">{formatRupiah(product.price)}</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="block flex-1 relative cursor-pointer">
                    <div className="relative aspect-square overflow-hidden bg-neutral-50 mb-3">
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                      
                      {/* Status badge - Out of stock */}
                      {!product.inStock && (
                        <div className="absolute bottom-2 left-0 bg-white text-black text-[10px] tracking-wide px-2 py-1">
                          Out of Stock
                        </div>
                      )}
                      
                      {/* Desktop: Hover overlay with actions */}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 p-3 z-10">
                        {product.inStock ? (
                          <>
                            <button
                              onClick={(e) => handleDirectAddToCart(e, product)}
                              className="w-full bg-white text-black text-xs py-2 px-3 transition-colors hover:bg-black hover:text-white flex items-center justify-center gap-1.5"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                              </svg>
                              Add to Cart
                            </button>
                          </>
                        ) : (
                          <div className="w-full bg-white/80 text-black text-xs py-2 px-3 text-center">
                            Out of Stock
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            router.push(`/product/${product.slug}`);
                          }}
                          className="w-full border border-white text-white text-xs py-2 px-3 transition-colors hover:bg-white hover:text-black text-center"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                    
                    {/* Add a clickable overlay for non-mobile desktop */}
                    <Link 
                      href={`/product/${product.slug}`}
                      className="absolute inset-0 z-0"
                      aria-label={`View ${product.name} details`}
                    />
                  </div>
                  
                  {/* Product Info */}
                  <div>
                    <h3 className="text-xs text-neutral-800 line-clamp-1">
                      <Link href={`/product/${product.slug}`}>
                        {product.name}
                      </Link>
                    </h3>
                    <p className="text-xs text-neutral-900 mt-1">{formatRupiah(product.price)}</p>
                  </div>
                </>
              )}
              
              {/* Wishlist Button - More visible on mobile */}
              <div className="absolute top-2 right-2 z-10 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                <WishlistButton product={product} variant="icon" className="bg-white/80 shadow-sm" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6 pb-16">
          {sortedProducts.map(product => (
            <div 
              key={product.id} 
              className="group flex flex-col md:flex-row gap-6 border-b border-neutral-100 pb-6"
              onClick={isMobile ? (e) => handleProductClick(e, product) : undefined}
            >
              {/* Product Image - Left side */}
              <div 
                className={`relative w-full md:w-36 lg:w-48 aspect-square overflow-hidden bg-neutral-50 ${isMobile ? 'cursor-pointer' : ''}`}
              >
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Status badge - Out of stock */}
                {!product.inStock && (
                  <div className="absolute bottom-2 left-0 bg-white text-black text-[10px] tracking-wide px-2 py-1">
                    Out of Stock
                  </div>
                )}
                
                {/* Desktop: Hover overlay with actions */}
                {!isMobile && (
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-3 z-10">
                    <div className="flex flex-col gap-2 w-full">
                      {product.inStock ? (
                        <button
                          onClick={(e) => handleDirectAddToCart(e, product)}
                          className="w-full bg-white text-black text-xs py-2 px-3 transition-colors hover:bg-black hover:text-white flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                          Add to Cart
                        </button>
                      ) : (
                        <div className="w-full bg-white/80 text-black text-xs py-2 px-3 text-center">
                          Out of Stock
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Add a clickable overlay for non-mobile desktop */}
                {!isMobile && (
                  <Link 
                    href={`/product/${product.slug}`}
                    className="absolute inset-0 z-0"
                    aria-label={`View ${product.name} details`}
                  />
                )}
              </div>
              
              {/* Product Info - Right side */}
              <div className="flex-1 flex flex-col">
                <div>
                  {isMobile ? (
                    <div className="block mb-2 cursor-pointer">
                      <h3 className="text-sm font-medium text-neutral-800">{product.name}</h3>
                    </div>
                  ) : (
                    <Link href={`/product/${product.slug}`} className="block mb-2">
                      <h3 className="text-sm font-medium text-neutral-800">{product.name}</h3>
                    </Link>
                  )}
                  <p className="text-neutral-500 text-xs line-clamp-2">{product.description}</p>
                </div>
                
                {/* Price and Actions */}
                <div className="flex items-center justify-between mt-auto pt-4">
                  <span className="text-sm text-neutral-900">{formatRupiah(product.price)}</span>
                  {!isMobile && (
                    <div className="flex items-center gap-2">
                      {product.inStock && (
                        <button
                          onClick={(e) => handleDirectAddToCart(e, product)}
                          className="text-xs uppercase tracking-wide hover:underline flex items-center gap-1.5 text-neutral-800"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                          Add to Cart
                        </button>
                      )}
                      <button
                        onClick={() => router.push(`/product/${product.slug}`)}
                        className="text-xs uppercase tracking-wide underline hover:no-underline"
                      >
                        View
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Empty state - Minimalist */}
      {sortedProducts.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-neutral-400 mb-4">No products found</p>
          <button
            onClick={clearSearch}
            className="px-4 py-2 border border-neutral-200 text-sm hover:bg-neutral-50"
          >
            Clear Search
          </button>
        </div>
      )}
      
      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        open={isModalOpen}
        onClose={closeModal}
      />
      
      {/* Options Sheet */}
      <AddToCartSheet
        product={optionsProduct}
        isOpen={showOptionsSheet}
        onClose={handleCloseOptionsSheet}
      />
    </div>
  );
}

export default ClientFilter;