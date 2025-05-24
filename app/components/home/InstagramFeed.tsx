'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView, useAnimation } from 'framer-motion';

const InstagramFeed: React.FC = () => {
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
        staggerChildren: 0.1,
        delayChildren: 0.1,
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0] }
    }
  };
  
  const instagramPosts = [
    {
      id: 1,
      image: '/images/rindi-one-set.png',
      likes: 245,
      comments: 12,
    },
    {
      id: 2,
      image: '/images/widia-one-set.png',
      likes: 187,
      comments: 8,
    },
    {
      id: 3,
      image: '/images/hyeri-one-set.png',
      likes: 302,
      comments: 24,
    },
    {
      id: 4,
      image: '/images/advantages-left-image.png',
      likes: 164,
      comments: 5,
    },
  ];
  
  return (
    <section ref={sectionRef} className="py-16 md:py-24 bg-white">
      <motion.div 
        className="instagram-content w-full px-5"
        initial="hidden"
        animate={controls}
        variants={containerVariants}
      >
        <motion.div className="text-center mb-12" variants={itemVariants}>
          <h2 className="text-xl md:text-2xl font-monument">Follow Our Instagram</h2>
          <div className="h-px w-10 bg-neutral-300 mx-auto mt-3 mb-3"></div>
          <p className="text-sm text-neutral-600">@hikarifashion</p>
        </motion.div>
        
        <div className="instagram-grid grid grid-cols-2 md:grid-cols-4 gap-4">
          {instagramPosts.map((post) => (
            <motion.div 
              key={post.id} 
              className="group relative aspect-square"
              variants={itemVariants}
            >
              <Image
                src={post.image}
                alt="Instagram post"
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover"
              />
              
              {/* Hover overlay with likes and comments */}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="text-white flex items-center gap-4">
                  <div className="flex items-center">
                    <svg width="16" height="16" fill="white" viewBox="0 0 24 24" className="mr-1">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    <span className="text-xs">{post.likes}</span>
                  </div>
                  <div className="flex items-center">
                    <svg width="16" height="16" fill="white" viewBox="0 0 24 24" className="mr-1">
                      <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z" />
                    </svg>
                    <span className="text-xs">{post.comments}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <motion.div className="text-center mt-8" variants={itemVariants}>
          <Link 
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex border-b border-neutral-800 py-1 text-sm uppercase tracking-wider text-neutral-800 hover:text-neutral-600 transition-colors duration-300 font-karla"
          >
            View Instagram
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default InstagramFeed; 