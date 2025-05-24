'use client';

import React, { useState, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { usePageTransition } from '../../context/PageTransitionProvider';
import AccountSidebar from '../../components/account/AccountSidebar';

export default function ProfilePage() {
  const { data: session, status, update } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/login?callbackUrl=/account/profile');
    },
  });
  
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { isTransitioning, transitionType, setTransitionType } = usePageTransition();
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  
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
  
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900"></div>
      </div>
    );
  }
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
        setIsLoading(false);
        return;
      }
      
      // Update the session with new user data
      await update({
        ...session,
        user: {
          ...session?.user,
          name: formData.name,
        },
      });
      
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    
    // Validate password match
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setIsLoading(false);
      return;
    }
    
    // Validate password length
    if (formData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long' });
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to update password' });
        setIsLoading(false);
        return;
      }
      
      setMessage({ type: 'success', text: 'Password updated successfully' });
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Basic validation
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file (PNG, JPG, etc.)');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be less than 5MB');
      return;
    }
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // Prepare for upload
    setUploadStatus('loading');
    setUploadError(null);
    
    const formData = new FormData();
    formData.append('profileImage', file);
    
    try {
      const response = await fetch('/api/user/profile/image', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setUploadStatus('error');
        setUploadError(data.error || 'Failed to upload image');
        return;
      }
      
      console.log("Image uploaded successfully, URL:", data.imageUrl);
      
      // Update the session with new user image
      try {
        await update({
          ...session,
          user: {
            ...session?.user,
            image: data.imageUrl,
          },
        });
        
        // Force a reload to update the UI with new image
        window.location.reload();
      } catch (updateError) {
        console.error("Failed to update session:", updateError);
        setUploadError('Image uploaded but session update failed. Please refresh the page.');
      }
      
      setUploadStatus('success');
      setMessage({ type: 'success', text: 'Profile image updated successfully' });
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus('error');
      setUploadError('An error occurred while uploading the image');
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <div className="min-h-screen pt-20 pb-20 bg-white font-karla">
      <div className="w-full px-4 md:px-8 lg:px-12">
        <h1 className="text-2xl md:text-3xl font-monument mb-2">Profile Settings</h1>
        <div className="h-px w-12 bg-neutral-300 mb-4 md:mb-12"></div>
        
        {/* Mobile Account Navigation */}
        <div className="md:hidden mb-6 mt-4 overflow-x-auto">
          <div className="flex space-x-2 pb-2 min-w-max">
            <Link 
              href="/account"
              className="px-4 py-2 text-sm rounded-full whitespace-nowrap bg-neutral-100 text-neutral-700"
            >
              Overview
            </Link>
            <Link 
              href="/account/orders"
              className="px-4 py-2 text-sm rounded-full whitespace-nowrap bg-neutral-100 text-neutral-700"
            >
              Orders
            </Link>
            <Link 
              href="/account/addresses" 
              className="px-4 py-2 text-sm rounded-full whitespace-nowrap bg-neutral-100 text-neutral-700"
            >
              Addresses
            </Link>
            <button
              className="px-4 py-2 text-sm rounded-full whitespace-nowrap bg-neutral-900 text-white"
            >
              Profile
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
          {/* Sidebar navigation - hidden on mobile */}
          <div className="hidden md:block col-span-1">
            <AccountSidebar onSignOut={handleSignOut} />
          </div>
          
          {/* Main content */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            {message && (
              <div className={`mb-4 p-3 rounded-sm ${
                message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {message.text}
              </div>
            )}
            
            {/* Profile Image Section - More compact for mobile */}
            <div className="bg-white border border-neutral-200 rounded-sm p-4 mb-4">
              <h2 className="font-medium mb-3">Profile Picture</h2>
              
              <div className="flex flex-col sm:flex-row items-center">
                <div className="relative mb-4 sm:mb-0 sm:mr-6">
                  {uploadedImage ? (
                    <div className="w-24 h-24 rounded-full overflow-hidden">
                      <Image 
                        src={uploadedImage} 
                        alt="Profile Preview" 
                        width={96} 
                        height={96} 
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ) : session?.user?.image ? (
                    <div className="w-24 h-24 rounded-full overflow-hidden">
                      <Image 
                        src={session.user.image} 
                        alt={session.user.name || 'User'} 
                        width={96} 
                        height={96} 
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 text-2xl">
                      {session?.user?.name?.[0] || 'U'}
                    </div>
                  )}
                  
                  {uploadStatus === 'loading' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                    accept="image/*"
                  />
                  <button
                    onClick={triggerFileInput}
                    className="bg-neutral-100 text-neutral-800 px-4 py-2 text-sm rounded-sm hover:bg-neutral-200 mb-2 w-full sm:w-auto"
                    disabled={uploadStatus === 'loading'}
                  >
                    {uploadStatus === 'loading' ? 'Uploading...' : 'Upload New Photo'}
                  </button>
                  <p className="text-xs text-neutral-500">JPEG, PNG. Max 5MB.</p>
                  
                  {uploadError && (
                    <p className="text-red-600 text-xs mt-2">{uploadError}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Basic Info Form */}
            <div className="bg-white border border-neutral-200 rounded-sm p-4 mb-4">
              <h2 className="font-medium mb-3">Basic Information</h2>
              
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-sm bg-neutral-50 text-neutral-500 cursor-not-allowed"
                    disabled
                  />
                  <p className="text-xs text-neutral-500 mt-1">Email cannot be changed</p>
                </div>
                
                <div>
                  <button
                    type="submit"
                    className="bg-neutral-900 text-white px-5 py-2 text-sm rounded-sm hover:bg-neutral-800 transition-colors"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
            
            {/* Password Form */}
            <div className="bg-white border border-neutral-200 rounded-sm p-4 mb-4">
              <h2 className="font-medium mb-3">Change Password</h2>
              
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-neutral-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-neutral-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    required
                  />
                </div>
                
                <div>
                  <button
                    type="submit"
                    className="bg-neutral-900 text-white px-5 py-2 text-sm rounded-sm hover:bg-neutral-800 transition-colors"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
            
            {/* Mobile Sign Out Button */}
            <div className="md:hidden">
              <button 
                onClick={handleSignOut}
                disabled={isSigningOut}
                className={`w-full py-3 text-center bg-neutral-100 text-neutral-700 rounded-sm ${
                  isSigningOut ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isSigningOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 