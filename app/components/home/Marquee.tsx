'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const Marquee: React.FC = () => {
  const marqueeRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  useGSAP(() => {
    // Clone the inner content for seamless scrolling
    const inner = innerRef.current;
    if (!inner) return;

    const original = inner.innerHTML;
    inner.innerHTML = original + original + original;
    
    // Create the infinite marquee animation with better settings
    const marqueeAnimation = gsap.to(inner, {
      x: '-33.33%',
      duration: 10,
      ease: 'none',
      repeat: -1,
      repeatDelay: 0,
      yoyo: false,
    });

    // Add hover effect
    if (marqueeRef.current) {
      marqueeRef.current.addEventListener('mouseenter', () => {
        gsap.to(marqueeAnimation, { timeScale: 0.2, duration: 0.5 });
      });
      
      marqueeRef.current.addEventListener('mouseleave', () => {
        gsap.to(marqueeAnimation, { timeScale: 1, duration: 0.5 });
      });
    }

    return () => {
      if (marqueeRef.current) {
        marqueeRef.current.removeEventListener('mouseenter', () => {});
        marqueeRef.current.removeEventListener('mouseleave', () => {});
      }
    };
  }, { scope: marqueeRef });

  return (
    <section 
      ref={marqueeRef} 
      className="py-12 md:py-16 bg-neutral-50 overflow-hidden border-t border-b border-neutral-200 font-monument"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="marquee-container relative">
        <div 
          ref={innerRef} 
          className="flex items-center whitespace-nowrap text-3xl md:text-4xl lg:text-6xl font-normal"
        >
          {['MINIMAL DESIGN', '·', 'TIMELESS STYLE', '·', 'PREMIUM QUALITY', '·', 'SUSTAINABLE FASHION', '·'].map((text, index) => (
            <span 
              key={index} 
              className={`px-4 md:px-8 transition-colors duration-300 ${
                text !== '·' 
                  ? (isHovered ? 'text-neutral-900' : 'text-neutral-800') 
                  : 'text-neutral-400'
              }`}
            >
              {text}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Marquee; 