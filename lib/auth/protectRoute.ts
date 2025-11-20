import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "./jwt";
import { UserRole } from "@/typings/authTypings";

/**
 * Protect a route - requires authentication
 */
export async function protectRoute(
  request: NextRequest
): Promise<{ user: any; error: NextResponse | null } | NextResponse> {
  const token =
    request.cookies.get("accessToken")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
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
 * Protect a route - requires admin role
 */
export async function protectAdminRoute(request: NextRequest) {
  const authResult = await protectRoute(request);

  // Check if it's a NextResponse (error case)
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // Check if there's an error in the result object
  if (authResult.error) {
    return authResult.error;
  }

  const { user } = authResult;

  if (user.role !== UserRole.ADMIN) {
    return {
      user: null,
      error: NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      ),
    };
  }

  return { user, error: null };
}


