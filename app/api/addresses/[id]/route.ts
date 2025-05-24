import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getAddress, updateAddress, deleteAddress } from '@/lib/services/address';
import prisma from '@/lib/db';

// Helper function to get userId from session, falling back to email lookup
async function getUserIdFromSession(session: any) {
  if (session?.user?.id) {
    return session.user.id;
  }
  
  if (!session?.user?.email) {
    return null;
  }
  
  console.log('Looking up user ID by email:', session.user.email);
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  });
  
  return user?.id || null;
}

// GET /api/addresses/[id] - Get a specific address
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const userId = await getUserIdFromSession(session);
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const address = await getAddress(params.id);
    
    if (!address) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }
    
    // Ensure the address belongs to the current user
    if (address.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    return NextResponse.json(address);
  } catch (error) {
    console.error('Error fetching address:', error);
    return NextResponse.json({ error: 'Failed to fetch address' }, { status: 500 });
  }
}

// PUT /api/addresses/[id] - Update an address
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const userId = await getUserIdFromSession(session);
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Parse the request data
    const data = await request.json();
    
    // First, get the address to verify ownership
    const existingAddress = await getAddress(params.id);
    
    if (!existingAddress) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }
    
    // Ensure the address belongs to the current user
    if (existingAddress.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const updatedAddress = await updateAddress(params.id, data);
    
    return NextResponse.json(updatedAddress);
  } catch (error) {
    console.error('Error updating address:', error);
    return NextResponse.json({ error: 'Failed to update address' }, { status: 500 });
  }
}

// DELETE /api/addresses/[id] - Delete an address
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const userId = await getUserIdFromSession(session);
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // First, get the address to verify ownership
    const existingAddress = await getAddress(params.id);
    
    if (!existingAddress) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }
    
    // Ensure the address belongs to the current user
    if (existingAddress.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    await deleteAddress(params.id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
  }
} 