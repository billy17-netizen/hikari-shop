'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface CustomerOrder {
  id: string;
  date: string;
  status: string;
  total: string;
  items: number;
  paymentMethod: string;
  shippingAddress: string;
}

interface Address {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface CustomerDetail {
  id: string;
  name: string;
  email: string;
  image: string | null;
  createdAt: string;
  orders: CustomerOrder[];
  addresses: Address[];
  orderCount: number;
  totalSpent: string;
  lastActive: string;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses'>('orders');
  
  useEffect(() => {
    async function fetchCustomerDetails() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/admin/customers/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Customer not found');
          } else {
            setError('Failed to fetch customer details');
          }
          return;
        }
        
        const data = await response.json();
        setCustomer(data);
      } catch (error) {
        console.error('Error fetching customer details:', error);
        setError('An error occurred while fetching customer details');
      } finally {
        setIsLoading(false);
      }
    }
    
    if (id) {
      fetchCustomerDetails();
    }
  }, [id]);
  
  // Helper function to get status badge color
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-8 w-8 text-neutral-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-neutral-500">Loading customer details...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-neutral-900 text-white rounded-sm"
        >
          Go Back
        </button>
      </div>
    );
  }
  
  if (!customer) {
    return null;
  }
  
  return (
    <div className="py-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-monument mb-2">Customer Details</h1>
          <p className="text-neutral-500">Manage customer information</p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-sm hover:bg-neutral-50"
        >
          Back to Customers
        </button>
      </div>
      
      {/* Customer Profile */}
      <div className="bg-white p-6 rounded-sm shadow-sm border border-neutral-200 mb-6">
        <div className="flex items-start sm:items-center flex-col sm:flex-row gap-6">
          <div className="flex-shrink-0 h-24 w-24 relative">
            {customer.image ? (
              <Image 
                src={customer.image} 
                alt={customer.name}
                width={96}
                height={96}
                className="rounded-full"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-neutral-200 flex items-center justify-center">
                <span className="text-2xl font-medium text-neutral-600">
                  {customer.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-medium">{customer.name}</h2>
                <p className="text-neutral-500">{customer.email}</p>
              </div>
              <div className="mt-2 sm:mt-0">
                <span className="text-sm text-neutral-500">Customer ID:</span>
                <span className="ml-1 text-sm bg-neutral-100 px-2 py-1 rounded">{customer.id}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <div className="text-sm text-neutral-500">Member Since</div>
                <div className="font-medium">{customer.createdAt}</div>
              </div>
              <div>
                <div className="text-sm text-neutral-500">Total Orders</div>
                <div className="font-medium">{customer.orderCount}</div>
              </div>
              <div>
                <div className="text-sm text-neutral-500">Total Spent</div>
                <div className="font-medium">{customer.totalSpent}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Orders and Addresses Tabs */}
      <div className="bg-white rounded-sm shadow-sm border border-neutral-200 overflow-hidden">
        <div className="border-b border-neutral-200">
          <div className="flex">
            <button 
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-3 ${activeTab === 'orders' ? 'border-b-2 border-neutral-900 font-medium' : 'text-neutral-500 hover:text-neutral-900'}`}
            >
              Orders
            </button>
            <button 
              onClick={() => setActiveTab('addresses')}
              className={`px-6 py-3 ${activeTab === 'addresses' ? 'border-b-2 border-neutral-900 font-medium' : 'text-neutral-500 hover:text-neutral-900'}`}
            >
              Addresses
            </button>
          </div>
        </div>
        
        {/* Orders Table */}
        {activeTab === 'orders' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {customer.orders.length > 0 ? (
                  customer.orders.map((order) => (
                    <tr key={order.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                        {order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {order.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${getStatusBadgeClass(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {order.items}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {order.total}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link 
                          href={`/admin/orders/${order.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View Order
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-neutral-500">
                      No orders found for this customer
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Addresses Section */}
        {activeTab === 'addresses' && (
          <div className="p-6">
            {customer.addresses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {customer.addresses.map((address) => (
                  <div key={address.id} className={`p-4 rounded-sm border ${address.isDefault ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200'}`}>
                    {address.isDefault && (
                      <div className="mb-2">
                        <span className="bg-neutral-900 text-white text-xs px-2 py-1 rounded-sm">Default Address</span>
                      </div>
                    )}
                    <h3 className="font-medium">{address.name}</h3>
                    <p className="text-sm text-neutral-600 mt-1">{address.phone}</p>
                    <div className="mt-2 text-sm">
                      <p>{address.address}</p>
                      <p>{address.city}, {address.province} {address.postalCode}</p>
                      <p>{address.country}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-neutral-500">No addresses found for this customer</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 