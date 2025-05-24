'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Modal } from 'react-responsive-modal';
import 'react-responsive-modal/styles.css';
import { formatRupiah } from '../../../lib/utils/format';
import { useCart } from '../../../contexts/CartContext';
import { Product } from '../../../types/product';
import toast from 'react-hot-toast';
import AddToCartSheet from './AddToCartSheet';
import ImageGallery from './ImageGallery';

// Custom styling for the modal
const modalStyles = {
  modal: {
    maxWidth: '800px',
    width: '90%',
    borderRadius: '4px',
    padding: '0',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
  },
  closeButton: {
    top: '10px',
    right: '10px',
    background: 'white',
    borderRadius: '50%',
    padding: '5px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  overlay: {
    background: 'rgba(0, 0, 0, 0.75)',
  },
};

interface ProductModalProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, open, onClose }) => {
  const [quantity, setQuantity] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
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
  
  // Reset state when modal opens or product changes
  useEffect(() => {
    if (open && product) {
      setQuantity(1);
      setShowOptionsSheet(false);
      setSelectedSize('');
      setSelectedColor('');
    }
  }, [open, product]);
  
  // Control body scroll lock
  useEffect(() => {
    if (open) {
      // Lock scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      // Restore scroll when modal is closed
      document.body.style.overflow = '';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);
  
  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };
  
  const decrementQuantity = () => {
    setQuantity(prev => (prev > 1 ? prev - 1 : 1));
  };
  
  const handleAddToCart = () => {
    if (product) {
      // On mobile with options, show options sheet instead of direct add
      if (isMobile && (product.sizes?.length > 0 || product.colors?.length > 0)) {
        setShowOptionsSheet(true);
        // Don't close modal - keep it visible behind the sheet
        return;
      }
      
      // Add to cart (using selected options on desktop)
      addToCart(product, 1, selectedColor, selectedSize);
      toast.success(`${product.name} added to cart`);
      onClose();
    }
  };
  
  // Check if required options are selected
  const isOptionMissing = !isMobile && (
    (product?.sizes && product.sizes.length > 0 && !selectedSize) || 
    (product?.colors && product.colors.length > 0 && !selectedColor)
  );
  
  if (!product) return null;
  
  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        center
        classNames={{
          modal: 'customModal',
          overlay: 'customOverlay',
          closeButton: 'customCloseButton',
        }}
        styles={modalStyles}
      >
        <div className="flex flex-col md:flex-row">
          {/* Product Image */}
          <div className="w-full md:w-1/2 relative p-4">
            <div className="w-full aspect-square relative rounded-md overflow-hidden cursor-pointer">
              <ImageGallery 
                images={product.images} 
                altText={product.name} 
              />
            </div>
          </div>
          
          {/* Product Details */}
          <div className="w-full md:w-1/2 p-6 flex flex-col">
            <h2 className="text-xl md:text-2xl font-medium mb-2">{product.name}</h2>
            <p className="text-lg font-medium mb-3 text-black">
              {formatRupiah(product.price)}
            </p>
            
            <div className="mb-4">
              <span className={`inline-block px-3 py-1 text-sm rounded ${
                product.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
            
            <p className="text-neutral-600 mb-6 text-sm">
              {product.description}
            </p>
            
            {/* Size selector (desktop only) */}
            {!isMobile && product.sizes && product.sizes.length > 0 && (
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
            
            {/* Color selector (desktop only) */}
            {!isMobile && product.colors && product.colors.length > 0 && (
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
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-3 mt-auto">
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock || isOptionMissing}
                className={`w-full py-3 px-6 rounded-sm font-medium transition-colors ${
                  product.inStock && !isOptionMissing
                    ? 'bg-black text-white hover:bg-neutral-800' 
                    : 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                }`}
              >
                {isMobile && (product.sizes.length > 0 || product.colors.length > 0) 
                  ? 'Select Options' 
                  : isOptionMissing
                    ? 'Select Options'
                    : 'Add to Cart'}
              </button>
              
              <button
                onClick={() => window.location.href = `/product/${product.slug}`}
                className="w-full py-3 px-6 rounded-sm font-medium border border-black text-black hover:bg-neutral-100 transition-colors"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      </Modal>
      
      {/* Options Sheet for Mobile */}
      <AddToCartSheet 
        product={product} 
        isOpen={showOptionsSheet} 
        onClose={() => setShowOptionsSheet(false)} 
      />
    </>
  );
};

export default ProductModal; 