import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "./jwt";
import { JWTPayload, UserRole } from "@/typings/authTypings";

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

/**
 * Middleware to authenticate requests
 */
export function authenticate(
  request: NextRequest
): { user: JWTPayload; error: null } | { user: null; error: NextResponse } {
  try {
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        user: null,
        error: NextResponse.json(
          { error: "No authorization token provided" },
          { status: 401 }
        ),
      };
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    const payload = verifyAccessToken(token);

    return { user: payload, error: null };
  } catch (error) {
    return {
      user: null,
      error: NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      ),
    };
  }
}

/**
 * Middleware to check if user has required role
 */
export function requireRole(
  request: NextRequest,
  requiredRole: UserRole
): { user: JWTPayload; error: null } | { user: null; error: NextResponse } {
  const authResult = authenticate(request);
  
  if (authResult.error) {
    return authResult;
  }

  const { user } = authResult;
  
  if (user.role !== requiredRole) {
    return {
      user: null,
      error: NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      ),
    };
  }

  return { user, error: null };
}

/**
 * Middleware to check if user is admin
 */
export function requireAdmin(
  request: NextRequest
): { user: JWTPayload; error: null } | { user: null; error: NextResponse } {
  return requireRole(request, UserRole.ADMIN);
}


