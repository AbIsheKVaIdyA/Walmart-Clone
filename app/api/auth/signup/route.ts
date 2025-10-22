import { NextRequest, NextResponse } from 'next/server';
import { 
  findUserByEmail, 
  createUser, 
  generateAccessToken, 
  generateRefreshToken,
  validatePasswordStrength,
  validateEmail,
  logSecurityEvent,
  detectSuspiciousActivity,
  addSecurityHeaders
} from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    // Check for suspicious activity
    if (detectSuspiciousActivity(request)) {
      logSecurityEvent('SUSPICIOUS_ACTIVITY', { url: request.url }, request);
      return NextResponse.json(
        { success: false, error: 'Request blocked for security reasons' },
        { status: 403 }
      );
    }

    const { email, password, name, role } = await request.json();

    // Input validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate name (basic sanitization)
    const sanitizedName = name.trim().replace(/[<>]/g, '');
    if (sanitizedName.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Name must be at least 2 characters long' },
        { status: 400 }
      );
    }

    // Enhanced password strength validation
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Password does not meet requirements',
          details: passwordValidation.errors
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      logSecurityEvent('DUPLICATE_SIGNUP_ATTEMPT', { email }, request);
      return NextResponse.json(
        { success: false, error: 'User already exists with this email' },
        { status: 409 }
      );
    }

    // Create new user
    const newUser = await createUser(email, password, sanitizedName, role);

    // Generate tokens
    const accessToken = generateAccessToken(newUser.id, newUser.role);
    const refreshToken = generateRefreshToken(newUser.id);

    // Log successful signup
    logSecurityEvent('SUCCESSFUL_SIGNUP', { email, userId: newUser.id, role: newUser.role }, request);

    // Return user data (without password) and tokens
    const { id, email: userEmail, name: userName, role: userRole, createdAt, updatedAt } = newUser;
    const userData = { id, email: userEmail, name: userName, role: userRole, createdAt, updatedAt };

    const response = NextResponse.json({
      success: true,
      user: userData,
      accessToken,
      refreshToken,
    });

    // Add security headers
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Signup error:', error);
    logSecurityEvent('SIGNUP_ERROR', { error: error.message }, request);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
