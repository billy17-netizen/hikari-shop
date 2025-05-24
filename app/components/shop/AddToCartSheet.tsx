'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { formatRupiah } from '../../../lib/utils/format';
import { useCart } from '../../../contexts/CartContext';
import { Product } from '../../../types/product';
import toast from 'react-hot-toast';
import ImageGallery from './ImageGallery';

interface AddToCartSheetProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const AddToCartSheet: React.FC<AddToCartSheetProps> = ({ product, isOpen, onClose }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);
  const { addToCart } = useCart();
  
  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  // Reset selections when product changes
  useEffect(() => {
    if (product) {
      setQuantity(1);
      setSelectedSize('');
      setSelectedColor('');
    }
  }, [product]);
  
  // Control body scroll lock
  useEffect(() => {
    if (isOpen) {
      // Lock scroll when sheet is open
      document.body.style.overflow = 'hidden';
    } else {
      // Restore scroll when sheet is closed
      document.body.style.overflow = '';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };
  
  const decrementQuantity = () => {
    setQuantity(prev => (prev > 1 ? prev - 1 : 1));
  };
  
  const handleAddToCart = () => {
    if (product) {
      // Add to cart with specified options
      addToCart(product, quantity, selectedColor, selectedSize);
      toast.success(`${product.name} added to cart`);
      onClose();
    }
  };
  
  // Check if required options are selected
  const isOptionMissing = (product?.sizes && product.sizes.length > 0 && !selectedSize) || 
                          (product?.colors && product.colors.length > 0 && !selectedColor);
  
  // Only render on mobile devices
  if (!isMobile || !product) return null;
  
  return (
    <div className={`fixed inset-0 z-[9999] ${isOpen ? 'visible' : 'invisible'} pointer-events-auto`}>
      {/* Semi-transparent backdrop */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isOpen ? 'opacity-30' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-xl transform transition-transform duration-300 ease-out shadow-lg ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ 
          maxHeight: '80vh', 
          overflow: 'auto',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s ease-out' 
        }}
      >
        {/* Handle bar */}
        <div className="w-12 h-1 bg-neutral-200 rounded-full mx-auto my-3" />
        
        <div className="p-5 pb-8">
          {/* Product info */}
          <div className="flex items-start space-x-3 mb-6">
            <div className="shrink-0">
              <ImageGallery 
                images={product.images} 
                altText={product.name}
                thumbnailMode={true}
              />
            </div>
            
            <div className="flex-1">
              <h3 className="text-sm font-medium">{product.name}</h3>
              <p className="text-sm font-medium text-black mt-1">
                {formatRupiah(product.price)}
              </p>
              <span className={`inline-block text-xs px-2 py-0.5 mt-1 rounded ${
                product.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
          </div>
          
          {/* Size selector */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mb-5">
              <label className="block text-sm font-medium mb-2">Size</label>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(selectedSize === size ? '' : size)}
                    className={`px-3 py-2 border text-xs rounded-md transition-colors ${
                      selectedSize === size 
                        ? 'border-black bg-black text-white' 
                        : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Color selector */}
          {product.colors && product.colors.length > 0 && (
            <div className="mb-5">
              <label className="block text-sm font-medium mb-2">Color</label>
              <div className="flex flex-wrap gap-2">
                {product.colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(selectedColor === color ? '' : color)}
                    className={`px-3 py-2 border text-xs rounded-md transition-colors ${
                      selectedColor === color 
                        ? 'border-black bg-black text-white' 
                        : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Quantity */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Quantity</label>
            <div className="flex items-center border border-neutral-200 rounded-md w-32">
              <button 
                className="w-10 h-10 flex items-center justify-center text-neutral-400"
                onClick={decrementQuantity}
                disabled={quantity <= 1}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <div className="flex-1 text-center">{quantity}</div>
              <button 
                className="w-10 h-10 flex items-center justify-center text-neutral-400"
                onClick={incrementQuantity}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-col gap-3 pt-4 border-t border-neutral-100">
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock || isOptionMissing}
              className={`w-full py-3.5 px-6 rounded-md font-medium transition-colors ${
                product.inStock && !isOptionMissing
                  ? 'bg-black text-white hover:bg-neutral-800' 
                  : 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
              }`}
            >
              {isOptionMissing 
                ? 'Select Options' 
                : `Add to Cart • ${formatRupiah(product.price)} × ${quantity}`}
            </button>
            
            <button
              onClick={onClose}
              className="w-full py-3 px-6 rounded-md font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddToCartSheet; 