/**
 * Rate Limiting Middleware
 * Prevents brute-force attacks by limiting requests within a time window.
 * Uses in-memory storage (use Redis for production with multiple servers).
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests allowed in window
  message?: string; // Custom error message
  identifier?: (request: NextRequest) => string; // Function to get unique identifier
}

/**
 * Default rate limit configurations for different endpoints
 */
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // Login endpoint: 5 attempts per 15 minutes
  '/api/auth/login': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
  // Signup endpoint: 3 attempts per hour
  '/api/auth/signup': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many signup attempts. Please try again in an hour.',
  },
  // General API: 100 requests per 15 minutes
  '/api': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests. Please slow down.',
  },
};

/**
 * Rate limit entry stored in memory
 */
interface RateLimitEntry {
  count: number;
  resetTime: number; // Timestamp when the window resets
  firstRequest: number; // Timestamp of first request in window
}

/**
 * In-memory store for rate limit data
 * Use Redis for production with multiple servers
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

setInterval(() => {
  const now = Date.now();
  // Convert to array to avoid iteration issues
  const entries = Array.from(rateLimitStore.entries());
  for (const [key, entry] of entries) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

/**
 * Gets the client identifier for rate limiting
 * Uses IP address by default
 * 
 * @param request - Next.js request object
 * @returns Unique identifier string
 */
export function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from headers (for reverse proxies)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0]?.trim() || realIp || request.ip || 'unknown';

  return `rate-limit:${ip}`;
}

/**
 * Checks if a request should be rate limited
 * 
 * @param request - Next.js request object
 * @param config - Rate limit configuration
 * @returns Object with isLimited flag and response if limited
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): {
  isLimited: boolean;
  response?: NextResponse;
  remaining?: number;
  resetTime?: number;
} {
  const identifier = config.identifier
    ? config.identifier(request)
    : getClientIdentifier(request);

  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // No entry exists, create new one
  if (!entry) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
      firstRequest: now,
    });

    return {
      isLimited: false,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  // Entry exists but window has expired, reset
  if (entry.resetTime < now) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
      firstRequest: now,
    });

    return {
      isLimited: false,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  // Entry exists and window is active
  entry.count++;

  // Check if limit exceeded
  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000); // seconds

    const response = NextResponse.json(
      {
        error: config.message || 'Too many requests',
        retryAfter,
      },
      { status: 429 }
    );

    // Set standard rate limit headers
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', '0');
    response.headers.set('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());
    response.headers.set('Retry-After', retryAfter.toString());

    return {
      isLimited: true,
      response,
    };
  }

  // Limit not exceeded, update entry
  rateLimitStore.set(identifier, entry);

  return {
    isLimited: false,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Applies rate limiting to a request based on the path
 * 
 * @param request - Next.js request object
 * @returns NextResponse if rate limited, null otherwise
 */
export function applyRateLimit(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname;

  // Find matching rate limit config
  let config: RateLimitConfig | null = null;

  // Check for exact path match first
  if (RATE_LIMIT_CONFIGS[pathname]) {
    config = RATE_LIMIT_CONFIGS[pathname];
  } else {
    // Check for prefix match (e.g., /api matches /api/auth/login)
    for (const [path, pathConfig] of Object.entries(RATE_LIMIT_CONFIGS)) {
      if (pathname.startsWith(path)) {
        config = pathConfig;
        break;
      }
    }
  }

  // No rate limit config found, allow request
  if (!config) {
    return null;
  }

  // Check rate limit
  const result = checkRateLimit(request, config);

  if (result.isLimited && result.response) {
    return result.response;
  }

  // Add rate limit headers to successful requests
  if (result.remaining !== undefined && result.resetTime !== undefined) {
    // Headers will be added by the route handler
    return null;
  }

  return null;
}

/**
 * Resets rate limit for a specific identifier
 * Useful for admin actions or after successful authentication
 * 
 * @param identifier - Client identifier
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Gets rate limit status for a client
 * Useful for displaying remaining attempts to users
 * 
 * @param request - Next.js request object
 * @param config - Rate limit configuration
 * @returns Rate limit status
 */
export function getRateLimitStatus(
  request: NextRequest,
  config: RateLimitConfig
): {
  remaining: number;
  resetTime: number;
  limit: number;
} {
  const identifier = config.identifier
    ? config.identifier(request)
    : getClientIdentifier(request);

  const entry = rateLimitStore.get(identifier);
  const now = Date.now();

  if (!entry || entry.resetTime < now) {
    return {
      remaining: config.maxRequests,
      resetTime: now + config.windowMs,
      limit: config.maxRequests,
    };
  }

  return {
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetTime: entry.resetTime,
    limit: config.maxRequests,
  };
}



