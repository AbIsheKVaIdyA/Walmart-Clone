import { NextRequest, NextResponse } from "next/server";
import { protectAdminRoute } from "@/lib/auth/protectRoute";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/security/metrics
 * Get security metrics and statistics
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
    const hours = parseInt(searchParams.get("hours") || "24"); // Default: last 24 hours
    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const supabase = createAdminClient();

    // Get total counts by event type
    const { data: eventTypeCounts, error: eventTypeError } = await supabase
      .from("security_logs")
      .select("event_type")
      .gte("created_at", startDate);

    // Get counts by severity
    const { data: severityCounts, error: severityError } = await supabase
      .from("security_logs")
      .select("severity")
      .gte("created_at", startDate);

    // Get recent critical events
    const { data: criticalEvents, error: criticalError } = await supabase
      .from("security_logs")
      .select("*")
      .eq("severity", "critical")
      .gte("created_at", startDate)
      .order("created_at", { ascending: false })
      .limit(10);

    // Get failed login attempts count
    const { data: failedLogins, error: failedLoginsError } = await supabase
      .from("security_logs")
      .select("id")
      .eq("event_type", "login_failed")
      .gte("created_at", startDate);

    // Get suspicious activity count
    const { data: suspiciousActivity, error: suspiciousError } = await supabase
      .from("security_logs")
      .select("id")
      .eq("event_type", "suspicious_activity")
      .gte("created_at", startDate);

    // Get rate limit exceeded count
    const { data: rateLimitExceeded, error: rateLimitError } = await supabase
      .from("security_logs")
      .select("id")
      .eq("event_type", "rate_limit_exceeded")
      .gte("created_at", startDate);

    // Get unique IP addresses with failed attempts
    const { data: uniqueIPs, error: uniqueIPsError } = await supabase
      .from("security_logs")
      .select("ip_address")
      .eq("event_type", "login_failed")
      .gte("created_at", startDate);

    // Calculate statistics
    const eventTypeStats: Record<string, number> = {};
    if (eventTypeCounts) {
      eventTypeCounts.forEach((log) => {
        eventTypeStats[log.event_type] = (eventTypeStats[log.event_type] || 0) + 1;
      });
    }

    const severityStats: Record<string, number> = {};
    if (severityCounts) {
      severityCounts.forEach((log) => {
        severityStats[log.severity] = (severityStats[log.severity] || 0) + 1;
      });
    }

    // Get unique IPs
    const uniqueIPSet = new Set<string>();
    if (uniqueIPs) {
      uniqueIPs.forEach((log) => {
        if (log.ip_address && log.ip_address !== "unknown") {
          uniqueIPSet.add(log.ip_address);
        }
      });
    }

    // Check for errors
    if (
      eventTypeError ||
      severityError ||
      criticalError ||
      failedLoginsError ||
      suspiciousError ||
      rateLimitError ||
      uniqueIPsError
    ) {
      console.error("Error fetching security metrics:", {
        eventTypeError,
        severityError,
        criticalError,
        failedLoginsError,
        suspiciousError,
        rateLimitError,
        uniqueIPsError,
      });
    }

    return NextResponse.json(
      {
        timeRange: {
          hours,
          startDate,
          endDate: new Date().toISOString(),
        },
        statistics: {
          totalEvents: eventTypeCounts?.length || 0,
          failedLogins: failedLogins?.length || 0,
          suspiciousActivity: suspiciousActivity?.length || 0,
          rateLimitExceeded: rateLimitExceeded?.length || 0,
          uniqueIPsWithFailedAttempts: uniqueIPSet.size,
          criticalEvents: criticalEvents?.length || 0,
        },
        eventTypeBreakdown: eventTypeStats,
        severityBreakdown: severityStats,
        recentCriticalEvents: criticalEvents || [],
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in security metrics endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

