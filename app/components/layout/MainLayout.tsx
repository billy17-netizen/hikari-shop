'use client';

import React, { ReactNode, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import PageTransitionProvider, { usePageTransition } from '../../context/PageTransitionProvider';
// Import our GSAP scroll context
import { GSAPScrollProvider, refreshScrollTrigger, useGSAPScroll } from '../../context/GSAPScrollContext';
import { CartProvider } from '../../../contexts/CartContext';
import { WishlistProvider } from '../../../contexts/WishlistContext';
import { AuthProvider } from '../../../contexts/AuthContext';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { Toaster } from 'react-hot-toast';

// Detect mobile simulator/iframe environment
const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

// Inline script to prevent header flash before React hydration
// Now also adds special styles for simulator environments
const InlineNoFlashScript = () => {
  return (
    <Script id="prevent-header-flash" strategy="beforeInteractive">
      {`
        (function() {
          // Create and inject a style tag to prevent header flashing
          var style = document.createElement('style');
          style.id = 'header-pre-render-style';
          style.innerHTML = \`
            /* Hide header until initialized to prevent flash */
            header.site-header {
              visibility: hidden !important;
              opacity: 0 !important;
              background-color: transparent !important;
            }
            
            /* Fix for modals in simulator environments */
            ${isInIframe ? `
            /* When in iframe/simulator, ensure modals are properly positioned */
            .modal, [role="dialog"], [aria-modal="true"] {
              position: absolute !important;
              bottom: auto !important;
              max-height: 90vh !important;
              overflow-y: auto !important;
              transform: none !important;
            }
            
            /* Ensure fixed elements stay in viewport */
            .fixed, [style*="position: fixed"] {
              position: absolute !important;
              transform: none !important;
            }
            ` : ''}
          \`;
          document.head.appendChild(style);
          
          ${isInIframe ? `
          // Mark document body for simulator environments
          document.body.setAttribute('data-in-simulator', 'true');
          ` : ''}
        })();
      `}
    </Script>
  );
};

interface MainLayoutProps {
  children: ReactNode;
}

const MainContent: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isTransitioning } = usePageTransition();
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/register');
  const isAdminPage = pathname?.startsWith('/admin');

  if (isAuthPage || isAdminPage) {
    // For auth pages and admin pages, just return the children without header/footer
    return <>{children}</>;
  }

  // To avoid hydration mismatch, don't add simulator-specific class conditionally
  const wrapperClasses = "flex flex-col min-h-screen";

  return (
    // These divs will be used by GSAP ScrollSmoother
    <div id="smooth-wrapper" className={wrapperClasses}>
      <Header />
      <div id="smooth-content">
        <main className={`flex-grow transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/register');
  const isAdminPage = pathname?.startsWith('/admin');
  
  // Update the layout initialization
  useEffect(() => {
    if (isAuthPage || isAdminPage) return; // Skip layout effects for auth pages and admin pages
    
    // Handle simulator-specific adjustments
    if (isInIframe) {
      // Add data attribute to body for CSS targeting
      document.body.setAttribute('data-in-simulator', 'true');
      
      // Fix any modals that might be stuck at bottom
      const fixModals = () => {
        const modals = document.querySelectorAll('.modal, [role="dialog"], [aria-modal="true"]');
        modals.forEach(modal => {
          if (modal instanceof HTMLElement) {
            modal.style.position = 'absolute';
            modal.style.bottom = 'auto';
            modal.style.maxHeight = '90vh';
            modal.style.overflowY = 'auto';
          }
        });
      };
      
      // Run initial fix and set up observer for dynamic elements
      fixModals();
      const observer = new MutationObserver(fixModals);
      observer.observe(document.body, { childList: true, subtree: true });
      
      // Clean up observer on unmount
      return () => observer.disconnect();
    }
    
    // Ensure DOM is ready before attempting any GSAP operations
    if (document.readyState !== 'complete') {
      const handleDOMReady = () => {
        // Give browser time to finish layout calculations
        setTimeout(() => {
          refreshScrollTrigger();
        }, isInIframe ? 500 : 300); // Longer delay in simulator environments
      };
      
      window.addEventListener('load', handleDOMReady, { once: true });
      return () => window.removeEventListener('load', handleDOMReady);
    } else {
      // If DOM is already complete, still wait a bit for React to finish rendering
      const timer = setTimeout(() => {
        refreshScrollTrigger();
      }, isInIframe ? 500 : 300);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthPage, isAdminPage, pathname]); // Also depend on pathname to refresh on route changes

  // Always wrap with auth and data providers for global state
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          {/* Toast notifications container */}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                fontFamily: 'var(--font-karla)',
                background: '#333',
                color: '#fff',
              },
            }}
          />
          
          {isAuthPage || isAdminPage ? (
            // For auth pages and admin pages, pass children directly
            <>{children}</>
          ) : (
            // For regular pages, use GSAP and page transitions
            <GSAPScrollProvider>
              <PageTransitionProvider>
                <InlineNoFlashScript />
                <MainContent>{children}</MainContent>
              </PageTransitionProvider>
            </GSAPScrollProvider>
          )}
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
};

export default MainLayout; 