'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import Link from 'next/link';
import AccountSidebar from '../components/account/AccountSidebar';
import { usePageTransition } from '../context/PageTransitionProvider';
import { formatRupiah } from '../../lib/utils/format';

// Define types for order data
interface OrderItem {
  productId: number;
  quantity: number;
  price: number;
  selectedColor?: string | null;
  selectedSize?: string | null;
}

interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  status: string;
  total: number;
  createdAt: string;
  updatedAt: string;
  paymentId?: string;
  paymentMethod: string;
  addressId?: string | null;
}

export default function AccountPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/login?callbackUrl=/account');
    },
  });
  
  const router = useRouter();
  const { isTransitioning, setTransitionType } = usePageTransition();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  
  // Fetch recent orders
  useEffect(() => {
    if (status === 'authenticated') {
      fetchRecentOrders();
    }
  }, [status]);
  
  const fetchRecentOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/orders?limit=3'); // Get only 3 most recent orders
      if (response.ok) {
        const data = await response.json();
        setRecentOrders(data);
      }
    } catch (error) {
      console.error('Error fetching recent orders:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Handle sign out with page transition
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
  
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pt-20 pb-6 bg-white font-karla">
      <div className="w-full px-4 md:px-8 lg:px-12">
        <h1 className="text-2xl md:text-3xl font-monument mb-2">My Account</h1>
        <div className="h-px w-12 bg-neutral-300 mb-4 md:mb-12"></div>
        
        {/* Mobile Account Navigation */}
        <div className="md:hidden mb-6 mt-4 overflow-x-auto">
          <div className="flex space-x-2 pb-2 min-w-max">
            <button 
              onClick={() => setActiveSection('overview')} 
              className={`px-4 py-2 text-sm rounded-full whitespace-nowrap ${
                activeSection === 'overview' 
                  ? 'bg-neutral-900 text-white' 
                  : 'bg-neutral-100 text-neutral-700'
              }`}
            >
              Overview
            </button>
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
            {/* Welcome Card - Compact for Mobile */}
            <div className="bg-neutral-50 p-4 md:p-6 rounded-sm mb-4 flex items-center">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-neutral-200 relative mr-3 flex-shrink-0">
                <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xl">
                  {session?.user?.name?.[0] || 'U'}
                </div>
              </div>
              <div>
                <h2 className="font-medium">Welcome, {session?.user?.name?.split(' ')[0] || 'User'}!</h2>
                <p className="text-sm text-neutral-500">{session?.user?.email}</p>
              </div>
              {session?.user?.role === 'admin' && (
                <span className="ml-auto text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">Admin</span>
              )}
            </div>
            
            {/* Personal Information - Compact Card */}
            <div className="border border-neutral-200 rounded-sm p-4 mb-4 bg-white">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Personal Information</h3>
                <Link 
                  href="/account/profile" 
                  className="text-xs bg-neutral-100 px-2 py-1 rounded text-neutral-700"
                >
                  Edit
                </Link>
              </div>
              <p className="text-sm text-neutral-600 mt-1">
                {session?.user?.name}<br />
                {session?.user?.email}
              </p>
            </div>
            
            {/* Recent Orders - Compact Card */}
            <div className="border border-neutral-200 rounded-sm p-4 mb-4 bg-white">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">Recent Orders</h3>
                <Link 
                  href="/account/orders" 
                  className="text-xs bg-neutral-100 px-2 py-1 rounded text-neutral-700"
                >
                  View all
                </Link>
              </div>
              
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-neutral-900"></div>
                </div>
              ) : recentOrders.length > 0 ? (
                <div className="text-sm space-y-3">
                  {recentOrders.slice(0, 2).map(order => (
                    <div key={order.id} className="flex justify-between items-center border-b border-neutral-100 pb-3 last:border-b-0 last:pb-0">
                      <div>
                        <p className="font-medium">#{order.id.slice(-6)}</p>
                        <span className="text-xs text-neutral-500">{formatDate(order.createdAt)}</span>
                      </div>
                      <div className="text-right">
                        <p>{formatRupiah(order.total)}</p>
                        <span className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                          order.status === 'success' || order.status === 'completed' || order.status === 'paid' 
                            ? 'bg-green-100 text-green-800 border border-green-200' : 
                          order.status === 'shipped' || order.status === 'processing'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          order.status === 'pending' || order.status === 'awaiting_payment'
                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                          order.status === 'cancelled' || order.status === 'failed'
                            ? 'bg-red-100 text-red-800 border border-red-200' :
                          'bg-neutral-100 text-neutral-800 border border-neutral-200'
                        }`}>
                          {order.status === 'awaiting_payment' ? 'Pending Payment' : 
                           order.status === 'paid' ? 'Success' :
                           order.status === 'completed' ? 'Completed' :
                           order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-600">
                  You have no recent orders.
                </p>
              )}
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