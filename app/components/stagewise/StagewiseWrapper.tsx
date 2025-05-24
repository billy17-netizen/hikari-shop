'use client';

import { StagewiseToolbar } from '@stagewise/toolbar-next';
import { useEffect, useState } from 'react';

// Simple UUID generator that doesn't rely on crypto.randomUUID
function generateUUID() {
  let d = new Date().getTime();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

export function StagewiseWrapper() {
  const [mounted, setMounted] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Patch crypto.randomUUID if needed
    if (typeof window !== 'undefined') {
      try {
        // Add a simple polyfill if randomUUID is missing
        if (window.crypto && !window.crypto.randomUUID) {
          // @ts-ignore - Bypass TypeScript checking for this workaround
          window.crypto.randomUUID = generateUUID;
        }
        setInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Stagewise:', error);
      }
    }
  }, []);

  if (!mounted || !initialized || process.env.NODE_ENV !== 'development') {
    return null;
  }

  const stagewiseConfig = {
    plugins: []
  };

  return <StagewiseToolbar config={stagewiseConfig} />;
} 