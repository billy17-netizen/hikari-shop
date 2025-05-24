'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import gsap from 'gsap';
import { useGSAPContext } from './GSAPContext';

interface ScrollEffectOptions {
  speed?: number;
  lag?: number;
  direction?: 'y' | 'x';
  start?: string;
  end?: string;
  scrub?: boolean | number;
}

/**
 * Safely trigger a GSAP refresh without causing infinite loops
 */
export const refreshGSAP = () => {
  window.dispatchEvent(new CustomEvent('gsap-refresh'));
};

/**
 * Hook to apply smooth scrolling effects to elements
 * @param options ScrollEffect options
 * @returns ref to be applied to the target element
 */
export const useSmoothScroll = (options: ScrollEffectOptions = {}) => {
  const elementRef = useRef<HTMLElement>(null);
  const { smoother } = useGSAPContext();
  
  const {
    speed = 1.5,
    lag = 0,
    direction = 'y',
    start = 'top bottom',
    end = 'bottom top',
    scrub = true
  } = options;

  // Use the GSAP React hook for proper cleanup and context management
  useGSAP(() => {
    const element = elementRef.current;
    
    if (!element || !smoother.current) return;
    
    // Apply speed effect with ScrollTrigger
    if (speed !== 1) {
      gsap.to(element, {
        scrollTrigger: {
          trigger: element,
          start,
          end,
          scrub
        },
        [direction === 'y' ? 'y' : 'x']: (_: number, target: any) => {
          const height = direction === 'y' ? 
            window.innerHeight : window.innerWidth;
          const trigger = ScrollTrigger.getById(target.vars.scrollTrigger.id);
          return trigger ? (speed - 1) * trigger.progress * height : 0;
        }
      });

      // Register the element with ScrollSmoother for effects
      smoother.current?.effects?.(element, { speed, lag });
    }
  }, { scope: elementRef, dependencies: [speed, lag, direction, start, end, scrub] });

  return elementRef;
};

/**
 * Hook to create reveal effects when elements come into view
 */
export const useRevealEffect = (threshold: number = 0.1) => {
  const elementRef = useRef<HTMLElement>(null);
  
  useGSAP(() => {
    const element = elementRef.current;
    
    if (!element) return;
    
    // Add reveal class for CSS transition
    element.classList.add('reveal');
    
    // Create ScrollTrigger for reveal effect
    ScrollTrigger.create({
      trigger: element,
      start: `top bottom-=${threshold * 100}%`,
      onEnter: () => element.classList.add('is-inview'),
      once: true
    });
  }, { scope: elementRef, dependencies: [threshold] });
  
  return elementRef;
};

export default useSmoothScroll; 