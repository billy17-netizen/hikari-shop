'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useCart } from '../../../contexts/CartContext';
import { motion } from 'framer-motion';

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { clearCart } = useCart();
  
  const [isAnimating, setIsAnimating] = useState(false);
  const hasCleared = useRef(false);
  
  // Get order ID and payment method from URL
  const orderId = searchParams.get('orderId');
  const paymentMethod = searchParams.get('paymentMethod') || 'cod'; // Default to cod
  
  // Separate useEffect for cart clearing to prevent loops
  useEffect(() => {
    if (!hasCleared.current) {
      clearCart();
      hasCleared.current = true;
    }
  }, [clearCart]);
  
  // Other effects that don't cause loops
  useEffect(() => {
    // Start animation
    setIsAnimating(true);
    
    // Check authentication
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/account/orders');
    }
    
    // Remove any loading overlay from previous page
    const loadingOverlay = document.querySelector('div[class*="fixed inset-0 bg-white z-50"]');
    if (loadingOverlay && loadingOverlay.parentNode) {
      loadingOverlay.parentNode.removeChild(loadingOverlay);
    }

    // Set session storage flag if we have an order ID
    if (orderId) {
      sessionStorage.setItem('payment_completed', 'true');
      sessionStorage.setItem('payment_order_id', orderId);
    }

    // Add logging to help debug
    console.log('Order success page mounted with params:', { 
      orderId, 
      paymentMethod,
      hasQueryParams: searchParams.toString().length > 0 
    });
  }, [status, router, orderId, paymentMethod, searchParams]);

  const handleRedirect = () => {
    // Redirect to order details if we have an orderId
    if (orderId) {
      router.push(`/account/orders/${orderId}`);
    } else {
    router.push('/account/orders');
    }
  };

  // Function to get payment method display name
  const getPaymentMethodName = () => {
    switch (paymentMethod) {
      case 'cod':
        return 'Cash on Delivery';
      case 'midtrans':
        return 'Midtrans';
      case 'credit_card':
        return 'Credit Card';
      default:
        return 'Cash on Delivery';
    }
  };
  
  return (
    <div className="min-h-screen pt-16 pb-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center min-h-[80vh] justify-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <motion.svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-12 w-12 text-green-600" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.2, duration: 0.8, ease: "easeInOut" }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </motion.svg>
        </motion.div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-4xl font-monument mb-4">Order Successful!</h1>
          <p className="text-neutral-600 text-lg mb-2">
            Thank you for your purchase.
          </p>
          {orderId && (
            <p className="text-neutral-600 mb-4">
              Order ID: <span className="font-medium">{orderId}</span>
            </p>
          )}
          <p className="text-neutral-600 mb-8">
            Payment Method: <span className="font-medium">{getPaymentMethodName()}</span>
          </p>
          
          <div className="mt-8">
            <button 
              onClick={handleRedirect}
              className="px-12 py-4 bg-neutral-900 text-white text-lg font-medium hover:bg-neutral-800 transition-colors rounded-sm"
            >
              Okay
            </button>
          </div>
          
          <div className="mt-6">
            <Link 
              href="/shop" 
              className="text-neutral-600 underline hover:text-neutral-900"
            >
              Continue Shopping
            </Link>
          </div>
        </motion.div>
        
        {/* Payment-specific information */}
        {paymentMethod === 'midtrans' && (
          <motion.div 
            className="w-full max-w-md mx-auto mt-8 p-6 bg-blue-50 border border-blue-100 rounded-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <h2 className="text-lg font-medium mb-3 text-blue-900">Midtrans Payment Information</h2>
            <p className="text-blue-800 mb-4">
              Your payment has been processed successfully. You can view your order details in your account.
            </p>
            <Link 
              href={orderId ? `/account/orders/${orderId}` : "/account/orders"}
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              View Order Details
            </Link>
          </motion.div>
        )}
        
        {paymentMethod === 'cod' && (
          <motion.div 
            className="w-full max-w-md mx-auto mt-8 p-6 bg-blue-50 border border-blue-100 rounded-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <h2 className="text-lg font-medium mb-3 text-blue-900">Cash on Delivery Information</h2>
            <ul className="text-left text-blue-800 space-y-2">
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Please prepare the exact amount for a smooth delivery experience.</span>
              </li>
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Our delivery personnel will verify your order before collecting payment.</span>
              </li>
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
                <span>You'll receive a receipt after payment is complete.</span>
              </li>
            </ul>
          </motion.div>
        )}
        
        <motion.div 
          className="w-full max-w-md mx-auto mt-12 p-6 border border-neutral-100 rounded-md shadow-sm"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <h2 className="text-lg font-medium mb-3">What happens next?</h2>
          <ul className="text-left space-y-3">
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-neutral-100 rounded-full mr-3 mt-0.5 text-xs font-medium">1</span>
              <span>You will receive an order confirmation email shortly.</span>
            </li>
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-neutral-100 rounded-full mr-3 mt-0.5 text-xs font-medium">2</span>
              <span>Our team will prepare your order for shipment.</span>
            </li>
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-neutral-100 rounded-full mr-3 mt-0.5 text-xs font-medium">3</span>
              <span>You'll receive tracking information once your order ships.</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
} 