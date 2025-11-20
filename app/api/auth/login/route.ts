import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/auth/db";
import { verifyPassword } from "@/lib/auth/password";
import { generateAccessToken, generateRefreshToken } from "@/lib/auth/jwt";
import { getSecureCookieOptions } from "@/lib/auth/cookies";
import { LoginRequest, AuthResponse } from "@/typings/authTypings";
import { validateCSRFToken } from "@/lib/security/csrf";
import { applyRateLimit, resetRateLimit, getClientIdentifier } from "@/lib/security/rateLimit";
import { validateEmail } from "@/lib/security/validation";
import {
  logFailedLogin,
  logSuccessfulLogin,
  logRateLimitExceeded,
  logCSRFValidationFailed,
  checkAndLogSuspiciousActivity,
} from "@/lib/security/logging";

export async function POST(request: NextRequest) {
  try {
    if (!validateCSRFToken(request)) {
      await logCSRFValidationFailed(request, "/api/auth/login");
      return NextResponse.json(
        { error: "Invalid or missing CSRF token" },
        { status: 403 }
      );
    }

    const rateLimitResponse = applyRateLimit(request);
    if (rateLimitResponse) {
      // Log rate limit exceeded
      await logRateLimitExceeded(request, "/api/auth/login", 5, 15 * 60 * 1000);
      return rateLimitResponse;
    }

    const body: LoginRequest = await request.json();
    const { email, password } = body;

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { error: emailValidation.error || "Invalid email format" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = emailValidation.sanitized;
    const user = await findUserByEmail(normalizedEmail);

    if (!user || !user.password) {
      // Log failed login attempt
      await logFailedLogin(request, normalizedEmail, "User not found or invalid");
      // Check for suspicious activity
      await checkAndLogSuspiciousActivity(request, normalizedEmail, 1);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isValidPassword = await verifyPassword(password, user.password);
    
    if (!isValidPassword) {
      // Log failed login attempt
      await logFailedLogin(request, normalizedEmail, "Invalid password");
      // Check for suspicious activity
      await checkAndLogSuspiciousActivity(request, normalizedEmail, 1);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const clientId = getClientIdentifier(request);
    resetRateLimit(clientId);

    // Log successful login
    await logSuccessfulLogin(request, user.id, user.email);

    const accessToken = generateAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id, user.email, user.role);

    const { password: _, ...userWithoutPassword } = user;

    const response: AuthResponse = {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };

    const nextResponse = NextResponse.json(response, { status: 200 });

    nextResponse.cookies.set(
      "accessToken",
      accessToken,
      getSecureCookieOptions(request, 15 * 60)
    );

    nextResponse.cookies.set(
      "refreshToken",
      refreshToken,
      getSecureCookieOptions(request, 7 * 24 * 60 * 60)
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
