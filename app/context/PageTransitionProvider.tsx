'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import gsap from 'gsap';

// Available transition types
export type TransitionType = 'fade' | 'slide' | 'zoom' | 'flip' | 'reveal' | 'blocks';

// Available color themes for transitions
export type TransitionColor = 'dark' | 'primary' | 'gradient';

type TransitionContextType = {
  isTransitioning: boolean;
  transitionType: TransitionType;
  transitionColor: TransitionColor;
  setTransitionType: (type: TransitionType) => void;
  setTransitionColor: (color: TransitionColor) => void;
};

const TransitionContext = createContext<TransitionContextType>({
  isTransitioning: false,
  transitionType: 'blocks',
  transitionColor: 'dark',
  setTransitionType: () => {},
  setTransitionColor: () => {},
});

export const usePageTransition = () => useContext(TransitionContext);

export default function PageTransitionProvider({
  children,
  initialTransitionType = 'blocks',
  initialTransitionColor = 'dark',
}: {
  children: React.ReactNode;
  initialTransitionType?: TransitionType;
  initialTransitionColor?: TransitionColor;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionType, setTransitionType] = useState<TransitionType>(initialTransitionType);
  const [transitionColor, setTransitionColor] = useState<TransitionColor>(initialTransitionColor);
  
  // Track if this is the initial page load
  const isInitialLoad = useRef(true);

  // Create block elements for the block transition
  useEffect(() => {
    if (transitionType === 'blocks' && !document.querySelector('.block-grid')) {
      const blockGrid = document.createElement('div');
      blockGrid.className = 'block-grid fixed inset-0 z-[9999] pointer-events-none';
      blockGrid.style.display = 'grid';
      blockGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
      blockGrid.style.gridTemplateRows = 'repeat(3, 1fr)';
      
      // Create 12 blocks (4x3 grid)
      for (let i = 0; i < 12; i++) {
        const block = document.createElement('div');
        block.className = `transition-block ${getColorClasses('block')}`;
        block.style.transformOrigin = 'center';
        block.style.transform = 'scale(0)';
        blockGrid.appendChild(block);
      }
      
      document.body.appendChild(blockGrid);
    }
    
    return () => {
      const blockGrid = document.querySelector('.block-grid');
      if (blockGrid) {
        blockGrid.remove();
      }
    };
  }, [transitionType]);

  // Run transition effect when route changes
  useEffect(() => {
    const handleRouteChange = async () => {
      // Skip transition on initial page load
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
        return;
      }
      
      setIsTransitioning(true);
      const tl = gsap.timeline();
      
      // Apply different animation based on transition type
      switch (transitionType) {
        case 'fade':
          // Simple fade transition
          tl.to('.page-transition-overlay', {
            opacity: 1,
            duration: 0.3,
            ease: 'power2.inOut',
          });
          
          await new Promise((resolve) => setTimeout(resolve, 350));
          
          tl.to('.page-transition-overlay', {
            opacity: 0,
            duration: 0.3,
            delay: 0.1,
            ease: 'power2.inOut',
          });
          break;
          
        case 'slide':
          // Slide from top
          tl.to('.page-transition-overlay', {
            y: '0%',
            duration: 0.5,
            ease: 'power2.inOut',
          });
          
          await new Promise((resolve) => setTimeout(resolve, 350));
          
          tl.to('.page-transition-overlay', {
            y: '-100%',
            duration: 0.5,
            delay: 0.1,
            ease: 'power2.inOut',
          });
          break;
          
        case 'zoom':
          // Zoom effect
          tl.set('.page-transition-overlay', { 
            scale: 0.5, 
            opacity: 0,
            y: '0%' 
          })
          .to('.page-transition-overlay', {
            scale: 1,
            opacity: 1,
            duration: 0.5,
            ease: 'power3.in',
          });
          
          await new Promise((resolve) => setTimeout(resolve, 350));
          
          tl.to('.page-transition-overlay', {
            scale: 1.5,
            opacity: 0,
            duration: 0.5,
            delay: 0.1,
            ease: 'power3.out',
          });
          break;
        
        case 'flip':
          // Flip effect
          gsap.set('.page-transition-wrapper', { perspective: 1200 });
          tl.to('.page-transition-overlay', {
            rotationY: -90, 
            opacity: 0.5,
            duration: 0.6, 
            ease: 'power1.in',
          });
          
          await new Promise((resolve) => setTimeout(resolve, 400));
          
          tl.set('.page-transition-overlay', { rotationY: 90 })
          .to('.page-transition-overlay', { 
            rotationY: 0, 
            opacity: 0,
            duration: 0.6, 
            ease: 'power1.out',
          });
          break;
          
        case 'reveal':
          // Reveal effect with multiple panels
          const panels = ['.panel-1', '.panel-2', '.panel-3', '.panel-4'];
          
          tl.to(panels, {
            scaleY: 1,
            duration: 0.5,
            stagger: 0.05,
            ease: 'power2.inOut',
          });
          
          await new Promise((resolve) => setTimeout(resolve, 450));
          
          tl.to(panels.reverse(), {
            scaleY: 0,
            duration: 0.5,
            stagger: 0.05,
            ease: 'power2.inOut',
          });
          break;
          
        case 'blocks':
          // Blocks transition effect - sequential block animation
          const blocks = document.querySelectorAll('.transition-block');
          
          // Entry animation
          tl.to(blocks, {
            scale: 1,
            duration: 0.4,
            stagger: {
              each: 0.05,
              grid: [3, 4],  // 3 rows, 4 columns
              from: "center", // Start from center
            },
            ease: "back.out(1.7)",
          });
          
          await new Promise((resolve) => setTimeout(resolve, 500));
          
          // Exit animation
          tl.to(blocks, {
            scale: 0,
            duration: 0.3,
            stagger: {
              each: 0.05,
              grid: [3, 4],
              from: "edges", // Exit from edges
            },
            ease: "back.in(1.7)",
          });
          break;
      }

      // Reset transition state
      setTimeout(() => {
        setIsTransitioning(false);
      }, 800);
    };

    handleRouteChange();
  }, [pathname, searchParams, transitionType]);

  // Get color classes based on selected theme
  const getColorClasses = (element: 'overlay' | 'panel' | 'block', index?: number) => {
    switch (transitionColor) {
      case 'dark':
        if (element === 'overlay') return 'bg-neutral-900';
        if (element === 'block') return 'bg-neutral-900';
        // For panels - slightly different shades
        return [
          'bg-neutral-900', 
          'bg-neutral-800', 
          'bg-neutral-700', 
          'bg-neutral-600'
        ][index || 0];
      
      case 'primary':
        if (element === 'overlay') return 'bg-indigo-600';
        if (element === 'block') return 'bg-indigo-700';
        // For panels - different shades
        return [
          'bg-indigo-900', 
          'bg-indigo-700', 
          'bg-indigo-500', 
          'bg-indigo-300'
        ][index || 0];
      
      case 'gradient':
        if (element === 'overlay') return 'bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-800';
        if (element === 'block') return 'bg-indigo-800';
        // For panels - different gradient stops
        return [
          'bg-violet-800',
          'bg-purple-700',
          'bg-indigo-700',
          'bg-indigo-600'
        ][index || 0];
      
      default:
        return 'bg-neutral-900';
    }
  };

  return (
    <TransitionContext.Provider value={{ 
      isTransitioning, 
      transitionType, 
      transitionColor,
      setTransitionType,
      setTransitionColor 
    }}>
      <div className="page-transition-wrapper">
        {/* Basic overlay for most transitions */}
        {transitionType !== 'blocks' && (
          <div 
            className={`page-transition-overlay fixed inset-0 ${getColorClasses('overlay')} z-[9999] transform -translate-y-full pointer-events-none`}
            style={{ 
              transform: 'translateY(-100%)', 
              opacity: transitionType === 'fade' || transitionType === 'zoom' ? 0 : 1 
            }}
          ></div>
        )}
        
        {/* Special panels for reveal transition */}
        {transitionType === 'reveal' && (
          <>
            <div className={`panel-1 fixed inset-0 ${getColorClasses('panel', 0)} z-[9999] origin-top scale-y-0 pointer-events-none`} style={{ top: '0%', height: '25%' }} />
            <div className={`panel-2 fixed inset-0 ${getColorClasses('panel', 1)} z-[9999] origin-top scale-y-0 pointer-events-none`} style={{ top: '25%', height: '25%' }} />
            <div className={`panel-3 fixed inset-0 ${getColorClasses('panel', 2)} z-[9999] origin-top scale-y-0 pointer-events-none`} style={{ top: '50%', height: '25%' }} />
            <div className={`panel-4 fixed inset-0 ${getColorClasses('panel', 3)} z-[9999] origin-top scale-y-0 pointer-events-none`} style={{ top: '75%', height: '25%' }} />
          </>
        )}
      </div>
      
      {children}
    </TransitionContext.Provider>
  );
} 