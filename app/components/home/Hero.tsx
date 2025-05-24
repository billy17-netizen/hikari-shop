'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// Create a client-only video component to avoid hydration mismatches
const ClientOnlyVideo = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isClient, setIsClient] = useState(false);
  
  // Only render video after hydration is complete
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    // Return a placeholder during SSR to maintain layout
    return (
      <div className="absolute inset-0 w-full h-full bg-gray-900"></div>
    );
  }
  
  return (
    <>
      <video 
        ref={videoRef}
        autoPlay 
        loop 
        muted 
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/video/hiraki-video.webm" type="video/webm" />
        Your browser does not support the video tag.
      </video>
      {/* Subtle overlay */}
      <div className="absolute inset-0 bg-black/20"></div>
    </>
  );
};

// Mobile-optimized modal component
const MobileModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 touch-none md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white w-full max-h-[85vh] rounded-t-2xl p-6 overflow-y-auto overscroll-contain"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>
            
            <h2 className="text-2xl font-monument text-center mb-6">HIKARI Collection</h2>
            
            <div className="space-y-6 mb-8">
              <p className="text-gray-700">
                Discover our meticulously curated collection of premium fashion pieces designed for the modern woman.
              </p>
              <p className="text-gray-700">
                Each piece in our collection embodies elegance and sophistication, carefully crafted with attention to detail.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="aspect-[2/3] bg-gray-100 rounded-lg overflow-hidden">
                <img src="/images/collection-preview-1.jpg" alt="Collection preview" className="w-full h-full object-cover" />
              </div>
              <div className="aspect-[2/3] bg-gray-100 rounded-lg overflow-hidden">
                <img src="/images/collection-preview-2.jpg" alt="Collection preview" className="w-full h-full object-cover" />
              </div>
            </div>
            
            <Link 
              href="/shop" 
              className="block w-full text-center bg-black hover:bg-gray-900 text-white font-medium text-sm tracking-widest py-4 rounded-full transition-all duration-300 uppercase"
            >
              Shop Collection
            </Link>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Hero: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewportHeight, setViewportHeight] = useState('100vh');
  
  // Detect mobile device and handle viewport height
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      
      // Fix for mobile viewport height (addresses the white space at bottom issue)
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      setViewportHeight(`calc(var(--vh, 1vh) * 100)`);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // Animation variants for staggered animations - used for desktop
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1.0] }
    }
  };

  return (
    <>
      <div 
        className="relative overflow-hidden font-karla"
        style={{ 
          height: viewportHeight,
          width: '100%'
        }}
      >
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full">
          <ClientOnlyVideo />
        </div>
        
        {/* Hero content */}
        <motion.div 
          className="absolute bottom-20 w-full text-center z-10"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <div className="max-w-4xl mx-auto px-6">
            {/* Main title with wide letter spacing */}
            <motion.h1 
              className="hero-title text-4xl sm:text-5xl md:text-6xl font-normal text-white tracking-[0.15em] mb-4 font-monument"
              variants={itemVariants}
            >
              Elegance in every Detail.
            </motion.h1>
            
            {/* Subtitle */}
            <motion.p 
              className="hero-subtitle text-base font-light text-white/90 mb-10 tracking-wider"
              variants={itemVariants}
            >
              Discover our meticulously curated collection of premium fashion pieces
            </motion.p>
            
            {/* Button - different styling for mobile vs desktop */}
            <motion.div 
              className="hero-button-wrapper mb-12"
              variants={itemVariants}
            >
              {isMobile ? (
                <button
                  onClick={() => setModalOpen(true)}
                  className="inline-block bg-white hover:bg-white/90 text-neutral-800 font-medium text-sm tracking-widest px-12 py-3.5 rounded-full transition-all duration-300 uppercase shadow-lg"
                >
                  View Collection
                </button>
              ) : (
                <Link 
                  href="/shop" 
                  className="inline-block bg-white hover:bg-white/90 text-neutral-800 font-medium text-sm tracking-widest px-12 py-3.5 rounded-full transition-all duration-300 uppercase shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Shop Collection
                </Link>
              )}
            </motion.div>
            
            {/* Discover more text with arrow - mobile version uses a swipe-up animation */}
            <motion.div 
              className={`discover-more text-white/80 text-xs tracking-[0.2em] uppercase flex flex-col items-center ${isMobile ? 'animate-bounce' : ''}`}
              variants={itemVariants}
              onClick={() => isMobile && setModalOpen(true)}
            >
              <span className="mb-1">{isMobile ? 'Swipe Up' : 'Discover More'}</span>
              <svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-pulse">
                <path d="M1 1L7 7L13 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>
          </div>
        </motion.div>
      </div>
      
      {/* Mobile-only modal */}
      <MobileModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};

export default Hero;