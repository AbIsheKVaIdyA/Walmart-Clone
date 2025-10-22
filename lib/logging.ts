import { NextRequest } from 'next/server';

// Log levels
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

// Security event types
export enum SecurityEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  SIGNUP_SUCCESS = 'SIGNUP_SUCCESS',
  SIGNUP_FAILED = 'SIGNUP_FAILED',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  CSRF_ATTACK = 'CSRF_ATTACK',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  DATA_BREACH_ATTEMPT = 'DATA_BREACH_ATTEMPT'
}

// Log entry interface
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  event: string;
  message: string;
  details: any;
  ip: string;
  userAgent: string;
  userId?: string;
  sessionId?: string;
  url: string;
  method: string;
  statusCode?: number;
  responseTime?: number;
}

// Security log entry
export interface SecurityLogEntry extends LogEntry {
  eventType: SecurityEventType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number;
  mitigation?: string;
}

// In-memory log storage (replace with database in production)
const logs: LogEntry[] = [];
const securityLogs: SecurityLogEntry[] = [];

// Rate limiting for logging
const logRateLimit = new Map<string, { count: number; lastReset: Date }>();
const MAX_LOGS_PER_MINUTE = 100;

// Check rate limit for logging
const checkLogRateLimit = (ip: string): boolean => {
  const now = new Date();
  const key = ip;
  const current = logRateLimit.get(key);
  
  if (!current) {
    logRateLimit.set(key, { count: 1, lastReset: now });
    return true;
  }
  
  const timeDiff = now.getTime() - current.lastReset.getTime();
  if (timeDiff > 60000) { // Reset after 1 minute
    logRateLimit.set(key, { count: 1, lastReset: now });
    return true;
  }
  
  if (current.count >= MAX_LOGS_PER_MINUTE) {
    return false;
  }
  
  current.count++;
  return true;
};

// Get client IP from request
const getClientIP = (req: NextRequest): string => {
  return req.headers.get('x-forwarded-for') || 
         req.headers.get('x-real-ip') || 
         req.headers.get('cf-connecting-ip') || 
         'unknown';
};

// Create base log entry
const createBaseLogEntry = (req: NextRequest, level: LogLevel, event: string, message: string, details: any = {}): LogEntry => {
  return {
    timestamp: new Date().toISOString(),
    level,
    event,
    message,
    details,
    ip: getClientIP(req),
    userAgent: req.headers.get('user-agent') || 'unknown',
    url: req.url,
    method: req.method
  };
};

// Log general events
export const logEvent = (req: NextRequest, level: LogLevel, event: string, message: string, details: any = {}): void => {
  const ip = getClientIP(req);
  
  if (!checkLogRateLimit(ip)) {
    console.warn('Log rate limit exceeded for IP:', ip);
    return;
  }
  
  const logEntry = createBaseLogEntry(req, level, event, message, details);
  logs.push(logEntry);
  
  // Console output for development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${level}] ${event}: ${message}`, details);
  }
  
  // In production, send to logging service
  // sendToLoggingService(logEntry);
};

// Log security events
export const logSecurityEvent = (
  req: NextRequest, 
  eventType: SecurityEventType, 
  message: string, 
  details: any = {},
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM',
  riskScore: number = 5
): void => {
  const ip = getClientIP(req);
  
  if (!checkLogRateLimit(ip)) {
    console.warn('Security log rate limit exceeded for IP:', ip);
    return;
  }
  
  const baseEntry = createBaseLogEntry(req, LogLevel.WARN, eventType, message, details);
  
  const securityEntry: SecurityLogEntry = {
    ...baseEntry,
    eventType,
    severity,
    riskScore,
    level: severity === 'CRITICAL' ? LogLevel.CRITICAL : LogLevel.WARN
  };
  
  securityLogs.push(securityEntry);
  
  // Console output for development
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[SECURITY ${severity}] ${eventType}: ${message}`, details);
  }
  
  // Alert for high-risk events
  if (severity === 'HIGH' || severity === 'CRITICAL') {
    sendSecurityAlert(securityEntry);
  }
  
  // In production, send to security monitoring service
  // sendToSecurityMonitoring(securityEntry);
};

// Send security alert
const sendSecurityAlert = (entry: SecurityLogEntry): void => {
  const alert = {
    timestamp: entry.timestamp,
    event: entry.eventType,
    severity: entry.severity,
    riskScore: entry.riskScore,
    ip: entry.ip,
    userAgent: entry.userAgent,
    url: entry.url,
    details: entry.details
  };
  
  console.error('🚨 SECURITY ALERT:', alert);
  
  // In production, send to alerting system
  // sendToAlertingSystem(alert);
};

// Log authentication events
export const logAuthEvent = (
  req: NextRequest, 
  event: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'SIGNUP_SUCCESS' | 'LOGOUT',
  userId?: string,
  details: any = {}
): void => {
  const eventType = event === 'LOGIN_SUCCESS' ? SecurityEventType.LOGIN_SUCCESS :
                   event === 'LOGIN_FAILED' ? SecurityEventType.LOGIN_FAILED :
                   event === 'SIGNUP_SUCCESS' ? SecurityEventType.SIGNUP_SUCCESS :
                   SecurityEventType.LOGIN_SUCCESS;
  
  const severity = event === 'LOGIN_FAILED' ? 'MEDIUM' : 'LOW';
  const riskScore = event === 'LOGIN_FAILED' ? 7 : 2;
  
  logSecurityEvent(req, eventType, `${event} for user ${userId || 'unknown'}`, {
    userId,
    ...details
  }, severity, riskScore);
};

// Log payment events
export const logPaymentEvent = (
  req: NextRequest,
  event: 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED',
  amount?: number,
  transactionId?: string,
  details: any = {}
): void => {
  const eventType = event === 'PAYMENT_SUCCESS' ? SecurityEventType.PAYMENT_SUCCESS : SecurityEventType.PAYMENT_FAILED;
  const severity = event === 'PAYMENT_FAILED' ? 'HIGH' : 'LOW';
  const riskScore = event === 'PAYMENT_FAILED' ? 8 : 1;
  
  logSecurityEvent(req, eventType, `${event} - Amount: ${amount}, Transaction: ${transactionId}`, {
    amount,
    transactionId,
    ...details
  }, severity, riskScore);
};

// Log suspicious activity
export const logSuspiciousActivity = (
  req: NextRequest,
  activity: string,
  details: any = {}
): void => {
  logSecurityEvent(
    req, 
    SecurityEventType.SUSPICIOUS_ACTIVITY, 
    `Suspicious activity detected: ${activity}`, 
    details, 
    'HIGH', 
    9
  );
};

// Get logs (for admin dashboard)
export const getLogs = (limit: number = 100, level?: LogLevel): LogEntry[] => {
  let filteredLogs = logs;
  
  if (level) {
    filteredLogs = logs.filter(log => log.level === level);
  }
  
  return filteredLogs
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
};

// Get security logs
export const getSecurityLogs = (limit: number = 100, severity?: string): SecurityLogEntry[] => {
  let filteredLogs = securityLogs;
  
  if (severity) {
    filteredLogs = securityLogs.filter(log => log.severity === severity);
  }
  
  return filteredLogs
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
};

// Get security metrics
export const getSecurityMetrics = (): any => {
  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const recentLogs = securityLogs.filter(log => 
    new Date(log.timestamp) > last24Hours
  );
  
  const metrics = {
    totalEvents: recentLogs.length,
    criticalEvents: recentLogs.filter(log => log.severity === 'CRITICAL').length,
    highRiskEvents: recentLogs.filter(log => log.severity === 'HIGH').length,
    failedLogins: recentLogs.filter(log => log.eventType === SecurityEventType.LOGIN_FAILED).length,
    suspiciousActivity: recentLogs.filter(log => log.eventType === SecurityEventType.SUSPICIOUS_ACTIVITY).length,
    topIPs: getTopIPs(recentLogs),
    topEvents: getTopEvents(recentLogs)
  };
  
  return metrics;
};

// Get top IPs by event count
const getTopIPs = (logs: SecurityLogEntry[]): any[] => {
  const ipCounts = new Map<string, number>();
  
  logs.forEach(log => {
    const count = ipCounts.get(log.ip) || 0;
    ipCounts.set(log.ip, count + 1);
  });
  
  return Array.from(ipCounts.entries())
    .map(([ip, count]) => ({ ip, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
};

// Get top events by count
const getTopEvents = (logs: SecurityLogEntry[]): any[] => {
  const eventCounts = new Map<string, number>();
  
  logs.forEach(log => {
    const count = eventCounts.get(log.eventType) || 0;
    eventCounts.set(log.eventType, count + 1);
  });
  
  return Array.from(eventCounts.entries())
    .map(([event, count]) => ({ event, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
};

// Clear old logs (run periodically)
export const clearOldLogs = (daysToKeep: number = 30): void => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  const cutoffTime = cutoffDate.getTime();
  
  // Remove old general logs
  const filteredLogs = logs.filter(log => 
    new Date(log.timestamp).getTime() > cutoffTime
  );
  logs.length = 0;
  logs.push(...filteredLogs);
  
  // Remove old security logs
  const filteredSecurityLogs = securityLogs.filter(log => 
    new Date(log.timestamp).getTime() > cutoffTime
  );
  securityLogs.length = 0;
  securityLogs.push(...filteredSecurityLogs);
  
  console.log(`Cleared logs older than ${daysToKeep} days`);
};
