# Logging & Monitoring Implementation Guide

This document explains the security logging and monitoring system implemented for tracking failed login attempts, suspicious activity, and security events.

## 📋 Table of Contents

- [Overview](#overview)
- [What Was Implemented](#what-was-implemented)
- [Database Schema](#database-schema)
- [Logging Functions](#logging-functions)
- [API Endpoints](#api-endpoints)
- [Admin Security Page](#admin-security-page)
- [How It Works](#how-it-works)
- [Setup Instructions](#setup-instructions)
- [Usage Examples](#usage-examples)

---

## Overview

The logging and monitoring system provides:

✅ **Persistent Activity Logs** - All security events stored in database
✅ **Failed Login Tracking** - Every failed login attempt is logged
✅ **Suspicious Activity Detection** - Automatic detection and logging of suspicious patterns
✅ **Admin Dashboard** - Visual interface to view logs and metrics
✅ **Alert Mechanisms** - Critical events are flagged for immediate attention
✅ **Rate Limit Logging** - Rate limit violations are tracked
✅ **CSRF Failure Logging** - CSRF validation failures are logged

---

## What Was Implemented

### 1. Database Schema (`security-logs-schema.sql`)

Created a `security_logs` table in Supabase to store all security events:

- **Event Types**: login_attempt, login_success, login_failed, rate_limit_exceeded, suspicious_activity, etc.
- **Severity Levels**: info, warning, error, critical
- **Metadata**: IP address, user agent, email, user ID, timestamps
- **Flexible Details**: JSONB field for additional context
- **Row-Level Security**: Only admins can view logs

### 2. Logging Utility (`lib/security/logging.ts`)

Centralized logging functions:

- `logSecurityEvent()` - Generic event logging
- `logFailedLogin()` - Failed login attempts
- `logSuccessfulLogin()` - Successful logins
- `logRateLimitExceeded()` - Rate limit violations
- `logSuspiciousActivity()` - Suspicious patterns
- `logCSRFValidationFailed()` - CSRF failures
- `checkAndLogSuspiciousActivity()` - Automatic suspicious activity detection

### 3. Updated Login Route (`app/api/auth/login/route.ts`)

Login endpoint now logs:
- ✅ Failed login attempts (with reason)
- ✅ Successful logins
- ✅ Rate limit exceeded events
- ✅ CSRF validation failures
- ✅ Suspicious activity patterns

### 4. API Endpoints

**`GET /api/admin/security/logs`**
- Retrieve security logs with filtering
- Pagination support
- Filter by: event type, severity, date range, email, IP address

**`GET /api/admin/security/metrics`**
- Get security statistics
- Event type breakdown
- Severity breakdown
- Recent critical events
- Time range filtering

### 5. Admin Security Page (`app/admin/security/page.tsx`)

Visual dashboard showing:
- Security metrics (total events, failed logins, suspicious activity, critical events)
- Filterable security logs table
- Real-time statistics
- Time range selection

---

## Database Schema

### Table: `security_logs`

```sql
CREATE TABLE security_logs (
  id UUID PRIMARY KEY,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE
);
```

### Event Types

- `login_attempt` - Login attempt initiated
- `login_success` - Successful login
- `login_failed` - Failed login attempt
- `login_blocked` - Login blocked (rate limit, etc.)
- `rate_limit_exceeded` - Rate limit violation
- `suspicious_activity` - Detected suspicious pattern
- `csrf_validation_failed` - CSRF token validation failed
- `invalid_token` - Invalid authentication token
- `admin_access` - Admin panel access
- `password_reset_attempt` - Password reset attempt
- `account_locked` - Account locked

### Severity Levels

- `info` - Informational events (successful logins, etc.)
- `warning` - Warning events (rate limits, etc.)
- `error` - Error events (failed logins, etc.)
- `critical` - Critical events requiring immediate attention

---

## Logging Functions

### Basic Event Logging

```typescript
import { logSecurityEvent } from "@/lib/security/logging";

await logSecurityEvent(
  "login_failed",
  "warning",
  request,
  {
    reason: "Invalid password",
    attemptCount: 3,
  },
  null, // userId (null for failed logins)
  "user@example.com"
);
```

### Failed Login Logging

```typescript
import { logFailedLogin } from "@/lib/security/logging";

await logFailedLogin(
  request,
  "user@example.com",
  "Invalid password",
  3 // attempt count
);
```

### Successful Login Logging

```typescript
import { logSuccessfulLogin } from "@/lib/security/logging";

await logSuccessfulLogin(
  request,
  userId,
  "user@example.com"
);
```

### Rate Limit Logging

```typescript
import { logRateLimitExceeded } from "@/lib/security/logging";

await logRateLimitExceeded(
  request,
  "/api/auth/login",
  6, // attempt count
  15 * 60 * 1000 // window in ms
);
```

### Suspicious Activity Detection

```typescript
import { checkAndLogSuspiciousActivity } from "@/lib/security/logging";

const isSuspicious = await checkAndLogSuspiciousActivity(
  request,
  "user@example.com",
  5 // recent failed attempts
);
```

---

## API Endpoints

### Get Security Logs

**Endpoint**: `GET /api/admin/security/logs`

**Query Parameters**:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)
- `eventType` - Filter by event type
- `severity` - Filter by severity (info, warning, error, critical)
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)
- `email` - Filter by email (partial match)
- `ipAddress` - Filter by IP address

**Example**:
```bash
GET /api/admin/security/logs?page=1&limit=50&severity=error&eventType=login_failed
```

**Response**:
```json
{
  "logs": [
    {
      "id": "uuid",
      "event_type": "login_failed",
      "severity": "warning",
      "email": "user@example.com",
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "details": {
        "reason": "Invalid password",
        "attemptCount": 3
      },
      "created_at": "2024-01-01T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

### Get Security Metrics

**Endpoint**: `GET /api/admin/security/metrics`

**Query Parameters**:
- `hours` - Time range in hours (default: 24)

**Example**:
```bash
GET /api/admin/security/metrics?hours=24
```

**Response**:
```json
{
  "timeRange": {
    "hours": 24,
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-02T00:00:00Z"
  },
  "statistics": {
    "totalEvents": 150,
    "failedLogins": 45,
    "suspiciousActivity": 3,
    "rateLimitExceeded": 12,
    "uniqueIPsWithFailedAttempts": 8,
    "criticalEvents": 2
  },
  "eventTypeBreakdown": {
    "login_failed": 45,
    "login_success": 100,
    "rate_limit_exceeded": 12
  },
  "severityBreakdown": {
    "info": 100,
    "warning": 45,
    "error": 5
  },
  "recentCriticalEvents": [...]
}
```

---

## Admin Security Page

### Access

Navigate to: `/admin/security` (Admin only)

### Features

1. **Metrics Dashboard**
   - Total events count
   - Failed logins count
   - Suspicious activity count
   - Critical events count

2. **Filters**
   - Time range (1 hour, 24 hours, 7 days, 30 days)
   - Severity filter
   - Event type filter

3. **Security Logs Table**
   - Timestamp
   - Event type
   - Severity (color-coded)
   - Email address
   - IP address
   - Event details

4. **Real-time Updates**
   - Refresh button to reload data
   - Automatic filtering

---

## How It Works

### Login Flow with Logging

1. **User attempts login** → Request received
2. **CSRF validation** → If fails, log `csrf_validation_failed`
3. **Rate limit check** → If exceeded, log `rate_limit_exceeded`
4. **Email validation** → Validate email format
5. **User lookup** → Find user by email
   - If not found → Log `login_failed` with reason "User not found"
6. **Password verification** → Verify password
   - If invalid → Log `login_failed` with reason "Invalid password"
7. **Suspicious activity check** → Check for patterns
   - If suspicious → Log `suspicious_activity`
8. **Success** → Log `login_success`
9. **Return response** → With tokens

### Suspicious Activity Detection

The system automatically detects suspicious patterns:

- **Multiple Failed Logins**: 5+ failed attempts from same IP/email
- **Rapid Attempts**: 10+ attempts in short time window
- **Pattern Detection**: Unusual login patterns

When detected:
1. Logs `suspicious_activity` event
2. Severity set to `error`
3. Details include attempt count and threshold

### Rate Limit Integration

Rate limiting works with logging:

1. **Rate limit check** → Before processing request
2. **If exceeded** → Log `rate_limit_exceeded`
3. **Return 429** → Too Many Requests

---

## Setup Instructions

### Step 1: Create Database Table

Run the SQL schema in your Supabase SQL editor:

```bash
# Copy contents of security-logs-schema.sql
# Paste into Supabase SQL Editor
# Execute
```

Or use Supabase CLI:
```bash
supabase db execute -f security-logs-schema.sql
```

### Step 2: Verify Table Creation

Check that the table exists:
```sql
SELECT * FROM security_logs LIMIT 1;
```

### Step 3: Test Logging

Make a failed login attempt and verify:
```sql
SELECT * FROM security_logs 
WHERE event_type = 'login_failed' 
ORDER BY created_at DESC 
LIMIT 5;
```

### Step 4: Access Admin Page

1. Login as admin
2. Navigate to `/admin/security`
3. View logs and metrics

---

## Usage Examples

### Example 1: View Failed Logins

```typescript
// In your code
const response = await fetch('/api/admin/security/logs?eventType=login_failed&limit=10', {
  credentials: 'include'
});
const data = await response.json();
console.log(data.logs);
```

### Example 2: Get Metrics for Last 7 Days

```typescript
const response = await fetch('/api/admin/security/metrics?hours=168', {
  credentials: 'include'
});
const metrics = await response.json();
console.log(`Failed logins: ${metrics.statistics.failedLogins}`);
```

### Example 3: Filter by IP Address

```typescript
const response = await fetch('/api/admin/security/logs?ipAddress=192.168.1.1', {
  credentials: 'include'
});
const data = await response.json();
```

### Example 4: Get Critical Events

```typescript
const response = await fetch('/api/admin/security/logs?severity=critical', {
  credentials: 'include'
});
const data = await response.json();
```

---

## Alert Mechanisms

### Current Implementation

1. **Visual Alerts** - Critical events highlighted in admin dashboard
2. **Severity Levels** - Color-coded badges (red for critical/error)
3. **Metrics Dashboard** - Shows counts of suspicious activity

### Future Enhancements (Optional)

You can extend the system with:

1. **Email Alerts** - Send emails for critical events
2. **Webhook Notifications** - Integrate with Slack, Discord, etc.
3. **SMS Alerts** - For critical security breaches
4. **Automated Responses** - Auto-block IPs after X failed attempts

---

## Security Considerations

### Data Privacy

- **IP Addresses**: Stored for security monitoring
- **User Agents**: Stored for pattern detection
- **Emails**: Stored for failed login tracking
- **Details**: JSONB field contains additional context

### Access Control

- **Row-Level Security**: Only admins can view logs
- **API Protection**: Admin routes require authentication
- **Service Role**: Logging uses service role (bypasses RLS for inserts)

### Data Retention

Consider implementing:
- **Automatic Cleanup**: Delete logs older than X days
- **Archival**: Move old logs to archive table
- **Compression**: Compress old log data

---

## Troubleshooting

### Logs Not Appearing

1. **Check Database**: Verify table exists
2. **Check Permissions**: Ensure service role has insert permissions
3. **Check Console**: Look for error messages
4. **Verify Logging**: Check if `logSecurityEvent` is being called

### Metrics Not Updating

1. **Refresh Page**: Click refresh button
2. **Check Time Range**: Verify time range includes recent events
3. **Check Filters**: Clear filters to see all events
4. **Check API**: Verify API endpoint returns data

### Performance Issues

1. **Add Indexes**: Ensure indexes are created (included in schema)
2. **Limit Queries**: Use pagination for large datasets
3. **Archive Old Data**: Move old logs to archive table
4. **Optimize Queries**: Use specific filters to reduce data

---

## Best Practices

1. **Regular Monitoring** - Check security logs daily
2. **Review Critical Events** - Investigate critical events immediately
3. **Pattern Analysis** - Look for patterns in failed logins
4. **IP Tracking** - Monitor IPs with multiple failed attempts
5. **User Education** - Inform users about suspicious activity
6. **Data Retention** - Set up automatic cleanup of old logs
7. **Backup Strategy** - Backup security logs regularly

---

## Summary

The logging and monitoring system provides:

✅ **Complete Visibility** - All security events are logged
✅ **Persistent Storage** - Logs stored in database
✅ **Admin Dashboard** - Visual interface for monitoring
✅ **Suspicious Activity Detection** - Automatic pattern detection
✅ **Filtering & Search** - Easy to find specific events
✅ **Metrics & Statistics** - Overview of security posture
✅ **Alert Mechanisms** - Critical events are highlighted

All security events are now tracked, logged, and visible to administrators for proactive security monitoring.

