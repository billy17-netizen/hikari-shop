'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Product } from '../../../types/product';
import { formatRupiah } from '../../../lib/utils/format';
import { useCart } from '../../../contexts/CartContext';
import WishlistButton from '../../components/wishlist/WishlistButton';
import toast from 'react-hot-toast';
import Drawer from 'react-bottom-drawer';

// Register ScrollTrigger plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface ProductClientProps {
  product: Product;
}

export default function ProductClient({ product }: ProductClientProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const productRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileOptions, setShowMobileOptions] = useState(false);
  
  // Cart state
  const { addToCart } = useCart();

  // Check if device is mobile
  React.useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decrementQuantity = () => {
    setQuantity(prev => prev > 1 ? prev - 1 : 1);
  };
  
  // Check if the product can be added to cart
  const isAddToCartDisabled = () => {
    if (!product.inStock) return true;
    
    // Check if selections are required but not made
    const needsColor = product.colors.length > 0 && !selectedColor;
    const needsSize = product.sizes.length > 0 && !selectedSize;
    
    return needsColor || needsSize;
  };
  
  // Handle adding to cart
  const handleAddToCart = () => {
    // Validate selections
    if (product.colors.length > 0 && !selectedColor) {
      toast.error('Please select a color');
      return;
    }
    
    if (product.sizes.length > 0 && !selectedSize) {
      toast.error('Please select a size');
      return;
    }

    // For mobile, show options drawer
    if (isMobile && (product.colors.length > 0 || product.sizes.length > 0)) {
      setShowMobileOptions(true);
      return;
    }
    
    // Add to cart
    addToCart(product, quantity, selectedColor || undefined, selectedSize || undefined);
    
    // Show toast notification with custom content
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white shadow-lg rounded-sm pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <img
                className="h-12 w-12 object-cover rounded-sm"
                src={product.images[0]}
                alt={product.name}
              />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">
                Added to cart
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {product.name}
                {selectedSize && ` - Size: ${selectedSize}`}
                {selectedColor && ` - Color: ${selectedColor}`}
              </p>
              <p className="mt-1 text-sm font-semibold">
                {formatRupiah(product.price)} × {quantity}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-sm p-4 flex items-center justify-center text-sm font-medium text-neutral-600 hover:text-neutral-500 focus:outline-none"
          >
            Close
          </button>
        </div>
      </div>
    ), { 
      duration: 3000,
      position: 'top-right',
    });
  };

  // Handle confirming options from mobile drawer
  const handleConfirmOptions = () => {
    // Add to cart
    addToCart(product, quantity, selectedColor || undefined, selectedSize || undefined);
    
    // Show toast notification
    toast.success(`${product.name} added to your cart!`);
    
    // Close the drawer
    setShowMobileOptions(false);
  };
  
  useGSAP(() => {
    // Create a timeline for smooth, sequenced animations
    const tl = gsap.timeline();
    
    // Animate main image
    tl.fromTo(
      '.product-main-image',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
    )
    
    // Animate thumbnails
    .fromTo(
      '.product-thumbnail',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, stagger: 0.15, duration: 0.5, ease: 'power2.out' },
      '-=0.4'
    )
    
    // Animate product info elements sequentially
    .fromTo(
      '.product-info-item',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, stagger: 0.1, duration: 0.6, ease: 'power2.out' },
      '-=0.3'
    );
    
  }, { scope: productRef });

  // Helper for rendering color options
  const getColorStyle = (color: string) => {
    switch(color.toLowerCase()) {
      case 'black': return 'bg-neutral-900';
      case 'white': return 'bg-white';
      case 'cream': return 'bg-amber-50';
      case 'brown': return 'bg-amber-800';
      case 'olive': return 'bg-olive-600';
      case 'sand': return 'bg-amber-200';
      default: return 'bg-gray-200';
    }
  };

  return (
    <>
      <div ref={productRef} className="py-12 md:py-20 font-karla bg-white">
        <div className="w-full max-w-full px-4 sm:px-8">
          {/* Breadcrumbs */}
          <div className="mb-8 mt-2 md:mt-4 text-sm text-neutral-500">
            <Link href="/" className="hover:text-neutral-900 transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/shop" className="hover:text-neutral-900 transition-colors">Shop</Link>
            <span className="mx-2">/</span>
            <span className="text-neutral-900">{product.name}</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 xl:gap-24">
            {/* Product Images */}
            <div>
              <div className="product-main-image relative aspect-square mb-4 overflow-hidden">
                <Image
                  src={product.images[selectedImage]}
                  alt={product.name}
                  fill
                  priority
                  style={{ objectFit: 'cover' }}
                  className="rounded-sm"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {product.images.map((image, index) => (
                  <button 
                    key={index} 
                    className={`product-thumbnail relative aspect-square overflow-hidden ${
                      selectedImage === index ? 'ring-1 ring-neutral-900' : 'ring-1 ring-neutral-200'
                    }`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} - Image ${index + 1}`}
                      fill
                      style={{ objectFit: 'cover' }}
                      className="transition duration-300 ease-in-out"
                      sizes="(max-width: 768px) 30vw, 15vw"
                    />
                  </button>
                ))}
              </div>
            </div>
            
            {/* Product Info */}
            <div>
              <div className="product-info-item">
                <h1 className="text-2xl md:text-3xl font-monument mb-2">{product.name}</h1>
                <div className="h-px w-12 bg-neutral-300 mb-6"></div>
              </div>
              
              <div className="product-info-item text-xl mb-8">{formatRupiah(product.price)}</div>
              
              <div className="product-info-item mb-8">
                <p className="text-neutral-600">{product.description}</p>
              </div>
              
              {/* Color Selection */}
              <div className="product-info-item mb-8">
                <h3 className="font-monument text-sm uppercase tracking-wider mb-4">Color</h3>
                <div className="flex space-x-3">
                  {product.colors.map((color, index) => (
                    <button 
                      key={index} 
                      className={`relative group`}
                      onClick={() => setSelectedColor(color)}
                    >
                      <span className={`absolute -inset-1 rounded-full ${selectedColor === color ? 'border border-neutral-900' : 'border border-transparent'}`}></span>
                      <span 
                        className={`block w-6 h-6 rounded-full ${getColorStyle(color)}`}
                        aria-label={color}
                      ></span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Size Selection */}
              <div className="product-info-item mb-8">
                <h3 className="font-monument text-sm uppercase tracking-wider mb-4">Size</h3>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size, index) => (
                    <button 
                      key={index} 
                      className={`px-4 py-2 border ${
                        selectedSize === size 
                          ? 'border-neutral-900 bg-neutral-900 text-white' 
                          : 'border-neutral-200 hover:border-neutral-300'
                      } transition-colors duration-200`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Quantity & Add to Cart */}
              <div className="product-info-item flex flex-col sm:flex-row gap-4 mb-8">
                <div className="flex border border-neutral-200 overflow-hidden">
                  <button 
                    className="w-12 h-12 flex items-center justify-center text-xl font-medium transition-colors hover:bg-neutral-100 touch-manipulation focus:outline-none active:bg-neutral-200"
                    onClick={decrementQuantity}
                    aria-label="Decrease quantity"
                    type="button"
                  >
                    <span className="leading-none inline-flex items-center justify-center w-full h-full">−</span>
                  </button>
                  <div className="w-12 h-12 flex items-center justify-center border-x border-neutral-200 font-medium">{quantity}</div>
                  <button 
                    className="w-12 h-12 flex items-center justify-center text-xl font-medium transition-colors hover:bg-neutral-100 touch-manipulation focus:outline-none active:bg-neutral-200"
                    onClick={incrementQuantity}
                    aria-label="Increase quantity"
                    type="button"
                  >
                    <span className="leading-none inline-flex items-center justify-center w-full h-full">+</span>
                  </button>
                </div>
                
                <button 
                  className={`flex-1 py-3 px-6 font-karla text-sm uppercase tracking-wider transition-colors duration-300 ${
                    isAddToCartDisabled()
                      ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                      : 'bg-neutral-900 text-white hover:bg-neutral-800'
                  }`}
                  onClick={handleAddToCart}
                  disabled={isAddToCartDisabled()}
                >
                  {isAddToCartDisabled() && (product.colors.length > 0 || product.sizes.length > 0)
                    ? 'Select Options'
                    : 'Add to Cart'
                  }
                </button>
              </div>
              
              {/* Wishlist Button */}
              <div className="product-info-item mb-8">
                <WishlistButton product={product} variant="button" className="w-full sm:w-auto" />
              </div>
              
              {/* Product Details */}
              <div className="product-info-item border-t border-neutral-200 pt-6">
                <h3 className="font-monument text-sm uppercase tracking-wider mb-4">Details</h3>
                <ul className="space-y-2 text-neutral-600">
                  {product.details.map((detail, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2 text-xs">◆</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Options Drawer */}
      {isMobile && (
        <Drawer
          isVisible={showMobileOptions}
          onClose={() => setShowMobileOptions(false)}
          duration={300}
        >
          <div className="p-5">
            <div className="w-12 h-1 bg-neutral-200 rounded-full mx-auto mb-5"></div>
            
            <h3 className="text-lg font-medium mb-4">Product Options</h3>
            
            {/* Product info */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-20 h-20 bg-neutral-50 rounded-md overflow-hidden relative flex-shrink-0">
                <Image 
                  src={product.images[0]} 
                  alt={product.name}
                  fill
                  sizes="100px"
                  className="object-cover object-center"
                />
              </div>
              <div>
                <h4 className="font-medium">{product.name}</h4>
                <p className="text-sm text-neutral-500 mt-1">{formatRupiah(product.price)}</p>
              </div>
            </div>
            
            {/* Color Selection */}
            {product.colors.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-sm mb-3">Select Color</h4>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color, index) => (
                    <button 
                      key={index} 
                      className={`relative group`}
                      onClick={() => setSelectedColor(color)}
                    >
                      <span className={`absolute -inset-1 rounded-full ${selectedColor === color ? 'border border-neutral-900' : 'border border-transparent'}`}></span>
                      <span 
                        className={`block w-8 h-8 rounded-full ${getColorStyle(color)}`}
                        aria-label={color}
                      ></span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Size Selection */}
            {product.sizes.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-sm mb-3">Select Size</h4>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size, index) => (
                    <button 
                      key={index} 
                      className={`px-4 py-2 border ${
                        selectedSize === size 
                          ? 'border-neutral-900 bg-neutral-900 text-white' 
                          : 'border-neutral-200 hover:border-neutral-300'
                      } transition-colors duration-200`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Quantity selector */}
            <div className="mb-6">
              <h4 className="font-medium text-sm mb-3">Quantity</h4>
              <div className="flex border border-neutral-200 w-36 overflow-hidden">
                <button 
                  className="w-12 h-12 flex items-center justify-center text-xl font-medium transition-colors hover:bg-neutral-100 touch-manipulation focus:outline-none active:bg-neutral-200"
                  onClick={decrementQuantity}
                  aria-label="Decrease quantity"
                  type="button"
                >
                  <span className="leading-none inline-flex items-center justify-center w-full h-full">−</span>
                </button>
                <div className="w-12 h-12 flex items-center justify-center border-x border-neutral-200 font-medium">{quantity}</div>
                <button 
                  className="w-12 h-12 flex items-center justify-center text-xl font-medium transition-colors hover:bg-neutral-100 touch-manipulation focus:outline-none active:bg-neutral-200"
                  onClick={incrementQuantity}
                  aria-label="Increase quantity"
                  type="button"
                >
                  <span className="leading-none inline-flex items-center justify-center w-full h-full">+</span>
                </button>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleConfirmOptions}
                className="w-full bg-black text-white py-3 rounded-md font-medium"
                disabled={isAddToCartDisabled()}
              >
                Add to Cart
              </button>
              <button
                onClick={() => setShowMobileOptions(false)}
                className="w-full border border-neutral-300 py-3 rounded-md font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </Drawer>
      )}
    </>
  );
} 