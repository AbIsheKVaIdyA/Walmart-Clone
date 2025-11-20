import { NextRequest, NextResponse } from "next/server";
import { createUser, findUserByEmail } from "@/lib/auth/db";
import { generateAccessToken, generateRefreshToken } from "@/lib/auth/jwt";
import { getSecureCookieOptions } from "@/lib/auth/cookies";
import { SignupRequest, AuthResponse, UserRole } from "@/typings/authTypings";
import { validateCSRFToken } from "@/lib/security/csrf";
import { applyRateLimit, RATE_LIMIT_CONFIGS, resetRateLimit, getClientIdentifier } from "@/lib/security/rateLimit";
import { validateEmail, validateName, validatePassword } from "@/lib/security/validation";

/**
 * POST /api/auth/signup
 * 
 * SECURITY FEATURES IMPLEMENTED:
 * 1. ✅ CSRF Protection - Validates CSRF token from header
 * 2. ✅ Rate Limiting - Limits signup attempts to 3 per hour
 * 3. ✅ Input Validation - Validates email, name, and password
 * 4. ✅ XSS Prevention - All inputs are sanitized before use
 * 
 * HOW IT WORKS:
 * - CSRF token must be present in X-CSRF-Token header
 * - Rate limit: 3 signups per hour per IP
 * - Email, name, and password are validated and sanitized
 * - On successful signup, rate limit is reset for that IP
 */
export async function POST(request: NextRequest) {
  try {
    // ✅ Step 1: CSRF Protection
    if (!validateCSRFToken(request)) {
      return NextResponse.json(
        { error: "Invalid or missing CSRF token" },
        { status: 403 }
      );
    }

    // ✅ Step 2: Rate Limiting
    const rateLimitConfig = RATE_LIMIT_CONFIGS['/api/auth/signup'];
    const rateLimitResponse = applyRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Parse request body
    const body: SignupRequest = await request.json();
    const { email, name, password } = body;

    // ✅ Step 3: Input Validation and Sanitization
    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { error: emailValidation.error || "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate name
    const nameValidation = validateName(name);
    if (!nameValidation.isValid) {
      return NextResponse.json(
        { error: nameValidation.error || "Invalid name" },
        { status: 400 }
      );
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.error || "Invalid password" },
        { status: 400 }
      );
    }

    // Use sanitized values
    const sanitizedEmail = emailValidation.sanitized;
    const sanitizedName = nameValidation.sanitized;

    // Check if user already exists
    const existingUser = await findUserByEmail(sanitizedEmail);
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // ✅ Step 4: Reset rate limit on successful signup
    const clientId = getClientIdentifier(request);
    resetRateLimit(clientId);

    // Create user (default role is CUSTOMER)
    // Use sanitized email and name to prevent XSS
    let user;
    try {
      user = await createUser(sanitizedEmail, sanitizedName, password, UserRole.CUSTOMER);
    } catch (createError: any) {
      // Handle duplicate email error from createUser
      if (createError.message?.includes("already exists")) {
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 409 }
        );
      }
      throw createError;
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id, user.email, user.role);

    const response: AuthResponse = {
      user,
      accessToken,
      refreshToken,
    };

    // Create response with tokens in httpOnly cookies
    const nextResponse = NextResponse.json(response, { status: 201 });

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
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

