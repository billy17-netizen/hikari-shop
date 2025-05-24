'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

// Type definitions
interface Order {
  id: string;
  customer: string;
  total: number;
  date: string;
  status: string;
}

interface Activity {
  type: 'order' | 'product' | 'customer' | 'payment';
  text: string;
  subtext: string;
  time: string;
}

interface DashboardData {
  totalProducts: number;
  pendingOrders: number;
  lowStockItems: number;
  totalRevenue: number;
  dailySales: number;
  totalCustomers: number;
  recentOrders: Order[];
  recentActivities: Activity[];
}

// Dashboard components
export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalProducts: 0,
    pendingOrders: 0,
    lowStockItems: 0,
    totalRevenue: 0,
    dailySales: 0,
    totalCustomers: 0,
    recentOrders: [],
    recentActivities: []
  });

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch real data from the API
        const response = await fetch('/api/admin/dashboard');
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        
        const data = await response.json();
        setDashboardData(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setIsLoading(false);
        
        // Set fallback data in case of error
        setDashboardData({
          totalProducts: 0,
          pendingOrders: 0,
          lowStockItems: 0,
          totalRevenue: 0,
          dailySales: 0,
          totalCustomers: 0,
          recentOrders: [],
          recentActivities: []
        });
      }
    };

    fetchDashboardData();
  }, []);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-monument mb-1">Admin Dashboard</h1>
          <p className="text-neutral-500">
            Welcome back, {session?.user?.name || 'Admin'}! Here's what's happening today.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <Link 
            href="/admin/products/new" 
            className="px-4 py-2 bg-neutral-900 text-white text-sm rounded-sm hover:bg-neutral-800 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Product
          </Link>
          <Link 
            href="/admin/reports" 
            className="px-4 py-2 border border-neutral-300 text-neutral-700 text-sm rounded-sm hover:bg-neutral-50 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Export Report
          </Link>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-sm shadow-sm border border-neutral-100">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Total Products</p>
              <p className="text-2xl font-medium mt-2">{dashboardData.totalProducts}</p>
              <p className="text-xs text-green-600 mt-1">
                <span className="inline-flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                  +5 this week
                </span>
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/admin/products" className="text-sm text-blue-600 hover:underline">
              View all products →
            </Link>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-sm shadow-sm border border-neutral-100">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Pending Orders</p>
              <p className="text-2xl font-medium mt-2">{dashboardData.pendingOrders}</p>
              <p className="text-xs text-amber-600 mt-1">
                <span className="inline-flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                  +3 today
                </span>
              </p>
            </div>
            <div className="bg-amber-100 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/admin/orders?status=pending" className="text-sm text-amber-600 hover:underline">
              Process pending orders →
            </Link>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-sm shadow-sm border border-neutral-100">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Low Stock Items</p>
              <p className="text-2xl font-medium mt-2">{dashboardData.lowStockItems}</p>
              <p className="text-xs text-red-600 mt-1">
                <span className="inline-flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                  +2 this week
                </span>
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <line x1="18" y1="8" x2="23" y2="13"></line>
                <line x1="23" y1="8" x2="18" y2="13"></line>
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/admin/products?filter=low-stock" className="text-sm text-red-600 hover:underline">
              Restock items →
            </Link>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-sm shadow-sm border border-neutral-100">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Total Revenue</p>
              <p className="text-2xl font-medium mt-2">{formatCurrency(dashboardData.totalRevenue)}</p>
              <p className="text-xs text-green-600 mt-1">
                <span className="inline-flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                  +12% this month
                </span>
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/admin/reports" className="text-sm text-green-600 hover:underline">
              View financial reports →
            </Link>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-sm shadow-sm border border-neutral-100">
          <h3 className="text-sm font-medium text-neutral-600 mb-2">Daily Sales</h3>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-2xl font-medium">{formatCurrency(dashboardData.dailySales)}</p>
              <p className="text-xs text-green-600 mt-1">
                <span className="inline-flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                  +8% vs yesterday
                </span>
              </p>
            </div>
            <div className="h-10 flex items-end">
              {/* Simple chart visualization */}
              <div className="w-2 h-5 bg-blue-200 rounded-sm mx-0.5"></div>
              <div className="w-2 h-3 bg-blue-200 rounded-sm mx-0.5"></div>
              <div className="w-2 h-7 bg-blue-200 rounded-sm mx-0.5"></div>
              <div className="w-2 h-6 bg-blue-200 rounded-sm mx-0.5"></div>
              <div className="w-2 h-4 bg-blue-200 rounded-sm mx-0.5"></div>
              <div className="w-2 h-8 bg-blue-300 rounded-sm mx-0.5"></div>
              <div className="w-2 h-10 bg-blue-500 rounded-sm mx-0.5"></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-sm shadow-sm border border-neutral-100">
          <h3 className="text-sm font-medium text-neutral-600 mb-2">Total Customers</h3>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-2xl font-medium">{dashboardData.totalCustomers}</p>
              <p className="text-xs text-green-600 mt-1">
                <span className="inline-flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                  +12 this month
                </span>
              </p>
            </div>
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">JD</div>
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs">SL</div>
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs">KM</div>
              <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 text-xs">+{dashboardData.totalCustomers - 3}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-sm shadow-sm border border-neutral-100">
          <h3 className="text-sm font-medium text-neutral-600 mb-2">Store Performance</h3>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Order Completion Rate</span>
                <span className="font-medium">92%</span>
              </div>
              <div className="w-full bg-neutral-100 rounded-full h-1.5">
                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Customer Satisfaction</span>
                <span className="font-medium">88%</span>
              </div>
              <div className="w-full bg-neutral-100 rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '88%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Store Availability</span>
                <span className="font-medium">99.8%</span>
              </div>
              <div className="w-full bg-neutral-100 rounded-full h-1.5">
                <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: '99.8%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Orders & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-sm shadow-sm border border-neutral-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left font-medium text-neutral-600 pb-3">Order ID</th>
                  <th className="text-left font-medium text-neutral-600 pb-3">Customer</th>
                  <th className="text-right font-medium text-neutral-600 pb-3">Amount</th>
                  <th className="text-right font-medium text-neutral-600 pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.recentOrders.map((order, index) => (
                  <tr key={order.id} className={index !== dashboardData.recentOrders.length - 1 ? "border-b border-neutral-100" : ""}>
                    <td className="py-3">
                      <Link href={`/admin/orders/${order.id}`} className="font-medium text-blue-600 hover:underline">
                        #{order.id}
                      </Link>
                    </td>
                    <td className="py-3">{order.customer}</td>
                    <td className="py-3 text-right">{formatCurrency(order.total)}</td>
                    <td className="py-3 text-right">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-sm shadow-sm border border-neutral-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Recent Activity</h2>
            <button className="text-sm text-neutral-500 hover:text-neutral-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="19" cy="12" r="1"></circle>
                <circle cx="5" cy="12" r="1"></circle>
              </svg>
            </button>
          </div>
          <div className="space-y-5">
            {dashboardData.recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start">
                <div className={`p-2 rounded-full mr-3 ${
                  activity.type === 'order' ? 'bg-blue-100' :
                  activity.type === 'product' ? 'bg-green-100' :
                  activity.type === 'customer' ? 'bg-purple-100' :
                  'bg-amber-100'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${
                    activity.type === 'order' ? 'text-blue-700' :
                    activity.type === 'product' ? 'text-green-700' :
                    activity.type === 'customer' ? 'text-purple-700' :
                    'text-amber-700'
                  }`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {activity.type === 'order' && (
                      <>
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <path d="M16 10a4 4 0 0 1-8 0"></path>
                      </>
                    )}
                    {activity.type === 'product' && (
                      <>
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                        <line x1="12" y1="22.08" x2="12" y2="12"></line>
                      </>
                    )}
                    {activity.type === 'customer' && (
                      <>
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </>
                    )}
                    {activity.type === 'payment' && (
                      <>
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                      </>
                    )}
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.text}</p>
                  <div className="flex justify-between mt-1">
                    <p className="text-xs text-neutral-500">{activity.subtext}</p>
                    <p className="text-xs text-neutral-400">{activity.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-sm shadow-sm border border-neutral-100">
        <h2 className="text-lg font-medium mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link 
            href="/admin/products/new" 
            className="p-4 border border-neutral-200 rounded-sm text-center hover:bg-neutral-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <line x1="12" y1="9" x2="12" y2="15"></line>
              <line x1="9" y1="12" x2="15" y2="12"></line>
            </svg>
            <p className="text-sm font-medium">Add New Product</p>
          </Link>
          
          <Link 
            href="/admin/orders?status=pending" 
            className="p-4 border border-neutral-200 rounded-sm text-center hover:bg-neutral-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <p className="text-sm font-medium">Process Orders</p>
          </Link>
          
          <Link 
            href="/admin/products?filter=update-inventory" 
            className="p-4 border border-neutral-200 rounded-sm text-center hover:bg-neutral-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
            <p className="text-sm font-medium">Update Inventory</p>
          </Link>
          
          <Link 
            href="/admin/settings" 
            className="p-4 border border-neutral-200 rounded-sm text-center hover:bg-neutral-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-neutral-600 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            <p className="text-sm font-medium">Site Settings</p>
          </Link>
        </div>
      </div>
    </div>
  );
} 