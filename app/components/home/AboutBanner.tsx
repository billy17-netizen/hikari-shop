'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

const AboutBanner: React.FC = () => {
  const bannerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  // Simple but effective scroll visibility checker
  useEffect(() => {
    const checkVisibility = () => {
      if (!bannerRef.current) return;
      
      const rect = bannerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Element is considered visible when it's 30% in the viewport
      if (rect.top <= windowHeight * 0.7) {
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

  const textVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { 
        duration: 1,
        ease: [0.25, 0.1, 0.25, 1.0]
      }
    }
  };

  return (
    <section ref={bannerRef} className="relative h-[60vh] md:h-[80vh] w-full overflow-hidden">
      {/* Full-width background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/about-banner.png"
          alt="About Hikari"
          fill
          style={{ objectFit: 'cover' }}
          priority
          sizes="100vw"
        />
        {/* Subtle overlay to enhance text readability */}
        <div className="absolute inset-0 bg-black/10"></div>
      </div>
      
      {/* Centered content */}
      <div className="relative z-10 h-full flex flex-col justify-center items-center px-4 text-center max-w-3xl mx-auto">
        <motion.div
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
          variants={textVariants}
        >
          <h2 className="text-3xl md:text-4xl font-monument mb-6 text-white">About HIKARI</h2>
          <p className="text-lg md:text-xl text-white/90 font-light leading-relaxed mb-8 font-karla">
            Crafting minimal, timeless pieces that transcend seasons and trends. 
            We believe in quality over quantity and sustainable practices.
          </p>
          <Link 
            href="/about" 
            className="inline-block border-b border-white text-white text-sm tracking-wider uppercase py-1 hover:border-opacity-50 transition-all font-karla"
          >
            Our story
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutBanner; 