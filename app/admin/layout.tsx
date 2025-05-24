'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { usePageTransition } from '../context/PageTransitionProvider';
import { Toaster } from 'react-hot-toast';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { isTransitioning, transitionType, setTransitionType } = usePageTransition();
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  // Handle sign out with transition
  const handleSignOut = async () => {
    if (isSigningOut) return; // Prevent multiple clicks
    
    setIsSigningOut(true);
    
    // Create a clean login URL without the callback parameter
    router.push('/login', { scroll: false });
    
    // Then sign out after the transition has started
    setTimeout(() => {
      // When we sign out, we explicitly set the callbackUrl to just '/login'
      // This prevents NextAuth from adding any return URL parameters
      signOut({ 
        redirect: true, 
        callbackUrl: '/login' 
      });
    }, 600);
  };
  
  // Check if the user is authenticated and loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900"></div>
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (status !== 'authenticated') {
    router.push('/login?callbackUrl=/admin');
    return null;
  }
  
  // Check if user has admin role
  if (session?.user?.role !== 'admin') {
    router.push('/account');
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 flex-col">
        <div className="text-red-500 text-xl mb-4">Access Denied</div>
        <div className="text-neutral-600">You do not have permission to access the admin area.</div>
      </div>
    );
  }
  
  // Admin routes for the sidebar
  const routes = [
    { name: 'Dashboard', path: '/admin', icon: 'grid' },
    { name: 'Products', path: '/admin/products', icon: 'box' },
    { name: 'Orders', path: '/admin/orders', icon: 'shopping-bag' },
    { name: 'Customers', path: '/admin/customers', icon: 'users' },
    { name: 'Settings', path: '/admin/settings', icon: 'settings' },
  ];
  
  // Function to check if a route is active
  const isActive = (path: string) => {
    if (path === '/admin') {
      return pathname === '/admin';
    }
    return pathname?.startsWith(path);
  };
  
  // Function to render the appropriate icon
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'grid':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        );
      case 'box':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
        );
      case 'shopping-bag':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
        );
      case 'users':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        );
      case 'settings':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        );
      case 'log-out':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-neutral-50 font-karla">
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
            fontSize: '14px',
          },
          success: {
            style: {
              background: '#10b981',
            },
          },
          error: {
            style: {
              background: '#ef4444',
            },
            duration: 4000,
          },
        }}
      />
      
      {/* Admin header */}
      <header className="bg-neutral-900 text-white">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/admin" className="font-monument text-xl tracking-wider">
            HIKARI ADMIN
          </Link>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-neutral-300">
              Logged in as: <span className="text-white">{session?.user?.email}</span>
              <span className="ml-2 text-green-400">(Admin)</span>
            </div>
            
            <Link href="/" className="text-sm hover:underline">
              Back to Site
            </Link>
            
            <button 
              onClick={handleSignOut}
              disabled={isSigningOut}
              className={`text-sm text-red-400 hover:text-red-300 hover:underline ${
                isSigningOut ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSigningOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      </header>
      
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-neutral-200 min-h-[calc(100vh-56px)] p-4">
          <nav>
            <ul className="space-y-2">
              {routes.map((route) => (
                <li key={route.path}>
                  <Link
                    href={route.path}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-sm transition-colors ${
                      isActive(route.path) 
                        ? 'bg-neutral-100 text-neutral-900' 
                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                    }`}
                  >
                    {renderIcon(route.icon)}
                    <span>{route.name}</span>
                  </Link>
                </li>
              ))}
              
              {/* Sign Out Button */}
              <li className="pt-4 mt-4 border-t border-neutral-200">
                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-sm transition-colors w-full text-left text-red-600 hover:bg-red-50 ${
                    isSigningOut ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {renderIcon('log-out')}
                  <span>{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
                </button>
              </li>
            </ul>
          </nav>
        </aside>
        
        {/* Main content */}
        <main className="flex-1 p-4">
          {children}
        </main>
      </div>
    </div>
  );
} 