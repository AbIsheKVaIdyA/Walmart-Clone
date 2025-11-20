import { NextRequest, NextResponse } from "next/server";
import { getClearCookieOptions } from "@/lib/auth/cookies";

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 }
    );

    // Clear cookies with secure options
    response.cookies.set("accessToken", "", getClearCookieOptions(request));
    response.cookies.set("refreshToken", "", getClearCookieOptions(request));

    return response;
  } catch (error: any) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


