'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { format, parseISO, isAfter, isBefore, isEqual } from 'date-fns';
import { prisma } from '@/lib/prisma';
import toast from 'react-hot-toast';

// Format price to Rupiah
const formatRupiah = (price: number | string) => {
  // If price is a string that might contain currency symbols, clean it
  if (typeof price === 'string') {
    price = parseFloat(price.replace(/[^0-9.-]+/g, ''));
  }
  
  // Handle NaN
  if (isNaN(price as number)) {
    return '0';
  }
  
  return new Intl.NumberFormat('id-ID').format(price as number);
};

// Helper function to ensure image URL is properly formatted
const getImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return '/images/placeholder-product.jpg';
  
  // If it's already an absolute URL or starts with a slash, return as is
  if (imageUrl.startsWith('http') || imageUrl.startsWith('/')) {
    return imageUrl;
  }
  
  // Otherwise, assume it's a relative path to the products folder
  return `/uploads/products/${imageUrl}`;
};

// Define types based on database schema
interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: string | number;
  selectedColor?: string | null;
  selectedSize?: string | null;
}

interface OrderData {
  id: string;
  customer: string;
  email: string;
  date: string;
  total: number | string;
  status: string;
  paymentStatus: string;
  items: number;
  paymentMethod: string;
  shippingAddress: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showOrderModal, setShowOrderModal] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loadingOrderItems, setLoadingOrderItems] = useState(false);
  
  // Add state for status update confirmation modal
  const [showStatusConfirmModal, setShowStatusConfirmModal] = useState<boolean>(false);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{order: OrderData | null, newStatus: string | null}>({
    order: null,
    newStatus: null
  });
  const [statusUpdateLoading, setStatusUpdateLoading] = useState<boolean>(false);
  
  // Add state for payment status update confirmation modal
  const [showPaymentConfirmModal, setShowPaymentConfirmModal] = useState<boolean>(false);
  const [pendingPaymentUpdate, setPendingPaymentUpdate] = useState<{order: OrderData | null, newStatus: string | null}>({
    order: null,
    newStatus: null
  });
  const [paymentUpdateLoading, setPaymentUpdateLoading] = useState<boolean>(false);
  
  // Items per page
  const itemsPerPage = 5;
  
  // Fetch orders from database
  useEffect(() => {
    async function fetchOrders() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/orders');
        
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchOrders();
  }, []);
  
  // Filter orders by status, search query, and date range
  const filteredOrders = orders.filter(order => {
    // Filter by status
    if (filterStatus !== 'all' && order.status !== filterStatus) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery && !order.id.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !order.customer.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !order.email.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Filter by date range
    if (startDate && endDate) {
      const orderDate = parseISO(order.date);
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      
      if (!(
        (isAfter(orderDate, start) || isEqual(orderDate, start)) && 
        (isBefore(orderDate, end) || isEqual(orderDate, end))
      )) {
        return false;
      }
    }
    
    return true;
  });
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );
  
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchQuery, startDate, endDate]);
  
  // Map status to badge color
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 border border-amber-300';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'processing':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'completed':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'cancelled':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };
  
  const initiateStatusUpdate = (order: OrderData, newStatus: string) => {
    setPendingStatusUpdate({ order, newStatus });
    setShowStatusConfirmModal(true);
  };
  
  const confirmStatusUpdate = async () => {
    if (!pendingStatusUpdate.order || !pendingStatusUpdate.newStatus) return;
    
    const toastId = toast.loading(`Updating order status to ${pendingStatusUpdate.newStatus}...`);
    
    try {
      setStatusUpdateLoading(true);
      const response = await fetch(`/api/admin/orders/${pendingStatusUpdate.order.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: pendingStatusUpdate.newStatus }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update order status');
      }
      
      // Update the order in the local state
      setOrders(prevOrders => 
        prevOrders.map(o => 
          o.id === pendingStatusUpdate.order?.id ? { ...o, status: pendingStatusUpdate.newStatus as string } : o
        )
      );
      
      // If the selected order is the one being updated, update it as well
      if (selectedOrder && selectedOrder.id === pendingStatusUpdate.order.id) {
        setSelectedOrder({ ...selectedOrder, status: pendingStatusUpdate.newStatus });
      }
      
      toast.success(`Order status updated to ${pendingStatusUpdate.newStatus}`, { id: toastId });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status', { id: toastId });
    } finally {
      setStatusUpdateLoading(false);
      setShowStatusConfirmModal(false);
      setPendingStatusUpdate({ order: null, newStatus: null });
    }
  };
  
  const cancelStatusUpdate = () => {
    setShowStatusConfirmModal(false);
    setPendingStatusUpdate({ order: null, newStatus: null });
  };
  
  // Replace the existing handleUpdateStatus function
  const handleUpdateStatus = (order: OrderData, newStatus: string) => {
    initiateStatusUpdate(order, newStatus);
  };
  
  const initiatePaymentStatusUpdate = (order: OrderData, newPaymentStatus: string) => {
    setPendingPaymentUpdate({ order, newStatus: newPaymentStatus });
    setShowPaymentConfirmModal(true);
  };
  
  const confirmPaymentStatusUpdate = async () => {
    if (!pendingPaymentUpdate.order || !pendingPaymentUpdate.newStatus) return;
    
    const toastId = toast.loading(`Updating payment status to ${pendingPaymentUpdate.newStatus}...`);
    
    try {
      setPaymentUpdateLoading(true);
      const response = await fetch(`/api/admin/orders/${pendingPaymentUpdate.order.id}/payment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentStatus: pendingPaymentUpdate.newStatus }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update payment status');
      }
      
      // Update the order in the local state
      setOrders(prevOrders => 
        prevOrders.map(o => 
          o.id === pendingPaymentUpdate.order?.id ? { ...o, paymentStatus: pendingPaymentUpdate.newStatus as string } : o
        )
      );
      
      // If the selected order is the one being updated, update it as well
      if (selectedOrder && selectedOrder.id === pendingPaymentUpdate.order.id) {
        setSelectedOrder({ ...selectedOrder, paymentStatus: pendingPaymentUpdate.newStatus });
      }
      
      toast.success(`Payment status updated to ${pendingPaymentUpdate.newStatus}`, { id: toastId });
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status', { id: toastId });
    } finally {
      setPaymentUpdateLoading(false);
      setShowPaymentConfirmModal(false);
      setPendingPaymentUpdate({ order: null, newStatus: null });
    }
  };
  
  const cancelPaymentStatusUpdate = () => {
    setShowPaymentConfirmModal(false);
    setPendingPaymentUpdate({ order: null, newStatus: null });
  };
  
  // Replace the existing handleUpdatePaymentStatus function
  const handleUpdatePaymentStatus = (order: OrderData, newPaymentStatus: string) => {
    initiatePaymentStatusUpdate(order, newPaymentStatus);
  };
  
  const handleOrderDetails = async (order: OrderData) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
    
    // Fetch order items from admin-specific endpoint
    setLoadingOrderItems(true);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`);
      if (response.ok) {
        const orderData = await response.json();
        console.log('Order data from API:', orderData);
        if (orderData.items && Array.isArray(orderData.items)) {
          // Process items to ensure images are properly formatted
          const processedItems = orderData.items.map((item: any) => {
            return {
              ...item,
              productImage: getImageUrl(item.productImage)
            };
          });
          
          setOrderItems(processedItems);
        } else {
          setOrderItems([]);
        }
      } else {
        console.error('Error response from API:', response.status, await response.text());
        setOrderItems([]);
      }
    } catch (error) {
      console.error('Error fetching order items:', error);
      setOrderItems([]);
    } finally {
      setLoadingOrderItems(false);
    }
  };
  
  // Get payment badge style
  const getPaymentBadgeClass = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
      case 'unpaid':
        return 'bg-gray-100 text-gray-800 border border-gray-300';
      case 'refunded':
        return 'bg-purple-100 text-purple-800 border border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };
  
  // Payment Status Icon
  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'refunded':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };
  
  return (
    <div className="py-4">
      <div className="mb-8">
        <h1 className="text-2xl font-monument mb-2">Orders</h1>
        <p className="text-neutral-500">Manage customer orders</p>
      </div>
      
      {/* Filter and search */}
      <div className="bg-white p-6 rounded-sm shadow-sm border border-neutral-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Order Status</label>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 text-sm rounded-sm ${
                  filterStatus === 'all' 
                    ? 'bg-neutral-900 text-white' 
                    : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                All
              </button>
              <button 
                onClick={() => setFilterStatus('pending')}
                className={`px-3 py-1 text-sm rounded-sm ${
                  filterStatus === 'pending' 
                    ? 'bg-amber-600 text-white' 
                    : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                Pending
              </button>
              <button 
                onClick={() => setFilterStatus('processing')}
                className={`px-3 py-1 text-sm rounded-sm ${
                  filterStatus === 'processing' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                Processing
              </button>
              <button 
                onClick={() => setFilterStatus('completed')}
                className={`px-3 py-1 text-sm rounded-sm ${
                  filterStatus === 'completed' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                Completed
              </button>
              <button 
                onClick={() => setFilterStatus('cancelled')}
                className={`px-3 py-1 text-sm rounded-sm ${
                  filterStatus === 'cancelled' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                Cancelled
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Date Range</label>
            <div className="flex space-x-2 items-center">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-neutral-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
              <span className="text-neutral-500">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-neutral-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Search Orders</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by ID, customer, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 pl-9 border border-neutral-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Orders table */}
      <div className="bg-white shadow-sm rounded-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center">
                      <svg className="animate-spin h-5 w-5 text-neutral-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="ml-2">Loading orders...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedOrders.length > 0 ? (
                paginatedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                      {order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      <div>{order.customer}</div>
                      <div className="text-xs text-neutral-400">{order.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {order.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {order.items}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      Rp {formatRupiah(
                        typeof order.total === 'number' 
                          ? order.total 
                          : Number(order.total)
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.status === 'pending' && (
                        <span className="px-3 py-1.5 inline-flex items-center text-xs leading-5 font-medium rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Pending
                        </span>
                      )}
                      
                      {order.status === 'processing' && (
                        <span className="px-3 py-1.5 inline-flex items-center text-xs leading-5 font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Processing
                        </span>
                      )}
                      
                      {order.status === 'completed' && (
                        <span className="px-3 py-1.5 inline-flex items-center text-xs leading-5 font-medium rounded-full bg-green-100 text-green-800 border border-green-300">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Completed
                        </span>
                      )}
                      
                      {order.status === 'cancelled' && (
                        <span className="px-3 py-1.5 inline-flex items-center text-xs leading-5 font-medium rounded-full bg-red-100 text-red-800 border border-red-300">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Cancelled
                        </span>
                      )}
                      
                      {order.status !== 'pending' && order.status !== 'processing' && order.status !== 'completed' && order.status !== 'cancelled' && (
                        <span className={`px-3 py-1.5 inline-flex items-center text-xs leading-5 font-medium rounded-full ${getStatusBadgeClass(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1.5 inline-flex items-center text-xs leading-5 font-medium rounded-full ${getPaymentBadgeClass(order.paymentStatus)}`}>
                        {getPaymentStatusIcon(order.paymentStatus)}
                        {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleOrderDetails(order)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Details
                      </button>
                      
                      {(order.status === 'pending') && (
                        <button 
                          onClick={() => handleUpdateStatus(order, 'processing')}
                          className="text-green-600 hover:text-green-900 mr-4"
                        >
                          Process
                        </button>
                      )}
                      
                      {(order.status === 'processing') && (
                        <button 
                          onClick={() => handleUpdateStatus(order, 'completed')}
                          className="text-green-600 hover:text-green-900 mr-4"
                        >
                          Complete
                        </button>
                      )}
                      
                      {(order.status === 'pending' || order.status === 'processing') && (
                        <button 
                          onClick={() => handleUpdateStatus(order, 'cancelled')}
                          className="text-red-600 hover:text-red-900"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-neutral-500">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-neutral-500">
          Showing <span className="font-medium">{paginatedOrders.length}</span> of{' '}
          <span className="font-medium">{filteredOrders.length}</span> orders
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => setCurrentPage(currentPage > 1 ? currentPage - 1 : 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 border border-neutral-300 rounded-sm text-sm ${
              currentPage === 1 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-neutral-50'
            }`}
          >
            Previous
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 ${
                currentPage === page
                  ? 'bg-neutral-900 text-white'
                  : 'border border-neutral-300 hover:bg-neutral-50'
              } rounded-sm text-sm`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => setCurrentPage(currentPage < totalPages ? currentPage + 1 : totalPages)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 border border-neutral-300 rounded-sm text-sm ${
              currentPage === totalPages
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-neutral-50'
            }`}
          >
            Next
          </button>
        </div>
      </div>
      
      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-sm shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="border-b border-neutral-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-medium">Order Details: {selectedOrder.id}</h3>
              <button 
                onClick={() => setShowOrderModal(false)}
                className="text-neutral-500 hover:text-neutral-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Customer Information</h4>
                  <p><span className="font-medium">Name:</span> {selectedOrder.customer}</p>
                  <p><span className="font-medium">Email:</span> {selectedOrder.email}</p>
                  <p><span className="font-medium">Shipping Address:</span> {selectedOrder.shippingAddress}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Order Information</h4>
                  <p><span className="font-medium">Order ID:</span> {selectedOrder.id}</p>
                  <p><span className="font-medium">Date:</span> {selectedOrder.date}</p>
                  <p><span className="font-medium">Payment Method:</span> {selectedOrder.paymentMethod}</p>
                  
                  <div className="flex items-center mt-2">
                    <span className="font-medium mr-2">Payment Status:</span>
                    <span className={`px-3 py-1 inline-flex items-center text-xs leading-5 font-medium rounded-full ${getPaymentBadgeClass(selectedOrder.paymentStatus)}`}>
                      {getPaymentStatusIcon(selectedOrder.paymentStatus)}
                      {selectedOrder.paymentStatus.charAt(0).toUpperCase() + selectedOrder.paymentStatus.slice(1)}
                    </span>
                    
                    <div className="ml-2">
                      {selectedOrder.paymentStatus !== 'paid' && (
                        <button 
                          onClick={() => handleUpdatePaymentStatus(selectedOrder, 'paid')}
                          className="ml-2 text-xs bg-emerald-600 text-white px-2 py-1 rounded-sm"
                        >
                          Mark as Paid
                        </button>
                      )}
                      {selectedOrder.paymentStatus !== 'unpaid' && selectedOrder.paymentStatus !== 'refunded' && (
                        <button 
                          onClick={() => handleUpdatePaymentStatus(selectedOrder, 'refunded')}
                          className="ml-2 text-xs bg-purple-600 text-white px-2 py-1 rounded-sm"
                        >
                          Refund
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <p className="flex items-center mt-2">
                    <span className="font-medium mr-2">Order Status:</span>
                    {selectedOrder.status === 'pending' && (
                      <span className="px-3 py-1 inline-flex items-center text-xs leading-5 font-medium rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Pending
                      </span>
                    )}
                    
                    {selectedOrder.status === 'processing' && (
                      <span className="px-3 py-1 inline-flex items-center text-xs leading-5 font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Processing
                      </span>
                    )}
                    
                    {selectedOrder.status === 'completed' && (
                      <span className="px-3 py-1 inline-flex items-center text-xs leading-5 font-medium rounded-full bg-green-100 text-green-800 border border-green-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Completed
                      </span>
                    )}
                    
                    {selectedOrder.status === 'cancelled' && (
                      <span className="px-3 py-1 inline-flex items-center text-xs leading-5 font-medium rounded-full bg-red-100 text-red-800 border border-red-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancelled
                      </span>
                    )}
                    
                    {selectedOrder.status !== 'pending' && selectedOrder.status !== 'processing' && selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                      <span className={`px-3 py-1 inline-flex items-center text-xs leading-5 font-medium rounded-full ${getStatusBadgeClass(selectedOrder.status)}`}>
                        {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-medium mb-3">Order Summary</h4>
                <div className="border border-neutral-200 rounded-sm overflow-hidden">
                  <div className="grid grid-cols-3 bg-neutral-50 p-3 text-sm font-medium text-neutral-600">
                    <div>Item</div>
                    <div className="text-center">Quantity</div>
                    <div className="text-right">Price</div>
                  </div>
                  
                  {loadingOrderItems ? (
                    <div className="p-6 flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-neutral-900"></div>
                    </div>
                  ) : orderItems.length > 0 ? (
                    <div className="divide-y divide-neutral-100">
                      {orderItems.map((item, index) => {
                        // Ensure we have a valid image URL
                        const imageUrl = item.productImage || '/images/placeholder-product.jpg';
                        
                        return (
                          <div key={index} className="grid grid-cols-3 p-3 text-sm">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-neutral-100 rounded mr-3 flex-shrink-0 overflow-hidden">
                                <img 
                                  src={imageUrl} 
                                  alt={item.productName || `Product #${item.productId}`}
                                  className="w-full h-full object-cover rounded"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null;
                                    target.src = '/images/placeholder-product.jpg';
                                  }}
                                />
                              </div>
                              <div>
                                <p className="font-medium">{item.productName || `Product #${item.productId}`}</p>
                                {(item.selectedColor || item.selectedSize) && (
                                  <div className="text-xs text-neutral-500 mt-0.5">
                                    {item.selectedColor && <span>Color: {item.selectedColor}</span>}
                                    {item.selectedSize && <span className="ml-1">Size: {item.selectedSize}</span>}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-center self-center">{item.quantity}</div>
                            <div className="text-right self-center">
                              {item.formattedPrice || `Rp ${formatRupiah(item.price)}`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                  <div className="p-3 border-t border-neutral-200">
                      <p className="text-sm text-neutral-500 italic">No order items found</p>
                  </div>
                  )}
                  
                  <div className="border-t border-neutral-200 p-3 flex justify-between items-center">
                    <span className="font-medium">Total</span>
                    <span className="font-medium">Rp {formatRupiah(
                      typeof selectedOrder.total === 'number' 
                        ? selectedOrder.total 
                        : parseFloat(selectedOrder.total.toString().replace(/[^0-9.-]+/g, ''))
                    )}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                {(selectedOrder.status === 'pending') && (
                  <button 
                    onClick={() => {
                      handleUpdateStatus(selectedOrder, 'processing');
                      setShowOrderModal(false);
                    }}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-sm hover:bg-green-700"
                  >
                    Process Order
                  </button>
                )}
                
                {(selectedOrder.status === 'processing') && (
                  <button 
                    onClick={() => {
                      handleUpdateStatus(selectedOrder, 'completed');
                      setShowOrderModal(false);
                    }}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-sm hover:bg-green-700"
                  >
                    Mark as Completed
                  </button>
                )}
                
                {(selectedOrder.status === 'pending' || selectedOrder.status === 'processing') && (
                  <button 
                    onClick={() => {
                      handleUpdateStatus(selectedOrder, 'cancelled');
                      setShowOrderModal(false);
                    }}
                    className="px-4 py-2 bg-red-600 text-white text-sm rounded-sm hover:bg-red-700"
                  >
                    Cancel Order
                  </button>
                )}
                
                <button 
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 text-sm rounded-sm hover:bg-neutral-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Status Update Confirmation Modal */}
      {showStatusConfirmModal && pendingStatusUpdate.order && pendingStatusUpdate.newStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-sm shadow-lg max-w-md w-full">
            <div className="border-b border-neutral-200 px-6 py-4">
              <h3 className="text-lg font-medium">Confirm Status Update</h3>
            </div>
            <div className="p-6">
              <p>Are you sure you want to change the order status to:</p>
              <p className="font-medium text-lg mt-2">
                {pendingStatusUpdate.newStatus.charAt(0).toUpperCase() + pendingStatusUpdate.newStatus.slice(1)}
              </p>
              
              <div className="mt-2 text-sm">
                <p><span className="font-medium">Order ID:</span> {pendingStatusUpdate.order.id}</p>
                <p><span className="font-medium">Customer:</span> {pendingStatusUpdate.order.customer}</p>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button 
                  onClick={cancelStatusUpdate}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 text-sm rounded-sm hover:bg-neutral-50"
                  disabled={statusUpdateLoading}
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmStatusUpdate}
                  className="px-4 py-2 bg-neutral-900 text-white text-sm rounded-sm hover:bg-neutral-800"
                  disabled={statusUpdateLoading}
                >
                  {statusUpdateLoading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </div>
                  ) : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Payment Status Update Confirmation Modal */}
      {showPaymentConfirmModal && pendingPaymentUpdate.order && pendingPaymentUpdate.newStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-sm shadow-lg max-w-md w-full">
            <div className="border-b border-neutral-200 px-6 py-4">
              <h3 className="text-lg font-medium">Confirm Payment Status Update</h3>
            </div>
            <div className="p-6">
              <p>Are you sure you want to change the payment status to:</p>
              <p className="font-medium text-lg mt-2">
                {pendingPaymentUpdate.newStatus.charAt(0).toUpperCase() + pendingPaymentUpdate.newStatus.slice(1)}
              </p>
              
              <div className="mt-2 text-sm">
                <p><span className="font-medium">Order ID:</span> {pendingPaymentUpdate.order.id}</p>
                <p><span className="font-medium">Customer:</span> {pendingPaymentUpdate.order.customer}</p>
                <p><span className="font-medium">Total:</span> Rp {formatRupiah(pendingPaymentUpdate.order.total)}</p>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button 
                  onClick={cancelPaymentStatusUpdate}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 text-sm rounded-sm hover:bg-neutral-50"
                  disabled={paymentUpdateLoading}
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmPaymentStatusUpdate}
                  className="px-4 py-2 bg-neutral-900 text-white text-sm rounded-sm hover:bg-neutral-800"
                  disabled={paymentUpdateLoading}
                >
                  {paymentUpdateLoading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </div>
                  ) : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 