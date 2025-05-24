'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCart } from '../../contexts/CartContext';
import { PaymentForm, OrderReview, CheckoutSummary } from './components';
import ShippingForm, { ShippingInfo } from './components/ShippingForm';
import { useMidtransPayment } from './hooks/useMidtransPayment';

// Define payment info type
interface PaymentInfo {
  cardNumber: string;
  cardholderName: string;
  expiryDate: string;
  cvv: string;
  paymentMethod: string;
}

// Checkout steps
const STEPS = {
  SHIPPING: 'shipping',
  PAYMENT: 'payment',
  REVIEW: 'review',
};

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { cartItems, totalPrice, clearCart } = useCart();
  const [currentStep, setCurrentStep] = useState(STEPS.SHIPPING);
  const [isLoading, setIsLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [showMidtransLoading, setShowMidtransLoading] = useState(false);
  
  // Form state
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    fullName: session?.user?.name || '',
    email: session?.user?.email || '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    province: '',
    country: 'Indonesia'
  });
  
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: '',
    paymentMethod: 'cod',
  });
  
  const [shippingMethod, setShippingMethod] = useState('standard');
  
  // Add this near the top of the file where other states are defined
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  
  // Add state to track if order was submitted
  const orderSubmitted = useRef(false);
  
  // Add ShippingForm ref to access its methods
  const shippingFormRef = useRef<{ isFormValid: () => boolean } | null>(null);
  
  // Reference to Midtrans payment handler
  const [midtransOrderId, setMidtransOrderId] = useState<string | null>(null);
  const midtransPaymentRef = useRef<any>(null);
  
  // Add state for Midtrans payment parameters
  const [midtransPaymentParams, setMidtransPaymentParams] = useState<{
    orderId: string;
    amount: number;
    shouldProcessPayment: boolean;
  } | null>(null);
  
  // Calculate shipping cost based on method
  const getShippingCost = () => {
    switch (shippingMethod) {
      case 'express':
        return 50000; // 50k IDR
      case 'standard':
        return 25000; // 25k IDR
      case 'economy':
        return 15000; // 15k IDR
      default:
        return 25000;
    }
  };
  
  // Calculate totals
  const subtotal = totalPrice;
  const shippingCost = getShippingCost();
  const orderTotal = subtotal + shippingCost;
  
  // Replace the conditional hook call with an unconditional one
  const midtransPayment = useMidtransPayment({
    orderId: midtransPaymentParams?.orderId || '',
    amount: midtransPaymentParams?.amount || 0,
    items: cartItems.map(item => ({
      id: item.id,
      name: item.product.name,
      price: parseFloat(item.product.price),
      quantity: item.quantity
    })),
    shipping: {
      cost: shippingCost,
      method: shippingMethod
    },
    shippingAddress: shippingInfo,
    customerEmail: shippingInfo.email || '',
    onPaymentSuccess: (result: Record<string, any>) => {
      console.log('Payment success callback received:', result);
      setShowMidtransLoading(false);
      setIsLoading(false);
      
      if (midtransPaymentParams?.orderId) {
        // Set order submitted flag
        orderSubmitted.current = true;
        
        // Update the order with Midtrans transaction ID
        // Extract transaction ID from different possible locations in the result object
        const transactionId = result.transaction_id || 
                              result.transaction_status && result.order_id || 
                              result.transaction_time && `midtrans_${Date.now()}`;
        
        console.log('Updating order with payment ID:', {
          orderId: midtransPaymentParams.orderId,
          transactionId,
          resultKeys: Object.keys(result)
        });
        
        fetch(`/api/orders/${midtransPaymentParams.orderId}/update-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentId: transactionId,
            status: 'processing',
            rawResponse: JSON.stringify(result) // Store the full response for debugging
          }),
        })
        .then(response => response.json())
        .then(data => console.log('Payment ID update response:', data))
        .catch(err => console.error('Error updating payment ID:', err));
        
        // Clear cart
        clearCart();
        
        // Try both router push and direct navigation
        try {
          router.push(`/checkout/success?orderId=${midtransPaymentParams.orderId}&paymentMethod=midtrans`);
        } catch (err) {
          console.error('Router push failed:', err);
          // Fallback to direct navigation
          window.location.href = `/checkout/success?orderId=${midtransPaymentParams.orderId}&paymentMethod=midtrans`;
        }
      }
    },
    onPaymentError: (result: Record<string, any>) => {
      console.error('Midtrans payment error:', result);
      setShowMidtransLoading(false);
      
      // Check if this is an abandonment error
      if (result.status === 'payment_abandoned') {
        setOrderError('Payment process was interrupted. You can retry the payment or view your order in your account.');
      } else {
        setOrderError('Payment failed. Please try again or choose another payment method.');
      }
      
      setIsLoading(false);
    },
    onPaymentPending: (result: Record<string, any>) => {
      console.log('Midtrans payment pending:', result);
      setShowMidtransLoading(false);
      clearCart();
      router.push(`/account/orders`);
    }
  });

  // Process payment when parameters change and handle Midtrans popup
  useEffect(() => {
    if (midtransPaymentParams?.shouldProcessPayment && midtransPayment.isReady) {
      console.log('Processing Midtrans payment with params:', midtransPaymentParams);
      
      // Add event listener to detect when Midtrans popup appears
      const checkMidtransPopup = setInterval(() => {
        const midtransFrame = document.querySelector('iframe[src*="midtrans"]');
        if (midtransFrame) {
          console.log('Midtrans popup detected, hiding loading screen');
          setShowMidtransLoading(false);
          clearInterval(checkMidtransPopup);
        }
      }, 500); // Check every 500ms
      
      // Timeout to hide loading screen if popup doesn't appear within 10 seconds
      const loadingTimeout = setTimeout(() => {
        setShowMidtransLoading(false);
        clearInterval(checkMidtransPopup);
      }, 10000);
      
      midtransPayment.processPayment().catch((err: Error) => {
        console.error('Error processing Midtrans payment:', err);
        setOrderError(err instanceof Error ? err.message : 'Failed to initialize payment');
        setIsLoading(false);
        setShowMidtransLoading(false);
        clearInterval(checkMidtransPopup);
        clearTimeout(loadingTimeout);
      });
      
      // Reset flag after initiating payment
      setMidtransPaymentParams(prev => prev ? { ...prev, shouldProcessPayment: false } : null);
      
      // Set a flag to prevent cart emptying if just submitted an order
      orderSubmitted.current = true;
      
      // Cleanup interval and timeout
      return () => {
        clearInterval(checkMidtransPopup);
        clearTimeout(loadingTimeout);
      };
    }
  }, [midtransPaymentParams, midtransPayment]);
  
  // Add this useEffect to handle successful Midtrans payments
  useEffect(() => {
    // Check URL parameters to see if we're coming back from Midtrans with success
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const transactionStatus = urlParams.get('transaction_status');
      const orderId = urlParams.get('order_id');
      
      if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
        console.log('Detected successful payment from URL params');
        // Clear cart and redirect to success page
        clearCart();
        router.replace(`/checkout/success?orderId=${orderId}&paymentMethod=midtrans`);
      }
    }
  }, [router, clearCart]);
  
  // Add this useEffect to fetch addresses
  useEffect(() => {
    if (session?.user) {
      fetchSavedAddresses();
    }
  }, [session]);
  
  // Add the selectedAddressId state to track which address is selected
  useEffect(() => {
    const handleAddressSelect = (addressId: string) => {
      setSelectedAddressId(addressId);
    };
    
    if (savedAddresses.length > 0 && !selectedAddressId) {
      const defaultAddress = savedAddresses.find((addr: any) => addr.isDefault);
      if (defaultAddress) {
        handleAddressSelect(defaultAddress.id);
      }
    }
  }, [savedAddresses, selectedAddressId]);
  
  // Add a refresh function to update the addresses list
  const refreshAddressList = async () => {
    await fetchSavedAddresses();
  };
  
  // Function to fetch saved addresses
  const fetchSavedAddresses = async () => {
    if (!session?.user) return;
    
    try {
      setLoadingAddresses(true);
      const response = await fetch('/api/addresses');
      
      if (response.ok) {
        const addresses = await response.json();
        setSavedAddresses(addresses);
        
        // If there's a default address and we're on the shipping step, pre-fill the form
        if (currentStep === STEPS.SHIPPING && !shippingInfo.address) {
          const defaultAddress = addresses.find((addr: any) => addr.isDefault);
          
          if (defaultAddress) {
            setShippingInfo(prev => ({
              ...prev,
              address: defaultAddress.address,
              city: defaultAddress.city,
              postalCode: defaultAddress.postalCode,
              province: defaultAddress.province,
              country: defaultAddress.country
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoadingAddresses(false);
    }
  };
  
  // Redirect if cart is empty - but only if not just submitted an order
  useEffect(() => {
    // Only redirect to cart if cart is empty AND we haven't just submitted an order
    if (cartItems.length === 0 && !orderSubmitted.current) {
      router.push('/cart');
    }
    
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/checkout');
    }
    
    // Pre-fill email from session if available
    if (session?.user?.email) {
      setShippingInfo(prev => ({
        ...prev,
        email: session.user.email || '',
      }));
    }
  }, [cartItems.length, router, status, session]);
  
  // Handle step navigation
  const goToNextStep = () => {
    if (currentStep === STEPS.SHIPPING) {
      setCurrentStep(STEPS.PAYMENT);
    } else if (currentStep === STEPS.PAYMENT) {
      setCurrentStep(STEPS.REVIEW);
    }
  };
  
  const goToPreviousStep = () => {
    if (currentStep === STEPS.PAYMENT) {
      setCurrentStep(STEPS.SHIPPING);
    } else if (currentStep === STEPS.REVIEW) {
      setCurrentStep(STEPS.PAYMENT);
    }
  };
  
  // Handle form submission
  const handleShippingSubmit = (data: ShippingInfo) => {
    setShippingInfo(data);
    goToNextStep();
  };
  
  const handlePaymentSubmit = (data: PaymentInfo) => {
    setPaymentInfo(data);
    goToNextStep();
  };
  
  // Handle placing the order
  const placeOrder = async () => {
    setIsLoading(true);
    setOrderError(null);
    
    // Add loading overlay for any payment
    if (paymentInfo.paymentMethod === 'midtrans') {
      setShowMidtransLoading(true);
    } else if (paymentInfo.paymentMethod === 'cod') {
      const overlay = document.createElement('div');
      overlay.className = "fixed inset-0 bg-white z-50 flex flex-col items-center justify-center";
      overlay.innerHTML = `
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mb-4"></div>
        <p class="text-neutral-600">Processing your order...</p>
      `;
      document.body.appendChild(overlay);
    }

    try {
      // Prepare order items
      const orderItems = cartItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: parseFloat(item.product.price),
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize
      }));

      // Create order data
      const orderData = {
        items: orderItems,
        shippingAddress: shippingInfo,
        paymentMethod: paymentInfo.paymentMethod,
        shippingMethod: shippingMethod,
        totals: {
          subtotal: subtotal,
          shipping: shippingCost,
          total: orderTotal
        },
        // Include credit card info only if credit card payment method is selected
        ...(paymentInfo.paymentMethod === 'credit_card' ? {
          cardNumber: paymentInfo.cardNumber,
          cardholderName: paymentInfo.cardholderName,
          expiryDate: paymentInfo.expiryDate,
          cvv: paymentInfo.cvv
        } : {})
      };

      console.log('Submitting order with data:', { ...orderData, items: `${orderData.items.length} items` });

      // Submit order to API
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to place order');
      }

      const data = await response.json();
      const orderId = data.id;
      
      console.log('Order created successfully:', data);
      
      // Special handling for Midtrans payment
      if (paymentInfo.paymentMethod === 'midtrans') {
        setMidtransOrderId(orderId);
        
        try {
          // Calculate total amount in the smallest currency unit
          const totalAmount = Math.round(orderTotal);
          
          if (isNaN(totalAmount) || totalAmount <= 0) {
            throw new Error('Invalid payment amount');
          }
          
          console.log('Setting up Midtrans payment for order:', orderId, 'with amount:', totalAmount);
          
          // Set parameters for Midtrans payment
          setMidtransPaymentParams({
            orderId,
            amount: totalAmount,
            shouldProcessPayment: true
          });
          
          // Don't redirect yet - payment needs to be completed
          return;
        } catch (err) {
          console.error('Midtrans setup error:', err);
          setOrderError(err instanceof Error ? err.message : 'Failed to initialize payment');
          setIsLoading(false);
        }
        
        return;
      }
      
      // For non-Midtrans payments, clear cart and redirect to success page
      clearCart();
      orderSubmitted.current = true;
      
      // For non-Midtrans payments, also update the paymentId
      if (paymentInfo.paymentMethod === 'cod') {
        // Generate a unique ID for COD payments
        const codPaymentId = `cod_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        
        console.log('Updating COD payment ID:', {
          orderId,
          paymentId: codPaymentId
        });
        
        // Update the payment ID in the database
        fetch(`/api/orders/${orderId}/update-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentId: codPaymentId,
            status: 'pending' // COD stays as pending until delivered
          }),
        })
        .then(response => response.json())
        .then(data => console.log('COD payment ID update response:', data))
        .catch(err => console.error('Error updating COD payment ID:', err));
      }
      
      // For COD payments, we need a small delay to ensure the order is processed
      if (paymentInfo.paymentMethod === 'cod') {
        setTimeout(() => {
          // Use window.location.href for more reliable navigation in case router.push fails
          try {
            console.log('Redirecting to success page for COD order:', orderId);
            window.location.href = `/checkout/success?orderId=${orderId}&paymentMethod=${paymentInfo.paymentMethod}`;
          } catch (navError) {
            console.error('Navigation error:', navError);
            // Fallback if that fails
            router.push(`/checkout/success?orderId=${orderId}&paymentMethod=${paymentInfo.paymentMethod}`);
          }
        }, 1500);
      } else {
        router.push(`/checkout/success?orderId=${orderId}&paymentMethod=${paymentInfo.paymentMethod}`);
      }
    } catch (err) {
      // Remove loading overlay if there's an error
      if (paymentInfo.paymentMethod === 'cod') {
        const overlay = document.querySelector('div[class*="fixed inset-0 bg-white z-50"]');
        if (overlay && overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }
      
      console.error('Error placing order:', err);
      setOrderError(err instanceof Error ? err.message : 'Failed to place order');
      setIsLoading(false);
    }
  };
  
  // Handle form submission with validation
  const handleContinueToPayment = () => {
    if (currentStep === STEPS.SHIPPING) {
      if (shippingFormRef.current?.isFormValid?.()) {
        handleShippingSubmit(shippingInfo);
      }
    } else if (currentStep === STEPS.PAYMENT) {
      // Find and submit the payment form manually
      const formElement = document.querySelector('form');
      if (formElement) {
        const event = new Event('submit', { bubbles: true, cancelable: true });
        formElement.dispatchEvent(event);
      }
    } else if (currentStep === STEPS.REVIEW) {
      placeOrder();
    }
  };
  
  // Add a retry payment function
  const retryMidtransPayment = async () => {
    if (!midtransOrderId) return;
    
    setIsLoading(true);
    setShowMidtransLoading(true);
    setOrderError(null);
    
    try {
      // Calculate total amount
      const totalAmount = Math.round(orderTotal);
      
      if (isNaN(totalAmount) || totalAmount <= 0) {
        throw new Error('Invalid payment amount');
      }
      
      console.log('Retrying Midtrans payment for order:', midtransOrderId);
      
      // Set parameters for Midtrans payment
      setMidtransPaymentParams({
        orderId: midtransOrderId,
        amount: totalAmount,
        shouldProcessPayment: true
      });
    } catch (err) {
      console.error('Error retrying payment:', err);
      setOrderError(err instanceof Error ? err.message : 'Failed to restart payment process');
      setIsLoading(false);
    }
  };
  
  // Add useEffect to ensure loading screen is removed on component unmount
  useEffect(() => {
    return () => {
      // Cleanup function to ensure loading screen is removed when component unmounts
      setShowMidtransLoading(false);
      setIsLoading(false);
    };
  }, []);
  
  // Show loading indicator while checking session
  if (status === 'loading') {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900"></div>
      </div>
    );
  }
  
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 pt-24 overflow-x-hidden">
      <h1 className="text-2xl md:text-3xl font-monument mb-2">Checkout</h1>
      <div className="h-px w-12 bg-neutral-300 mb-8"></div>
      
      {/* Checkout steps indicator */}
      <div className="flex justify-center mb-12">
        <div className="flex items-center">
          <div className={`flex flex-col items-center ${currentStep === STEPS.SHIPPING ? 'text-neutral-900' : 'text-neutral-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${currentStep === STEPS.SHIPPING ? 'bg-neutral-900 text-white border-neutral-900' : 'border-neutral-300'}`}>
              1
            </div>
            <span className="text-xs mt-1">Shipping</span>
          </div>
          <div className={`w-16 h-px ${currentStep !== STEPS.SHIPPING ? 'bg-neutral-900' : 'bg-neutral-300'}`}></div>
          
          <div className={`flex flex-col items-center ${currentStep === STEPS.PAYMENT ? 'text-neutral-900' : 'text-neutral-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${currentStep === STEPS.PAYMENT ? 'bg-neutral-900 text-white border-neutral-900' : currentStep === STEPS.REVIEW ? 'bg-neutral-900 text-white border-neutral-900' : 'border-neutral-300'}`}>
              2
            </div>
            <span className="text-xs mt-1">Payment</span>
          </div>
          <div className={`w-16 h-px ${currentStep === STEPS.REVIEW ? 'bg-neutral-900' : 'bg-neutral-300'}`}></div>
          
          <div className={`flex flex-col items-center ${currentStep === STEPS.REVIEW ? 'text-neutral-900' : 'text-neutral-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${currentStep === STEPS.REVIEW ? 'bg-neutral-900 text-white border-neutral-900' : 'border-neutral-300'}`}>
              3
            </div>
            <span className="text-xs mt-1">Review</span>
          </div>
        </div>
      </div>
      
      {/* Midtrans Loading Overlay */}
      {showMidtransLoading && (
        <div className="fixed inset-0 bg-white/90 z-50 flex flex-col items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center max-w-md w-full">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-neutral-900 mb-6"></div>
            <h3 className="text-xl font-medium mb-2">Processing Payment</h3>
            <p className="text-neutral-600 text-center mb-4">
              Please wait while we redirect you to the secure payment page...
            </p>
            <div className="flex flex-wrap gap-4 justify-center mt-2">
              <div className="h-6 w-12 bg-neutral-100 rounded flex items-center justify-center">
                <svg viewBox="0 0 120 40" className="h-4" xmlns="http://www.w3.org/2000/svg">
                  <rect width="120" height="40" fill="#0060AF" />
                  <path d="M24 10h72v20H24z" fill="#FFF" />
                  <path d="M35 15h10v3H35zm0 7h10v3H35zm15-7h20v3H50zm0 7h15v3H50z" fill="#0060AF" />
                </svg>
              </div>
              <div className="h-6 w-12 bg-neutral-100 rounded flex items-center justify-center">
                <svg viewBox="0 0 120 40" className="h-4" xmlns="http://www.w3.org/2000/svg">
                  <rect width="120" height="40" fill="#00A0E9" />
                  <circle cx="60" cy="20" r="15" fill="#FFF" />
                  <path d="M50 20l5 5 15-15" stroke="#00A0E9" strokeWidth="3" fill="none" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Main content */}
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
        <div className="lg:col-span-2 overflow-x-hidden">
          {currentStep === STEPS.SHIPPING && (
            <ShippingForm
              ref={shippingFormRef}
              formData={shippingInfo}
              onChange={setShippingInfo}
              onSubmit={handleShippingSubmit}
              savedAddresses={savedAddresses}
              loading={loadingAddresses}
              onAddressSelect={setSelectedAddressId}
              onAddressAdded={refreshAddressList}
            />
          )}
          
          {currentStep === STEPS.PAYMENT && (
            <PaymentForm
              initialValues={{
                cardNumber: paymentInfo.cardNumber,
                cardholderName: paymentInfo.cardholderName,
                expiryDate: paymentInfo.expiryDate,
                cvv: paymentInfo.cvv,
              }}
              onSubmit={handlePaymentSubmit}
              onBack={goToPreviousStep}
              total={orderTotal}
            />
          )}
          
          {currentStep === STEPS.REVIEW && (
            <OrderReview 
              shippingInfo={shippingInfo}
              paymentInfo={paymentInfo}
              shippingMethod={shippingMethod}
              onSubmit={placeOrder}
              onBack={goToPreviousStep}
              isLoading={isLoading}
              error={orderError}
              onRetry={retryMidtransPayment}
            />
          )}
        </div>
        
        <div className="lg:col-span-1">
          <CheckoutSummary 
            cartItems={cartItems}
            subtotal={subtotal}
            shippingCost={shippingCost}
            total={orderTotal}
            shippingMethod={shippingMethod}
            onContinue={handleContinueToPayment}
            onBack={goToPreviousStep}
            showContinueButton={true}
            showBackButton={currentStep !== STEPS.SHIPPING}
            buttonText={
              currentStep === STEPS.SHIPPING 
                ? "Continue to Payment" 
                : currentStep === STEPS.PAYMENT 
                  ? "Review Order" 
                  : "Place Order"
            }
          />
        </div>
      </div>
    </div>
  );
}