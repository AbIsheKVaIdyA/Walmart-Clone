import { NextRequest, NextResponse } from "next/server";
import { handleCSRF, isCSRFExempt } from "@/lib/security/csrf";
import { applyRateLimit } from "@/lib/security/rateLimit";

/**
 * Middleware to enforce security best practices
 * - Enforces HTTPS/TLS in production
 * - Adds security headers (HSTS, X-Frame-Options, etc.)
 * - CSRF Protection - Generates tokens for GET requests
 * - Rate Limiting - Applies to API routes
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProduction = process.env.NODE_ENV === "production";
  const host = request.headers.get("host") || "";
  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");
  
  // Get protocol from URL or headers (for reverse proxies)
  const protocol = request.nextUrl.protocol;
  const forwardedProto = request.headers.get("x-forwarded-proto");
  
  // For localhost, always allow HTTP (development)
  if (isLocalhost) {
    // If user accidentally accessed via HTTPS on localhost, redirect to HTTP
    if (protocol === "https:" && !isProduction) {
      const httpUrl = new URL(request.url);
      httpUrl.protocol = "http:";
      return NextResponse.redirect(httpUrl, 301);
    }
    // Treat localhost as HTTP for header purposes
    const response = NextResponse.next();
    addSecurityHeaders(response, false); // false = HTTP for localhost
    return response;
  }
  
  // Check if request is over HTTPS (for non-localhost)
  const isHttps = protocol === "https:" || forwardedProto === "https";
  
  // In production only (not localhost), enforce HTTPS redirect
  if (isProduction && !isHttps) {
    const httpsUrl = new URL(request.url);
    httpsUrl.protocol = "https:";
    return NextResponse.redirect(httpsUrl, 301);
  }
  
  // CSRF Protection - Generate token for GET requests (skip API routes)
  if (!isCSRFExempt(pathname) && !pathname.startsWith('/api')) {
    const csrfResponse = handleCSRF(request);
    if (csrfResponse) {
      addSecurityHeaders(csrfResponse, isHttps);
      return csrfResponse;
    }
  }
  
  // Rate Limiting for API routes
  if (pathname.startsWith('/api')) {
    const rateLimitResponse = applyRateLimit(request);
    if (rateLimitResponse) {
      addSecurityHeaders(rateLimitResponse, isHttps);
      return rateLimitResponse;
    }
  }
  
  // Create response
  const response = NextResponse.next();
  
  // Add security headers
  addSecurityHeaders(response, isHttps);
  
  return response;
}

/**
 * Adds security headers to the response
 */
function addSecurityHeaders(response: NextResponse, isHttps: boolean): void {
  const isProduction = process.env.NODE_ENV === "production";
  const host = response.headers.get("host") || "";
  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");
  
  // HSTS (HTTP Strict Transport Security) - Only in production with HTTPS
  if (isProduction && isHttps && !isLocalhost) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }
  
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
  if (isHttps && isProduction) {
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

