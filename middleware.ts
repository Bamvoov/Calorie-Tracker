import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

// Define paths that don't require authentication
const publicPaths = ['/login', '/signup', '/api/auth/login', '/api/auth/signup', '/setup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static files and internal Next.js assets
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon.ico')) {
    return NextResponse.next();
  }

  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'));
  
  const token = request.cookies.get('token')?.value;
  let payload = null;

  if (token) {
    payload = await verifyToken(token);
  }

  // Redirect to login if accessing a protected route without valid token
  if (!isPublicPath && (!token || !payload)) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if logged in and trying to access login/signup
  if (isPublicPath && payload && (pathname === '/login' || pathname === '/signup')) {
    const dashboardUrl = new URL('/', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Next.js middleware currently can't easily pass custom values directly to API routes,
  // but it ensures the cookie is valid. API routes will re-verify the token to get userId.
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
