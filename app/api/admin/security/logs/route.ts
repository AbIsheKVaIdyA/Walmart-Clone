import { NextRequest, NextResponse } from "next/server";
import { protectAdminRoute } from "@/lib/auth/protectRoute";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/security/logs
 * Get security logs with filtering and pagination
 * Admin only
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await protectAdminRoute(request);
    // Check if it's a NextResponse (error case)
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    // Check if there's an error in the result object
    if (authResult.error) {
      return authResult.error;
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const eventType = searchParams.get("eventType");
    const severity = searchParams.get("severity");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const email = searchParams.get("email");
    const ipAddress = searchParams.get("ipAddress");

    const offset = (page - 1) * limit;

    const supabase = createAdminClient();
    let query = supabase
      .from("security_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (eventType) {
      query = query.eq("event_type", eventType);
    }
    if (severity) {
      query = query.eq("severity", severity);
    }
    if (startDate) {
      query = query.gte("created_at", startDate);
    }
    if (endDate) {
      query = query.lte("created_at", endDate);
    }
    if (email) {
      query = query.ilike("email", `%${email}%`);
    }
    if (ipAddress) {
      query = query.eq("ip_address", ipAddress);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching security logs:", error);
      return NextResponse.json(
        { error: "Failed to fetch security logs" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        logs: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in security logs endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

