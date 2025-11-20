import { NextRequest } from "next/server";

/**
 * Check if the request is over HTTPS
 * Handles various proxy scenarios (Vercel, Cloudflare, etc.)
 */
export function isHttps(request: NextRequest): boolean {
  // Check the protocol from the URL
  const protocol = request.nextUrl.protocol;
  
  // Check X-Forwarded-Proto header (common in reverse proxies)
  const forwardedProto = request.headers.get("x-forwarded-proto");
  
  // Check if we're in production
  const isProduction = process.env.NODE_ENV === "production";
  
  // In production, always require HTTPS
  if (isProduction) {
    return protocol === "https:" || forwardedProto === "https";
  }
  
  // In development, check if HTTPS is explicitly used
  return protocol === "https:" || forwardedProto === "https";
}

/**
 * Get secure cookie options with proper HTTPS detection
 * 
 * @param request - The NextRequest object to check HTTPS status
 * @param maxAge - Cookie max age in seconds
 * @param sameSite - SameSite attribute ('strict', 'lax', or 'none')
 * @returns Cookie options with secure attributes
 */
export function getSecureCookieOptions(
  request: NextRequest,
  maxAge: number,
  sameSite: "strict" | "lax" | "none" = "lax"
) {
  const isSecure = isHttps(request);
  const isProduction = process.env.NODE_ENV === "production";
  
  return {
    httpOnly: true,
    secure: isSecure || isProduction, // Require secure in production or when HTTPS is detected
    sameSite: sameSite as "strict" | "lax" | "none",
    maxAge,
    path: "/",
  };
}

/**
 * Get secure cookie options for clearing cookies (logout)
 * 
 * @param request - The NextRequest object to check HTTPS status
 * @returns Cookie options for clearing cookies
 */
export function getClearCookieOptions(request: NextRequest) {
  const isSecure = isHttps(request);
  const isProduction = process.env.NODE_ENV === "production";
  
  return {
    httpOnly: true,
    secure: isSecure || isProduction,
    sameSite: "lax" as const,
    maxAge: 0,
    path: "/",
  };
}



