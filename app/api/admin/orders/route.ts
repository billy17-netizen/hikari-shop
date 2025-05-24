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
    
    if (session.user.role?.toLowerCase() !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    // Fetch orders with user and address data
    const orders = await prisma.order.findMany({
      include: {
        user: true,
        address: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Transform data to match the frontend format
    const formattedOrders = orders.map(order => {
      // Parse items from JSON
      const itemsJson = order.items as any;
      const itemCount = Array.isArray(itemsJson) ? itemsJson.length : 0;
      
      // Format address
      const address = order.address;
      let formattedAddress = 'No address provided';
      
      if (address) {
        formattedAddress = `${address.address}, ${address.city}, ${address.province}, ${address.postalCode}`;
      }
      
      // Format payment method for display
      let displayPaymentMethod = order.paymentMethod;
      switch (order.paymentMethod) {
        case 'cod':
          displayPaymentMethod = 'Cash on Delivery';
          break;
        case 'midtrans':
          displayPaymentMethod = 'Midtrans';
          break;
        case 'credit_card':
          displayPaymentMethod = 'Credit Card';
          break;
      }
      
      // Determine payment status if it doesn't exist yet
      let paymentStatus = (order as any).paymentStatus || 'unpaid';
      
      // Fallback logic to determine payment status if not in database
      if (!(order as any).paymentStatus) {
        if (order.status === 'cancelled') {
          paymentStatus = 'unpaid';
        } else if (order.paymentMethod === 'credit_card' || order.paymentMethod === 'midtrans') {
          paymentStatus = 'paid';
        } else if (order.paymentMethod === 'Bank Transfer' && (order.status === 'processing' || order.status === 'completed')) {
          paymentStatus = 'paid';
        } else if (order.paymentMethod === 'cod' && order.status === 'completed') {
          paymentStatus = 'paid';
        }
      }
      
      return {
        id: order.id,
        customer: order.user.name || 'Unknown',
        email: order.user.email,
        date: format(order.createdAt, 'yyyy-MM-dd'),
        total: Number(order.total),
        status: order.status,
        paymentStatus,
        items: itemCount,
        paymentMethod: displayPaymentMethod,
        shippingAddress: formattedAddress,
      };
    });
    
    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
} 