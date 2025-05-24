'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import CartIcon from '../../components/cart/CartIcon';
import SearchBar from './SearchBar';
import WishlistIcon from '../wishlist/WishlistIcon';
import AccountMenu from '../account/AccountMenu';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';

/*
 * This file contains alternative header navigation styles.
 * You can copy any of these styles into your Header.tsx file.
 */

// Current path should be provided as a prop
interface NavProps {
  activeLink: string;
  isFloating: boolean;
}

export const MinimalUnderlineNav: React.FC<NavProps> = ({ activeLink, isFloating }) => (
  <nav className="hidden lg:flex items-center space-x-12 xl:space-x-16">
            {[
              { name: 'Home', path: '/' },
              { name: 'Shop', path: '/shop' },
      { name: 'About', path: '/about' }
            ].map((link) => (
              <Link 
                key={link.path}
                href={link.path} 
        className="group relative py-2 font-monument text-xs uppercase tracking-widest"
              >
        <span className={activeLink === link.path ? 'text-black' : ''}>
          {link.name}
        </span>
                <span 
          className={`absolute -bottom-1 left-0 w-full h-px bg-neutral-900 transform origin-left transition-transform duration-300 ease-out ${
                    activeLink === link.path ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  }`}
                ></span>
              </Link>
            ))}
          </nav>
);

export const BoxedNav: React.FC<NavProps> = ({ activeLink, isFloating }) => (
  <nav className="hidden lg:flex items-center space-x-8 xl:space-x-12">
    {[
      { name: 'Home', path: '/' },
      { name: 'Shop', path: '/shop' },
      { name: 'About', path: '/about' }
    ].map((link) => (
      <Link 
        key={link.path}
        href={link.path} 
        className={`group relative px-4 py-2 font-monument text-xs uppercase tracking-widest transition-all duration-300 ${
          activeLink === link.path 
            ? 'text-white bg-neutral-900' 
            : 'text-neutral-800 hover:bg-neutral-100'
        }`}
      >
        {link.name}
            </Link>
    ))}
  </nav>
);

// Enhanced navigation for desktop with animated underline indicator
export const EnhancedNav: React.FC<NavProps> = ({ activeLink, isFloating }) => {
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  
  return (
    <nav className="hidden lg:flex items-center space-x-12">
      {[
        { name: 'HOME', path: '/' },
        { name: 'SHOP', path: '/shop' },
        { name: 'ABOUT', path: '/about' }
      ].map((link) => (
                  <Link 
          key={link.path}
            href={link.path} 
          className="relative py-2.5 font-monument text-xs uppercase tracking-widest"
          onMouseEnter={() => setHoveredPath(link.path)}
          onMouseLeave={() => setHoveredPath(null)}
        >
          <span className="relative z-10 transition-colors duration-300"
            style={{ 
              color: activeLink === link.path 
                ? (isFloating ? '#000000' : '#ffffff') 
                : hoveredPath === link.path
                  ? (isFloating ? '#000000' : '#ffffff')
                  : (isFloating ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.8)')
            }}>
            {link.name}
          </span>
          {/* Active/hover indicator line */}
              <span 
            className={`absolute -bottom-1 left-0 h-0.5 bg-current transition-all duration-300 ease-out ${
              activeLink === link.path 
                ? 'w-full' 
                : hoveredPath === link.path 
                  ? 'w-full opacity-50' 
                  : 'w-0 opacity-0'
            }`}
            style={{ 
              backgroundColor: isFloating ? '#000000' : '#ffffff'
            }}
              ></span>
                  </Link>
      ))}
    </nav>
  );
};

// Mobile navigation menu with improved animation and styling
const MobileNav: React.FC<{ 
  isOpen: boolean; 
  isFloating: boolean; 
  activeLink: string; 
  onClose: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}> = ({ 
  isOpen, 
  isFloating,
  activeLink, 
  onClose,
  isAuthenticated,
  isAdmin
}) => {
  const menuVariants = {
    closed: {
      opacity: 0,
      y: "-100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    },
    open: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring", 
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    closed: { opacity: 0, y: -20 },
    open: { opacity: 1, y: 0 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial="closed"
          animate="open"
          exit="closed"
          variants={menuVariants}
          className="fixed inset-0 bg-black z-[10000] flex flex-col justify-center items-center"
    >
      <button 
        onClick={onClose}
            className="absolute top-8 right-8 text-white p-2 z-50 focus:outline-none"
        aria-label="Close menu"
      >
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      
          <nav className="flex flex-col items-center space-y-10">
        {[
          { name: 'HOME', path: '/' },
          { name: 'SHOP', path: '/shop' },
          { name: 'ABOUT', path: '/about' }
        ].map((link) => (
              <motion.div key={link.path} variants={itemVariants}>
                  <Link 
            href={link.path} 
                  className={`relative font-monument text-2xl uppercase tracking-widest transition-colors duration-300 ${
                    activeLink === link.path ? 'text-white' : 'text-gray-500 hover:text-white'
            }`}
            onClick={onClose}
          >
            {link.name}
                  {activeLink === link.path && (
                    <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-white"></span>
                  )}
                  </Link>
              </motion.div>
        ))}
        
            <motion.div variants={itemVariants} className="w-16 h-px bg-gray-800 my-4"></motion.div>
        
        {/* Account link - redirects based on user role */}
            <motion.div variants={itemVariants}>
        <Link
          href={!isAuthenticated ? "/login" : isAdmin ? "/admin" : "/account"}
                className="text-gray-500 hover:text-white text-base font-monument transition-colors duration-300"
          onClick={onClose}
        >
                {!isAuthenticated ? "SIGN IN" : isAdmin ? "ADMIN DASHBOARD" : "MY ACCOUNT"}
        </Link>
            </motion.div>
        
            <motion.div variants={itemVariants}>
        <Link
          href="/wishlist"
                className="text-gray-500 hover:text-white text-base font-monument transition-colors duration-300"
          onClick={onClose}
        >
                WISHLIST
        </Link>
            </motion.div>
      </nav>
          
          <motion.div 
            variants={itemVariants}
            className="absolute bottom-8 left-0 w-full flex justify-center"
          >
            <div className="text-gray-600 text-sm font-karla tracking-wide">
              © 2023 HIKARI • Premium Fashion
                </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Add global style to avoid FOUC (Flash of Unstyled Content)
const NoFlashScript = () => {
  useEffect(() => {
    // Create and inject a style tag to prevent header flashing
    const style = document.createElement('style');
    style.id = 'header-initial-style';
    style.innerHTML = `
      /* Hide header until initialized */
      header.site-header {
        visibility: hidden !important;
        opacity: 0 !important;
        background-color: transparent !important;
      }
      
      /* Only once JS sets the data-ready attribute, show the header */
      header.site-header[data-ready="true"] {
        visibility: visible !important;
        opacity: 1 !important;
        transition: opacity 0.3s ease, transform 0.3s ease, background-color 0.4s ease, color 0.4s ease !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      if (document.getElementById('header-initial-style')) {
        document.getElementById('header-initial-style')?.remove();
      }
    };
  }, []);
  
  return null;
};

// Default export for Header component
export default function Header() {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const [isFloating, setIsFloating] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [headerReady, setHeaderReady] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [headerVisible, setHeaderVisible] = useState(true);
  const session = useSession();
  
  // Toggle mobile menu and prevent scroll when open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [mobileMenuOpen]);
  
  // Add the header styles
  useEffect(() => {
    // Create a style tag in the head
    const style = document.createElement('style');
    style.innerHTML = `
      /* Fixed header styles */
      .header-fixed {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        z-index: 1000 !important;
        transition: transform 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease !important;
      }
      
      .header-floating {
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1) !important;
        background-color: rgba(255, 255, 255, 0.95) !important;
        backdrop-filter: blur(10px) !important;
      }

      .header-transparent {
        background-color: rgba(0, 0, 0, 0) !important;
        backdrop-filter: blur(0px) !important;
      }
      
      .header-hidden {
        transform: translateY(-100%) !important;
      }

      /* Make sure these styles aren't blocked by !important elsewhere */
      body.page-loaded header.site-header.header-floating {
        background-color: rgba(255, 255, 255, 0.95) !important;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1) !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // Replace Lenis scroll effect with standard window scroll event
  useEffect(() => {
    // Helper to check if we're on the home page
    const isHomePage = () => {
      return pathname === '/';
    };
    
    // Set immediate check for scroll position
    const checkInitialScroll = () => {
      // If scrolled down or not on home page, show floating header
      const showFloating = window.scrollY > 100 || !isHomePage();
      setIsFloating(showFloating);
      setLastScrollY(window.scrollY);
      
      // Set header as ready after initial check with a longer delay
      // This ensures all styles are properly calculated before showing
      setTimeout(() => {
        setHeaderReady(true);
        
        // Set data attribute to trigger CSS visibility, but let the page-level script control timing
        if (headerRef.current && document.body.classList.contains('page-loaded')) {
          headerRef.current.setAttribute('data-ready', 'true');
        }
      }, 100);
    };
    
    // Handle scroll events after initial check
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Determine if scrolling up or down and by how much
      const isScrollingDown = currentScrollY > lastScrollY;
      const scrollDifference = Math.abs(currentScrollY - lastScrollY);
      
      // Only hide/show header on significant scroll movements (avoid tiny scroll jitters)
      if (scrollDifference > 10) {
        if (isScrollingDown && currentScrollY > 400) {
          setHeaderVisible(false);
        } else {
          setHeaderVisible(true);
        }
      }
      
      // Only use scroll-based transparency on the home page
      const shouldFloat = currentScrollY > 100 || !isHomePage();
      setIsFloating(shouldFloat);
      
      // When scrolled, make sure the header has the proper class and styling
      if (headerRef.current) {
        if (shouldFloat) {
          headerRef.current.classList.add('header-floating');
          headerRef.current.classList.remove('header-transparent');
        } else {
          headerRef.current.classList.remove('header-floating');
          headerRef.current.classList.add('header-transparent');
        }
        
        // Add/remove hidden class based on scroll direction
        if (!headerVisible && !mobileMenuOpen) {
          headerRef.current.classList.add('header-hidden');
        } else {
          headerRef.current.classList.remove('header-hidden');
        }
      }
      
      setLastScrollY(currentScrollY);
    };
    
    // Run initial check
    checkInitialScroll();
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    
    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pathname, lastScrollY, headerVisible, mobileMenuOpen]);

  return (
    <>
      <NoFlashScript />
      <header 
        ref={headerRef}
        className={`site-header header-fixed ${isFloating ? 'header-floating' : 'header-transparent'}`}
        data-ready="false"
      >
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo with hover effect */}
            <Link 
              href="/" 
              className="relative font-monument text-2xl tracking-wider transition-all duration-300 transform hover:scale-105"
              style={{ 
                color: isFloating ? '#000000' : '#ffffff',
              }} 
            >
              HIKARI
            </Link>
            
            {/* Navigation - Centered */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <EnhancedNav activeLink={pathname} isFloating={isFloating} />
            </div>
            
            {/* Right side icons */}
            <div className="flex items-center space-x-6">
              {/* Mobile menu button (visible only on mobile) */}
              <button
                className="lg:hidden flex flex-col items-center justify-center w-8 h-8 space-y-1.5 focus:outline-none relative z-10"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <span className="block w-6 h-0.5 transition-all duration-300"
                  style={{ backgroundColor: isFloating ? '#000000' : '#ffffff' }}></span>
                <span className="block w-6 h-0.5 transition-all duration-300"
                  style={{ backgroundColor: isFloating ? '#000000' : '#ffffff' }}></span>
                <span className="block w-4 h-0.5 transition-all duration-300 self-end"
                  style={{ backgroundColor: isFloating ? '#000000' : '#ffffff' }}></span>
              </button>
              
              {/* Search Bar */}
              <div className="hidden sm:block transition-colors duration-300"
                   style={{ color: isFloating ? '#000000' : '#ffffff' }}>
                <SearchBar />
              </div>
              
              <div className="hidden sm:block transition-colors duration-300"
                   style={{ color: isFloating ? '#000000' : '#ffffff' }}>
                <AccountMenu />
              </div>
              
              {/* Wishlist Icon with improved hover */}
              <div className="transition-transform duration-300 hover:scale-110" 
                style={{ color: isFloating ? '#000000' : '#ffffff' }}>
                <WishlistIcon />
              </div>
              
              {/* Cart Icon Component with improved hover */}
              <div className="transition-transform duration-300 hover:scale-110"
                style={{ color: isFloating ? '#000000' : '#ffffff' }}>
                <CartIcon />
              </div>
            </div>
          </div>
      </div>
    </header>
      
      {/* Mobile menu overlay */}
      <MobileNav
        isOpen={mobileMenuOpen}
        isFloating={isFloating}
        activeLink={pathname}
        onClose={() => setMobileMenuOpen(false)}
        isAuthenticated={session.data?.user.email ? true : false}
        isAdmin={session.data?.user.role === 'admin'}
      />
    </>
  );
} 