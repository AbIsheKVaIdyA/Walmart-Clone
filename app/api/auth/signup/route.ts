import { NextRequest, NextResponse } from "next/server";
import { createUser, findUserByEmail } from "@/lib/auth/db";
import { generateAccessToken, generateRefreshToken } from "@/lib/auth/jwt";
import { getSecureCookieOptions } from "@/lib/auth/cookies";
import { SignupRequest, AuthResponse, UserRole } from "@/typings/authTypings";
import { validateCSRFToken } from "@/lib/security/csrf";
import { applyRateLimit, resetRateLimit, getClientIdentifier } from "@/lib/security/rateLimit";
import { validateEmail, validateName, validatePassword } from "@/lib/security/validation";

export async function POST(request: NextRequest) {
  try {
    if (!validateCSRFToken(request)) {
      return NextResponse.json(
        { error: "Invalid or missing CSRF token" },
        { status: 403 }
      );
    }

    const rateLimitResponse = applyRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body: SignupRequest = await request.json();
    const { email, name, password } = body;

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { error: emailValidation.error || "Invalid email format" },
        { status: 400 }
      );
    }

    const nameValidation = validateName(name);
    if (!nameValidation.isValid) {
      return NextResponse.json(
        { error: nameValidation.error || "Invalid name" },
        { status: 400 }
      );
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.error || "Invalid password" },
        { status: 400 }
      );
    }

    const sanitizedEmail = emailValidation.sanitized;
    const sanitizedName = nameValidation.sanitized;

    const existingUser = await findUserByEmail(sanitizedEmail);
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    const clientId = getClientIdentifier(request);
    resetRateLimit(clientId);

    let user;
    try {
      user = await createUser(sanitizedEmail, sanitizedName, password, UserRole.CUSTOMER);
    } catch (createError: any) {
      if (createError.message?.includes("already exists")) {
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 409 }
        );
      }
      throw createError;
    }

    const accessToken = generateAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id, user.email, user.role);

    const response: AuthResponse = {
      user,
      accessToken,
      refreshToken,
    };

    const nextResponse = NextResponse.json(response, { status: 201 });

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
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
