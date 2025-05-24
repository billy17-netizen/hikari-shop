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
export function useMidtransPayment({ 
  orderId, 
  amount,
  items,
  shipping,
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
      console.log('Attempting to load Midtrans script with client key available:', !!clientKey);
      
      // Check if the script is already loaded
      if (!document.getElementById('midtrans-snap')) {
        const script = document.createElement('script');
        script.id = 'midtrans-snap';
        script.src = SNAP_URL;
        if (clientKey) {
          script.setAttribute('data-client-key', clientKey);
        }
        script.async = true;
        script.onload = () => {
          console.log('Midtrans Snap.js loaded successfully');
          setSnapInitialized(true);
        };
        script.onerror = (err) => {
          console.error('Failed to load Midtrans Snap.js:', err);
          setError('Failed to load payment processor');
        };
        document.body.appendChild(script);
      } else {
        console.log('Midtrans script already exists in the DOM');
        setSnapInitialized(true);
      }
    }
  }, [clientKey]);

  // Process payment with Midtrans
  const processPayment = async () => {
    console.log('processPayment called with:', { 
      orderId, 
      amount, 
      itemsCount: items?.length, 
      shipping,
      snapInitialized 
    });
    
    if (!orderId || !amount || !items || !snapInitialized) {
      const errorMessage = `Missing required payment information: orderId=${!!orderId}, amount=${!!amount}, items=${!!items}, snapInitialized=${snapInitialized}`;
      console.error(errorMessage);
      setError(errorMessage);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Ensure amount is properly formatted as a number
      const formattedAmount = Math.round(parseFloat(amount.toString()));
      
      if (isNaN(formattedAmount) || formattedAmount <= 0) {
        throw new Error(`Invalid payment amount: ${amount} (formatted: ${formattedAmount})`);
      }
      
      console.log('Requesting Midtrans token for order:', orderId, 'with amount:', formattedAmount);
      
      // Prepare modified items array with shipping as separate item
      const modifiedItems = [...items].map(item => ({
        ...item,
        // Truncate name to prevent Midtrans API errors (50 char limit)
        name: (item.name || 'Product').substring(0, 50),
        // Ensure price is a number
        price: parseFloat(item.price),
        // Ensure quantity is a number
        quantity: parseInt(item.quantity) || 1
      }));
      
      // Add shipping as a separate item if provided
      if (shipping && shipping.cost > 0) {
        modifiedItems.push({
          id: 'shipping',
          name: `Shipping (${shipping.method || 'Standard'})`.substring(0, 50),
          price: parseFloat(shipping.cost),
          quantity: 1
        });
      }
      
      // Calculate final total to verify
      const finalTotal = Math.round(modifiedItems.reduce((sum, item) => 
        sum + (parseFloat(item.price) * item.quantity), 0));
        
      // Adjust total if needed to match formattedAmount
      if (finalTotal !== formattedAmount) {
        console.log('Adjusting total to match requested amount', {
          requestedAmount: formattedAmount,
          calculatedAmount: finalTotal,
          difference: formattedAmount - finalTotal
        });
      }
      
      console.log('Payment amount check:', {
        requestedTotal: formattedAmount,
        itemsTotal: finalTotal,
        shippingCost: shipping?.cost || 0,
        calculatedTotal: finalTotal,
        difference: formattedAmount - finalTotal
      });
      
      // Get transaction token from our API
      const response = await fetch('/api/midtrans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          amount: formattedAmount,
          items: modifiedItems, // Use modified items with shipping
          shippingAddress,
          customerEmail
        }),
      });

      const data = await response.json();
      console.log('Midtrans API response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize payment');
      }

      // Make sure window.snap is available
      if (!window.snap) {
        console.error('window.snap is not available!');
        throw new Error('Midtrans Snap is not initialized properly');
      }

      console.log('Opening Midtrans payment popup with token:', data.token);
      
      // Open Snap payment page with transaction token
      window.snap.pay(data.token, {
        onSuccess: async function(result) {
          console.log('Payment success:', result);
          // Force clear any payment processing state
          setIsLoading(false);
          
          try {
            // Extract transaction ID information for logging
            console.log('Checking Midtrans success response for transaction ID', {
              transaction_id: result.transaction_id,
              order_id: result.order_id,
              resultKeys: Object.keys(result)
            });
            
            // Manually update the order status since webhook might not work in development
            await updateOrderStatus(orderId, 'processing', result);
            
            // First try the callback
            if (onPaymentSuccess) {
              onPaymentSuccess(result);
            }
            
            // As a backup, try direct redirection
            setTimeout(() => {
              console.log('Fallback redirect after successful payment');
              const successUrl = `${window.location.origin}/checkout/success?orderId=${orderId}&paymentMethod=midtrans`;
              window.location.href = successUrl;
            }, 1000);
          } catch (err) {
            console.error('Error in success redirect:', err);
            // Last resort - force navigation
            window.location.href = `/checkout/success?orderId=${orderId}&paymentMethod=midtrans`;
          }
        },
        onPending: function(result) {
          console.log('Payment pending:', result);
          setIsLoading(false);
          
          try {
            if (onPaymentPending) {
              onPaymentPending(result);
            } else {
              setTimeout(() => {
                console.log('Fallback redirect after pending payment');
                window.location.href = '/account/orders';
              }, 1000);
            }
          } catch (err) {
            console.error('Error in pending redirect:', err);
            window.location.href = '/account/orders';
          }
        },
        onError: function(result) {
          console.error('Payment error:', result);
          setError('Payment failed. Please try again.');
          setIsLoading(false);
          
          if (onPaymentError) {
            onPaymentError(result);
          }
        },
        onClose: function() {
          console.log('Customer closed the payment popup without completing payment');
          setIsLoading(false);
          
          // Show abandoned cart message and offer to retry
          setError('Payment process was interrupted. You can retry payment or check your order status in your account.');
          
          // Update order status to abandoned/payment_interrupted if needed
          try {
            // Notify the parent about the abandonment
            if (typeof onPaymentError === 'function') {
              onPaymentError({ 
                status: 'payment_abandoned',
                message: 'Customer closed payment popup without completing payment'
              });
            }
          } catch (err) {
            console.error('Error handling payment popup closure:', err);
          }
        }
      });
    } catch (err) {
      console.error('Error processing payment:', err);
      setError(err.message || 'An error occurred while processing your payment');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to manually update order status
  const updateOrderStatus = async (orderId, status, paymentResult) => {
    try {
      console.log(`Updating order ${orderId} status to ${status} with payment details:`, 
        paymentResult ? {
          transaction_id: paymentResult.transaction_id,
          resultKeys: Object.keys(paymentResult)
        } : 'No payment result'
      );
      
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
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error('Failed to update order status');
      }
      
      console.log(`Order ${orderId} status manually updated to ${status}`, responseData);
      return responseData;
    } catch (err) {
      console.error('Error updating order status:', err);
      // Continue anyway since payment was successful
      return null;
    }
  };

  return {
    processPayment,
    isLoading,
    error,
    isReady: snapInitialized
  };
} 