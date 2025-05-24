import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import midtransClient from 'midtrans-client';
import { MIDTRANS_CONFIG } from '../config';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/db';

/**
 * POST /api/midtrans/retry
 * 
 * Retries a payment using Midtrans Snap instead of Core API.
 * Uses the original order ID to avoid creating duplicate transactions.
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse the request body
    const requestData = await request.json();
    const { 
      originalOrderId, // The original order ID to retry payment for
      amount, 
      items, 
      shipping,
      shippingAddress, 
      customerEmail,
      forceRetry = false // Add an option to force retry (for admin use)
    } = requestData;
    
    // Validate required parameters
    if (!originalOrderId || !amount || !items) {
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
    
    // Verify the order exists and belongs to the user
    const originalOrder = await prisma.order.findUnique({
      where: { id: originalOrderId },
      include: { address: true }
    });
    
    if (!originalOrder) {
      return NextResponse.json({ error: 'Original order not found' }, { status: 404 });
    }
    
    if (originalOrder.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized to modify this order' }, { status: 403 });
    }
    
    // Only allow retrying payment for orders in 'awaiting_payment' status
    if (originalOrder.status !== 'awaiting_payment') {
      return NextResponse.json(
        { error: `Cannot retry payment for order in '${originalOrder.status}' status` },
        { status: 400 }
      );
    }

    try {
      // Check if we have a stored token for a pending transaction
      if (originalOrder.paymentToken) {
        console.log('Found existing payment token, checking transaction status');
        
        // Create Core API instance to check transaction status
        const core = new midtransClient.CoreApi({
          isProduction: MIDTRANS_CONFIG.isProduction,
          serverKey: MIDTRANS_CONFIG.serverKey,
          clientKey: MIDTRANS_CONFIG.clientKey
        });
        
        // Get payment information for this transaction
        const existingTransaction = await core.transaction.status(originalOrderId);
        console.log('Existing transaction status:', existingTransaction);
        
        // If transaction is pending and we have a token, reuse it
        if (existingTransaction?.transaction_status === 'pending') {
          console.log('Found existing Snap token for pending transaction, reusing it');
          return NextResponse.json({
            success: true,
            useExistingToken: true,
            token: originalOrder.paymentToken,
            transaction_status: existingTransaction.transaction_status
          });
        }
        
        // Check if we can reuse the order ID
        const canReuseOrderId = ['deny', 'cancel', 'expire', 'failure'].includes(
          existingTransaction?.transaction_status
        );
        
        // Check if the transaction is pending but potentially stale
        if (!canReuseOrderId && existingTransaction?.transaction_status === 'pending') {
          const transactionTime = new Date(existingTransaction.transaction_time);
          const currentTime = new Date();
          const hoursDifference = (currentTime - transactionTime) / (1000 * 60 * 60);
          
          // If the transaction has been pending for more than 24 hours, we can consider it stale
          if (hoursDifference > 24) {
            console.log('Pending transaction is stale (over 24 hours old), allowing retry');
            canReuseOrderId = true;
          }
        }
        
        // Only allow force retry for admin users
        if (forceRetry && session.user.role === 'ADMIN') {
          console.log('Admin user forcing payment retry');
          canReuseOrderId = true;
        }
        
        if (!canReuseOrderId) {
          // Create a more descriptive error message based on the status
          let errorMessage = 'Cannot retry this transaction';
          
          if (existingTransaction?.transaction_status === 'pending') {
            errorMessage = 'This transaction is still pending with Midtrans. Please wait for it to complete or expire before retrying.';
          } else if (existingTransaction?.transaction_status === 'settlement' || 
                    existingTransaction?.transaction_status === 'capture') {
            errorMessage = 'This transaction has already been paid successfully.';
          }
          
          return NextResponse.json(
            { 
              error: errorMessage, 
              redirectUrl: `/account/orders/${originalOrderId}`,
              status: existingTransaction?.transaction_status || 'unknown'
            }, 
            { status: 400 }
          );
        }
      }
      
      // Format items for Midtrans
      const formattedItems = items.map(item => ({
        id: item.id.toString(),
        price: parseFloat(item.price),
        quantity: parseInt(item.quantity) || 1,
        name: item.name || 'Item',
        category: item.category || 'Fashion',
        merchant_name: 'Hikari Shop'
      }));
      
      // Add shipping as a separate item if provided
      if (shipping && shipping.cost > 0) {
        formattedItems.push({
          id: 'shipping',
          price: shipping.cost,
          quantity: 1,
          name: `Shipping (${shipping.method || 'Standard'})`,
          category: 'Shipping',
          merchant_name: 'Hikari Shop'
        });
      }
      
      // Calculate the total from items to ensure it matches
      const calculatedTotal = formattedItems.reduce(
        (sum, item) => sum + (item.price * item.quantity), 
        0
      );
      
      console.log('Midtrans Snap payment check:', {
        requestedAmount: grossAmount,
        calculatedTotal,
        difference: grossAmount - calculatedTotal,
        originalOrderId
      });
      
      // If there's a difference between the calculated total and gross amount
      if (Math.abs(grossAmount - calculatedTotal) > 1) { // Allow 1 rupiah difference for rounding
        console.error('Amount mismatch', {
          expectedTotal: grossAmount,
          calculatedTotal
        });
        
        // Try to adjust the first item's price to account for rounding errors
        if (formattedItems.length > 0 && Math.abs(grossAmount - calculatedTotal) < 100) {
          const difference = grossAmount - calculatedTotal;
          formattedItems[0].price += difference;
          console.log('Price adjusted to match total', {
            item: formattedItems[0].name,
            adjustment: difference,
            newPrice: formattedItems[0].price
          });
        } else {
          return NextResponse.json(
            { error: 'Total amount does not match sum of items' },
            { status: 400 }
          );
        }
      }

      // Create Snap API instance
      let snap = new midtransClient.Snap({
        isProduction: MIDTRANS_CONFIG.isProduction,
        serverKey: MIDTRANS_CONFIG.serverKey,
        clientKey: MIDTRANS_CONFIG.clientKey
      });

      // Prepare customer details
      const customerDetails = {
        first_name: session.user.name?.split(' ')[0] || 'Customer',
        last_name: session.user.name?.split(' ').slice(1).join(' ') || '',
        email: customerEmail || session.user.email,
        phone: shippingAddress?.phone || originalOrder.address?.phone || '',
        billing_address: {
          first_name: shippingAddress?.fullName?.split(' ')[0] || originalOrder.address?.name?.split(' ')[0] || '',
          last_name: shippingAddress?.fullName?.split(' ').slice(1).join(' ') || originalOrder.address?.name?.split(' ').slice(1).join(' ') || '',
          phone: shippingAddress?.phone || originalOrder.address?.phone || '',
          address: shippingAddress?.address || originalOrder.address?.address || '',
          city: shippingAddress?.city || originalOrder.address?.city || '',
          postal_code: shippingAddress?.postalCode || originalOrder.address?.postalCode || '',
          country_code: 'IDN',
        },
        shipping_address: {
          first_name: shippingAddress?.fullName?.split(' ')[0] || originalOrder.address?.name?.split(' ')[0] || '',
          last_name: shippingAddress?.fullName?.split(' ').slice(1).join(' ') || originalOrder.address?.name?.split(' ').slice(1).join(' ') || '',
          phone: shippingAddress?.phone || originalOrder.address?.phone || '',
          address: shippingAddress?.address || originalOrder.address?.address || '',
          city: shippingAddress?.city || originalOrder.address?.city || '',
          postal_code: shippingAddress?.postalCode || originalOrder.address?.postalCode || '',
          country_code: 'IDN',
        }
      };
      
      // Generate a random 3-digit number to avoid caching issues
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      
      // Transaction parameters for Snap API
      const transactionDetails = {
        transaction_details: {
          order_id: originalOrderId,
          gross_amount: grossAmount
        },
        item_details: formattedItems,
        customer_details: customerDetails,
        credit_card: {
          secure: true
        },
        callbacks: {
          finish: process.env.NEXT_PUBLIC_APP_URL 
            ? `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?orderId=${originalOrderId}&paymentMethod=midtrans`
            : `${request.headers.get('origin') || 'http://localhost:3000'}/checkout/success?orderId=${originalOrderId}&paymentMethod=midtrans`,
          error: process.env.NEXT_PUBLIC_APP_URL
            ? `${process.env.NEXT_PUBLIC_APP_URL}/checkout/error?orderId=${originalOrderId}`
            : `${request.headers.get('origin') || 'http://localhost:3000'}/checkout/error?orderId=${originalOrderId}`,
          pending: process.env.NEXT_PUBLIC_APP_URL
            ? `${process.env.NEXT_PUBLIC_APP_URL}/account/orders`
            : `${request.headers.get('origin') || 'http://localhost:3000'}/account/orders`
        }
      };
      
      // Create transaction token
      const transaction = await snap.createTransaction(transactionDetails);
      console.log('Midtrans Snap transaction created:', transaction);
      
      // Update the order with transaction details
      await prisma.order.update({
        where: { id: originalOrderId },
        data: { 
          paymentId: transaction.transaction_id || null,
          paymentToken: transaction.token || null
        }
      });
      
      // Return payment details to the client
      return NextResponse.json({
        success: true,
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