'use client';

import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { usePageTransition } from '../../context/PageTransitionProvider';

interface AccountSidebarProps {
  onSignOut?: () => void;
}

export default function AccountSidebar({ onSignOut }: AccountSidebarProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { setTransitionType } = usePageTransition();
  
  // Handle sign out with transition
  const handleSignOut = async () => {
    if (isSigningOut) return; // Prevent multiple clicks
    
    setIsSigningOut(true);
    
    try {
      // Call parent's onSignOut if provided
      if (onSignOut) {
        onSignOut();
      }
      
      // Set transition type to blocks for a dramatic effect
      setTransitionType('blocks');
      
      // Use signOut with redirect: false to avoid double transitions
      // This only handles the session termination
      await signOut({ 
        redirect: false
      });
      
      // Manually navigate after sign-out to control the transition
      // Slight delay to ensure session is cleared first
      setTimeout(() => {
        router.push('/login');
      }, 100);
    } catch (error) {
      console.error("Error during sign out process:", error);
      setIsSigningOut(false);
    }
  };
  
  // Check if a menu item is active
  const isActive = (path: string) => {
    return pathname === path;
  };
  
  return (
    <>
      {/* Desktop Sidebar */}
      <div className="bg-neutral-50 p-6 rounded-sm">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-200 relative">
            {session?.user?.image ? (
              <Image 
                src={session.user.image}
                alt={session?.user?.name || 'User'}
                width={48}
                height={48}
                className="w-full h-full object-cover user-profile-img"
                onError={() => {
                  // Fallback to initials if image fails to load
                  const imgElement = document.querySelector('.user-profile-img');
                  if (imgElement) {
                    imgElement.classList.add('hidden');
                    const fallbackElement = document.querySelector('.user-profile-fallback');
                    if (fallbackElement) {
                      fallbackElement.classList.remove('hidden');
                    }
                  }
                }}
              />
            ) : null}
            <div className={`w-full h-full flex items-center justify-center text-neutral-600 text-xl user-profile-fallback ${session?.user?.image ? 'hidden' : ''}`}>
              {session?.user?.name?.[0] || 'U'}
            </div>
          </div>
          <div>
            <p className="font-medium">{session?.user?.name || 'User'}</p>
            <p className="text-sm text-neutral-500">{session?.user?.email}</p>
          </div>
        </div>
        
        <nav className="space-y-1">
          <Link 
            href="/account" 
            className={`block py-2 px-3 rounded-sm ${
              isActive('/account') 
                ? 'bg-neutral-200 text-neutral-900' 
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            Account Overview
          </Link>
          <Link 
            href="/account/orders" 
            className={`block py-2 px-3 rounded-sm ${
              isActive('/account/orders') 
                ? 'bg-neutral-200 text-neutral-900' 
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            Orders
          </Link>
          <Link 
            href="/account/addresses" 
            className={`block py-2 px-3 rounded-sm ${
              isActive('/account/addresses') 
                ? 'bg-neutral-200 text-neutral-900' 
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            Addresses
          </Link>
          <Link 
            href="/account/profile" 
            className={`block py-2 px-3 rounded-sm ${
              isActive('/account/profile') 
                ? 'bg-neutral-200 text-neutral-900' 
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            Profile Settings
          </Link>
          {session?.user?.role === 'admin' && (
            <Link 
              href="/admin" 
              className="block py-2 px-3 text-blue-600 hover:bg-blue-50 rounded-sm"
            >
              Admin Dashboard
            </Link>
          )}
          <button 
            onClick={handleSignOut}
            disabled={isSigningOut}
            className={`w-full text-left py-2 px-3 text-red-600 hover:bg-red-50 rounded-sm ${
              isSigningOut ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSigningOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </nav>
      </div>
      
      {/* Mobile Bottom Navigation - Hidden on desktop */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-neutral-200 z-30 md:hidden">
        <nav className="flex justify-around">
          <Link 
            href="/account" 
            className={`py-3 px-2 flex flex-col items-center ${
              isActive('/account') ? 'text-neutral-900' : 'text-neutral-500'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link 
            href="/account/orders" 
            className={`py-3 px-2 flex flex-col items-center ${
              isActive('/account/orders') ? 'text-neutral-900' : 'text-neutral-500'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="text-xs mt-1">Orders</span>
          </Link>
          <Link 
            href="/account/addresses" 
            className={`py-3 px-2 flex flex-col items-center ${
              isActive('/account/addresses') ? 'text-neutral-900' : 'text-neutral-500'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-1">Addresses</span>
          </Link>
          <Link 
            href="/account/profile" 
            className={`py-3 px-2 flex flex-col items-center ${
              isActive('/account/profile') ? 'text-neutral-900' : 'text-neutral-500'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs mt-1">Profile</span>
          </Link>
          <button 
            onClick={handleSignOut}
            disabled={isSigningOut}
            className={`py-3 px-2 flex flex-col items-center ${isSigningOut ? 'opacity-70 cursor-not-allowed text-neutral-400' : 'text-red-500'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-xs mt-1">{isSigningOut ? 'Exiting...' : 'Sign Out'}</span>
          </button>
        </nav>
      </div>
    </>
  );
} 