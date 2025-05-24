import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware is used for admin routes to ensure only admins can access them
export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware(req) {
    console.log('Middleware execution for:', req.nextUrl.pathname);
    
    // Log important data for debugging
    console.log('Headers:', JSON.stringify(Object.fromEntries(req.headers)));
    console.log('Auth token present:', !!req.nextauth?.token);
    
    if (req.nextauth?.token) {
      console.log('Token role:', req.nextauth.token.role);
    }
    
    // Redirect admin users to admin dashboard if they try to access user-specific pages
    if (req.nextauth?.token?.role === 'admin' && 
        (req.nextUrl.pathname.startsWith('/account') || 
         req.nextUrl.pathname.startsWith('/checkout') ||
         req.nextUrl.pathname.startsWith('/cart'))) {
      console.log('Redirecting admin to admin dashboard');
      return NextResponse.redirect(new URL('/admin', req.url));
    }
    
    // Forward the request for normal routes
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Log auth attempts
        console.log('Auth check for path:', req.nextUrl.pathname);
        console.log('Token present:', !!token);
        
        if (token) {
          console.log('Token data:', { id: token.id, role: token.role });
        }
        
        // Admin routes require admin role
        if (req.nextUrl.pathname.startsWith('/admin')) {
          const isAdmin = !!token && token.role === 'admin';
          console.log('Admin route access check:', isAdmin ? 'GRANTED' : 'DENIED');
          return isAdmin;
        }
        
        // Account routes require authentication
        if (req.nextUrl.pathname.startsWith('/account')) {
          const isAuthenticated = !!token;
          console.log('Account route access check:', isAuthenticated ? 'GRANTED' : 'DENIED');
          return isAuthenticated;
        }
        
        // Allow public routes
        return true;
      },
    },
  }
);

// Only apply this middleware to admin and account routes
export const config = { matcher: ['/admin/:path*', '/account/:path*', '/checkout/:path*', '/cart/:path*'] }; 