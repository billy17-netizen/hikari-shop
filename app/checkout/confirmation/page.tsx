'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useCart } from '../../../contexts/CartContext';
import Image from 'next/image';

// Define order interface
interface OrderItem {
  productId: number;
  quantity: number;
  price: number;
  selectedColor?: string | null;
  selectedSize?: string | null;
  product?: {
    name: string;
    images: string[];
    slug: string;
  };
}

interface OrderAddress {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  status: string;
  total: number;
  createdAt: string;
  updatedAt: string;
  paymentId?: string;
  paymentMethod: string;
  addressId?: string | null;
  address?: OrderAddress | null;
}

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { clearCart } = useCart();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get order ID from URL
  const orderId = searchParams.get('orderId');
  
  // Fetch order details from API
  useEffect(() => {
    if (!orderId) {
      router.push('/account/orders');
      return;
    }
    
    if (status === 'authenticated') {
      fetchOrderDetails();
    }
    
    // Clear the cart once we know we're on the confirmation page
    clearCart();
  }, [orderId, status]);
  
  // Fetch order details
  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/orders/${orderId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch order details');
      }
      
      const data = await response.json();
      setOrder(data);
    } catch (error: any) {
      console.error('Error fetching order:', error);
      setError(error.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };
  
  // Format currency with IDR
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900"></div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-16 px-4">
        <div className="p-6 bg-red-50 border border-red-200 rounded text-red-700 mb-6 max-w-md">
          <p className="flex items-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
          <div className="flex space-x-4">
            <button 
              onClick={() => fetchOrderDetails()}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Try Again
            </button>
            <Link 
              href="/account/orders" 
              className="px-4 py-2 border border-neutral-300 text-neutral-800 text-sm rounded hover:bg-neutral-50"
            >
              View Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // No order found
  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-16 px-4">
        <h1 className="text-2xl font-monument mb-4">Order Not Found</h1>
        <p className="text-neutral-600 mb-6">We couldn't find details for this order.</p>
        <Link 
          href="/account/orders" 
          className="px-5 py-2 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
        >
          View Your Orders
        </Link>
      </div>
    );
  }
  
  // Get readable payment method name
  const getPaymentMethodName = () => {
    switch (order.paymentMethod) {
      case 'cod':
        return 'Cash on Delivery';
      case 'midtrans':
        return 'Midtrans';
      case 'credit_card':
        return 'Credit Card';
      default:
        return order.paymentMethod;
    }
  };
  
  return (
    <div className="min-h-screen pt-16 pb-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-monument mb-4">Order Confirmed</h1>
          <p className="text-neutral-600">
            Thank you for your purchase. Your order has been confirmed.
          </p>
          <p className="text-neutral-600 mt-1">
            Order ID: <span className="font-medium">{order.id}</span>
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Order Details */}
          <div className="bg-neutral-50 p-6 rounded-sm">
            <h2 className="font-monument text-lg mb-4">Order Details</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm uppercase tracking-wider text-neutral-500 mb-1">Date</h3>
                <p>{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              
              <div>
                <h3 className="text-sm uppercase tracking-wider text-neutral-500 mb-1">Status</h3>
                <p className={`inline-block px-2 py-1 text-sm rounded-sm ${
                  order.status === 'success' || order.status === 'completed' || order.status === 'paid' 
                    ? 'bg-green-100 text-green-800 border border-green-200' : 
                  order.status === 'shipped' || order.status === 'processing'
                    ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                  order.status === 'pending' || order.status === 'awaiting_payment'
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                  order.status === 'cancelled' || order.status === 'failed'
                    ? 'bg-red-100 text-red-800 border border-red-200' :
                  'bg-neutral-100 text-neutral-800 border border-neutral-200'
                }`}>
                  {order.status === 'awaiting_payment' ? 'Pending Payment' : 
                   order.status === 'paid' ? 'Success' :
                   order.status === 'completed' ? 'Completed' :
                   order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm uppercase tracking-wider text-neutral-500 mb-1">Payment</h3>
                <p>{getPaymentMethodName()}</p>
              </div>
              
              <div>
                <h3 className="text-sm uppercase tracking-wider text-neutral-500 mb-1">Total</h3>
                <p className="font-medium">{formatCurrency(order.total)}</p>
              </div>
            </div>
          </div>
          
          {/* Shipping Information */}
          <div className="bg-neutral-50 p-6 rounded-sm">
            <h2 className="font-monument text-lg mb-4">Shipping Information</h2>
            
            {order.address ? (
              <div className="space-y-1">
                <p className="font-medium">{order.address.name}</p>
                <p>{order.address.phone}</p>
                <p>{order.address.address}</p>
                <p>
                  {order.address.city}, {order.address.province}, {order.address.postalCode}
                </p>
                <p>{order.address.country}</p>
              </div>
            ) : (
              <div className="text-neutral-600">No shipping address provided.</div>
            )}
          </div>
        </div>
        
        {/* Order Items */}
        <div className="bg-neutral-50 p-6 rounded-sm mb-8">
          <h2 className="font-monument text-lg mb-4">Order Items</h2>
          
          <div className="space-y-4">
            {order.items && Array.isArray(order.items) ? (
              order.items.map((item: OrderItem, index: number) => (
                <div key={index} className="flex items-start border-b border-neutral-200 pb-4 last:border-b-0 last:pb-0">
                  {/* Product Image */}
                  {item.product?.images && item.product.images.length > 0 ? (
                    <div className="w-16 h-16 bg-neutral-100 rounded-sm mr-3 relative flex-shrink-0 overflow-hidden">
                      <Image 
                        src={item.product.images[0]} 
                        alt={item.product?.name || `Product #${item.productId}`}
                        fill
                        sizes="64px"
                        className="object-cover object-center"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-neutral-100 rounded-sm mr-3 flex-shrink-0 flex items-center justify-center text-neutral-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <p className="font-medium">
                      {item.product?.name || `Product #${item.productId}`}
                    </p>
                    <div className="text-sm text-neutral-600 mt-1">
                      <p>Quantity: {item.quantity}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {item.selectedSize && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs bg-neutral-100">
                            Size: {item.selectedSize}
                          </span>
                        )}
                        {item.selectedColor && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs bg-neutral-100">
                            <span 
                              className="w-3 h-3 rounded-full mr-1" 
                              style={{ backgroundColor: item.selectedColor }}
                            ></span>
                            {item.selectedColor}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-neutral-600">No items in this order.</p>
            )}
          </div>
          
          <div className="border-t border-neutral-300 mt-6 pt-4 flex justify-between">
            <p className="font-medium">Total</p>
            <p className="font-medium">{formatCurrency(order.total)}</p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Link 
            href="/account/orders" 
            className="text-center px-6 py-3 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
          >
            View Your Orders
          </Link>
          <Link 
            href="/shop" 
            className="text-center px-6 py-3 border border-neutral-300 text-neutral-800 hover:bg-neutral-50 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
} 