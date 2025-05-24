'use client';

import { useCart } from '../../../contexts/CartContext';
import { formatRupiah } from '../../../lib/utils/format';
import MidtransPayment from './MidtransPayment';
import { useState } from 'react';

interface ShippingInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  province: string;
  country: string;
}

interface PaymentInfo {
  cardNumber: string;
  cardholderName: string;
  expiryDate: string;
  cvv: string;
  paymentMethod: string;
}

interface OrderReviewProps {
  shippingInfo: ShippingInfo;
  paymentInfo: PaymentInfo;
  shippingMethod: string;
  onSubmit: () => void;
  onBack: () => void;
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export default function OrderReview({
  shippingInfo,
  paymentInfo,
  shippingMethod,
  onSubmit,
  onBack,
  isLoading,
  error,
  onRetry
}: OrderReviewProps) {
  const { cartItems } = useCart();
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [midtransError, setMidtransError] = useState<string | null>(null);
  
  // Initialize Midtrans payment handler
  const midtransPayment = MidtransPayment({
    orderId: '', // Will be set if/when order is created
    amount: cartItems.reduce((total, item) => total + (parseFloat(item.product.price) * item.quantity), 0),
    items: cartItems.map(item => ({
      id: item.id,
      name: item.product.name,
      price: parseFloat(item.product.price),
      quantity: item.quantity
    })),
    shippingAddress: shippingInfo,
    customerEmail: shippingInfo.email,
    onPaymentSuccess: (result: Record<string, any>) => {
      console.log('Payment successful:', result);
      window.location.href = `/checkout/success?orderId=${result.order_id}&paymentMethod=midtrans`;
    },
    onPaymentError: (result: Record<string, any>) => {
      console.error('Payment failed:', result);
      setMidtransError('Payment failed. Please try again.');
      setPaymentProcessing(false);
    },
    onPaymentPending: (result: Record<string, any>) => {
      console.log('Payment pending:', result);
      window.location.href = `/account/orders`;
    }
  });
  
  // Get readable shipping method name
  const getShippingMethodName = () => {
    switch (shippingMethod) {
      case 'express':
        return 'Express Shipping (1-2 business days)';
      case 'standard':
        return 'Standard Shipping (3-5 business days)';
      case 'economy':
        return 'Economy Shipping (5-7 business days)';
      default:
        return 'Standard Shipping';
    }
  };
  
  // Get readable payment method name
  const getPaymentMethodName = () => {
    switch (paymentInfo.paymentMethod) {
      case 'cod':
        return 'Cash on Delivery';
      case 'midtrans':
        return 'Midtrans Payment';
      case 'credit_card':
        return 'Credit Card';
      default:
        return 'Unknown Payment Method';
    }
  };
  
  // Mask credit card number
  const maskCardNumber = (cardNumber: string) => {
    const last4 = cardNumber.replace(/\D/g, '').slice(-4);
    return `•••• •••• •••• ${last4}`;
  };

  // Handle order submission
  const handleOrderSubmit = async () => {
    if (paymentProcessing) return;
    
    setMidtransError(null);
    
    if (paymentInfo.paymentMethod === 'midtrans') {
      setPaymentProcessing(true);
      
      try {
        // First create the order through the regular submission flow
        await onSubmit();
        
        // The parent component (checkout/page.tsx) will handle the Midtrans payment initialization
        // after the order is created. We don't need to do anything else here.
      } catch (err) {
        console.error('Error submitting order:', err);
        setMidtransError(err instanceof Error ? err.message : 'Error placing order');
        setPaymentProcessing(false);
      }
    } else {
      // Use regular submission for non-Midtrans methods
      onSubmit();
    }
  };

  return (
    <div className="bg-white p-6 border border-neutral-200 rounded">
      <h2 className="text-xl font-semibold mb-6">Review Your Order</h2>
      
      {(error || midtransError) && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
          <p className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error || midtransError}
          </p>
          
          {paymentInfo.paymentMethod === 'midtrans' && onRetry && (
            <button 
              onClick={onRetry}
              className="mt-3 bg-red-600 text-white px-4 py-2 text-sm rounded hover:bg-red-700 transition-colors"
            >
              Retry Payment
            </button>
          )}
        </div>
      )}
      
      <div className="space-y-8">
        {/* Order Items Summary */}
        <div>
          <h3 className="text-sm uppercase tracking-wider text-neutral-500 mb-4">Items ({cartItems.length})</h3>
          <div className="space-y-4 max-h-60 overflow-y-auto">
            {cartItems.map(item => (
              <div key={item.id} className="flex items-center gap-4 border-b border-neutral-200 pb-4">
                <div className="w-16 h-16 bg-neutral-100 relative flex-shrink-0">
                  {item.product.images[0] && (
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="object-cover w-full h-full"
                    />
                  )}
                </div>
                
                <div className="flex-grow">
                  <h4 className="text-sm font-medium">{item.product.name}</h4>
                  <div className="text-xs text-neutral-500 mt-1">
                    <p>Quantity: {item.quantity}</p>
                    {item.selectedColor && <p>Color: {item.selectedColor}</p>}
                    {item.selectedSize && <p>Size: {item.selectedSize}</p>}
                  </div>
                </div>
                
                <div className="text-sm font-medium">
                  {formatRupiah(parseFloat(item.product.price) * item.quantity)}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Shipping Information */}
        <div>
          <h3 className="text-sm uppercase tracking-wider text-neutral-500 mb-3">Shipping Information</h3>
          <div className="text-sm">
            <p className="font-medium">{shippingInfo.fullName}</p>
            <p className="text-neutral-600 mt-1">{shippingInfo.address}</p>
            <p className="text-neutral-600">
              {shippingInfo.city}, {shippingInfo.province}, {shippingInfo.postalCode}
            </p>
            <p className="text-neutral-600">{shippingInfo.country}</p>
            <p className="text-neutral-600 mt-2">{shippingInfo.phone}</p>
            <p className="text-neutral-600">{shippingInfo.email}</p>
          </div>
          <div className="mt-2">
            <p className="text-sm">
              <span className="font-medium">Shipping Method: </span>
              <span className="text-neutral-600">{getShippingMethodName()}</span>
            </p>
          </div>
        </div>
        
        {/* Payment Information */}
        <div>
          <h3 className="text-sm uppercase tracking-wider text-neutral-500 mb-3">Payment Information</h3>
          <div className="text-sm">
            <p>
              <span className="font-medium">Payment Method: </span>
              <span className="text-neutral-600">{getPaymentMethodName()}</span>
            </p>
            
            {paymentInfo.paymentMethod === 'credit_card' && (
              <>
                <p className="mt-2">
                  <span className="font-medium">Card: </span>
                  <span className="text-neutral-600">{maskCardNumber(paymentInfo.cardNumber)}</span>
                </p>
                <p>
                  <span className="font-medium">Name on Card: </span>
                  <span className="text-neutral-600">{paymentInfo.cardholderName}</span>
                </p>
                <p>
                  <span className="font-medium">Expiry Date: </span>
                  <span className="text-neutral-600">{paymentInfo.expiryDate}</span>
                </p>
              </>
            )}
            
            {paymentInfo.paymentMethod === 'cod' && (
              <p className="mt-2 text-neutral-600">
                You will pay when your order is delivered.
              </p>
            )}
            
            {paymentInfo.paymentMethod === 'midtrans' && (
              <p className="mt-2 text-neutral-600">
                You will be redirected to complete payment after placing your order.
              </p>
            )}
          </div>
        </div>
        
                {/* Action buttons removed at user's request */}
      </div>
    </div>
  );
} 