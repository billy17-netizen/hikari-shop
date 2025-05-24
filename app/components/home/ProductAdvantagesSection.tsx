'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, useInView, useAnimation } from 'framer-motion';

const ProductAdvantagesSection: React.FC = () => {
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
      transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1.0] }
    }
  };

  return (
    <section 
      ref={sectionRef}
      className="w-full"
    >
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 advantages-content"
        initial="hidden"
        animate={controls}
        variants={containerVariants}
      >
        {/* Left side with text */}
        <motion.div 
          className="flex items-center justify-center p-10 md:p-16 bg-neutral-50"
          variants={itemVariants}
        >
          <div className="max-w-lg mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-monument mb-6">Sustainable Choice</h2>
            <p className="text-neutral-700 mb-8">
              Our commitment to sustainability goes beyond materials. We ensure ethical production processes and minimal environmental impact in creating our unique collections.
            </p>
            <Link 
              href="/about"
              className="inline-flex border-b border-neutral-800 py-1 text-sm uppercase tracking-wider text-neutral-800 hover:text-neutral-600 transition-colors duration-300 font-karla"
            >
              About Our Values
            </Link>
          </div>
        </motion.div>
        
        {/* Right side with full image */}
        <motion.div 
          className="aspect-square relative"
          style={{
            backgroundImage: "url('/images/dual-image-right.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
          variants={itemVariants}
        />
      </motion.div>
    </section>
  );
};

export default ProductAdvantagesSection; 