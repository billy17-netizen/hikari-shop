import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * GET /api/orders/[id]
 * Get a single order by ID
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const orderId = params.id;
    
    // Fetch the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        address: true
      }
    });
    
    // Check if order exists
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    // Check if the user is authorized to view this order
    if (order.userId !== session.user.id && session.user.role?.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Fetch product details for each order item
    let orderWithProducts = { ...order };
    
    if (order.items && Array.isArray(order.items)) {
      // Get all product IDs from order items
      const productIds = order.items.map((item: any) => item.productId).filter(Boolean);
      
      if (productIds.length > 0) {
        // Fetch products in a single query
        const products = await prisma.product.findMany({
          where: {
            id: { in: productIds }
          },
          select: {
            id: true,
            name: true,
            images: true
          }
        });
        
        // Create a map for quick lookups
        const productMap = products.reduce((map: any, product) => {
          map[product.id] = product;
          return map;
        }, {});
        
        // Enhance each order item with its product details
        orderWithProducts.items = order.items.map((item: any) => {
          const product = productMap[item.productId];
          return {
            ...item,
            product: product || null
          };
        });
      }
    }
    
    return NextResponse.json(orderWithProducts);
  } catch (error: any) {
    console.error('Error fetching order:', error.message);
    return NextResponse.json({ error: 'Failed to retrieve order' }, { status: 500 });
  }
}

/**
 * PATCH /api/orders/[id]
 * Update order details, including restarting a payment process
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const orderId = params.id;
    const data = await request.json();
    
    console.log(`Order update request for ${orderId}:`, data);
    
    // Fetch the order to check ownership
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, status: true }
    });
    
    // Check if order exists
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    // Check if the user is authorized to update this order
    if (order.userId !== session.user.id && session.user.role?.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Handle abandoned Midtrans payments specifically
    if (data.action === 'restart_payment' && order.status === 'awaiting_payment') {
      // We don't need to change the status, just allow the payment to be retried
      return NextResponse.json({ 
        success: true,
        message: 'Payment can be restarted',
        order: {
          id: order.id,
          status: order.status
        }
      });
    }
    
    // Add logging for status update
    if (data.status) {
      console.log(`Updating order ${orderId} status from ${order.status} to ${data.status}`);
    }
    
    // General update for other fields
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        // Only allow updating specific fields
        // For safety, don't allow changing critical fields like total, items, etc.
        ...(data.status && { status: data.status }),
        updatedAt: new Date()
      }
    });
    
    console.log(`Order ${orderId} updated successfully:`, {
      previousStatus: order.status,
      newStatus: updatedOrder.status
    });
    
    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        status: updatedOrder.status
      }
    });
  } catch (error: any) {
    console.error('Error updating order:', error.message, error.stack);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
} 