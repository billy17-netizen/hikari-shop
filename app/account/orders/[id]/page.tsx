'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { formatRupiah } from '../../../../lib/utils/format';

export default function OrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/orders/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch order');
        }
        
        const data = await response.json();
        setOrder(data);
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
      router.push('/login?callbackUrl=' + encodeURIComponent(`/account/orders/${id}`));
    }
  }, [authStatus, id, router]);
  
  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Handle payment retry for abandoned Midtrans payments
  const handleRetryPayment = async () => {
    if (!order || order.paymentMethod !== 'midtrans' || order.status !== 'awaiting_payment') {
      return;
    }
    
    try {
      setRetrying(true);
      setError(null);
      
      // First, notify the API that we want to restart the payment
      const response = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'restart_payment'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to initiate payment retry');
      }
      
      // Store timestamp in sessionStorage to identify returning from payment
      sessionStorage.setItem('payment_initiated', Date.now().toString());
      sessionStorage.setItem('payment_order_id', id as string);
      
      // Redirect to checkout page with retry parameter
      router.push(`/checkout/retry?orderId=${id}`);
    } catch (err) {
      console.error('Error retrying payment:', err);
      setError(err instanceof Error ? err.message : 'Failed to retry payment');
      setRetrying(false);
    }
  };

  // Check if returning from payment
  useEffect(() => {
    const paymentInitiated = sessionStorage.getItem('payment_initiated');
    const paymentCompleted = sessionStorage.getItem('payment_completed');
    const paymentOrderId = sessionStorage.getItem('payment_order_id');
    
    if ((paymentInitiated || paymentCompleted) && paymentOrderId === id) {
      // Remove the flags
      sessionStorage.removeItem('payment_initiated');
      sessionStorage.removeItem('payment_completed');
      sessionStorage.removeItem('payment_order_id');
      
      // Refresh the order details
      if (session?.user) {
        const refreshOrder = async () => {
          try {
            const response = await fetch(`/api/orders/${id}`);
            if (response.ok) {
              const data = await response.json();
              setOrder(data);
            }
          } catch (error) {
            console.error('Error refreshing order:', error);
          }
        };
        
        refreshOrder();
      }
    }
  }, [id, session?.user]);

  // Generate status badge style based on order status
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'paid':
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'shipped':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'awaiting_payment':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-neutral-100 text-neutral-800 border border-neutral-200';
    }
  };

  // Format status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'awaiting_payment': 
        return 'Pending Payment';
      case 'paid': 
        return 'Paid';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
    }
  };
  
  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen pt-16 pb-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mb-4"></div>
            <p className="text-neutral-600">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen pt-16 pb-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-6">
            <p>{error}</p>
          </div>
          <Link href="/account/orders" className="inline-flex items-center text-neutral-600 hover:text-neutral-900">
            <span className="mr-1">←</span> Back to orders
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pt-16 pb-12 bg-white">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl md:text-2xl font-monument">Order Details</h1>
          <Link href="/account/orders" className="inline-flex items-center text-neutral-600 hover:text-neutral-900 text-sm md:text-base">
            <span className="mr-1">←</span> Back to orders
          </Link>
        </div>
        
        {order && (
          <div className="space-y-5">
            {/* Order header info with improved status display */}
            <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                <div>
                  <div className="flex items-center">
                    <h2 className="text-lg md:text-xl font-medium">Order #{order.id.slice(-6)}</h2>
                    <div className={`ml-3 px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </div>
                  </div>
                  <p className="text-neutral-500 text-sm mt-1">Placed on {formatDate(order.createdAt)}</p>
                </div>
                
                <div className="md:text-right">
                  {/* Retry payment button with better styling */}
                  {order.paymentMethod === 'midtrans' && order.status === 'awaiting_payment' && (
                    <button
                      onClick={handleRetryPayment}
                      disabled={retrying}
                      className="w-full md:w-auto bg-neutral-900 text-white px-4 py-2 text-sm rounded-md hover:bg-neutral-800 transition-colors disabled:bg-neutral-400"
                    >
                      {retrying ? 'Processing...' : 'Complete Payment'}
                    </button>
                  )}
                  
                  {/* Payment processing notification */}
                  {order.paymentStatus === 'pending' && order.paymentMethod === 'midtrans' && (
                    <div className="mt-3 text-sm text-yellow-700 bg-yellow-50 p-3 border border-yellow-200 rounded-md">
                      <p className="mb-2">Your payment is being processed by Midtrans.</p>
                      <p className="text-xs">If you've completed the payment, it may take a few minutes to be confirmed.</p>
                      <button
                        onClick={() => window.location.reload()}
                        className="mt-2 text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md hover:bg-yellow-200 transition-colors"
                      >
                        Check Status
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Order timeline */}
              <div className="border-t border-neutral-100 pt-4 mt-4">
                <h3 className="text-sm uppercase tracking-wider text-neutral-500 mb-3">Order Progress</h3>
                <div className="relative">
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-neutral-200"></div>
                  
                  <div className="relative pl-8 pb-4">
                    <div className={`absolute left-0 w-6 h-6 rounded-full flex items-center justify-center
                      ${order.status !== 'cancelled' ? 'bg-green-100 text-green-800' : 'bg-neutral-200 text-neutral-500'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Order Placed</p>
                      <p className="text-xs text-neutral-500">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                  
                  <div className="relative pl-8 pb-4">
                    <div className={`absolute left-0 w-6 h-6 rounded-full flex items-center justify-center
                      ${['processing', 'paid', 'shipped', 'delivered', 'completed'].includes(order.status) ? 'bg-green-100 text-green-800' : 
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-neutral-200 text-neutral-500'}`}>
                      {['processing', 'paid', 'shipped', 'delivered', 'completed'].includes(order.status) ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : order.status === 'cancelled' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-neutral-400"></span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {order.status === 'cancelled' ? 'Order Cancelled' : 'Payment Confirmed'}
                      </p>
                      {['processing', 'paid', 'shipped', 'delivered', 'completed'].includes(order.status) && (
                        <p className="text-xs text-neutral-500">
                          {order.updatedAt ? formatDate(order.updatedAt) : 'Processing'}
                        </p>
                      )}
                      {order.status === 'cancelled' && (
                        <p className="text-xs text-neutral-500">Order was cancelled</p>
                      )}
                      {order.status === 'awaiting_payment' && (
                        <p className="text-xs text-neutral-500">Waiting for payment</p>
                      )}
                    </div>
                  </div>
                  
                  {order.status !== 'cancelled' && (
                    <>
                      <div className="relative pl-8 pb-4">
                        <div className={`absolute left-0 w-6 h-6 rounded-full flex items-center justify-center
                          ${order.status === 'shipped' || order.status === 'delivered' || order.status === 'completed' 
                            ? 'bg-blue-100 text-blue-800' : 'bg-neutral-200 text-neutral-500'}`}>
                          {order.status === 'shipped' || order.status === 'delivered' || order.status === 'completed' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <span className="h-2 w-2 rounded-full bg-neutral-400"></span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">Shipped</p>
                          {order.status === 'shipped' || order.status === 'delivered' || order.status === 'completed' ? (
                            <p className="text-xs text-neutral-500">Your order is on the way</p>
                          ) : (
                            <p className="text-xs text-neutral-500">Preparing for shipment</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="relative pl-8">
                        <div className={`absolute left-0 w-6 h-6 rounded-full flex items-center justify-center
                          ${order.status === 'delivered' || order.status === 'completed' 
                            ? 'bg-green-100 text-green-800' : 'bg-neutral-200 text-neutral-500'}`}>
                          {order.status === 'delivered' || order.status === 'completed' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <span className="h-2 w-2 rounded-full bg-neutral-400"></span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">Delivered</p>
                          {order.status === 'delivered' || order.status === 'completed' ? (
                            <p className="text-xs text-neutral-500">Your order has been delivered</p>
                          ) : (
                            <p className="text-xs text-neutral-500">Waiting for delivery</p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="border-t border-neutral-200 pt-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm uppercase tracking-wider text-neutral-500 mb-1">Payment Method</h3>
                    <p className="font-medium">
                      {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 
                       order.paymentMethod === 'midtrans' ? 'Midtrans' : 
                       order.paymentMethod === 'credit_card' ? 'Credit Card' : 
                       order.paymentMethod}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm uppercase tracking-wider text-neutral-500 mb-1">Total Amount</h3>
                    <p className="font-medium">{formatRupiah(order.total)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Order items with improved styling */}
            <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-4 md:p-6">
              <h2 className="text-lg font-medium mb-4">Order Items</h2>
              
              <div className="divide-y divide-neutral-100">
                {order.items && Array.isArray(order.items) && order.items.map((item: any, index: number) => (
                  <div key={index} className="flex items-start py-3">
                    <div className="w-12 h-12 bg-neutral-100 rounded mr-3 flex-shrink-0">
                      {(item.image || item.imageUrl || 
                        (item.product && (
                          item.product.imageUrl || 
                          (item.product.images && item.product.images.length > 0 && item.product.images[0])
                        ))
                      ) ? (
                        <img 
                          src={item.image || item.imageUrl || 
                            (item.product && (
                              item.product.imageUrl || 
                              (item.product.images && item.product.images.length > 0 && item.product.images[0])
                            ))
                          } 
                          alt={item.product?.name || `Product #${item.productId}`}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <p className="font-medium">{item.product?.name || `Product #${item.productId}`}</p>
                      <div className="text-xs text-neutral-500 mt-1 space-y-0.5">
                        <p>Quantity: {item.quantity}</p>
                        {item.selectedColor && <p>Color: {item.selectedColor}</p>}
                        {item.selectedSize && <p>Size: {item.selectedSize}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatRupiah(item.price * item.quantity)}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {formatRupiah(item.price)} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Order summary */}
              <div className="border-t border-neutral-200 mt-4 pt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Subtotal</span>
                  <span>{formatRupiah(order.total)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Shipping</span>
                  <span>Included</span>
                </div>
                <div className="flex justify-between font-medium mt-4 pt-2 border-t border-neutral-200">
                  <span>Total</span>
                  <span className="text-lg">{formatRupiah(order.total)}</span>
                </div>
              </div>
            </div>
            
            {/* Shipping address with improved styling */}
            {order.address && (
              <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-4 md:p-6">
                <h2 className="text-lg font-medium mb-3">Shipping Address</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-neutral-50 p-3 rounded border border-neutral-100">
                    <div className="text-neutral-600 space-y-1">
                      <p className="font-medium">{order.address.name}</p>
                      <p className="text-sm">{order.address.phone}</p>
                      <p className="text-sm">{order.address.address}</p>
                      <p className="text-sm">{order.address.city}, {order.address.province}, {order.address.postalCode}</p>
                      <p className="text-sm">{order.address.country}</p>
                    </div>
                  </div>
                  
                  <div className="hidden md:block">
                    {/* This space intentionally left blank for future content or map */}
                  </div>
                </div>
              </div>
            )}
            
            {/* Contact support section */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 md:p-5">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-medium mb-1">Need help with your order?</h3>
                  <p className="text-sm text-neutral-600">Our customer support team is here to help</p>
                </div>
                <a 
                  href="mailto:support@hikarishop.com" 
                  className="px-4 py-2 bg-neutral-900 text-white rounded-md text-sm hover:bg-neutral-800 transition-colors w-full md:w-auto text-center"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 