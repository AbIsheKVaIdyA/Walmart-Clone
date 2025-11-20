/**
 * CSRF Protection using double-submit cookie pattern
 */

import { NextRequest, NextResponse } from 'next/server';

const CSRF_TOKEN_COOKIE_NAME = 'csrf-token';
const CSRF_TOKEN_HEADER_NAME = 'X-CSRF-Token';
const CSRF_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function getCSRFTokenFromCookie(request: NextRequest): string | null {
  return request.cookies.get(CSRF_TOKEN_COOKIE_NAME)?.value || null;
}

export function getCSRFTokenFromHeader(request: NextRequest): string | null {
  return request.headers.get(CSRF_TOKEN_HEADER_NAME) || null;
}

export function setCSRFTokenCookie(
  response: NextResponse,
  token: string,
  request: NextRequest
): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const host = request.headers.get('host') || '';
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
  const protocol = request.nextUrl.protocol;
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const isHttps = protocol === 'https:' || forwardedProto === 'https';

  response.cookies.set(CSRF_TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction && isHttps && !isLocalhost,
    sameSite: 'strict',
    maxAge: CSRF_TOKEN_EXPIRY / 1000,
    path: '/',
  });
}

export function validateCSRFToken(request: NextRequest): boolean {
  const cookieToken = getCSRFTokenFromCookie(request);
  const headerToken = getCSRFTokenFromHeader(request);

  // Both tokens must be present
  if (!cookieToken || !headerToken) {
    return false;
  }

  // Tokens must match (constant-time comparison to prevent timing attacks)
  return constantTimeEquals(cookieToken, headerToken);
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

export function handleCSRF(request: NextRequest): NextResponse | null {
  const method = request.method;
  const existingToken = getCSRFTokenFromCookie(request);

  if (method === 'GET') {
    const token = existingToken || generateCSRFToken();
    const response = NextResponse.next();
    setCSRFTokenCookie(response, token, request);
    response.headers.set(CSRF_TOKEN_HEADER_NAME, token);
    return response;
  }

  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    if (!validateCSRFToken(request)) {
      return NextResponse.json(
        { error: 'Invalid or missing CSRF token' },
        { status: 403 }
      );
    }
  }

  return null;
}

export function isCSRFExempt(pathname: string): boolean {
  const exemptPaths: string[] = [
    '/api/csrf-token',
  ];

  return exemptPaths.some(path => pathname.startsWith(path));
}

