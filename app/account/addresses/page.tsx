'use client';

import React, { useState, useEffect } from 'react';
import { redirect, useRouter } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { AddressForm, AddressCard } from './components';
import { useAuth } from '../../../contexts/AuthContext';
import AccountSidebar from '../../components/account/AccountSidebar';
import { usePageTransition } from '../../context/PageTransitionProvider';

// Address type definition
interface AddressData {
  name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface Address extends AddressData {
  id: string;
}

export default function AddressesPage() {
  const { user, status, error, useMockAuth } = useAuth();
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { setTransitionType } = usePageTransition();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/account/addresses');
    }
  }, [status, router]);
  
  // Fetch addresses from API when component mounts
  useEffect(() => {
    if (status === 'authenticated') {
      fetchAddresses();
    }
  }, [status]);
  
  // Function to fetch addresses from the API
  const fetchAddresses = async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      
      const response = await fetch('/api/addresses');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        setFetchError('Failed to load addresses. Please try again later.');
        return;
      }
      
      const data = await response.json();
      if (Array.isArray(data)) {
        setAddresses(data);
      } else {
        console.warn('API returned non-array data:', data);
        setAddresses([]);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setFetchError('An error occurred while loading your addresses.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add a new address
  const handleAddAddress = async (newAddressData: AddressData) => {
    try {
      const response = await fetch('/api/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAddressData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add address');
      }
      
      const newAddress = await response.json();
      setAddresses(prev => [...prev, newAddress]);
      setShowForm(false);
    } catch (error) {
      console.error('Error adding address:', error);
      alert('Failed to add address. Please try again.');
    }
  };
  
  // Update an existing address
  const handleUpdateAddress = async (updatedAddress: Address | AddressData) => {
    if ('id' in updatedAddress) {
      try {
        const response = await fetch(`/api/addresses/${updatedAddress.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedAddress),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update address');
        }
        
        const updated = await response.json();
        setAddresses(prev => 
          prev.map(addr => 
            addr.id === updated.id ? updated : addr
          )
        );
        setEditingAddress(null);
        setShowForm(false);
      } catch (error) {
        console.error('Error updating address:', error);
        alert('Failed to update address. Please try again.');
      }
    }
  };
  
  // Delete an address
  const handleDeleteAddress = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        const response = await fetch(`/api/addresses/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete address');
        }
        
        setAddresses(prev => prev.filter(addr => addr.id !== id));
      } catch (error) {
        console.error('Error deleting address:', error);
        alert('Failed to delete address. Please try again.');
      }
    }
  };
  
  // Set an address as default
  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/addresses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isDefault: true }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to set default address');
      }
      
      // Update local state to reflect the new default status
      await fetchAddresses();
    } catch (error) {
      console.error('Error setting default address:', error);
      alert('Failed to set default address. Please try again.');
    }
  };
  
  // Open the form for editing an address
  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setShowForm(true);
  };
  
  // Handle sign out
  const handleSignOut = async () => {
    if (isSigningOut) return; // Prevent multiple clicks
    
    setIsSigningOut(true);
    
    try {
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
  
  // Show auth error with mock auth option
  if (error) {
    return (
      <div className="min-h-screen py-16 pt-24 bg-white font-karla">
        <div className="max-w-md mx-auto p-6 bg-neutral-50 rounded-sm">
          <h1 className="text-2xl font-monument mb-4">Authentication Issue</h1>
          <p className="mb-4">{error}</p>
          <button
            onClick={() => {
              useMockAuth();
              fetchAddresses();
            }}
            className="w-full py-2 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
          >
            Continue with Mock User
          </button>
        </div>
      </div>
    );
  }
  
  // Render loading state
  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pt-20 pb-20 bg-white font-karla">
      <div className="w-full px-4 md:px-8 lg:px-12">
        <h1 className="text-2xl md:text-3xl font-monument mb-2">My Addresses</h1>
        <div className="h-px w-12 bg-neutral-300 mb-4 md:mb-8"></div>
        
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
            <button 
              className="px-4 py-2 text-sm rounded-full whitespace-nowrap bg-neutral-900 text-white"
            >
              Addresses
            </button>
            <Link 
              href="/account/profile" 
              className="px-4 py-2 text-sm rounded-full whitespace-nowrap bg-neutral-100 text-neutral-700"
            >
              Profile
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
          {/* Sidebar navigation - hidden on mobile */}
          <div className="hidden md:block col-span-1">
            <AccountSidebar onSignOut={handleSignOut} />
          </div>
          
          {/* Main content */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <div className="bg-white border border-neutral-200 rounded-sm p-4 md:p-6 mb-4">
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <h2 className="font-medium md:font-monument md:text-lg">Saved Addresses</h2>
                <button
                  onClick={() => {
                    setEditingAddress(null);
                    setShowForm(true);
                  }}
                  className="text-xs md:text-sm px-3 py-1.5 md:px-4 md:py-2 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors rounded-sm"
                >
                  Add New
                </button>
              </div>
              
              {showForm ? (
                <AddressForm
                  onSave={editingAddress ? handleUpdateAddress : handleAddAddress}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingAddress(null);
                  }}
                  initialData={editingAddress}
                />
              ) : (
                <div>
                  {fetchError ? (
                    <div className="bg-white border border-neutral-200 p-4 md:p-8 text-center rounded-sm">
                      <p className="text-red-600 mb-4">{fetchError}</p>
                      <button
                        onClick={fetchAddresses}
                        className="text-sm px-4 py-2 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : addresses.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {addresses.map(address => (
                        <AddressCard
                          key={address.id}
                          address={address}
                          onEdit={() => handleEditAddress(address)}
                          onDelete={() => handleDeleteAddress(address.id)}
                          onSetDefault={() => handleSetDefault(address.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white border border-neutral-200 p-4 md:p-8 text-center rounded-sm">
                      <p className="text-neutral-600 mb-4">You don't have any saved addresses yet.</p>
                      <button
                        onClick={() => setShowForm(true)}
                        className="text-sm px-4 py-2 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
                      >
                        Add Your First Address
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="border border-neutral-200 rounded-sm p-4 md:p-6 bg-white mb-4">
              <h3 className="font-medium mb-2">About Saved Addresses</h3>
              <p className="text-xs md:text-sm text-neutral-600">
                Adding addresses to your account makes checkout faster and easier. Your saved addresses will 
                automatically appear in the checkout process.
              </p>
              <p className="text-xs md:text-sm text-neutral-600 mt-2">
                Your default address will be pre-selected during checkout.
              </p>
            </div>
            
            {/* Mobile Sign Out Button */}
            <div className="md:hidden mt-6">
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