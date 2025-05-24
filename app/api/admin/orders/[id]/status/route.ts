import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Support both PUT and PATCH methods for backward compatibility
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return updateOrderStatus(request, params);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return updateOrderStatus(request, params);
}

// Shared function to handle both PUT and PATCH requests
async function updateOrderStatus(
  request: NextRequest,
  params: { id: string }
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