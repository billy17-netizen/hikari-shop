import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * PATCH /api/orders/[id]/status
 * 
 * Updates the status of an order.
 * This is used for manual updates when the webhook notification fails.
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const orderId = params.id;
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }
    
    // Parse the request body
    const data = await request.json();
    const { status, paymentDetails } = data;
    
    console.log('Order status update request received:', {
      orderId,
      status,
      hasPaymentDetails: !!paymentDetails,
      paymentDetailsKeys: paymentDetails ? Object.keys(paymentDetails) : []
    });
    
    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }
    
    // Validate status value
    const validStatuses = ['pending', 'awaiting_payment', 'processing', 'completed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }
    
    // Check if order exists and belongs to the user
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true }
    });
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    // Verify ownership or admin role
    if (order.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Extract payment ID from paymentDetails if available
    let paymentId = null;
    let metadata = null;
    
    if (paymentDetails) {
      // Try to extract transaction_id from Midtrans response
      paymentId = paymentDetails.transaction_id || 
                  paymentDetails.order_id && `midtrans_${paymentDetails.order_id}` || 
                  null;
      
      if (paymentId) {
        console.log(`Extracted payment ID from Midtrans response: ${paymentId}`);
      } else {
        console.log('No payment ID found in Midtrans response, using fallback');
        // If no transaction_id is found, create a fallback ID
        paymentId = `midtrans_manual_${Date.now()}`;
      }
      
      // Store full payment details as metadata
      metadata = {
        midtransResponse: JSON.stringify(paymentDetails),
        lastUpdate: new Date().toISOString()
      };
    }
    
    // Update the order status
    const updateData: any = {
      status,
      updatedAt: new Date()
    };
    
    // Set paymentStatus based on order status
    if (status === 'processing' || status === 'completed' || status === 'shipped' || status === 'delivered') {
      updateData.paymentStatus = 'paid';
    } else if (status === 'cancelled') {
      updateData.paymentStatus = 'unpaid';
    }
    
    // Add payment ID if available
    if (paymentId) {
      updateData.paymentId = paymentId;
    }
    
    // Add metadata if available
    if (metadata) {
      updateData.metadata = metadata;
    }
    
    console.log('Updating order with data:', {
      orderId,
      status,
      paymentId: paymentId || 'not set',
      hasMetadata: !!metadata
    });
    
    // Update the order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData
    });
    
    console.log(`Order ${orderId} status updated to ${status} by ${session.user.email}, paymentId: ${updatedOrder.paymentId || 'not set'}`);
    
    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        status: updatedOrder.status,
        paymentId: updatedOrder.paymentId
      }
    });
  } catch (error: any) {
    console.error('Error updating order status:', error.message, error.stack);
    return NextResponse.json({ 
      error: 'Failed to update order status', 
      details: error.message 
    }, { status: 500 });
  }
} 