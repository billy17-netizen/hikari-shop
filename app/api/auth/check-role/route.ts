import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../[...nextauth]/route';

export async function GET(request: Request) {
  try {
    console.log('Check role API called');
    const session = await getServerSession(authOptions);
    console.log('Session from getServerSession:', session);
    
    const url = new URL(request.url);
    const callbackUrl = url.searchParams.get('callbackUrl');
    
    if (!session) {
      console.log('No session found');
      return NextResponse.json({ 
        authenticated: false,
        message: 'Not authenticated' 
      });
    }
    
    console.log('User role from session:', session.user.role);
    
    // Admin users should always be redirected to admin dashboard
    let redirectTo = '/account';
    if (session.user.role === 'admin') {
      console.log('Admin role detected, setting redirect to /admin');
      redirectTo = '/admin';
    } else if (callbackUrl) {
      // Only use callback URL for non-admin users
      console.log('Using callback URL for non-admin:', callbackUrl);
      redirectTo = callbackUrl;
    }
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role || 'user'
      },
      redirectTo
    });
  } catch (error) {
    console.error('Error checking user role:', error);
    return NextResponse.json({ 
      authenticated: false,
      message: 'Error checking authentication status',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 