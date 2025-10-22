import { NextRequest, NextResponse } from 'next/server';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { verifyAccessToken } from './security';
import { UserRole } from '@/typings/authTypings';

// Rate limiting configurations
export const createRateLimit = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Specific rate limits for different endpoints
export const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts per window
  'Too many authentication attempts, please try again later'
);

export const apiRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests per window
  'Too many API requests, please try again later'
);

export const strictRateLimit = createRateLimit(
  5 * 60 * 1000, // 5 minutes
  3, // 3 attempts per window
  'Too many attempts, please try again later'
);

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

// Authentication middleware
export const authenticateToken = (req: NextRequest): { userId: string; role: UserRole } | null => {
  const authHeader = req.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return null;
  }

  return verifyAccessToken(token);
};

// Role-based access control middleware
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: NextRequest): NextResponse | null => {
    const auth = authenticateToken(req);
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!allowedRoles.includes(auth.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return null;
  };
};

// Admin-only middleware
export const requireAdmin = requireRole([UserRole.ADMIN]);

// Customer and Admin middleware
export const requireAuth = requireRole([UserRole.CUSTOMER, UserRole.ADMIN]);

// Input validation middleware
export const validateInput = (req: NextRequest, validationRules: any) => {
  // This would integrate with express-validator in a real Express app
  // For Next.js API routes, we'll implement validation in each route
  return true;
};

// CSRF protection middleware
export const csrfProtection = (req: NextRequest): boolean => {
  const csrfToken = req.headers.get('x-csrf-token');
  const sessionToken = req.headers.get('x-session-token');
  
  if (!csrfToken || !sessionToken) {
    return false;
  }
  
  return csrfToken === sessionToken;
};

// Request logging for security monitoring
export const logSecurityEvent = (event: string, details: any, req: NextRequest) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
    userAgent: req.headers.get('user-agent') || 'unknown',
    url: req.url,
    method: req.method
  };
  
  console.log('SECURITY_EVENT:', JSON.stringify(logEntry));
  
  // In production, send to logging service
  // sendToLoggingService(logEntry);
};

// Suspicious activity detection
export const detectSuspiciousActivity = (req: NextRequest): boolean => {
  const userAgent = req.headers.get('user-agent') || '';
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
  
  // Check for common attack patterns
  const suspiciousPatterns = [
    /script.*alert/i,
    /union.*select/i,
    /<script/i,
    /javascript:/i,
    /onload=/i,
    /onerror=/i
  ];
  
  const url = req.url.toLowerCase();
  const body = req.body ? JSON.stringify(req.body).toLowerCase() : '';
  
  return suspiciousPatterns.some(pattern => 
    pattern.test(url) || pattern.test(body) || pattern.test(userAgent)
  );
};

// Security response headers
export const addSecurityHeaders = (response: NextResponse): NextResponse => {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  return response;
};
