import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const pathname = request.nextUrl.pathname;

  // Check if the path starts with /admin (but not /admin/login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    // Get the token from the request headers or cookies
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('auth-token')?.value;

    // If no token, redirect to admin login page
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // You could also verify the token here if needed
    // For now, we'll let the page component handle the verification
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
};
