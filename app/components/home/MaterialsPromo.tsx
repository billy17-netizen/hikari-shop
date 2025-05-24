'use client';

import React, { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useInView, useAnimation } from 'framer-motion';

const MaterialsPromo: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });
  const controls = useAnimation();
  
  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [isInView, controls]);
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1.0] } // Using easeOutQuart
    }
  };

  return (
    <section 
      ref={sectionRef}
      className="py-20 bg-gradient-to-r from-[#E9E4DF] to-[#F5F0EB]"
    >
      <motion.div 
        className="max-w-4xl mx-auto px-5"
        initial="hidden"
        animate={controls}
        variants={containerVariants}
      >
        <motion.div className="promo-content text-center" variants={containerVariants}>
          <motion.h2 
            className="text-3xl md:text-4xl font-monument mb-8 text-neutral-800"
            variants={itemVariants}
          >
            Premium Materials
          </motion.h2>
          
          <motion.div 
            className="flex flex-col md:flex-row justify-center gap-8 md:gap-16 mb-10"
            variants={itemVariants}
          >
            <div className="flex flex-col items-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-neutral-700 mb-3">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 12c0-4.4-3.6-8-8-8s-8 3.6-8 8 3.6 8 8 8c1.1 0 2-.9 2-2s-.9-2-2-2H8c-2.2 0-4-1.8-4-4s1.8-4 4-4h8c1.1 0 2 .9 2 2s-.9 2-2 2" />
              </svg>
              <span className="text-sm tracking-wide text-neutral-600 font-karla">Organic Cotton</span>
            </div>
            
            <div className="flex flex-col items-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-neutral-700 mb-3">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4c-1.2 0-2.4.6-3 1.7C8.4 4.6 7.2 4 6 4c-2.2 0-4 1.8-4 4 0 4.4 4 8 10 13 6-5 10-8.6 10-13 0-2.2-1.8-4-4-4-1.2 0-2.4.6-3 1.7-.6-1.1-1.8-1.7-3-1.7Z" />
              </svg>
              <span className="text-sm tracking-wide text-neutral-600 font-karla">Japanese Silk</span>
            </div>
            
            <div className="flex flex-col items-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-neutral-700 mb-3">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3.5 19h17M5 21h14M7 9.5l2 1v3l-2 1.5m10-6l-2 1v3l2 1.5M7 5l5 3 5-3" />
              </svg>
              <span className="text-sm tracking-wide text-neutral-600 font-karla">Italian Linen</span>
            </div>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Link 
              href="/shop"
              className="inline-flex border-b border-neutral-800 py-1 text-sm uppercase tracking-wider text-neutral-800 hover:text-neutral-600 transition-colors duration-300 font-karla"
            >
              Shop Collection
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default MaterialsPromo; 