'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import MidtransPayment from './MidtransPayment';
import { formatRupiah } from '../../../lib/utils/format';

interface PaymentFormProps {
  initialValues: {
    cardNumber: string;
    cardholderName: string;
    expiryDate: string;
    cvv: string;
  };
  onSubmit: (values: {
    cardNumber: string;
    cardholderName: string;
    expiryDate: string;
    cvv: string;
    paymentMethod: string;
  }) => void;
  onBack: () => void;
  total: number;
}

export default function PaymentForm({ initialValues, onSubmit, onBack, total }: PaymentFormProps) {
  const [formValues, setFormValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<string>('cod');
  
  // Constants
  const COD_LIMIT = 5000000; // 5 million rupiah
  const isCodDisabled = total >= COD_LIMIT;
  
  // Auto-select Midtrans if COD is disabled
  useEffect(() => {
    if (isCodDisabled && paymentMethod === 'cod') {
      setPaymentMethod('midtrans');
    }
  }, [isCodDisabled]);
  
  // Add a ref so we can submit the form programmatically
  const formRef = useRef<HTMLFormElement>(null);
  
  // Initialize Midtrans payment handler
  // This will be used in Review step, not here directly
  const midtransHandler = MidtransPayment({
    orderId: '', // Will be set during checkout
    amount: 0, // Will be set during checkout
    items: [], // Will be set during checkout
    shippingAddress: null,
    customerEmail: '',
    onPaymentSuccess: (result: Record<string, any>) => {
      console.log('Payment successful:', result);
    },
    onPaymentError: (result: Record<string, any>) => {
      console.error('Payment failed:', result);
    },
    onPaymentPending: (result: Record<string, any>) => {
      console.log('Payment pending:', result);
    }
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // No credit card validation needed as that option has been removed
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({ ...formValues, paymentMethod });
    }
  };

  // Error message from Midtrans
  if (midtransHandler.error) {
    console.error('Midtrans error:', midtransHandler.error);
  }
  
  return (
    <div className="bg-white p-6 border border-neutral-200 rounded">
      <h2 className="text-xl font-semibold mb-6">Payment Method</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6" ref={formRef}>
        <p className="text-sm text-neutral-500 mb-4">All transactions are secure and encrypted.</p>
        
        {/* Payment Method Selection */}
        <div className="space-y-4">
          <p className="font-medium text-sm">Select Payment Method</p>
          
          <div className="grid grid-cols-1 gap-3">
            {/* COD Option - Disabled for orders over 5M IDR */}
            <label className={`relative border rounded p-4 ${
              isCodDisabled 
                ? 'bg-neutral-100 opacity-60 cursor-not-allowed' 
                : 'cursor-pointer hover:border-neutral-400'
              } transition-colors`}>
              <input
                type="radio"
                name="paymentMethod"
                value="cod"
                checked={paymentMethod === 'cod'}
                onChange={() => !isCodDisabled && setPaymentMethod('cod')}
                className="absolute top-4 right-4"
                disabled={isCodDisabled}
              />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center bg-neutral-100 rounded">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 8H7c-1.1 0-2 .9-2 2v7h14v-7c0-1.1-.9-2-2-2z" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 6V4m5 10h2m-2 4h2m-12 0H5m2-4H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Cash on Delivery</p>
                  <p className="text-sm text-neutral-500">Pay when your order arrives</p>
                </div>
              </div>
            </label>
            
            {/* Midtrans Option */}
            <label className="relative border rounded p-4 cursor-pointer hover:border-neutral-400 transition-colors">
              <input
                type="radio"
                name="paymentMethod"
                value="midtrans"
                checked={paymentMethod === 'midtrans'}
                onChange={() => setPaymentMethod('midtrans')}
                className="absolute top-4 right-4"
              />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center bg-neutral-100 rounded">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 7v10c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2z" stroke="currentColor" strokeWidth="2" />
                    <path d="M3 10h18M7 15h.01M12 15h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Midtrans Payment</p>
                  <p className="text-sm text-neutral-500">Pay securely with multiple payment options</p>
                </div>
              </div>
            </label>
          </div>
        </div>
        
        {/* Midtrans Information - Only show if Midtrans is selected */}
        {paymentMethod === 'midtrans' && (
          <div className="space-y-4 mt-6 pt-6 border-t border-neutral-200">
            <h3 className="font-medium">Midtrans Payment</h3>
            <p className="text-sm text-neutral-600">
              You will be redirected to Midtrans secure payment page after reviewing your order.
              Various payment methods including bank transfer, e-wallet, and more will be available.
            </p>
            <div className="mt-4 flex flex-wrap gap-4">
              {/* Bank/E-wallet logos as SVG components instead of img tags */}
              <div className="relative h-8 w-16">
                <svg viewBox="0 0 120 40" className="h-8" xmlns="http://www.w3.org/2000/svg">
                  <rect width="120" height="40" fill="#0060AF" />
                  <path d="M24 10h72v20H24z" fill="#FFF" />
                  <path d="M35 15h10v3H35zm0 7h10v3H35zm15-7h20v3H50zm0 7h15v3H50z" fill="#0060AF" />
                </svg>
                <span className="sr-only">BCA</span>
              </div>
              <div className="relative h-8 w-16">
                <svg viewBox="0 0 120 40" className="h-8" xmlns="http://www.w3.org/2000/svg">
                  <rect width="120" height="40" fill="#003366" />
                  <path d="M20 10h80v20H20z" fill="#FFF" />
                  <path d="M25 15h20v10H25z" fill="#003366" />
                  <path d="M50 15h45v3H50zm0 7h45v3H50z" fill="#003366" />
                </svg>
                <span className="sr-only">Mandiri</span>
              </div>
              <div className="relative h-8 w-16">
                <svg viewBox="0 0 120 40" className="h-8" xmlns="http://www.w3.org/2000/svg">
                  <rect width="120" height="40" fill="#F15A22" />
                  <path d="M30 10h60v20H30z" fill="#FFF" />
                  <path d="M35 15h15v10H35zm25 0h25v3H60zm0 7h25v3H60z" fill="#F15A22" />
                </svg>
                <span className="sr-only">BNI</span>
              </div>
              <div className="relative h-8 w-16">
                <svg viewBox="0 0 120 40" className="h-8" xmlns="http://www.w3.org/2000/svg">
                  <rect width="120" height="40" fill="#00A0E9" />
                  <circle cx="60" cy="20" r="15" fill="#FFF" />
                  <path d="M50 20l5 5 15-15" stroke="#00A0E9" strokeWidth="3" fill="none" />
                </svg>
                <span className="sr-only">GoPay</span>
              </div>
              <div className="relative h-8 w-16">
                <svg viewBox="0 0 120 40" className="h-8" xmlns="http://www.w3.org/2000/svg">
                  <rect width="120" height="40" fill="#4C2E92" />
                  <path d="M40 15a10 10 0 100 10h40a10 10 0 100-10z" fill="#FFF" />
                  <path d="M60 15a10 10 0 100 10 10 10 0 000-10z" fill="#4C2E92" />
                </svg>
                <span className="sr-only">OVO</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Cash on Delivery Information - Only show if COD is selected */}
        {paymentMethod === 'cod' && (
          <div className="space-y-4 mt-6 pt-6 border-t border-neutral-200">
            <h3 className="font-medium">Cash on Delivery</h3>
            <p className="text-sm text-neutral-600">
              Pay with cash when your order is delivered. Our delivery person will collect the payment.
              Please prepare the exact amount.
            </p>
            <div className="bg-amber-50 p-4 rounded text-sm text-amber-800 mt-2">
              <div className="flex items-start">
                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <strong>Note:</strong> Cash on Delivery is only available for orders under {formatRupiah(COD_LIMIT)}. For higher value orders, please use online payment methods.
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* COD limit warning - Show when COD is disabled */}
        {isCodDisabled && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded text-sm text-yellow-800 mt-2">
            <div className="flex items-start">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <strong>Cash on Delivery unavailable:</strong> Your order total of {formatRupiah(total)} exceeds the {formatRupiah(COD_LIMIT)} limit for Cash on Delivery. Please use Midtrans payment instead.
              </div>
            </div>
          </div>
        )}
      </form>
      
      <div className="mt-6 flex justify-center">
        <div className="flex items-center text-sm text-neutral-500">
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-8v2h2v-2h-2zm0-8v6h2V6h-2z" fill="currentColor"/>
          </svg>
          <span>This is a test environment. No actual payments will be processed.</span>
        </div>
      </div>
    </div>
  );
} 