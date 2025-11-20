import { NextRequest, NextResponse } from "next/server";
import { handleCSRF, isCSRFExempt } from "@/lib/security/csrf";
import { applyRateLimit } from "@/lib/security/rateLimit";

/**
 * Middleware to enforce security best practices
 * 
 * This middleware:
 * 1. ✅ Enforces HTTPS/TLS in production
 * 2. ✅ Adds security headers (HSTS, CSP, etc.)
 * 3. ✅ CSRF Protection - Generates tokens for GET requests
 * 4. ✅ Rate Limiting - Applies to API routes
 * 
 * HOW IT WORKS:
 * - GET requests: Generate/refresh CSRF token, set in cookie and header
 * - POST/PUT/DELETE: CSRF validation happens in route handlers
 * - Rate limiting: Applied to API routes to prevent abuse
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProduction = process.env.NODE_ENV === "production";
  
  // Get protocol from URL or headers (for reverse proxies)
  const protocol = request.nextUrl.protocol;
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const host = request.headers.get("host");
  
  // Check if request is over HTTPS
  const isHttps = protocol === "https:" || forwardedProto === "https";
  
  // In production, enforce HTTPS redirect
  if (isProduction && !isHttps && host) {
    const httpsUrl = new URL(request.url);
    httpsUrl.protocol = "https:";
    
    // Redirect HTTP to HTTPS
    return NextResponse.redirect(httpsUrl, 301); // Permanent redirect
  }
  
  // ✅ CSRF Protection
  // Generate CSRF token for GET requests (skip validation for exempt routes)
  if (!isCSRFExempt(pathname)) {
    const csrfResponse = handleCSRF(request);
    if (csrfResponse) {
      // Add security headers to CSRF response
      addSecurityHeaders(csrfResponse, isHttps);
      return csrfResponse;
    }
  }
  
  // ✅ Rate Limiting for API routes
  if (pathname.startsWith('/api')) {
    const rateLimitResponse = applyRateLimit(request);
    if (rateLimitResponse) {
      addSecurityHeaders(rateLimitResponse, isHttps);
      return rateLimitResponse;
    }
  }
  
  // Create response
  const response = NextResponse.next();
  
  // ✅ Add security headers
  addSecurityHeaders(response, isHttps);
  
  return response;
}

/**
 * Adds security headers to the response
 */
function addSecurityHeaders(response: NextResponse, isHttps: boolean): void {
  // HSTS (HTTP Strict Transport Security)
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );
  
  // X-Content-Type-Options - Prevents MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");
  
  // X-Frame-Options - Prevents clickjacking
  response.headers.set("X-Frame-Options", "DENY");
  
  // X-XSS-Protection - Legacy XSS protection (modern browsers use CSP)
  response.headers.set("X-XSS-Protection", "1; mode=block");
  
  // Referrer-Policy - Controls referrer information
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // Permissions-Policy - Restricts browser features
  response.headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()"
  );
  
  // Add X-Forwarded-Proto header validation
  if (isHttps) {
    response.headers.set("X-Forwarded-Proto", "https");
  }
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

