'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SNAP_URL } from '@/app/api/midtrans/config';

/**
 * useMidtransPayment hook
 * 
 * Custom React hook for integrating Midtrans Snap payment processing.
 * Loads the Snap.js script, initializes the Snap instance,
 * and provides a function to open the payment popup.
 */
export default function useMidtransPayment({ 
  orderId, 
  amount,
  items,
  shippingAddress,
  customerEmail,
  onPaymentSuccess,
  onPaymentError,
  onPaymentPending
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snapInitialized, setSnapInitialized] = useState(false);
  
  // Get the client key from environment variables
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

  // Load Midtrans Snap.js script
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if the script is already loaded
      if (!document.getElementById('midtrans-snap')) {
        const script = document.createElement('script');
        script.id = 'midtrans-snap';
        script.src = SNAP_URL;
        script.setAttribute('data-client-key', clientKey);
        script.async = true;
        script.onload = () => {
          console.log('Midtrans Snap.js loaded');
          setSnapInitialized(true);
        };
        script.onerror = () => {
          console.error('Failed to load Midtrans Snap.js');
          setError('Failed to load payment processor');
        };
        document.body.appendChild(script);
      } else {
        setSnapInitialized(true);
      }
    }
  }, [clientKey]);

  // Process payment with Midtrans
  const processPayment = async () => {
    if (!orderId || !amount || !items || !snapInitialized) {
      setError('Missing required payment information');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Ensure amount is properly formatted as a number
      const formattedAmount = Math.round(parseFloat(amount.toString()));
      
      if (isNaN(formattedAmount) || formattedAmount <= 0) {
        throw new Error('Invalid payment amount');
      }
      
      // Get transaction token from our API
      const response = await fetch('/api/midtrans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          amount: formattedAmount,
          items,
          shippingAddress,
          customerEmail
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize payment');
      }

      // Open Snap payment page with transaction token
      window.snap.pay(data.token, {
        onSuccess: function(result) {
          console.log('Payment success:', result);
          if (onPaymentSuccess) {
            onPaymentSuccess(result);
          } else {
            router.push(`/checkout/success?orderId=${orderId}&paymentMethod=midtrans`);
          }
        },
        onPending: function(result) {
          console.log('Payment pending:', result);
          if (onPaymentPending) {
            onPaymentPending(result);
          } else {
            router.push('/account/orders');
          }
        },
        onError: function(result) {
          console.error('Payment error:', result);
          setError('Payment failed. Please try again.');
          if (onPaymentError) {
            onPaymentError(result);
          }
        },
        onClose: function() {
          console.log('Customer closed the payment popup without completing payment');
        }
      });
    } catch (err) {
      console.error('Error processing payment:', err);
      setError(err.message || 'An error occurred while processing your payment');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    processPayment,
    isLoading,
    error,
    isReady: snapInitialized
  };
} 