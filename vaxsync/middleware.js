import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Routes that require authentication
const protectedRoutes = [
  '/pages/RuralHealthMidwife',
  '/pages/PublicHealthNurse',
];

// Routes that are always public (no auth needed)
const publicRoutes = [
  '/pages/signin',
  '/pages/signup',
  '/pages/forgot-password',
  '/pages/registration-success',
  '/api/auth',
  '/api/signup',
];

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Skip middleware for public routes
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check if this is a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtectedRoute) {
    // Check for any Supabase auth cookies
    const allCookies = request.cookies.getAll();
    
    // Supabase cookie names vary by project - look for common patterns
    const hasSupabaseAuth = allCookies.some(cookie => {
      const name = cookie.name.toLowerCase();
      return (
        name.includes('sb-') ||
        name.includes('supabase') ||
        name.includes('auth-token') ||
        name.includes('access-token') ||
        name.includes('refresh-token')
      );
    });

    // Also check localStorage indicator via a custom cookie we'll set
    const hasLocalAuth = request.cookies.get('vaxsync_authenticated')?.value === 'true';

    // If no auth found, redirect to signin
    if (!hasSupabaseAuth && !hasLocalAuth) {
      console.log('No auth cookie found, redirecting to signin from:', pathname);
      console.log('Available cookies:', allCookies.map(c => c.name));
      const signinUrl = new URL('/pages/signin', siteUrl);
      signinUrl.searchParams.set('redirect', pathname);
      const response = NextResponse.redirect(signinUrl);
      // Add no-cache headers to prevent caching
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      return response;
    }
    
    // Add no-cache headers to protected routes to prevent back-button access
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    return response;
  }

  // Add no-cache headers to signin page as well
  if (pathname.startsWith('/pages/signin')) {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) - except we handle /api/auth separately
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
};
