import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    
    // Skip middleware for static files and API routes
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api/auth') ||
      pathname.includes('.')
    ) {
      return NextResponse.next();
    }

    // Check if the path is protected
    const isProtected = 
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/projects') ||
      pathname.startsWith('/settings') ||
      pathname === '/';

    // Check if the path is auth-related
    const isAuthPath = pathname.startsWith('/auth');

    // Get authentication token
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET
    });
    
    // For debugging purposes
    console.log('Path:', pathname, 'Token exists:', !!token);
    
    // Redirect logic
    if (isProtected && !token) {
      // Redirect unauthenticated users to login page
      const url = new URL('/auth/signin', request.url);
      url.searchParams.set('callbackUrl', encodeURI(request.url));
      return NextResponse.redirect(url);
    }
    
    if (isAuthPath && token) {
      // Redirect authenticated users to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Redirect root to dashboard
    if (pathname === '/' && token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    if (pathname === '/' && !token) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    // On error, allow the request to proceed
    return NextResponse.next();
  }
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};