'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';

// Register GSAP plugins safely with better browser detection
// Only register once window is definitely available
const isBrowser = typeof window !== 'undefined';

// Register plugins if we're in the browser (but not during SSR)
if (isBrowser) {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
}

interface GSAPScrollContextType {
  smoother: ScrollSmoother | null;
  isInSimulator: boolean;
}

const GSAPScrollContext = createContext<GSAPScrollContextType>({
  smoother: null,
  isInSimulator: false
});

export const useGSAPScroll = () => useContext(GSAPScrollContext);

interface GSAPScrollProviderProps {
  children: ReactNode;
}

export const GSAPScrollProvider: React.FC<GSAPScrollProviderProps> = ({ children }) => {
  const [smoother, setSmoother] = useState<ScrollSmoother | null>(null);
  const [isInSimulator, setIsInSimulator] = useState(false);

  useEffect(() => {
    // Only run on the client side
    if (!isBrowser) return;
    
    // Check if in iframe/simulator
    const inIframe = window.self !== window.top;
    setIsInSimulator(inIframe);
    
    // Configure ScrollTrigger for iframe/simulator environments
    if (inIframe) {
      ScrollTrigger.config({
        ignoreMobileResize: true
      });
    }

    let smootherInstance: ScrollSmoother | null = null;
    
    // Use a timeout to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      try {
        // Make sure the required elements exist before creating ScrollSmoother
        const wrapper = document.getElementById('smooth-wrapper');
        const content = document.getElementById('smooth-content');
        
        if (wrapper && content) {
          // Adjust settings for iframe/simulator environments
          const smootherSettings = {
            smooth: inIframe ? 0.5 : 1.5, // Lower smoothness in simulators
            effects: true,
            wrapper: wrapper,
            content: content,
            ignoreMobileResize: inIframe // Prevent resize issues in simulators
          };
          
          // Create ScrollSmoother with adjusted settings
          smootherInstance = ScrollSmoother.create(smootherSettings);
          
          setSmoother(smootherInstance);
          
          // Force a refresh after creation to properly handle simulator viewport
          if (inIframe) {
            setTimeout(() => {
              ScrollTrigger.refresh(true); // true = deep refresh
            }, 200);
          }
        }
      } catch (error) {
        console.error('Error initializing ScrollSmoother:', error);
      }
    }, inIframe ? 300 : 100); // Longer delay in simulator environments

    return () => {
      // Clean up
      clearTimeout(timer);
      
      if (smootherInstance) {
        smootherInstance.kill();
      }
      
      // Kill all ScrollTriggers safely
      try {
        ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      } catch (error) {
        console.error('Error cleaning up ScrollTrigger:', error);
      }
    };
  }, []);

  return (
    <GSAPScrollContext.Provider value={{ smoother, isInSimulator }}>
      {children}
    </GSAPScrollContext.Provider>
  );
};

// Helper for refreshing the ScrollTrigger instances
export const refreshScrollTrigger = () => {
  if (!isBrowser) return;
  
  try {
    // Only refresh if the DOM is fully ready
    if (document.readyState === 'complete') {
      // Check if in iframe/simulator
      const inIframe = window.self !== window.top;
      ScrollTrigger.refresh(inIframe); // Deep refresh in iframe environments
    } else {
      // If DOM isn't ready, wait for it
      window.addEventListener('load', () => {
        const inIframe = window.self !== window.top;
        ScrollTrigger.refresh(inIframe);
      }, { once: true });
    }
  } catch (error) {
    console.error('Error refreshing ScrollTrigger:', error);
  }
}; 