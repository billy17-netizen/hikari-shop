'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { formatRupiah } from '../../../lib/utils/format';
import { Product } from '../../../types/product';
import { useCart } from '../../../contexts/CartContext';
import toast from 'react-hot-toast';

const BestProducts: React.FC = () => {
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  
  // Cart state
  const { addToCart } = useCart();
  
  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        // Only show the first 3 products for best sellers section
        setProducts(data.slice(0, 3));
      } catch (error) {
        console.error('Error fetching products:', error);
        // Set some fallback products if fetch fails
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProducts();
  }, []);
  
  // Simple but effective scroll visibility checker
  useEffect(() => {
    const checkVisibility = () => {
      if (!sectionRef.current) return;
      
      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Element is considered visible when it's 20% in the viewport
      if (rect.top <= windowHeight * 0.8) {
        setIsVisible(true);
        window.removeEventListener('scroll', checkVisibility);
      }
    };
    
    window.addEventListener('scroll', checkVisibility);
    // Check on mount too
    checkVisibility();
    
    return () => {
      window.removeEventListener('scroll', checkVisibility);
    };
  }, []);
  
  // Handle adding product to cart
  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
    
    // Show toast notification
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
              </p>
              <p className="mt-1 text-sm font-semibold">
                {formatRupiah(product.price)}
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
  
  const titleVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };
  
  const dividerVariants = {
    hidden: { width: 0, opacity: 0 },
    visible: {
      width: '3rem',
      opacity: 1,
      transition: { duration: 0.8, delay: 0.2 }
    }
  };
  
  const productVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { 
        duration: 0.7,
        delay: i * 0.4, // Longer delay between items for more pronounced effect
        ease: [0.25, 0.1, 0.25, 1.0], // Smooth easing
      }
    })
  };

  if (isLoading) {
    return (
      <section className="py-24 bg-white font-karla">
        <div className="max-w-[2000px] mx-auto px-5 lg:px-16 xl:px-20">
          <div className="text-center">
            <div className="animate-pulse h-8 w-40 bg-neutral-200 rounded mx-auto mb-2"></div>
            <div className="animate-pulse h-px w-12 bg-neutral-200 mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 mt-16">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-neutral-200 mb-5"></div>
                <div className="h-4 bg-neutral-200 w-3/4 mb-2"></div>
                <div className="h-4 bg-neutral-200 w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section 
        ref={sectionRef}
        className="py-24 bg-white font-karla overflow-hidden"
      >
        <div className="max-w-[2000px] mx-auto px-5 lg:px-16 xl:px-20">
          {/* Section header */}
          <div className="mb-16 text-center">
            <motion.h2 
              className="section-title text-3xl md:text-4xl font-monument mb-2"
              initial="hidden"
              animate={isVisible ? "visible" : "hidden"}
              variants={titleVariants}
            >
              Best Sellers
            </motion.h2>
            <motion.div 
              className="title-divider h-px bg-neutral-900 mx-auto"
              style={{ width: 0 }}
              initial="hidden"
              animate={isVisible ? "visible" : "hidden"}
              variants={dividerVariants}
            ></motion.div>
          </div>
          
          {/* Products grid */}
          <div className="product-grid grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {products.map((product, index) => (
              <motion.div 
                key={product.id}
                className="product-item"
                initial="hidden"
                animate={isVisible ? "visible" : "hidden"}
                variants={productVariants}
                custom={index}
                onMouseEnter={() => setHoveredProduct(product.id)}
                onMouseLeave={() => setHoveredProduct(null)}
              >
                {/* Product image */}
                <Link href={`/product/${product.slug}`} className="block mb-5">
                  <div className="product-image relative aspect-square overflow-hidden bg-neutral-50">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="(max-width: 768px) 100vw, 33vw"
                      priority={index === 0}
                      className="transition-all duration-700 ease-out hover:scale-105"
                    />
                  </div>
                </Link>
                
                {/* Product info with add to cart */}
                <div className="product-info flex flex-col gap-2">
                  <h3 className="font-monument text-sm">{product.name}</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-900">{formatRupiah(product.price)}</span>
                    <button 
                      className={`text-xs uppercase tracking-wide py-1 border-b transition-all duration-300 ${
                        hoveredProduct === product.id 
                          ? 'border-neutral-900' 
                          : 'border-transparent'
                      }`}
                      onClick={() => handleAddToCart(product)}
                      aria-label={`Add ${product.name} to cart`}
                    >
                      Add to cart
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default BestProducts; 