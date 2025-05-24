'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import PageTransitionProvider, { usePageTransition } from '../context/PageTransitionProvider';

interface AuthLayoutProps {
  children: ReactNode;
}

// Inner content component that uses the transition hook
const AuthContent = ({ children }: { children: ReactNode }) => {
  const { isTransitioning } = usePageTransition();
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  
  return (
    <div className="min-h-screen bg-white font-karla">
      <div className="py-6 px-4">
        <Link 
          href="/" 
          className="font-monument text-xl tracking-wider text-neutral-900 flex items-center"
        >
          <span className="mr-2">←</span>
          <span>HIKARI</span>
        </Link>
      </div>
      
      <main className={`pb-20 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </main>
      
      <div className="fixed bottom-6 left-0 w-full text-center text-sm text-neutral-500">
        {isLoginPage ? (
          <p>
            Don't have an account?{' '}
            <Link href="/register" className="text-neutral-900 underline">
              Register
            </Link>
          </p>
        ) : (
          <p>
            Already have an account?{' '}
            <Link href="/login" className="text-neutral-900 underline">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <PageTransitionProvider>
      <AuthContent>{children}</AuthContent>
    </PageTransitionProvider>
  );
} 