import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { format } from 'date-fns';

/**
 * GET /api/admin/orders/[id]
 * Admin-specific endpoint to get a single order by ID with all details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const { id } = params;
    
    // Get order details
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        address: true,
      },
    });
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Parse items from JSON
    const items = typeof order.items === 'string' 
      ? JSON.parse(order.items) 
      : (order.items as any[] || []);
    
    // Get all product IDs from items
    const productIds = items
      .map((item: any) => {
        // Convert to number if it's a string but contains only digits
        const productId = item.productId;
        if (typeof productId === 'string' && /^\d+$/.test(productId)) {
          return parseInt(productId, 10);
        }
        return productId;
      })
      .filter(Boolean);
    
    console.log('Product IDs:', productIds);
    
    // Fetch all products at once for better performance
    const products = productIds.length > 0 
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, images: true }
        })
      : [];
    
    console.log('Products found:', products.length);
    if (products.length > 0) {
      console.log('Sample product:', products[0]);
    }
    
    // Create a map for quick lookup
    const productMap = products.reduce((acc: Record<string, any>, product) => {
      acc[product.id] = product;
      return acc;
    }, {});
    
    // Fetch product details for each item to get accurate images
    const itemsWithDetails = await Promise.all(items.map(async (item: any) => {
      // Try to get product details from map
      const product = item.productId ? productMap[item.productId] : null;
      
      // Handle product images - extract first image from array or string
      let productImage = '/images/placeholder-product.jpg';
      
      if (product?.images) {
        console.log(`Product ${product.id} images:`, product.images);
        
        if (Array.isArray(product.images) && product.images.length > 0) {
          productImage = product.images[0];
        } else if (typeof product.images === 'string') {
          try {
            // Try to parse if it's a JSON string
            const parsedImages = JSON.parse(product.images);
            
            if (Array.isArray(parsedImages) && parsedImages.length > 0) {
              productImage = parsedImages[0];
            } else if (typeof parsedImages === 'string') {
              productImage = parsedImages;
            }
          } catch (e) {
            // If not valid JSON, use as is
            productImage = product.images;
          }
        }
      } else if (item.image) {
        productImage = item.image;
      } else if (item.productImage) {
        productImage = item.productImage;
      }
      
      // Ensure the productImage is a valid URL or path
      if (productImage && !productImage.startsWith('http') && !productImage.startsWith('/')) {
        productImage = `/uploads/products/${productImage}`;
      }
      
      // We don't need to convert to absolute URLs anymore since we're using Next.js Image component
      // which handles relative URLs properly
      
      return {
        id: item.id || `item-${Math.random().toString(36).substr(2, 9)}`,
        productId: item.productId || '',
        productName: item.name || item.productName || (product?.name || 'Unknown Product'),
        productImage: productImage,
        quantity: item.quantity || 1,
        price: item.price || 0,  // Return raw price value
        formattedPrice: formatCurrency(item.price || 0),  // Add formatted price separately
        selectedColor: item.selectedColor || item.color || null,
        selectedSize: item.selectedSize || item.size || null,
      };
    }));
    
    // Format address
    const address = order.address;
    let formattedAddress = {
      name: 'Not provided',
      phone: 'Not provided',
      address: 'Not provided',
      city: 'Not provided',
      province: 'Not provided',
      postalCode: 'Not provided',
      country: 'Not provided'
    };
    
    if (address) {
      formattedAddress = {
        name: address.name || 'Not provided',
        phone: address.phone || 'Not provided',
        address: address.address || 'Not provided',
        city: address.city || 'Not provided',
        province: address.province || 'Not provided',
        postalCode: address.postalCode || 'Not provided',
        country: address.country || 'Not provided'
      };
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
    
    // Format order data for response
    const formattedOrder = {
      id: order.id,
      customerId: order.userId,
      customerName: order.user.name || 'Unknown',
      customerEmail: order.user.email,
      status: order.status,
      total: formatCurrency(Number(order.total)),
      subtotal: formatCurrency(Number(order.total) * 0.9), // Estimate subtotal as 90% of total
      shipping: formatCurrency(Number(order.total) * 0.05), // Estimate shipping as 5% of total
      tax: formatCurrency(Number(order.total) * 0.05), // Estimate tax as 5% of total
      items: itemsWithDetails,
      paymentMethod: displayPaymentMethod,
      paymentId: order.paymentId || undefined,
      createdAt: format(order.createdAt, 'MMMM d, yyyy, h:mm a'),
      updatedAt: format(order.updatedAt, 'MMMM d, yyyy, h:mm a'),
      shippingAddress: formattedAddress,
    };
    
    return NextResponse.json(formattedOrder);
  } catch (error) {
    console.error('Error fetching order details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}

// Helper function to format currency
function formatCurrency(amount: number | string): string {
  // Convert string to number if needed
  let numericAmount: number;
  if (typeof amount === 'string') {
    // Remove any non-numeric characters except decimal point
    numericAmount = parseFloat(amount.replace(/[^0-9.-]+/g, ''));
  } else {
    numericAmount = amount;
  }
  
  // Handle NaN
  if (isNaN(numericAmount)) {
    return 'Rp 0';
  }
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(numericAmount);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const { id } = params;
    const { status } = await request.json();
    
    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
    });
    
    return NextResponse.json({
      message: 'Order status updated successfully',
      status: updatedOrder.status,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
} 