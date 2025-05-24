import { NextResponse } from 'next/server';
import midtransClient from 'midtrans-client';
import { MIDTRANS_CONFIG } from '../config';
import prisma from '@/lib/db';

/**
 * POST /api/midtrans/notification
 * 
 * Handles webhook notifications from Midtrans about payment status changes.
 * Updates the order status in our database based on the notification.
 */
export async function POST(request) {
  try {
    console.log('Received Midtrans notification');
    
    // Parse notification data
    const notificationData = await request.json();
    console.log('Notification data:', JSON.stringify(notificationData));
    
    // Create Snap API instance for notification handling
    let snap = new midtransClient.Snap({
      isProduction: MIDTRANS_CONFIG.isProduction,
      serverKey: MIDTRANS_CONFIG.serverKey,
      clientKey: MIDTRANS_CONFIG.clientKey
    });
    
    // Process the notification
    const statusResponse = await snap.transaction.notification(notificationData);
    
    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;
    const transactionId = statusResponse.transaction_id || `midtrans_${Date.now()}`;
    
    console.log(`Transaction notification received. Order ID: ${orderId}. Transaction status: ${transactionStatus}. Fraud status: ${fraudStatus}. Transaction ID: ${transactionId}`);
    
    // Get the order from database
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });
    
    if (!order) {
      console.error(`Order not found: ${orderId}`);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    let orderStatus = order.status; // Keep current status as default
    
    // Determine order status based on transaction status
    if (transactionStatus === 'capture') {
      // For credit card transaction
      if (fraudStatus === 'challenge') {
        // Need manual review
        orderStatus = 'pending';
      } else if (fraudStatus === 'accept') {
        // Payment successful
        orderStatus = 'processing';
      }
    } else if (transactionStatus === 'settlement') {
      // Payment successful
      orderStatus = 'processing';
    } else if (transactionStatus === 'deny') {
      // Payment denied
      orderStatus = 'cancelled';
    } else if (transactionStatus === 'cancel' || transactionStatus === 'expire') {
      // Payment cancelled or expired
      orderStatus = 'cancelled';
    } else if (transactionStatus === 'pending') {
      // Payment pending
      orderStatus = 'awaiting_payment';
    }
    
    // Log the status change
    console.log(`Updating order ${orderId} status from ${order.status} to ${orderStatus}`);
    console.log(`Setting paymentId to: ${transactionId}`);
    
    // Update order status in database
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: orderStatus,
        paymentId: transactionId, // Store the Midtrans transaction ID
        paymentStatus: transactionStatus === 'settlement' || 
                      (transactionStatus === 'capture' && fraudStatus === 'accept') ? 
                      'paid' : 'unpaid',
        updatedAt: new Date()
      }
    });
    
    console.log(`Order ${orderId} status updated to ${orderStatus} with paymentId ${transactionId}`);
    
    return NextResponse.json({ 
      success: true, 
      order: { 
        id: updatedOrder.id, 
        status: updatedOrder.status,
        paymentId: updatedOrder.paymentId
      } 
    });
    
  } catch (error) {
    console.error('Midtrans notification error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process notification' },
      { status: 500 }
    );
  }
} 