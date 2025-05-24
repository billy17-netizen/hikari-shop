import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import midtransClient from 'midtrans-client';
import { MIDTRANS_CONFIG } from './config';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/db';

/**
 * POST /api/midtrans
 * 
 * Creates a payment transaction in Midtrans and returns the transaction token.
 * This token is used by the frontend to display the Midtrans payment popup.
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse the request body
    const requestData = await request.json();
    const { orderId, amount, items, shippingAddress, customerEmail } = requestData;
    
    // Validate required parameters
    if (!orderId || !amount || !items) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Ensure amount is a number and convert to integer (Midtrans requires amount in lowest currency unit)
    const grossAmount = Math.round(parseFloat(amount.toString()));
    
    if (isNaN(grossAmount) || grossAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount value' },
        { status: 400 }
      );
    }

    try {
      // Format items for Midtrans and verify totals
      const formattedItems = items.map(item => ({
        id: item.id.toString(),
        price: parseFloat(item.price),
        quantity: parseInt(item.quantity) || 1,
        // Truncate item name to 50 characters (Midtrans limit)
        name: (item.name || 'Item').substring(0, 50),
        category: item.category || 'Fashion',
        merchant_name: 'Hikari Shop'
      }));
      
      // Calculate the total from items to ensure it matches
      let calculatedTotal = formattedItems.reduce(
        (sum, item) => sum + (item.price * item.quantity), 
        0
      );
      
      // Round calculated total to ensure whole number comparison
      calculatedTotal = Math.round(calculatedTotal);
      
      console.log('Midtrans payment check:', {
        requestedAmount: grossAmount,
        calculatedTotal,
        difference: grossAmount - calculatedTotal,
        items: formattedItems
      });
      
      // If there's a difference between the calculated total and gross amount,
      // adjust the item prices to ensure they match exactly
      if (grossAmount !== calculatedTotal) {
        const difference = grossAmount - calculatedTotal;
        
        // Distribute the difference proportionally among all items
        let remainingDiff = difference;
        const totalItemCount = formattedItems.reduce((sum, item) => sum + item.quantity, 0);
        
        // Sort items by price (descending) to adjust higher-priced items first
        formattedItems.sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity));
        
        for (let i = 0; i < formattedItems.length && remainingDiff !== 0; i++) {
          const item = formattedItems[i];
          // Calculate how much to adjust this item by (proportional to its quantity)
          const itemAdjustment = Math.round(remainingDiff * (item.quantity / totalItemCount));
          
          if (itemAdjustment !== 0) {
            // Adjust price per unit
            const priceAdjustment = itemAdjustment / item.quantity;
            item.price += priceAdjustment;
            remainingDiff -= itemAdjustment;
            
            console.log(`Adjusted item "${item.name}": new price = ${item.price}, adjustment = ${priceAdjustment}`);
          }
        }
        
        // If there's still a remaining difference, add it to the first item
        if (remainingDiff !== 0 && formattedItems.length > 0) {
          const priceAdjustment = remainingDiff / formattedItems[0].quantity;
          formattedItems[0].price += priceAdjustment;
          console.log(`Final adjustment on "${formattedItems[0].name}": +${priceAdjustment} per unit`);
        }
        
        // Recalculate to verify
        const newCalculatedTotal = formattedItems.reduce(
          (sum, item) => sum + (item.price * item.quantity), 
          0
        );
        
        console.log('After adjustments:', {
          grossAmount,
          newCalculatedTotal: Math.round(newCalculatedTotal),
          match: Math.round(newCalculatedTotal) === grossAmount
        });
      }

      // Create Snap API instance
      let snap = new midtransClient.Snap({
        isProduction: MIDTRANS_CONFIG.isProduction,
        serverKey: MIDTRANS_CONFIG.serverKey,
        clientKey: MIDTRANS_CONFIG.clientKey
      });

      // Prepare transaction parameters
      const transactionDetails = {
        transaction_details: {
          order_id: orderId,
          gross_amount: grossAmount
        },
        item_details: formattedItems,
        customer_details: {
          first_name: session.user.name?.split(' ')[0] || 'Customer',
          last_name: session.user.name?.split(' ').slice(1).join(' ') || '',
          email: customerEmail || session.user.email,
          phone: shippingAddress?.phone || '',
          billing_address: shippingAddress ? {
            first_name: shippingAddress.fullName?.split(' ')[0] || '',
            last_name: shippingAddress.fullName?.split(' ').slice(1).join(' ') || '',
            phone: shippingAddress.phone || '',
            address: shippingAddress.address || '',
            city: shippingAddress.city || '',
            postal_code: shippingAddress.postalCode || '',
            country_code: 'IDN',
          } : null,
          shipping_address: shippingAddress ? {
            first_name: shippingAddress.fullName?.split(' ')[0] || '',
            last_name: shippingAddress.fullName?.split(' ').slice(1).join(' ') || '',
            phone: shippingAddress.phone || '',
            address: shippingAddress.address || '',
            city: shippingAddress.city || '',
            postal_code: shippingAddress.postalCode || '',
            country_code: 'IDN',
          } : null
        },
        credit_card: {
          secure: true
        },
        callbacks: {
          finish: process.env.NEXT_PUBLIC_APP_URL 
            ? `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?orderId=${orderId}&paymentMethod=midtrans`
            : `${request.headers.get('origin') || 'http://localhost:3000'}/checkout/success?orderId=${orderId}&paymentMethod=midtrans`,
          error: process.env.NEXT_PUBLIC_APP_URL
            ? `${process.env.NEXT_PUBLIC_APP_URL}/checkout/error?orderId=${orderId}`
            : `${request.headers.get('origin') || 'http://localhost:3000'}/checkout/error?orderId=${orderId}`,
          pending: process.env.NEXT_PUBLIC_APP_URL
            ? `${process.env.NEXT_PUBLIC_APP_URL}/account/orders`
            : `${request.headers.get('origin') || 'http://localhost:3000'}/account/orders`
        }
      };

      // Create transaction token
      const transaction = await snap.createTransaction(transactionDetails);
      
      console.log('Midtrans transaction created:', {
        token: transaction.token,
        transactionId: transaction.transaction_id || 'not available yet',
        orderId
      });
      
      // Generate a temporary transaction ID if none is provided
      const paymentId = transaction.transaction_id || `midtrans_temp_${Date.now()}`;
      
      // Save order with initial pending status in the database
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { 
          paymentMethod: 'midtrans',
          paymentId: paymentId,
          paymentToken: transaction.token || null,
          status: 'awaiting_payment'
        }
      });
      
      console.log(`Order ${orderId} updated with Midtrans details. Payment ID: ${updatedOrder.paymentId}`);
      
      // Return the token and redirect URL
      return NextResponse.json({
        token: transaction.token,
        redirect_url: transaction.redirect_url
      });
    } catch (processingError) {
      console.error('Error processing Midtrans payment:', processingError);
      return NextResponse.json(
        { error: processingError.message || 'Failed to process payment data' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Midtrans transaction error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment transaction' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/midtrans/notification
 * 
 * Handles webhook notifications from Midtrans about payment status changes.
 * Updates the order status in our database based on the notification.
 */
export async function NOTIFICATION(request) {
  try {
    // Parse notification data
    const notificationData = await request.json();
    
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
    
    console.log(`Transaction notification received. Order ID: ${orderId}. Transaction status: ${transactionStatus}. Fraud status: ${fraudStatus}`);
    
    let orderStatus = 'pending';
    
    // Determine order status based on transaction status
    if (transactionStatus === 'capture') {
      // For credit card transaction
      if (fraudStatus === 'challenge') {
        // Need manual review
        orderStatus = 'pending';
      } else if (fraudStatus === 'accept') {
        // Payment successful
        orderStatus = 'paid';
      }
    } else if (transactionStatus === 'settlement') {
      // Payment successful
      orderStatus = 'paid';
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
    
    // Update order status in database
    await prisma.order.update({
      where: { id: orderId },
      data: { status: orderStatus }
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Midtrans notification error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process notification' },
      { status: 500 }
    );
  }
} 