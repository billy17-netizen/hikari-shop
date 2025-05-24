'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatRupiah } from '../../../lib/utils/format';
import Image from 'next/image';
import AccountSidebar from '../../components/account/AccountSidebar';
import { usePageTransition } from '../../context/PageTransitionProvider';

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

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { setTransitionType } = usePageTransition();
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(5);
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/account/orders');
      return;
    }
    
    if (status === 'authenticated') {
      fetchOrders();
    }
  }, [status, router]);
  
  // Fetch orders from the API
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/orders');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch orders');
      }
      
      const data = await response.json();
      setOrders(data);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      setError(error.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate pagination values
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  
  // Count pending/awaiting orders
  const pendingCount = orders.filter(order => 
    ['pending', 'awaiting_payment'].includes(order.status)
  ).length;
  
  // Filter orders by status
  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => {
        if (statusFilter === 'success') {
          return ['success', 'completed', 'paid'].includes(order.status);
        } else if (statusFilter === 'processing') {
          return ['processing', 'shipped'].includes(order.status);
        } else if (statusFilter === 'pending') {
          return ['pending', 'awaiting_payment'].includes(order.status);
        } else if (statusFilter === 'cancelled') {
          return ['cancelled', 'failed'].includes(order.status);
        }
        return order.status === statusFilter;
      });
  
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  
  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  
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
  
  // Show loading indicator while checking session
  if (status === 'loading' || loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900"></div>
      </div>
    );
  }
  
  // Show error message if there was a problem fetching orders
  if (error) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-2xl md:text-3xl font-monument mb-2">My Orders</h1>
        <div className="h-px w-12 bg-neutral-300 mb-8"></div>
        
        <div className="p-6 bg-red-50 border border-red-200 rounded text-red-700 mb-6">
          <p className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
          <button 
            onClick={fetchOrders}
            className="mt-4 text-sm bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pt-20 pb-6 bg-white font-karla">
      <div className="w-full px-4 md:px-8 lg:px-12">
        <h1 className="text-2xl md:text-3xl font-monument mb-2">My Orders</h1>
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
            <button 
              className="px-4 py-2 text-sm rounded-full whitespace-nowrap bg-neutral-900 text-white"
            >
              Orders
            </button>
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
            {/* We can remove this on mobile as it's redundant with the account page */}
            <div className="hidden md:flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-200 relative">
                <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xl">
                  {session?.user?.name?.[0] || 'U'}
                </div>
              </div>
              <div>
                <p className="font-medium">{session?.user?.name || 'User'}</p>
                <p className="text-sm text-neutral-500">{session?.user?.email}</p>
              </div>
            </div>
            
            {/* Status filter - desktop */}
            <div className="hidden md:flex mb-6 items-center">
              <div className="flex items-center">
                <span className="mr-2 text-sm text-neutral-600">
                  Filter by status:
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-2 text-sm rounded-sm ${
                      statusFilter === 'all'
                        ? 'bg-neutral-900 text-white'
                        : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    All Orders
                  </button>
                  <button
                    onClick={() => setStatusFilter('success')}
                    className={`px-3 py-2 text-sm rounded-sm ${
                      statusFilter === 'success'
                        ? 'bg-green-600 text-white'
                        : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    Completed
                  </button>
                  <button
                    onClick={() => setStatusFilter('processing')}
                    className={`px-3 py-2 text-sm rounded-sm ${
                      statusFilter === 'processing'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    Processing
                  </button>
                  <button
                    onClick={() => setStatusFilter('pending')}
                    className={`px-3 py-2 text-sm rounded-sm flex items-center justify-center ${
                      statusFilter === 'pending'
                        ? 'bg-yellow-600 text-white'
                        : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <span>Pending / Awaiting</span>
                    {pendingCount > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-yellow-500 text-white">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setStatusFilter('cancelled')}
                    className={`px-3 py-2 text-sm rounded-sm ${
                      statusFilter === 'cancelled'
                        ? 'bg-red-600 text-white'
                        : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    Cancelled
                  </button>
                </div>
              </div>
            </div>
            
            {/* Status filter - mobile */}
            <div className="md:hidden mb-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-2 text-sm rounded-sm ${
                    statusFilter === 'all'
                      ? 'bg-neutral-900 text-white'
                      : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  All Orders
                </button>
                <button
                  onClick={() => setStatusFilter('success')}
                  className={`px-3 py-2 text-sm rounded-sm ${
                    statusFilter === 'success'
                      ? 'bg-green-600 text-white'
                      : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setStatusFilter('processing')}
                  className={`px-3 py-2 text-sm rounded-sm ${
                    statusFilter === 'processing'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  Processing
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3 py-2 text-sm rounded-sm flex items-center justify-center ${
                    statusFilter === 'pending'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <span>Pending / Awaiting</span>
                  {pendingCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-yellow-500 text-white">
                      {pendingCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setStatusFilter('cancelled')}
                  className={`px-3 py-2 text-sm rounded-sm ${
                    statusFilter === 'cancelled'
                      ? 'bg-red-600 text-white'
                      : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  Cancelled
                </button>
              </div>
            </div>
            
            {filteredOrders.length > 0 ? (
              <div className="space-y-3">
                {currentOrders.map((order) => (
                  <div key={order.id} className="border border-neutral-200 rounded p-4 bg-white">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center">
                          <h2 className="font-medium">#{order.id.slice(-6)}</h2>
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
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
                        <p className="text-xs text-neutral-500">{formatDate(order.createdAt)}</p>
                      </div>
                      <span className="font-medium text-right">{formatRupiah(order.total)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
                      <span>{(order.items as OrderItem[]).length} {(order.items as OrderItem[]).length === 1 ? 'product' : 'products'}</span>
                      <span>
                        {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 
                         order.paymentMethod === 'midtrans' ? 'Midtrans' : 
                         order.paymentMethod === 'credit_card' ? 'Credit Card' : 
                         order.paymentMethod}
                      </span>
                    </div>
                    
                    <div className="mt-2 pt-2 border-t border-neutral-100 flex justify-between items-center">
                      <div className="flex flex-col space-y-1">
                        <Link 
                          href={`/account/orders/${order.id}`}
                          className="text-sm text-neutral-600 hover:text-neutral-900 underline"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Pagination Controls */}
                {filteredOrders.length > ordersPerPage && (
                  <div className="mt-6 flex flex-col items-center">
                    <div className="flex items-center justify-between w-full max-w-md">
                      <button
                        onClick={goToPrevPage}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded-sm border ${
                          currentPage === 1
                            ? 'border-neutral-200 bg-neutral-100 text-neutral-400 cursor-not-allowed'
                            : 'border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50'
                        }`}
                      >
                        Previous
                      </button>
                      
                      <div className="flex space-x-2">
                        {Array.from({ length: totalPages }, (_, i) => (
                          <button
                            key={i + 1}
                            onClick={() => paginate(i + 1)}
                            className={`w-10 h-10 rounded-sm ${
                              currentPage === i + 1
                                ? 'bg-neutral-900 text-white'
                                : 'bg-white border border-neutral-200 text-neutral-800 hover:bg-neutral-50'
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                      
                      <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 rounded-sm border ${
                          currentPage === totalPages
                            ? 'border-neutral-200 bg-neutral-100 text-neutral-400 cursor-not-allowed'
                            : 'border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                    
                    <div className="mt-3 text-sm text-neutral-500">
                      Showing {indexOfFirstOrder + 1}-{Math.min(indexOfLastOrder, filteredOrders.length)} of {filteredOrders.length} orders
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 bg-neutral-50 rounded border border-neutral-100">
                <div className="w-16 h-16 flex items-center justify-center bg-neutral-100 rounded-full mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">
                  {orders.length === 0 
                    ? "No orders yet" 
                    : `No ${statusFilter !== 'all' ? statusFilter : ''} orders found`}
                </h3>
                <p className="text-neutral-500 text-center mb-4">
                  {orders.length === 0 
                    ? "You haven't placed any orders yet. Start shopping to see your orders here."
                    : statusFilter !== 'all' 
                      ? `You don't have any orders with "${statusFilter}" status. Try a different filter or view all orders.`
                      : "No orders match your current filter."}
                </p>
                {orders.length === 0 ? (
                  <Link 
                    href="/shop" 
                    className="bg-neutral-900 text-white px-6 py-2 rounded-sm hover:bg-neutral-800 transition-colors"
                  >
                    Shop Now
                  </Link>
                ) : statusFilter !== 'all' && (
                  <button
                    onClick={() => setStatusFilter('all')}
                    className="bg-neutral-900 text-white px-6 py-2 rounded-sm hover:bg-neutral-800 transition-colors"
                  >
                    View All Orders
                  </button>
                )}
              </div>
            )}
            
            {/* Mobile Sign Out Button */}
            <div className="mt-8 md:hidden">
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