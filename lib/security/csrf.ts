/**
 * CSRF (Cross-Site Request Forgery) Protection
 * 
 * Uses double-submit cookie pattern:
 * - Token stored in httpOnly cookie and sent in X-CSRF-Token header
 * - Server validates both tokens match for state-changing requests
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

/**
 * Gets the CSRF token from the request cookie
 * 
 * @param request - Next.js request object
 * @returns CSRF token if present, null otherwise
 */
export function getCSRFTokenFromCookie(request: NextRequest): string | null {
  return request.cookies.get(CSRF_TOKEN_COOKIE_NAME)?.value || null;
}

/**
 * Gets the CSRF token from the request header
 * 
 * @param request - Next.js request object
 * @returns CSRF token if present, null otherwise
 */
export function getCSRFTokenFromHeader(request: NextRequest): string | null {
  return request.headers.get(CSRF_TOKEN_HEADER_NAME) || null;
}

/**
 * Sets the CSRF token in the response cookie
 * 
 * @param response - Next.js response object
 * @param token - CSRF token to set
 * @param request - Next.js request object (for HTTPS detection)
 */
export function setCSRFTokenCookie(
  response: NextResponse,
  token: string,
  request: NextRequest
): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const protocol = request.nextUrl.protocol;
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const isHttps = protocol === 'https:' || forwardedProto === 'https';

  response.cookies.set(CSRF_TOKEN_COOKIE_NAME, token, {
    httpOnly: true, // Prevents JavaScript access (XSS protection)
    secure: isProduction && isHttps, // Only send over HTTPS in production
    sameSite: 'strict', // Prevents CSRF attacks
    maxAge: CSRF_TOKEN_EXPIRY / 1000, // Convert to seconds
    path: '/',
  });
}

/**
 * Validates the CSRF token from the request
 * Uses the "double-submit cookie" pattern:
 * - Token must be present in both cookie AND header/body
 * - Both tokens must match
 * 
 * @param request - Next.js request object
 * @returns true if token is valid, false otherwise
 */
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

/**
 * Constant-time string comparison to prevent timing attacks
 * Compares strings character by character without short-circuiting
 * 
 * @param a - First string
 * @param b - Second string
 * @returns true if strings are equal, false otherwise
 */
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

/**
 * Middleware to generate and set CSRF token for GET requests
 * and validate CSRF token for state-changing requests
 * 
 * @param request - Next.js request object
 * @returns NextResponse with CSRF token set, or error response if validation fails
 */
export function handleCSRF(request: NextRequest): NextResponse | null {
  const method = request.method;
  const existingToken = getCSRFTokenFromCookie(request);

  // For GET requests, generate/refresh token
  if (method === 'GET') {
    const token = existingToken || generateCSRFToken();
    const response = NextResponse.next();
    setCSRFTokenCookie(response, token, request);
    // Also set token in response header for client to read
    response.headers.set(CSRF_TOKEN_HEADER_NAME, token);
    return response;
  }

  // For state-changing requests, validate token
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    if (!validateCSRFToken(request)) {
      return NextResponse.json(
        { error: 'Invalid or missing CSRF token' },
        { status: 403 }
      );
    }
  }

  // Token is valid, continue with request
  return null;
}

/**
 * Checks if a route should be exempt from CSRF protection
 * Some routes like public APIs might not need CSRF protection
 * 
 * @param pathname - Request pathname
 * @returns true if route should be exempt, false otherwise
 */
export function isCSRFExempt(pathname: string): boolean {
  // Add paths that should be exempt from CSRF protection
  // For example, webhooks that use their own authentication
  const exemptPaths: string[] = [
    // Add exempt paths here if needed
  ];

  return exemptPaths.some(path => pathname.startsWith(path));
}

