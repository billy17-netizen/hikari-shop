import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * POST /api/orders/[id]/update-payment
 * Update order payment details after Midtrans payment
 */
export async function POST(
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
    const { paymentId, status, rawResponse } = data;
    
    console.log('Received update payment request:', {
      orderId,
      paymentId,
      status,
      rawResponseAvailable: !!rawResponse
    });
    
    // Validate input
    if (!paymentId) {
      console.error('No paymentId provided in request for order:', orderId);
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }
    
    // Fetch the order to check ownership
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, status: true, paymentMethod: true }
    });
    
    // Check if order exists
    if (!order) {
      console.error(`Order not found: ${orderId}`);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    console.log('Found order:', {
      id: order.id,
      userId: order.userId,
      status: order.status,
      paymentMethod: order.paymentMethod
    });
    
    // Check if the user is authorized to update this order
    if (order.userId !== session.user.id && session.user.role !== 'ADMIN') {
      console.error(`Unauthorized access attempt by ${session.user.id} for order ${orderId}`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Create a metadata field to store additional information
    const metadata = {};
    if (rawResponse) {
      try {
        Object.assign(metadata, { paymentResponse: rawResponse });
      } catch (e) {
        console.error('Error parsing raw response:', e);
      }
    }
    
    // Update the order with payment details
    const updateData: any = {
      paymentId,
      status: status || 'processing',
      updatedAt: new Date()
    };
    
    // If the status indicates payment is complete, update paymentStatus too
    if (status === 'processing' || status === 'completed' || status === 'shipped' || status === 'delivered' || (!status && paymentId)) {
      updateData.paymentStatus = 'paid';
    }
    
    // If we have metadata, store it
    if (Object.keys(metadata).length > 0) {
      updateData.metadata = metadata;
    }
    
    console.log('Updating order with data:', {
      orderId,
      paymentId,
      status: status || 'processing',
      hasMetadata: Object.keys(metadata).length > 0
    });
    
    // Update the order with payment details
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData
    });
    
    console.log(`Order ${orderId} payment updated successfully: PaymentID=${paymentId}, Status=${updatedOrder.status}`);
    
    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        status: updatedOrder.status,
        paymentId: updatedOrder.paymentId
      }
    });
    
  } catch (error: any) {
    console.error('Error updating payment details:', error.message, error.stack);
    return NextResponse.json({ error: 'Failed to update payment details' }, { status: 500 });
  }
} 