'use client';

import { useRef, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Define animation types
type AnimationType = 'fadeIn' | 'slideUp' | 'stagger' | 'scaleIn' | 'splitText';

interface SectionAnimationOptions {
  type?: AnimationType;
  duration?: number;
  delay?: number;
  ease?: string;
  start?: string; 
  staggerItems?: string; // Selector for staggered items
  staggerAmount?: number; // Stagger timing
}

/**
 * A hook to add consistent ScrollTrigger animations to sections
 */
export const useSectionAnimation = <T extends HTMLElement = HTMLDivElement>(options: SectionAnimationOptions = {}) => {
  const sectionRef = useRef<T>(null);
  
  const {
    type = 'fadeIn',
    duration = 1,
    delay = 0.1,
    ease = 'power2.out',
    start = 'top bottom-=100',
    staggerItems = '.animate-item',
    staggerAmount = 0.1
  } = options;
  
  useGSAP(() => {
    const section = sectionRef.current;
    if (!section) return;
    
    const fromVars: gsap.TweenVars = {
      duration,
      ease,
    };

    // Set up different animations based on type
    switch (type) {
      case 'fadeIn':
        fromVars.opacity = 0;
        fromVars.y = 40;
        break;
        
      case 'slideUp':
        fromVars.opacity = 0;
        fromVars.y = 70;
        break;
        
      case 'scaleIn':
        fromVars.opacity = 0;
        fromVars.scale = 0.92;
        break;
        
      case 'stagger': {
        const items = section.querySelectorAll(staggerItems);
        if (items.length) {
          gsap.from(items, {
            opacity: 0,
            y: 30,
            duration,
            ease,
            stagger: staggerAmount,
            delay,
            scrollTrigger: {
              trigger: section,
              start,
              toggleActions: 'play none none none',
            }
          });
          return; // Skip the main animation since we're doing staggered
        }
        break;
      }
      
      case 'splitText': {
        // Apply custom class for text splitting via CSS
        section.classList.add('split-text-animation');
        gsap.from(section.querySelectorAll('.split-text-animation > *'), {
          opacity: 0,
          y: 40,
          duration,
          stagger: 0.1,
          ease,
          scrollTrigger: {
            trigger: section,
            start,
            toggleActions: 'play none none none',
          }
        });
        return; // Skip the main animation
      }
    }
    
    // Apply main animation to the section
    gsap.from(section, {
      ...fromVars,
      delay,
      scrollTrigger: {
        trigger: section,
        start,
        toggleActions: 'play none none none',
      }
    });
    
  }, { scope: sectionRef });
  
  return sectionRef;
};

export default useSectionAnimation; 