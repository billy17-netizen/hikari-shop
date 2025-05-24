'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { BsPerson } from 'react-icons/bs';

export default function AccountMenu() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const isAdmin = isAuthenticated && session?.user?.role === 'admin';
  const router = useRouter();
  
  const handleAccountClick = () => {
    if (isAuthenticated) {
      // Redirect to admin dashboard if user is an admin
      if (isAdmin) {
        router.push('/admin');
      } else {
        router.push('/account');
      }
    } else {
      router.push('/login');
    }
  };
  
  return (
    <div className="relative">
      <button 
        aria-label="Account" 
        className="p-1 transition-colors duration-300 relative"
        onClick={handleAccountClick}
      >
        <BsPerson size={20} />
        
        {isAuthenticated && (
          <span 
            className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
              isAdmin ? 'bg-blue-500' : 'bg-green-500'
            }`}
            title={isAdmin ? 'Admin Account' : 'Signed In'}
          ></span>
        )}
      </button>
    </div>
  );
} 