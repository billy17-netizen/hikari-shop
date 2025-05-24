'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCart } from '../../../contexts/CartContext';
import { useMidtransPayment } from '../hooks/useMidtransPayment';
import Link from 'next/link';

// Add TypeScript declaration for window.snap
declare global {
  interface Window {
    snap: any;
  }
}

export default function RetryPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: authStatus } = useSession();
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [snapPopupActive, setSnapPopupActive] = useState(false);
  
  // Get order ID from URL parameters
  const orderId = searchParams.get('orderId');
  
  // Check and reset Snap popup state on page load
  useEffect(() => {
    // This helps in case a Snap popup was left active from a previous session
    if (typeof window !== 'undefined' && window.snap) {
      try {
        // Some browsers might not support this, so we're using try-catch
        if (document.querySelector('.snap-popup')) {
          console.log('Found existing Snap popup on page load, resetting state');
          setSnapPopupActive(false);
        }
      } catch (err) {
        console.error('Error checking for existing Snap popup:', err);
      }
    }
  }, []);
  
  // Helper function to safely open Snap popup
  const openSnapPopup = (token: string) => {
    // Check if we already have a Snap popup open
    if (snapPopupActive) {
      console.log('Snap popup is already active, won\'t open another one');
      return false;
    }
    
    if (typeof window !== 'undefined' && window.snap) {
      try {
        setSnapPopupActive(true);
        window.snap.pay(token, {
          onSuccess: function(result: Record<string, any>) {
            console.log('Payment success:', result);
            setSnapPopupActive(false);
            
            // Update order status to processing (not paid)
            updateOrderStatus(order?.id, 'processing', result).then(() => {
              router.push(`/checkout/success?orderId=${order?.id}&paymentMethod=midtrans`);
            });
          },
          onPending: function(result: Record<string, any>) {
            console.log('Payment pending:', result);
            setSnapPopupActive(false);
            router.push(`/account/orders`);
          },
          onError: function(result: Record<string, any>) {
            console.error('Payment error:', result);
            setSnapPopupActive(false);
            setError('Payment failed. Please try again or contact customer support.');
            setIsProcessing(false);
          },
          onClose: function() {
            console.log('Customer closed the payment popup without completing payment');
            setSnapPopupActive(false);
            setError('Payment process was interrupted. You can try again or check your order status.');
            setIsProcessing(false);
          }
        });
        return true;
      } catch (err) {
        console.error('Error opening Snap popup:', err);
        setSnapPopupActive(false);
        setError('Failed to open payment popup. Please try again.');
        setIsProcessing(false);
        return false;
      }
    } else {
      setError('Midtrans Snap not initialized correctly');
      setIsProcessing(false);
      return false;
    }
  };
  
  // Helper function to update order status
  const updateOrderStatus = async (orderId: string | undefined, status: string, paymentResult?: Record<string, any>) => {
    if (!orderId) return;
    
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status,
          paymentDetails: paymentResult 
        }),
      });
      
      if (!response.ok) {
        console.error('Failed to update order status:', await response.json());
      } else {
        console.log('Order status updated successfully to:', status);
      }
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };
  
  // Fetch the order details
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId || !session?.user) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/orders/${orderId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch order details');
        }
        
        const orderData = await response.json();
        
        // Validate that this is a Midtrans order in awaiting_payment status
        if (orderData.paymentMethod !== 'midtrans' || orderData.status !== 'awaiting_payment') {
          throw new Error('This order cannot be retried or has already been paid');
        }
        
        setOrder(orderData);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError(err instanceof Error ? err.message : 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrder();
  }, [orderId, session?.user]);
  
  // Initialize Midtrans payment hook
  const midtransPayment = useMidtransPayment({
    orderId: order?.id || '',
    amount: order?.total || 0,
    items: order?.items?.map((item: any) => ({
      id: item.productId,
      name: `Product #${item.productId}`,
      price: parseFloat(item.price),
      quantity: item.quantity
    })) || [],
    shipping: {
      cost: 25000, // Standard shipping cost
      method: 'standard'
    },
    shippingAddress: order?.address || {},
    customerEmail: session?.user?.email || '',
    onPaymentSuccess: (result: Record<string, any>) => {
      router.push(`/checkout/success?orderId=${order?.id}&paymentMethod=midtrans`);
    },
    onPaymentError: (result: Record<string, any>) => {
      setError('Payment failed. Please try again or contact customer support.');
      setIsProcessing(false);
    },
    onPaymentPending: (result: Record<string, any>) => {
      router.push(`/account/orders`);
    }
  });
  
  // Process the payment when the component mounts and we have the order
  useEffect(() => {
    if (order && midtransPayment.isReady && !isProcessing && !error && !snapPopupActive) {
      handleRetryPayment();
    }
  }, [order, midtransPayment.isReady, isProcessing, error, snapPopupActive]);
  
  // Handle retry button click
  const handleRetryPayment = async () => {
    // Don't proceed if a Snap popup is already active
    if (snapPopupActive) {
      console.log('Snap popup is already active, ignoring retry attempt');
      return;
    }
    
    setError(null);
    setIsProcessing(true);
    
    try {
      // Calculate items subtotal to verify
      const itemsSubtotal = order.items?.reduce((sum: number, item: any) => {
        return sum + (parseFloat(item.price) * item.quantity);
      }, 0) || 0;
      
      // Log payment details for debugging
      console.log('Midtrans payment retry details:', {
        originalOrderId: order.id,
        orderTotal: order.total,
        itemsSubtotal,
        shippingCost: 25000,
        calculatedTotal: itemsSubtotal + 25000
      });
      
      // Call the API to retry payment
      const response = await fetch('/api/midtrans/retry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalOrderId: order.id,
          amount: order.total,
          items: order.items?.map((item: any) => ({
            id: item.productId,
            name: `Product #${item.productId}`,
            price: parseFloat(item.price),
            quantity: item.quantity
          })) || [],
          shipping: {
            cost: 25000,
            method: 'standard'
          },
          shippingAddress: order?.address || {},
          customerEmail: session?.user?.email || ''
        }),
      });
      
      const data = await response.json();
      console.log('Midtrans API response:', data);
      
      if (!response.ok) {
        // If we can't retry, show error and redirect if needed
        if (data.redirectUrl) {
          setTimeout(() => {
            router.push(data.redirectUrl);
          }, 5000);
        }
        throw new Error(data.error || 'Failed to initialize payment');
      }
      
      // Open Snap payment page with the token
      if (data.token) {
        if (openSnapPopup(data.token)) {
          // Successfully opened popup, nothing more to do
          return;
        }
      } else {
        throw new Error('No payment token received from the server');
      }
    } catch (err) {
      console.error('Error processing payment:', err);
      setError(err instanceof Error ? err.message : 'Failed to retry payment. Please try again later.');
      setIsProcessing(false);
    }
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Reset the popup state when component unmounts
      setSnapPopupActive(false);
    };
  }, []);
  
  // Show loading state
  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen pt-20 pb-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center">
          <h1 className="text-2xl md:text-3xl font-monument mb-6">Processing Payment</h1>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mb-4"></div>
          <p className="text-neutral-600">Loading payment details...</p>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="min-h-screen pt-20 pb-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center">
          <h1 className="text-2xl md:text-3xl font-monument mb-6">Payment Error</h1>
          
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded w-full max-w-md mb-6">
            <p className="mb-4">{error}</p>
            
            <div className="flex flex-col gap-4 mt-4">
              {/* Show different options based on the error */}
              {error.includes('pending') ? (
                <Link 
                  href="/account/orders"
                  className="px-4 py-2 bg-neutral-900 text-white rounded hover:bg-neutral-800 transition-colors text-center"
                >
                  Check Order Status
                </Link>
              ) : (
                <button
                  onClick={handleRetryPayment}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-neutral-900 text-white rounded hover:bg-neutral-800 transition-colors text-center disabled:bg-neutral-400"
                >
                  Try Again
                </button>
              )}
              
              <Link 
                href="/account/orders"
                className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded hover:bg-neutral-200 transition-colors text-center"
              >
                View All Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Show processing state
  return (
    <div className="min-h-screen pt-20 pb-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center">
        <h1 className="text-2xl md:text-3xl font-monument mb-6">
          Processing Payment
        </h1>
        
        {isProcessing ? (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mb-4"></div>
            <p className="text-neutral-600 mb-2">Initializing payment...</p>
            <p className="text-neutral-500 text-sm">Please do not close this window.</p>
          </div>
        ) : (
          <button
            onClick={handleRetryPayment}
            disabled={isProcessing}
            className="px-4 py-2 bg-neutral-900 text-white rounded hover:bg-neutral-800 transition-colors disabled:bg-neutral-400"
          >
            Complete Payment
          </button>
        )}
        
        <div className="mt-8">
          <Link 
            href="/account/orders"
            className="text-neutral-600 underline hover:text-neutral-900"
          >
            Cancel and return to orders
          </Link>
        </div>
      </div>
    </div>
  );
} 