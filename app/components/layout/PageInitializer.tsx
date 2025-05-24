'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function PageInitializer() {
  const pathname = usePathname();
  
  useEffect(() => {
    // Function to check if we're on the home page
    const isHomePage = () => {
      return pathname === '/';
    };
    
    // Function to check if we're on an auth page
    const isAuthPage = () => {
      return pathname.includes('/login') || pathname.includes('/register');
    };
    
    // Handle page load with timeout to ensure smooth transition
    const timeoutId = setTimeout(() => {
      // Add loaded class to body
      document.body.classList.add('page-loaded');
      
      // Set page type attribute for CSS targeting
      if (isHomePage()) {
        document.body.setAttribute('data-page', 'home');
      } else if (isAuthPage()) {
        document.body.setAttribute('data-page', 'auth');
      } else {
        document.body.setAttribute('data-page', 'other');
      }
      
      // Only make the header visible if not on auth pages
      if (!isAuthPage()) {
        const header = document.querySelector('header.site-header');
        if (header) {
          setTimeout(() => {
            header.setAttribute('data-ready', 'true');
            
            // Check if we should use floating header (not home or scrolled)
            if (window.scrollY > 50 || !isHomePage()) {
              header.classList.add('header-floating');
              header.classList.remove('header-transparent');
            } else {
              header.classList.remove('header-floating');
              header.classList.add('header-transparent');
            }
          }, 100);
        }
      }
    }, 300);
    
    // Cleanup on route change
    return () => {
      clearTimeout(timeoutId);
    };
  }, [pathname]); // Re-run when pathname changes
  
  return null;
} 