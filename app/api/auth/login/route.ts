import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/auth/db";
import { verifyPassword } from "@/lib/auth/password";
import { generateAccessToken, generateRefreshToken } from "@/lib/auth/jwt";
import { getSecureCookieOptions } from "@/lib/auth/cookies";
import { LoginRequest, AuthResponse } from "@/typings/authTypings";
import { validateCSRFToken } from "@/lib/security/csrf";
import { applyRateLimit, RATE_LIMIT_CONFIGS, resetRateLimit, getClientIdentifier } from "@/lib/security/rateLimit";
import { validateEmail } from "@/lib/security/validation";

/**
 * POST /api/auth/login
 * 
 * SECURITY FEATURES IMPLEMENTED:
 * 1. ✅ CSRF Protection - Validates CSRF token from header
 * 2. ✅ Rate Limiting - Limits login attempts to 5 per 15 minutes
 * 3. ✅ Input Validation - Validates and sanitizes email input
 * 4. ✅ XSS Prevention - Email is sanitized before use
 * 
 * HOW IT WORKS:
 * - CSRF token must be present in X-CSRF-Token header
 * - Rate limit: 5 attempts per 15 minutes per IP
 * - Email is validated and normalized
 * - On successful login, rate limit is reset for that IP
 */
export async function POST(request: NextRequest) {
  try {
    // ✅ Step 1: CSRF Protection
    // Validate CSRF token to prevent cross-site request forgery
    if (!validateCSRFToken(request)) {
      return NextResponse.json(
        { error: "Invalid or missing CSRF token" },
        { status: 403 }
      );
    }

    // ✅ Step 2: Rate Limiting
    // Prevent brute-force attacks by limiting login attempts
    const rateLimitConfig = RATE_LIMIT_CONFIGS['/api/auth/login'];
    const rateLimitResponse = applyRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Parse and validate request body
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    // ✅ Step 3: Input Validation and Sanitization
    // Validate email format and sanitize to prevent XSS
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { error: emailValidation.error || "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password is provided
    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    // Use sanitized email
    const normalizedEmail = emailValidation.sanitized;

    // Find user
    const user = await findUserByEmail(normalizedEmail);
    if (!user) {
      console.error('🔴 LOGIN DEBUG: User not found for email:', normalizedEmail);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    console.log('🟢 LOGIN DEBUG: User found:', {
      id: user.id,
      email: user.email,
      hasPassword: !!user.password,
      passwordLength: user.password?.length || 0,
      passwordStartsWith: user.password?.substring(0, 7) || 'N/A',
      passwordType: typeof user.password,
    });

    // Debug: Check if password field exists (remove in production)
    if (!user.password) {
      console.error('🔴 LOGIN DEBUG: User found but password field is missing or empty');
      console.error('🔴 LOGIN DEBUG: User object:', JSON.stringify(user, null, 2));
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    console.log('🟡 LOGIN DEBUG: Attempting password verification...');
    console.log('🟡 LOGIN DEBUG: Input password length:', password.length);
    console.log('🟡 LOGIN DEBUG: Stored hash starts with:', user.password.substring(0, 20));
    
    const isValidPassword = await verifyPassword(password, user.password);
    
    console.log('🟡 LOGIN DEBUG: Password verification result:', isValidPassword);
    
    if (!isValidPassword) {
      console.error('🔴 LOGIN DEBUG: Password verification FAILED');
      console.error('🔴 LOGIN DEBUG: User email:', user.email);
      console.error('🔴 LOGIN DEBUG: Stored hash:', user.password.substring(0, 30) + '...');
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    console.log('✅ LOGIN DEBUG: Password verification SUCCESS!');

    // ✅ Step 4: Reset rate limit on successful login
    // This allows legitimate users to continue using the service
    const clientId = getClientIdentifier(request);
    resetRateLimit(clientId);

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id, user.email, user.role);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    const response: AuthResponse = {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };

    // Create response with tokens in httpOnly cookies
    const nextResponse = NextResponse.json(response, { status: 200 });

    // Set secure httpOnly cookies for tokens with HTTPS detection
    nextResponse.cookies.set(
      "accessToken",
      accessToken,
      getSecureCookieOptions(request, 15 * 60) // 15 minutes
    );

    nextResponse.cookies.set(
      "refreshToken",
      refreshToken,
      getSecureCookieOptions(request, 7 * 24 * 60 * 60) // 7 days
    );

    return nextResponse;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

