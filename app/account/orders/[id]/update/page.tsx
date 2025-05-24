'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function UpdateOrderStatusPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState('paid');
  
  // Fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch order');
        }
        
        const data = await response.json();
        setOrder(data);
        setNewStatus(data.status || 'paid');
      } catch (err) {
        setError('Error loading order details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    if (session?.user) {
      fetchOrder();
    }
  }, [id, session?.user]);
  
  // Check authentication
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login?callbackUrl=' + encodeURIComponent(`/account/orders/${id}/update`));
    }
  }, [authStatus, id, router]);
  
  const handleStatusUpdate = async () => {
    setUpdating(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/orders/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }
      
      // Refresh order data
      setOrder((prev: any) => ({ ...prev, status: newStatus }));
      
      // Show success message or redirect
      setTimeout(() => {
        router.push(`/account/orders`);
      }, 1500);
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };
  
  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen pt-20 pb-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen pt-20 pb-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-6">
            <p>{error}</p>
          </div>
          <Link href="/account/orders" className="text-neutral-600 hover:text-neutral-900">
            &larr; Back to orders
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pt-20 pb-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-2xl md:text-3xl font-monument mb-6">Update Order Status</h1>
        
        {order && (
          <div className="bg-white border border-neutral-200 rounded p-6 mb-6">
            <div className="mb-4">
              <p className="text-sm text-neutral-500">Order ID</p>
              <p className="font-medium">{order.id}</p>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-neutral-500">Current Status</p>
              <p className="font-medium">
                <span className={`inline-block px-2 py-1 text-xs rounded ${
                  order.status === 'paid' ? 'bg-green-100 text-green-800' :
                  order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  order.status === 'awaiting_payment' ? 'bg-orange-100 text-orange-800' :
                  'bg-neutral-100 text-neutral-800'
                }`}>
                  {order.status}
                </span>
              </p>
            </div>
            
            <div className="mb-6">
              <label htmlFor="status" className="block text-sm mb-1">New Status</label>
              <select
                id="status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full p-2 border border-neutral-300 rounded"
                disabled={updating}
              >
                <option value="pending">Pending</option>
                <option value="awaiting_payment">Awaiting Payment</option>
                <option value="paid">Paid</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={handleStatusUpdate}
                disabled={updating}
                className="px-6 py-2 bg-neutral-900 text-white hover:bg-neutral-800 disabled:bg-neutral-300 transition-colors rounded-sm"
              >
                {updating ? 'Updating...' : 'Update Status'}
              </button>
              
              <Link href="/account/orders" className="text-neutral-600 hover:text-neutral-900">
                Cancel
              </Link>
            </div>
          </div>
        )}
        
        <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded">
          <h2 className="text-lg font-medium mb-2 text-blue-900">Important Note</h2>
          <p className="text-blue-800 text-sm">
            This page allows you to manually update the order status in case the automatic status update from the payment provider fails.
            This is particularly useful for Midtrans payments where webhook notifications may not work in development environments.
          </p>
        </div>
      </div>
    </div>
  );
} 