import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { format, startOfDay, subDays } from 'date-fns';

interface Activity {
  type: 'order' | 'product' | 'customer' | 'payment';
  text: string;
  subtext: string;
  time: string;
}

export async function GET() {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (session.user.role?.toLowerCase() !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    // Get total products
    const totalProducts = await prisma.product.count();
    
    // Get low stock items (products that are not in stock)
    const lowStockItems = await prisma.product.count({
      where: {
        inStock: false
      }
    });
    
    // Get pending orders
    const pendingOrders = await prisma.order.count({
      where: {
        status: 'pending'
      }
    });
    
    // Get total revenue from all orders
    const orders = await prisma.order.findMany();
    const totalRevenue = orders.reduce(
      (sum, order) => sum + Number(order.total),
      0
    );
    
    // Get daily sales (orders from today)
    const today = startOfDay(new Date());
    const todayOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: today
        }
      }
    });
    const dailySales = todayOrders.reduce(
      (sum, order) => sum + Number(order.total),
      0
    );
    
    // Get total customers
    const totalCustomers = await prisma.user.count({
      where: {
        role: 'user'
      }
    });
    
    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: true
      }
    });
    
    // Format recent orders
    const formattedRecentOrders = recentOrders.map(order => {
      const createdAtDate = new Date(order.createdAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - createdAtDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      let dateString;
      if (diffDays === 0) {
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        if (diffHours === 0) {
          const diffMinutes = Math.floor(diffTime / (1000 * 60));
          dateString = `${diffMinutes} minutes ago`;
        } else {
          dateString = `${diffHours} hours ago`;
        }
      } else if (diffDays === 1) {
        dateString = '1 day ago';
      } else {
        dateString = `${diffDays} days ago`;
      }
      
      return {
        id: order.id,
        customer: order.user?.name || 'Unknown Customer',
        total: Number(order.total),
        date: dateString,
        status: order.status
      };
    });
    
    // Get recent activities
    // We'll combine recent orders, product updates, user registrations
    const recentActivities: Activity[] = [];
    
    // Add recent orders to activities
    recentOrders.forEach(order => {
      const createdAtDate = new Date(order.createdAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - createdAtDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      let timeString;
      if (diffDays === 0) {
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        if (diffHours === 0) {
          const diffMinutes = Math.floor(diffTime / (1000 * 60));
          timeString = `${diffMinutes} minutes ago`;
        } else {
          timeString = `${diffHours} hours ago`;
        }
      } else if (diffDays === 1) {
        timeString = '1 day ago';
      } else {
        timeString = `${diffDays} days ago`;
      }
      
      recentActivities.push({
        type: 'order',
        text: 'New order received',
        subtext: `Order #${order.id}`,
        time: timeString
      });
    });
    
    // Get recent product updates
    const recentProducts = await prisma.product.findMany({
      take: 3,
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    recentProducts.forEach(product => {
      const updatedAtDate = new Date(product.updatedAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - updatedAtDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      let timeString;
      if (diffDays === 0) {
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        if (diffHours === 0) {
          const diffMinutes = Math.floor(diffTime / (1000 * 60));
          timeString = `${diffMinutes} minutes ago`;
        } else {
          timeString = `${diffHours} hours ago`;
        }
      } else if (diffDays === 1) {
        timeString = '1 day ago';
      } else {
        timeString = `${diffDays} days ago`;
      }
      
      recentActivities.push({
        type: 'product',
        text: 'Product updated',
        subtext: product.name,
        time: timeString
      });
    });
    
    // Get recent user registrations
    const recentUsers = await prisma.user.findMany({
      where: {
        role: 'user'
      },
      take: 3,
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    recentUsers.forEach(user => {
      const createdAtDate = new Date(user.createdAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - createdAtDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      let timeString;
      if (diffDays === 0) {
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        if (diffHours === 0) {
          const diffMinutes = Math.floor(diffTime / (1000 * 60));
          timeString = `${diffMinutes} minutes ago`;
        } else {
          timeString = `${diffHours} hours ago`;
        }
      } else if (diffDays === 1) {
        timeString = '1 day ago';
      } else {
        timeString = `${diffDays} days ago`;
      }
      
      recentActivities.push({
        type: 'customer',
        text: 'New customer registered',
        subtext: user.name || user.email,
        time: timeString
      });
    });
    
    // Sort activities by time (most recent first)
    // For simplicity, we're just taking the first 5 items
    recentActivities.sort((a, b) => {
      const timeA = a.time.includes('minutes') ? 0 : 
                   a.time.includes('hours') ? 1 : 2;
      const timeB = b.time.includes('minutes') ? 0 : 
                   b.time.includes('hours') ? 1 : 2;
      return timeA - timeB;
    });
    
    // Add payment successful activities for orders with 'paid' payment status
    const paidOrders = await prisma.order.findMany({
      where: {
        paymentStatus: 'paid'
      },
      take: 2,
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    paidOrders.forEach(order => {
      const paidAtDate = new Date(order.updatedAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - paidAtDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      let timeString;
      if (diffDays === 0) {
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        if (diffHours === 0) {
          const diffMinutes = Math.floor(diffTime / (1000 * 60));
          timeString = `${diffMinutes} minutes ago`;
        } else {
          timeString = `${diffHours} hours ago`;
        }
      } else if (diffDays === 1) {
        timeString = '1 day ago';
      } else {
        timeString = `${diffDays} days ago`;
      }
      
      recentActivities.push({
        type: 'payment',
        text: 'Payment received',
        subtext: `Order #${order.id}`,
        time: timeString
      });
    });
    
    // Just take the first 5 activities
    const limitedActivities = recentActivities.slice(0, 5);
    
    // Prepare and return the dashboard data
    return NextResponse.json({
      totalProducts,
      pendingOrders,
      lowStockItems,
      totalRevenue,
      dailySales,
      totalCustomers,
      recentOrders: formattedRecentOrders,
      recentActivities: limitedActivities
    });
    
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
} 