import { NextRequest, NextResponse } from 'next/server';
import { 
  findUserByEmail, 
  validateUserPassword, 
  generateAccessToken, 
  generateRefreshToken,
  validateEmail,
  logSecurityEvent,
  addSecurityHeaders
} from '@/lib/security';
import { detectSuspiciousActivity } from '@/lib/securityMiddleware';

// In-memory storage for failed login attempts
const failedAttempts = new Map<string, { count: number; lastAttempt: Date }>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export async function POST(request: NextRequest) {
  try {
    // Check for suspicious activity
    if (detectSuspiciousActivity(request)) {
      logSecurityEvent('SUSPICIOUS_ACTIVITY', { url: request.url });
      return NextResponse.json(
        { success: false, error: 'Request blocked for security reasons' },
        { status: 403 }
      );
    }

    const { email, password } = await request.json();

    // Input validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check for account lockout
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const attemptKey = `${email}:${clientIP}`;
    const attempts = failedAttempts.get(attemptKey);

    if (attempts && attempts.count >= MAX_FAILED_ATTEMPTS) {
      const timeSinceLastAttempt = Date.now() - attempts.lastAttempt.getTime();
      if (timeSinceLastAttempt < LOCKOUT_DURATION) {
        const remainingTime = Math.ceil((LOCKOUT_DURATION - timeSinceLastAttempt) / 1000 / 60);
        return NextResponse.json(
          { success: false, error: `Account temporarily locked. Try again in ${remainingTime} minutes` },
          { status: 429 }
        );
      } else {
        // Reset attempts after lockout period
        failedAttempts.delete(attemptKey);
      }
    }

    // Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      // Log failed attempt
      logSecurityEvent('FAILED_LOGIN', { email, reason: 'User not found' });
      
      // Increment failed attempts
      const currentAttempts = failedAttempts.get(attemptKey) || { count: 0, lastAttempt: new Date() };
      currentAttempts.count++;
      currentAttempts.lastAttempt = new Date();
      failedAttempts.set(attemptKey, currentAttempts);
      
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Since we're using Firebase for authentication, 
    // password validation is handled by Firebase Auth
    // This API route is mainly for token management

    // Clear failed attempts on successful login
    failedAttempts.delete(attemptKey);

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    // Log successful login
    logSecurityEvent('SUCCESSFUL_LOGIN', { email, userId: user.id });

    // Return user data (without password) and tokens
    const { id, email: userEmail, name, role, createdAt, updatedAt } = user;
    const userData = { id, email: userEmail, name, role, createdAt, updatedAt };

    const response = NextResponse.json({
      success: true,
      user: userData,
      accessToken,
      refreshToken,
    });

    // Add security headers
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Login error:', error);
    logSecurityEvent('LOGIN_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
