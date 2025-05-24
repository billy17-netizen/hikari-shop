'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthLayout from '../layouts/AuthLayout';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/account';
  const registered = searchParams.get('registered');
  const { data: session, status } = useSession();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  
  // Redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated') {
      console.log('Session data:', session);
      // Always redirect admin users to admin dashboard
      if (session?.user?.role === 'admin') {
        console.log('Admin user detected, redirecting to /admin');
        router.push('/admin');
      } else {
        // For non-admin users, use the callback URL
        console.log('Regular user detected, redirecting to', callbackUrl || '/account');
        router.push(callbackUrl || '/account');
      }
    }
  }, [status, session, router, callbackUrl]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setDebugInfo(null);
    
    try {
      console.log('Attempting to sign in with credentials:', { email: formData.email });
      
      // Try with admin@example.com if the user is trying to log in as admin
      const email = formData.email === 'admin@hikarishop.com' ? 'admin@example.com' : formData.email;
      
      const result = await signIn('credentials', {
        redirect: false,
        email: email,
        password: formData.password,
      });
      
      console.log('Sign in result:', result);
      
      if (result?.error) {
        setError('Invalid email or password. If you are trying to log in as admin, use admin@example.com with password admin123.');
        setIsLoading(false);
        setDebugInfo(JSON.stringify(result, null, 2));
        return;
      }
      
      // Wait briefly for the session to be established
      setTimeout(async () => {
        try {
          // Check user role for redirection
          console.log('Checking user role...');
          const roleResponse = await fetch('/api/auth/check-role');
          const roleData = await roleResponse.json();
          
          console.log('Role check response:', roleData);
          setDebugInfo(JSON.stringify(roleData, null, 2));
          
          if (roleData.authenticated) {
            // Admin users should always go to admin dashboard
            if (roleData.user.role === 'admin') {
              console.log('Admin confirmed, redirecting to /admin');
              router.push('/admin');
            } else {
              // Non-admin users can use the callback URL
              console.log('Regular user confirmed, redirecting to', callbackUrl || '/account');
              router.push(callbackUrl || '/account');
            }
          } else {
            // Fallback to default redirection
            console.log('Authentication status unclear, using fallback redirect to /account');
            router.push('/account');
          }
        } catch (error) {
          console.error('Error checking role:', error);
          // Fallback to default redirect
          router.push('/account');
        }
      }, 1000); // Increased delay to ensure session is established
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };
  
  // If still checking authentication status, show loading
  if (status === 'loading') {
    return (
      <AuthLayout>
        <div className="max-w-md mx-auto flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900"></div>
        </div>
      </AuthLayout>
    );
  }
  
  // Only render the login form if not authenticated
  if (status === 'unauthenticated') {
    return (
      <AuthLayout>
        <div className="max-w-md mx-auto bg-white rounded-sm shadow-sm border border-neutral-100 p-8 mt-8">
          <h1 className="text-2xl font-monument text-center mb-1">Sign In</h1>
          <div className="h-px w-10 bg-neutral-300 mx-auto mb-8"></div>
          
          {registered && (
            <div className="bg-green-50 text-green-700 p-3 rounded-sm mb-6">
              Account created successfully! Please sign in.
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-sm mb-6">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-neutral-600 hover:text-neutral-900">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 bg-neutral-900 text-white text-sm uppercase tracking-wider transition-colors ${
                isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-neutral-800'
              }`}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
            
            {/* Admin login hint */}
            <div className="text-center text-xs text-neutral-500 pt-2">
              Admin login: admin@example.com / admin123
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              Don't have an account?{' '}
              <Link href="/register" className="text-neutral-900 hover:underline">
                Create one
              </Link>
            </p>
          </div>
          
          {/* Debug info section - always shown for troubleshooting */}
          {debugInfo && (
            <div className="mt-8 p-4 bg-gray-100 rounded-sm text-xs overflow-auto">
              <h3 className="font-bold mb-2">Debug Info:</h3>
              <pre>{debugInfo}</pre>
            </div>
          )}
        </div>
      </AuthLayout>
    );
  }
  
  // Fallback for any unexpected state (shouldn't normally reach here)
  return null;
} 