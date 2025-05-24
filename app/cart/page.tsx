'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart, CartItem } from '../../contexts/CartContext';
import { formatRupiah } from '../../lib/utils/format';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { BsTrash, BsArrowLeft, BsPencil, BsX, BsArrowRight } from 'react-icons/bs';
import { motion, AnimatePresence } from 'framer-motion';

// Add this helper function before the CartPage function
function isProductOptionsComplete(item: CartItem): boolean {
  // Check if the product has colors and a color is selected
  const needsColor = item.product.colors && item.product.colors.length > 0;
  const hasColor = !!item.selectedColor;
  
  // Check if the product has sizes and a size is selected
  const needsSize = item.product.sizes && item.product.sizes.length > 0;
  const hasSize = !!item.selectedSize;
  
  // Product is complete if it has all required options selected
  return (!needsColor || hasColor) && (!needsSize || hasSize);
}

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, updateOptions, clearCart, totalPrice } = useCart();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const { data: session, status } = useSession();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const router = useRouter();
  
  // State for which items are in edit mode (for desktop)
  const [editingItems, setEditingItems] = useState<{[key: number]: boolean}>({});
  
  // State for mobile bottom sheet
  const [mobileEditItem, setMobileEditItem] = useState<CartItem | null>(null);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [bottomSheetAnimation, setBottomSheetAnimation] = useState(false);
  
  // Animation states
  const [removingItemId, setRemovingItemId] = useState<number | null>(null);
  
  // Add this computed property to check if all items have complete options
  const allItemsComplete = cartItems.every(isProductOptionsComplete);
  
  // Add this function to get missing options text
  const getMissingOptionsText = (item: CartItem): string => {
    const missing = [];
    
    if (item.product.colors && item.product.colors.length > 0 && !item.selectedColor) {
      missing.push('color');
    }
    
    if (item.product.sizes && item.product.sizes.length > 0 && !item.selectedSize) {
      missing.push('size');
    }
    
    return missing.length > 0 ? `Please select: ${missing.join(', ')}` : '';
  };
  
  // Handle toggle desktop edit mode
  const toggleEditMode = (itemId: number) => {
    setEditingItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };
  
  // Handle mobile edit - open bottom sheet
  const openMobileEdit = (item: CartItem) => {
    setMobileEditItem(item);
    setBottomSheetVisible(true);
    // Animate after a short delay to ensure DOM is ready
    setTimeout(() => setBottomSheetAnimation(true), 50);
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
  };
  
  // Close mobile edit bottom sheet
  const closeMobileEdit = () => {
    setBottomSheetAnimation(false);
    // Wait for animation to complete before hiding
    setTimeout(() => {
      setBottomSheetVisible(false);
      setMobileEditItem(null);
      document.body.style.overflow = '';
    }, 300);
  };
  
  // Update product options and close the sheet if on mobile
  const handleUpdateOptions = (itemId: number, color?: string, size?: string) => {
    updateOptions(itemId, color, size);
    
    // Update local mobileEditItem state to immediately reflect the changes in the UI
    if (mobileEditItem && mobileEditItem.id === itemId) {
      setMobileEditItem({
        ...mobileEditItem,
        selectedColor: color !== undefined ? color : mobileEditItem.selectedColor,
        selectedSize: size !== undefined ? size : mobileEditItem.selectedSize
      });
    }
  };
  
  // Handle remove item with animation
  const handleRemoveItem = (itemId: number) => {
    setRemovingItemId(itemId);
    
    // Wait for animation to complete before actual removal
    setTimeout(() => {
      removeFromCart(itemId);
      setRemovingItemId(null);
    }, 300);
  };
  
  const handleCheckout = () => {
    if (status === 'unauthenticated') {
      // Show login modal if user is not authenticated
      setShowLoginModal(true);
      return;
    }
    
    // Proceed with checkout if user is authenticated
    setCheckoutLoading(true);
    
    // Redirect to checkout page
    router.push('/checkout');
    
    // Reset loading after small delay to ensure smooth transition
    setTimeout(() => {
      setCheckoutLoading(false);
    }, 500);
  };
  
  const redirectToLogin = () => {
    // Close modal and redirect to login page with callback URL
    setShowLoginModal(false);
    router.push(`/login?callbackUrl=${encodeURIComponent('/cart')}`);
  };
  
  const redirectToRegister = () => {
    // Close modal and redirect to register page
    setShowLoginModal(false);
    router.push('/register');
  };
  
  // Close modal if user becomes authenticated
  useEffect(() => {
    if (status === 'authenticated' && showLoginModal) {
      setShowLoginModal(false);
    }
  }, [status, showLoginModal]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);
  
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white font-karla flex items-center justify-center">
        <div className="w-full px-4 md:px-8 lg:px-12 py-12 text-center">
          <h1 className="text-2xl md:text-3xl font-monument mb-2">Your Cart</h1>
          <div className="h-px w-12 bg-neutral-300 mb-12 mx-auto"></div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md mx-auto"
          >
            <div className="aspect-square w-24 h-24 mx-auto mb-8 bg-neutral-50 rounded-full flex items-center justify-center">
              <BsTrash size={32} className="text-neutral-300" />
            </div>
            <p className="text-neutral-600 mb-8">Your cart is currently empty.</p>
            
            <Link 
              href="/shop" 
              className="inline-flex items-center gap-2 bg-neutral-900 text-white py-4 px-8 font-karla text-sm uppercase tracking-wider relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center gap-2">
                <BsArrowLeft className="group-hover:-translate-x-1 transition-transform duration-300" />
                Continue Shopping
              </span>
              <div className="absolute inset-0 bg-black scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500"></div>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-white font-karla">
      {/* Cart Header - Matching Shop Page Style */}
      <div className="w-full px-4 md:px-8 lg:px-12 pt-24 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl md:text-3xl font-monument mb-2">Your Cart ({cartItems.length})</h1>
          <div className="h-px w-12 bg-neutral-300 mb-8"></div>
          <p className="text-neutral-600 mb-6 max-w-xl">Review your items before proceeding to checkout. You can modify quantity or remove items as needed.</p>
        </motion.div>
      </div>
      
      <div className="px-4 md:px-8 lg:px-12 xl:px-16 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 xl:gap-24">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <AnimatePresence>
                {cartItems.map(item => (
                  <motion.div 
                    key={item.id} 
                    className={`border-b border-neutral-200 pb-6 ${removingItemId === item.id ? 'opacity-50' : ''}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.3 }}
                    layout
                  >
                    {/* Mobile layout (flex layout with specific ordering) */}
                    <div className="flex sm:hidden">
                      <Link href={`/product/${item.product.slug}`} className="w-24 h-24 relative flex-shrink-0 group overflow-hidden rounded-sm">
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          fill
                          style={{ objectFit: 'cover' }}
                          className="rounded-sm object-cover object-center transform transition-transform duration-700 group-hover:scale-110"
                          sizes="96px"
                        />
                      </Link>
                      
                      <div className="flex-1 ml-4">
                        <Link href={`/product/${item.product.slug}`} className="block">
                          <h2 className="font-monument text-sm mb-1 hover:text-neutral-600 transition-colors">{item.product.name}</h2>
                        </Link>
                        
                        {/* Mobile color/size display with directly editable options */}
                        <div className="flex flex-col mb-2">
                          <span className="text-xs text-neutral-600 mb-2">Options</span>
                          
                          {item.product.colors && item.product.colors.length > 0 && (
                            <div className="flex items-center gap-1.5 mb-2">
                              <span className="text-xs text-neutral-600 min-w-[40px]">Color:</span>
                              <div className="flex flex-wrap gap-1">
                                {item.product.colors.map(color => (
                                  <button
                                    key={color}
                                    className={`w-5 h-5 rounded-full ${
                                      color === item.selectedColor 
                                        ? 'ring-2 ring-offset-1 ring-neutral-900' 
                                        : 'border border-neutral-200'
                                    } ${!item.selectedColor ? 'animate-pulse ring-1 ring-red-300' : ''}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => handleUpdateOptions(item.id, color, item.selectedSize)}
                                    aria-label={`Select ${color} color`}
                                  />
                                ))}
                              </div>
                              {!item.selectedColor && (
                                <span className="text-red-500 text-[10px] ml-1">Required</span>
                              )}
                            </div>
                          )}
                          
                          {item.product.sizes && item.product.sizes.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-neutral-600 min-w-[40px]">Size:</span>
                              <div className="flex flex-wrap gap-1">
                                {item.product.sizes.map(size => (
                                  <button
                                    key={size}
                                    className={`px-2 py-0.5 text-[10px] border ${
                                      size === item.selectedSize 
                                        ? 'border-black bg-black text-white' 
                                        : 'border-neutral-200'
                                    } ${!item.selectedSize ? 'border-red-300' : ''}`}
                                    onClick={() => handleUpdateOptions(item.id, item.selectedColor, size)}
                                  >
                                    {size}
                                  </button>
                                ))}
                              </div>
                              {!item.selectedSize && (
                                <span className="text-red-500 text-[10px] ml-1">Required</span>
                              )}
                            </div>
                          )}
                          
                          {!isProductOptionsComplete(item) && (
                            <div className="mt-1 text-red-500 text-xs">
                              {getMissingOptionsText(item)}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-neutral-900 font-medium">{formatRupiah(item.product.price)}</p>
                          
                          <div className="flex border border-neutral-200 rounded-sm overflow-hidden shadow-sm">
                            <button 
                              className="w-8 h-8 flex items-center justify-center text-sm transition-colors hover:bg-neutral-100 active:bg-neutral-200 touch-manipulation"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              aria-label="Decrease quantity"
                              disabled={item.quantity <= 1}
                            >
                              -
                            </button>
                            <div className="w-8 h-8 flex items-center justify-center border-x border-neutral-200 text-sm">{item.quantity}</div>
                            <button 
                              className="w-8 h-8 flex items-center justify-center text-sm transition-colors hover:bg-neutral-100 active:bg-neutral-200 touch-manipulation"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        
                        <button
                          className="flex items-center gap-1 text-xs uppercase tracking-wider text-neutral-500 hover:text-neutral-900 mt-3 transition-colors"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <BsTrash size={12} />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Desktop layout (original layout) */}
                    <div className="hidden sm:flex sm:flex-row">
                      <Link href={`/product/${item.product.slug}`} className="sm:w-28 md:w-36 sm:h-28 md:h-36 relative sm:mr-6 group overflow-hidden rounded-sm">
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          fill
                          style={{ objectFit: 'cover' }}
                          className="rounded-sm object-cover object-center transform transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 768px) 112px, 144px"
                        />
                      </Link>
                      
                      <div className="flex-1 flex flex-row justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Link href={`/product/${item.product.slug}`} className="block">
                              <h2 className="font-monument text-base hover:text-neutral-600 transition-colors">{item.product.name}</h2>
                            </Link>
                          </div>
                          
                          {/* Always show editable options */}
                          <div className="flex flex-col mb-2 space-y-2">
                            {item.product.colors && item.product.colors.length > 0 && (
                              <div className="flex items-center flex-wrap gap-2">
                                <span className="text-neutral-600 text-xs">Color:</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {item.product.colors.map(color => (
                                    <button
                                      key={color}
                                      className={`w-6 h-6 rounded-full ${
                                        color === item.selectedColor 
                                          ? 'ring-2 ring-offset-1 ring-neutral-900' 
                                          : 'border border-neutral-200'
                                      } transition-all duration-200 hover:scale-110 ${!item.selectedColor ? 'animate-pulse ring-1 ring-red-300' : ''}`}
                                      style={{ backgroundColor: color }}
                                      onClick={() => handleUpdateOptions(item.id, color, item.selectedSize)}
                                      aria-label={`Select ${color} color`}
                                    >
                                      {color === item.selectedColor && (
                                        <span className="flex items-center justify-center h-full w-full">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                          </svg>
                                        </span>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {item.product.sizes && item.product.sizes.length > 0 && (
                              <div className="flex items-center flex-wrap gap-2">
                                <span className="text-neutral-600 text-xs">Size:</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {item.product.sizes.map(size => (
                                    <button
                                      key={size}
                                      className={`px-2 py-0.5 text-[10px] border ${
                                        size === item.selectedSize 
                                          ? 'border-black bg-black text-white' 
                                          : 'border-neutral-200'
                                      } transition-all duration-200 hover:scale-105 ${!item.selectedSize ? 'border-red-300' : ''}`}
                                      onClick={() => handleUpdateOptions(item.id, item.selectedColor, size)}
                                    >
                                      {size}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <p className="text-neutral-900 font-medium">{formatRupiah(item.product.price)}</p>
                          
                          <div className="mt-1 text-xs text-neutral-500">
                            Item Total: {formatRupiah(parseFloat(item.product.price) * item.quantity)}
                          </div>
                        </div>
                        
                        <div className="flex flex-col justify-between items-end">
                          <div className="flex border border-neutral-200 rounded-sm overflow-hidden shadow-sm">
                            <button 
                              className="w-8 h-8 flex items-center justify-center text-sm transition-colors hover:bg-neutral-100 active:bg-neutral-200 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              aria-label="Decrease quantity"
                            >
                              -
                            </button>
                            <div className="w-10 h-8 flex items-center justify-center border-x border-neutral-200">{item.quantity}</div>
                            <button 
                              className="w-8 h-8 flex items-center justify-center text-sm transition-colors hover:bg-neutral-100 active:bg-neutral-200 touch-manipulation"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                          
                          <button
                            className="flex items-center gap-1 text-xs uppercase tracking-wider text-neutral-500 hover:text-neutral-900 py-2 transition-colors duration-300 hover:scale-105"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <BsTrash size={14} />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
            
            <motion.div 
              className="mt-8 md:mt-10 flex flex-col sm:flex-row gap-4 justify-between items-center border-t border-neutral-100 pt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <button 
                className="text-sm uppercase tracking-wider text-neutral-600 hover:text-neutral-900 flex items-center gap-1 py-2 px-4 rounded-full border border-neutral-200 hover:border-neutral-400 transition-all duration-300"
                onClick={clearCart}
              >
                <BsTrash size={14} />
                Clear Cart
              </button>
              
              <Link 
                href="/shop" 
                className="text-sm uppercase tracking-wider text-neutral-600 hover:text-neutral-900 flex items-center gap-1 py-2 px-4 rounded-full border border-neutral-200 hover:border-neutral-400 transition-all duration-300"
              >
                <BsArrowLeft className="transition-transform duration-300 group-hover:-translate-x-1" />
                Continue Shopping
              </Link>
            </motion.div>
          </div>
          
          {/* Cart Summary */}
          <motion.div 
            className="bg-neutral-50 p-6 sm:p-8 h-fit rounded-sm border border-neutral-100 shadow-sm"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h2 className="font-monument text-lg mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatRupiah(totalPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-green-600">Free</span>
              </div>
              <div className="h-px w-full bg-neutral-200"></div>
              <div className="flex justify-between font-medium text-lg">
                <span>Total</span>
                <span>{formatRupiah(totalPrice)}</span>
              </div>
            </div>
            
            <button 
              className={`w-full py-4 px-6 font-karla text-sm uppercase tracking-wider transition-all duration-300 shadow-sm hover:shadow group relative overflow-hidden ${
                !allItemsComplete || checkoutLoading
                  ? 'bg-neutral-400 text-white cursor-not-allowed opacity-70'
                  : 'bg-neutral-900 text-white hover:bg-black hover:-translate-y-1'
              }`}
              onClick={handleCheckout}
              disabled={!allItemsComplete || checkoutLoading}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {!allItemsComplete 
                  ? 'Please Select All Options' 
                  : checkoutLoading 
                    ? 'Processing...' 
                    : 'Proceed to Checkout'
                }
                {allItemsComplete && !checkoutLoading && <BsArrowRight className="group-hover:translate-x-1 transition-transform duration-300" />}
              </span>
            </button>
            
            {!allItemsComplete && (
              <p className="text-xs text-red-500 text-center mt-3">
                Please select all required options for each product before proceeding
              </p>
            )}
            
            {allItemsComplete && status === 'authenticated' ? (
              <p className="text-xs text-neutral-500 text-center mt-3">
                Signed in as {session?.user?.email}
              </p>
            ) : (
              <p className="text-xs text-neutral-500 text-center mt-3">
                You'll be asked to login or create an account during checkout
              </p>
            )}
            
            <div className="mt-8 pt-6 border-t border-neutral-200">
              <h3 className="text-sm font-medium mb-3">We Accept</h3>
              <div className="flex gap-2">
                <div className="bg-white p-2 rounded border border-neutral-200 w-12 h-8 flex items-center justify-center">
                  <div className="text-[10px] font-medium text-neutral-500">Midtrans</div>
                </div>
                <div className="bg-white p-2 rounded border border-neutral-200 w-12 h-8 flex items-center justify-center">
                  <div className="text-[10px] font-medium text-neutral-500">VISA</div>
                </div>
                <div className="bg-white p-2 rounded border border-neutral-200 w-12 h-8 flex items-center justify-center">
                  <div className="text-[10px] font-medium text-neutral-500">MC</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Mobile Edit Options Bottom Sheet */}
      {bottomSheetVisible && mobileEditItem && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 sm:hidden animate-fadeIn"
          onClick={closeMobileEdit}
        >
          <motion.div 
            className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl transform transition-transform duration-300 ease-out ${
              bottomSheetAnimation ? 'translate-y-0' : 'translate-y-full'
            }`}
            onClick={e => e.stopPropagation()}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Handle and header */}
            <div className="flex flex-col items-center pt-4 px-5 pb-2 border-b border-neutral-100">
              <div className="w-10 h-1 bg-neutral-200 rounded-full mb-4"></div>
              <div className="flex items-center justify-between w-full">
                <h3 className="text-base font-medium">Edit Options</h3>
                <button 
                  onClick={closeMobileEdit}
                  className="text-neutral-500 p-2 -m-2"
                >
                  <BsX size={20} />
                </button>
              </div>
            </div>
            
            {/* Product info */}
            <div className="p-5">
              <div className="flex items-start gap-3 mb-5">
                <div className="w-16 h-16 relative flex-shrink-0 bg-neutral-50 rounded-sm overflow-hidden">
                  <Image
                    src={mobileEditItem.product.images[0]}
                    alt={mobileEditItem.product.name}
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 768px) 64px"
                  />
                </div>
                <div>
                  <h4 className="font-medium text-sm">{mobileEditItem.product.name}</h4>
                  <p className="text-neutral-900 text-sm mt-1">{formatRupiah(mobileEditItem.product.price)}</p>
                </div>
              </div>
              
              {/* Options selectors */}
              <div className="space-y-5">
                {mobileEditItem.product.colors && mobileEditItem.product.colors.length > 0 && (
                  <div>
                    <span className="text-sm text-neutral-600 block mb-2">Color</span>
                    <div className="flex flex-wrap gap-2">
                      {mobileEditItem.product.colors.map(color => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded-full ${
                            color === mobileEditItem.selectedColor 
                              ? 'ring-2 ring-offset-1 ring-neutral-900' 
                              : 'border border-neutral-200'
                          } transition-all duration-200 hover:scale-105`}
                          style={{ backgroundColor: color }}
                          onClick={() => handleUpdateOptions(mobileEditItem.id, color, mobileEditItem.selectedSize)}
                          aria-label={`Select ${color} color`}
                        >
                          {color === mobileEditItem.selectedColor && (
                            <span className="flex items-center justify-center h-full w-full">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {mobileEditItem.product.sizes && mobileEditItem.product.sizes.length > 0 && (
                  <div>
                    <span className="text-sm text-neutral-600 block mb-2">Size</span>
                    <div className="flex flex-wrap gap-2">
                      {mobileEditItem.product.sizes.map(size => (
                        <button
                          key={size}
                          className={`px-3 py-1 text-sm border ${
                            size === mobileEditItem.selectedSize 
                              ? 'border-black bg-black text-white' 
                              : 'border-neutral-200 hover:border-neutral-400'
                          } transition-all duration-200`}
                          onClick={() => handleUpdateOptions(mobileEditItem.id, mobileEditItem.selectedColor, size)}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Save button */}
              <button
                className="w-full bg-black text-white py-3 rounded-sm mt-6 mb-5 text-sm uppercase tracking-wider hover:bg-neutral-800 transition-colors"
                onClick={closeMobileEdit}
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <motion.div 
            className="bg-white max-w-md w-full p-8 rounded-sm shadow-lg"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <div className="text-center mb-8">
              <h3 className="font-monument text-xl mb-3">Login Required</h3>
              <p className="text-neutral-600 text-sm mb-3">Please sign in or create an account to complete your purchase.</p>
              <p className="text-xs text-neutral-500">You'll be automatically returned to your cart after signing in.</p>
            </div>
            
            <div className="space-y-4">
              <button 
                onClick={redirectToLogin}
                className="w-full bg-black text-white py-3 text-sm uppercase tracking-wide hover:bg-neutral-800 transition-colors"
              >
                Sign In
              </button>
              
              <button 
                onClick={redirectToRegister}
                className="w-full border border-neutral-300 py-3 text-sm uppercase tracking-wide hover:bg-neutral-50 transition-colors"
              >
                Create Account
              </button>
              
              <button 
                onClick={() => setShowLoginModal(false)}
                className="w-full text-neutral-500 py-2 text-sm hover:text-neutral-800 transition-colors"
              >
                Continue as Guest
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
} 