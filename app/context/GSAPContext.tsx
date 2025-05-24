'use client';

import React, { createContext, useContext, ReactNode, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';

// Register GSAP plugins
gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollSmoother);

interface GSAPContextType {
  smoother: React.MutableRefObject<ScrollSmoother | null>;
  smoothWrapper: React.RefObject<HTMLDivElement | null>;
  smoothContent: React.RefObject<HTMLDivElement | null>;
}

const GSAPContext = createContext<GSAPContextType | undefined>(undefined);

export const GSAPProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const smoothWrapper = useRef<HTMLDivElement>(null);
  const smoothContent = useRef<HTMLDivElement>(null);
  const smoother = useRef<ScrollSmoother | null>(null);

  // Use the official GSAP React hook
  useGSAP(() => {
    // Skip if elements aren't available
    if (!smoothWrapper.current || !smoothContent.current) return;
    
    // Set default GSAP configurations
    gsap.defaults({
      ease: 'power3.out',
      duration: 0.8,
    });

    // Initialize ScrollSmoother
    smoother.current = ScrollSmoother.create({
      wrapper: smoothWrapper.current,
      content: smoothContent.current,
      smooth: 1.5,
      effects: true,
      normalizeScroll: true,
      ignoreMobileResize: false
    });

    // Force refresh ScrollTrigger to ensure proper content height detection
    ScrollTrigger.refresh();
    
    // Listen for custom gsap-refresh event
    const handleRefresh = () => {
      if (smoother.current) {
        ScrollTrigger.refresh();
      }
    };
    
    window.addEventListener('gsap-refresh', handleRefresh);
    
    return () => {
      // This will be called automatically when the component unmounts
      window.removeEventListener('gsap-refresh', handleRefresh);
      if (smoother.current) {
        smoother.current.kill();
        smoother.current = null;
      }
    };
  }, { scope: smoothWrapper });

  const value: GSAPContextType = {
    smoother,
    smoothWrapper,
    smoothContent,
  };

  return (
    <GSAPContext.Provider value={value}>
      <div ref={smoothWrapper} id="smooth-wrapper" className="relative">
        <div ref={smoothContent} id="smooth-content">
          {children}
        </div>
      </div>
    </GSAPContext.Provider>
  );
};

export const useGSAPContext = (): GSAPContextType => {
  const context = useContext(GSAPContext);
  if (context === undefined) {
    throw new Error('useGSAPContext must be used within a GSAPProvider');
  }
  return context;
}; 