/**
 * Next.js Proxy (Middleware)
 * Handles authentication with development bypass support
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Check for development bypass
  const isDevelopment = process.env.NODE_ENV === 'development';
  const hasDevBypass = searchParams.get('dev_bypass') === 'true';

  if (isDevelopment && hasDevBypass) {
    // Log the bypass for debugging
    console.log('[Proxy] Development bypass active for:', pathname);

    // Set a cookie to indicate dev bypass is active
    const response = NextResponse.next();
    response.cookies.set('dev_bypass_active', 'true', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
