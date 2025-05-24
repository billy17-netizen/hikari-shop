import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { format } from 'date-fns';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = params.id;
    
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
    
    // Fetch customer details
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
    });
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    // Fetch customer's orders
    const orders = await prisma.order.findMany({
      where: { userId: customerId },
      orderBy: { createdAt: 'desc' },
      include: { address: true }
    });
    
    // Calculate total spent
    const totalSpent = orders.reduce(
      (sum, order) => sum + Number(order.total),
      0
    );
    
    // Format orders with necessary information
    const formattedOrders = orders.map(order => {
      const itemsJson = order.items as any;
      const itemCount = Array.isArray(itemsJson) ? itemsJson.length : 0;
      
      return {
        id: order.id,
        date: format(order.createdAt, 'yyyy-MM-dd'),
        status: order.status,
        total: `Rp ${order.total.toString()}`,
        items: itemCount,
        paymentMethod: order.paymentMethod,
        shippingAddress: order.address 
          ? `${order.address.address}, ${order.address.city}, ${order.address.province}` 
          : 'No address provided'
      };
    });
    
    // Fetch customer's addresses
    const addresses = await prisma.address.findMany({
      where: { userId: customerId },
      orderBy: { isDefault: 'desc' }
    });
    
    return NextResponse.json({
      id: customer.id,
      name: customer.name || 'Anonymous',
      email: customer.email,
      image: customer.image,
      createdAt: format(customer.createdAt, 'yyyy-MM-dd'),
      orders: formattedOrders,
      addresses: addresses,
      orderCount: orders.length,
      totalSpent: `Rp ${totalSpent.toLocaleString('id-ID')}`,
      lastActive: customer.updatedAt 
        ? format(customer.updatedAt, 'yyyy-MM-dd') 
        : format(customer.createdAt, 'yyyy-MM-dd')
    });
    
  } catch (error) {
    console.error('Error fetching customer details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer details' },
      { status: 500 }
    );
  }
} 