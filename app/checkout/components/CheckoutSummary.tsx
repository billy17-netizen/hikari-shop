'use client';

import { CartItem } from '../../../contexts/CartContext';
import { formatRupiah } from '../../../lib/utils/format';

interface CheckoutSummaryProps {
  cartItems: CartItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  shippingMethod: string;
  onContinue?: () => void;
  onBack?: () => void;
  showContinueButton?: boolean;
  showBackButton?: boolean;
  buttonText?: string;
}

export default function CheckoutSummary({
  cartItems,
  subtotal,
  shippingCost,
  total,
  shippingMethod,
  onContinue,
  onBack,
  showContinueButton = false,
  showBackButton = false,
  buttonText = "Continue to Payment"
}: CheckoutSummaryProps) {
  // Get shipping method text
  const getShippingMethodText = () => {
    switch (shippingMethod) {
      case 'express':
        return 'Express';
      case 'standard':
        return 'Standard';
      case 'economy':
        return 'Economy';
      default:
        return 'Standard';
    }
  };
  
  return (
    <div className="bg-neutral-50 p-6 border border-neutral-200 sticky top-8">
      <h2 className="font-monument text-lg mb-6">Order Summary</h2>
      
      {/* Items count */}
      <div className="text-sm mb-4">
        {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
      </div>
      
      {/* Items list - collapsed */}
      <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
        {cartItems.map(item => (
          <div key={item.id} className="flex justify-between text-sm">
            <div className="flex-1">
              <span className="font-medium">{item.product.name}</span>
              <span className="text-neutral-500 ml-2">x {item.quantity}</span>
            </div>
            <div className="text-right">
              {formatRupiah(parseFloat(item.product.price) * item.quantity)}
            </div>
          </div>
        ))}
      </div>
      
      {/* Price breakdown */}
      <div className="space-y-3 py-4 border-t border-b border-neutral-200">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{formatRupiah(subtotal)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span>Shipping ({getShippingMethodText()})</span>
          <span>{formatRupiah(shippingCost)}</span>
        </div>
      </div>
      
      {/* Total */}
      <div className="flex justify-between py-4 font-medium">
        <span>Total</span>
        <span className="text-lg">{formatRupiah(total)}</span>
      </div>
      
      {/* Info text */}
      <div className="mt-4 text-xs text-neutral-500">
        <p>Taxes included. Shipping calculated at next step.</p>
      </div>
      
      {/* Terms and Conditions */}
      <div className="mt-4 text-xs text-neutral-500 border-t border-neutral-200 pt-4">
        <p>
          By placing your order, you agree to the Hikari Shop{' '}
          <a href="#" className="underline">Terms of Service</a> and{' '}
          <a href="#" className="underline">Privacy Policy</a>.
        </p>
      </div>
      
      {/* Continue button */}
      {(showContinueButton || showBackButton) && (
        <div className="mt-6 space-y-3">
          {showBackButton && onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-full py-3 border border-neutral-300 text-neutral-700 text-sm uppercase tracking-wider hover:bg-neutral-50 transition-colors"
            >
              Back
            </button>
          )}
          
          {showContinueButton && onContinue && (
            <button
              type="button"
              onClick={onContinue}
              className="w-full bg-neutral-900 text-white py-3 rounded hover:bg-neutral-800 transition-colors"
            >
              {buttonText}
            </button>
          )}
        </div>
      )}
    </div>
  );
} 