'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

// Mock user for testing when NextAuth fails
const MOCK_USER = {
  id: 'mock-user-id',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
};

interface AuthContextType {
  user: any;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  error: string | null;
  useMockAuth: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  status: 'loading',
  error: null,
  useMockAuth: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status: nextAuthStatus } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [usingMockAuth, setUsingMockAuth] = useState(false);
  
  // Auth timeout to detect issues with NextAuth
  useEffect(() => {
    let authTimeout: NodeJS.Timeout;
    
    if (nextAuthStatus === 'loading') {
      authTimeout = setTimeout(() => {
        setError('Authentication is taking too long. You can continue with mock authentication for testing.');
      }, 5000); // 5 seconds timeout
    }
    
    return () => {
      if (authTimeout) clearTimeout(authTimeout);
    };
  }, [nextAuthStatus]);
  
  // Use mock authentication
  const useMockAuth = () => {
    setUsingMockAuth(true);
    setError(null);
  };
  
  // Determine effective authentication state
  const user = usingMockAuth ? MOCK_USER : session?.user;
  const status = usingMockAuth ? 'authenticated' : nextAuthStatus;
  
  const value = {
    user,
    status,
    error,
    useMockAuth,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
} 