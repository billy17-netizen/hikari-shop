import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getUserAddresses, createAddress } from '@/lib/services/address';
import prisma from '@/lib/db';

// GET /api/addresses - Get all addresses for the current user
export async function GET() {
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Debug: Check if user ID exists in session
  console.log('Session user data:', JSON.stringify(session.user));
  
  try {
    let userId = session.user.id;
    
    // If user ID is missing from session, try to find it by email
    if (!userId) {
      console.log('User ID missing from session, looking up by email');
      
      // Find the user by email
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      });
      
      if (!user) {
        console.error('Could not find user with email:', session.user.email);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      userId = user.id;
      console.log('Found user ID from email lookup:', userId);
    }
    
    const addresses = await getUserAddresses(userId);
    return NextResponse.json(addresses);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
  }
}

// POST /api/addresses - Create a new address
export async function POST(request: Request) {
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const data = await request.json();
    
    let userId = session.user.id;
    
    // If user ID is missing from session, try to find it by email
    if (!userId) {
      console.log('User ID missing from session, looking up by email');
      
      // Find the user by email
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      });
      
      if (!user) {
        console.error('Could not find user with email:', session.user.email);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      userId = user.id;
    }
    
    // Add the userId to the data
    const addressData = {
      ...data,
      userId
    };
    
    const newAddress = await createAddress(addressData);
    return NextResponse.json(newAddress, { status: 201 });
  } catch (error) {
    console.error('Error creating address:', error);
    return NextResponse.json({ error: 'Failed to create address' }, { status: 500 });
  }
} 