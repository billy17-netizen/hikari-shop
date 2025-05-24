import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { format } from 'date-fns';

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
    
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    // Fetch all users with the role 'user'
    const customers = await prisma.user.findMany({
      where: {
        role: 'user',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Get all orders in a single query for efficiency
    const allOrders = await prisma.order.findMany({
          where: {
        userId: {
          in: customers.map(customer => customer.id)
        }
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
    
    // Group orders by user
    const ordersByUser: { [userId: string]: any[] } = allOrders.reduce((acc: { [key: string]: any[] }, order) => {
      if (!acc[order.userId]) {
        acc[order.userId] = [];
      }
      acc[order.userId].push(order);
      return acc;
    }, {});
    
    // Calculate total revenue from all orders
    const totalRevenue = allOrders.reduce(
      (sum: number, order) => sum + Number(order.total),
      0
    );
    
    // Get order data for each customer
    const customersWithOrders = customers.map(customer => {
      const customerOrders = ordersByUser[customer.id] || [];
        
        // Calculate total spent
      const totalSpent = customerOrders.reduce(
        (sum: number, order: any) => sum + Number(order.total),
          0
        );
        
        // Format as Rupiah
        const formattedTotalSpent = `Rp ${totalSpent.toLocaleString('id-ID')}`;
        
        // Get last order date and status
        let lastOrderDate = 'No orders';
        let lastOrderStatus = null;
        
      if (customerOrders.length > 0) {
        lastOrderDate = format(customerOrders[0].createdAt, 'yyyy-MM-dd');
        lastOrderStatus = customerOrders[0].status;
        }
        
        return {
          id: customer.id,
          name: customer.name || 'Anonymous',
          email: customer.email,
        orders: customerOrders.length,
          totalSpent: formattedTotalSpent,
          lastOrder: lastOrderDate,
          lastOrderStatus: lastOrderStatus,
          createdAt: format(customer.createdAt, 'yyyy-MM-dd'),
          // You could include additional data like customer avatar
          image: customer.image || null,
        };
    });
    
    return NextResponse.json({
      customers: customersWithOrders,
      totalCustomers: customersWithOrders.length,
      totalRevenue: `Rp ${totalRevenue.toLocaleString('id-ID')}`,
    });
    
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
} 