/**
 * Security Event Logging
 * Logs security-related events to the database for monitoring and alerting
 */

import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export type SecurityEventType =
  | "login_attempt"
  | "login_success"
  | "login_failed"
  | "login_blocked"
  | "rate_limit_exceeded"
  | "suspicious_activity"
  | "csrf_validation_failed"
  | "invalid_token"
  | "admin_access"
  | "password_reset_attempt"
  | "account_locked";

export type SecuritySeverity = "info" | "warning" | "error" | "critical";

export interface SecurityLogDetails {
  [key: string]: any;
  reason?: string;
  attemptCount?: number;
  rateLimitWindow?: number;
  endpoint?: string;
  method?: string;
  errorMessage?: string;
}

/**
 * Get client IP address from request
 */
function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwardedFor?.split(",")[0]?.trim() || realIp || request.ip || "unknown";
  return ip;
}

/**
 * Get user agent from request
 */
function getUserAgent(request: NextRequest): string {
  return request.headers.get("user-agent") || "unknown";
}

/**
 * Log a security event to the database
 * 
 * @param eventType - Type of security event
 * @param severity - Severity level
 * @param request - Next.js request object
 * @param details - Additional event details
 * @param userId - User ID (if applicable)
 * @param email - Email address (for failed logins, etc.)
 */
export async function logSecurityEvent(
  eventType: SecurityEventType,
  severity: SecuritySeverity,
  request: NextRequest,
  details: SecurityLogDetails = {},
  userId?: string | null,
  email?: string | null
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const ipAddress = getClientIp(request);
    const userAgent = getUserAgent(request);

    const { error } = await supabase.from("security_logs").insert({
      event_type: eventType,
      severity: severity,
      user_id: userId || null,
      email: email || null,
      ip_address: ipAddress,
      user_agent: userAgent,
      details: {
        ...details,
        timestamp: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    });

    if (error) {
      // Log to console as fallback if database logging fails
      console.error("Failed to log security event:", error);
      console.error("Event:", {
        eventType,
        severity,
        userId,
        email,
        ipAddress,
        details,
      });
    }
  } catch (error) {
    // Fallback logging if database is unavailable
    console.error("Error logging security event:", error);
    console.error("Event:", {
      eventType,
      severity,
      userId,
      email,
      details,
    });
  }
}

/**
 * Log a failed login attempt
 */
export async function logFailedLogin(
  request: NextRequest,
  email: string,
  reason: string,
  attemptCount?: number
): Promise<void> {
  const severity: SecuritySeverity =
    attemptCount && attemptCount >= 5 ? "error" : "warning";

  await logSecurityEvent(
    "login_failed",
    severity,
    request,
    {
      reason,
      attemptCount,
      endpoint: "/api/auth/login",
      method: "POST",
    },
    null,
    email
  );
}

/**
 * Log a successful login
 */
export async function logSuccessfulLogin(
  request: NextRequest,
  userId: string,
  email: string
): Promise<void> {
  await logSecurityEvent(
    "login_success",
    "info",
    request,
    {
      endpoint: "/api/auth/login",
      method: "POST",
    },
    userId,
    email
  );
}

/**
 * Log a rate limit exceeded event
 */
export async function logRateLimitExceeded(
  request: NextRequest,
  endpoint: string,
  attemptCount: number,
  windowMs: number
): Promise<void> {
  await logSecurityEvent(
    "rate_limit_exceeded",
    "warning",
    request,
    {
      endpoint,
      attemptCount,
      rateLimitWindow: windowMs,
      reason: "Too many requests",
    }
  );
}

/**
 * Log suspicious activity
 */
export async function logSuspiciousActivity(
  request: NextRequest,
  reason: string,
  details: SecurityLogDetails = {},
  userId?: string | null,
  email?: string | null
): Promise<void> {
  await logSecurityEvent(
    "suspicious_activity",
    "error",
    request,
    {
      reason,
      ...details,
    },
    userId,
    email
  );
}

/**
 * Log CSRF validation failure
 */
export async function logCSRFValidationFailed(
  request: NextRequest,
  endpoint: string
): Promise<void> {
  await logSecurityEvent(
    "csrf_validation_failed",
    "warning",
    request,
    {
      endpoint,
      method: request.method,
      reason: "Invalid or missing CSRF token",
    }
  );
}

/**
 * Check for suspicious patterns and log if detected
 * 
 * @param request - Next.js request object
 * @param email - Email being attempted
 * @param recentFailedAttempts - Number of recent failed attempts
 * @returns true if suspicious activity detected
 */
export async function checkAndLogSuspiciousActivity(
  request: NextRequest,
  email: string,
  recentFailedAttempts: number
): Promise<boolean> {
  // Thresholds for suspicious activity
  const SUSPICIOUS_THRESHOLDS = {
    multipleFailedLogins: 5, // 5+ failed attempts
    rapidAttempts: 10, // 10+ attempts in short time
  };

  if (recentFailedAttempts >= SUSPICIOUS_THRESHOLDS.multipleFailedLogins) {
    await logSuspiciousActivity(
      request,
      `Multiple failed login attempts (${recentFailedAttempts})`,
      {
        attemptCount: recentFailedAttempts,
        threshold: SUSPICIOUS_THRESHOLDS.multipleFailedLogins,
      },
      null,
      email
    );
    return true;
  }

  return false;
}

