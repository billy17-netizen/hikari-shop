import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// POST /api/orders - Create a new order
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user ID exists
    if (!session.user.id) {
      console.error('Session user ID is missing:', session.user);
      return NextResponse.json({ error: 'Invalid user session' }, { status: 400 });
    }

    const data = await request.json();
    
    // Validate required data
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }
    
    if (!data.totals || typeof data.totals.total !== 'number') {
      return NextResponse.json({ error: 'Invalid total amount' }, { status: 400 });
    }
    
    // Set the appropriate status based on payment method
    let initialStatus = 'pending';
    
    // For Midtrans payments, set status to awaiting_payment
    if (data.paymentMethod === 'midtrans') {
      initialStatus = 'awaiting_payment';
    } else if (data.paymentMethod === 'cod') {
      // For COD, keep it as pending since payment will happen on delivery
      initialStatus = 'pending';
      console.log('Creating COD order with status:', initialStatus);
    }
    
    // If we have shipping address but not addressId, create or find the address
    let addressId = data.addressId || null;
    
    // Process the shipping address if provided
    if (data.shippingAddress && !addressId) {
      console.log('Processing shipping address for order:', data.shippingAddress);
      
      try {
        // Check if address already exists for this user
        const existingAddress = await prisma.address.findFirst({
          where: {
            userId: session.user.id,
            address: data.shippingAddress.address,
            city: data.shippingAddress.city,
            postalCode: data.shippingAddress.postalCode,
          }
        });
        
        if (existingAddress) {
          // Use existing address
          addressId = existingAddress.id;
          console.log('Using existing address ID:', addressId);
        } else {
          // Create new address
          const newAddress = await prisma.address.create({
            data: {
              userId: session.user.id,
              name: data.shippingAddress.fullName || 'Unknown',
              phone: data.shippingAddress.phone || '',
              address: data.shippingAddress.address,
              city: data.shippingAddress.city,
              province: data.shippingAddress.province || '',
              postalCode: data.shippingAddress.postalCode,
              country: data.shippingAddress.country || 'Indonesia',
              isDefault: false,
            }
          });
          
          addressId = newAddress.id;
          console.log('Created new address with ID:', addressId);
        }
      } catch (addressError) {
        console.error('Error processing address:', addressError);
        // Continue with order creation even if address creation fails
      }
    }
    
    // Create the order
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        addressId: addressId,
        items: data.items,
        total: data.totals.total,
        status: initialStatus,
        paymentId: data.paymentMethod === 'midtrans' ? null : `pay_${Date.now()}`, // Only set mock ID for non-Midtrans
        paymentMethod: data.paymentMethod || 'cod', // Default to COD if not specified
      },
      include: {
        address: true // Include address in response
      }
    });
    
    // Log successful order creation
    console.log(`Order created successfully: ID=${order.id}, Method=${order.paymentMethod}, Status=${order.status}`);

    // Return the order ID for confirmation page
    return NextResponse.json({
      success: true,
      id: order.id, // Changed to match what checkout page expects
      paymentMethod: order.paymentMethod,
      addressId: order.addressId
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating order:', error.message, error.stack);
    return NextResponse.json({ 
      error: 'Failed to create order', 
      details: error.message 
    }, { status: 500 });
  }
}

// GET /api/orders - Get all orders for the current user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    
    // Find orders
    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        address: true, // Include the address information
      },
      ...(limit && { take: limit }), // Apply limit if provided
    });
    
    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Error fetching orders:', error.message);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
} 