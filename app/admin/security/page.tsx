"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface SecurityLog {
  id: string;
  event_type: string;
  severity: "info" | "warning" | "error" | "critical";
  user_id: string | null;
  email: string | null;
  ip_address: string;
  user_agent: string;
  details: any;
  created_at: string;
}

interface SecurityMetrics {
  timeRange: {
    hours: number;
    startDate: string;
    endDate: string;
  };
  statistics: {
    totalEvents: number;
    failedLogins: number;
    suspiciousActivity: number;
    rateLimitExceeded: number;
    uniqueIPsWithFailedAttempts: number;
    criticalEvents: number;
  };
  eventTypeBreakdown: Record<string, number>;
  severityBreakdown: Record<string, number>;
  recentCriticalEvents: SecurityLog[];
}

export default function SecurityPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(24); // hours
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [selectedEventType, setSelectedEventType] = useState<string>("all");

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") {
      router.push("/admin/login");
    }
  }, [isAuthenticated, user, router]);

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "100",
      });
      if (selectedSeverity !== "all") {
        params.append("severity", selectedSeverity);
      }
      if (selectedEventType !== "all") {
        params.append("eventType", selectedEventType);
      }

      const response = await fetch(`/api/admin/security/logs?${params}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedSeverity, selectedEventType]);

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/security/metrics?hours=${timeRange}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error("Error fetching metrics:", error);
    }
  }, [timeRange]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      fetchLogs();
      fetchMetrics();
    }
  }, [isAuthenticated, user, fetchLogs, fetchMetrics]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500";
      case "error":
        return "bg-orange-500";
      case "warning":
        return "bg-yellow-500";
      default:
        return "bg-blue-500";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
      case "error":
        return <XCircle className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  return (
    <div className="w-full flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-100 py-12 px-4 min-h-[calc(100vh-120px)]">
      <div className="w-full max-w-7xl mx-auto">
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <Shield className="h-8 w-8 text-walmart" />
            <h1 className="text-4xl font-bold text-gray-900">Security Monitoring</h1>
          </div>
          <p className="text-lg text-gray-600">Monitor security events and suspicious activity</p>
        </div>

        {/* Metrics Cards */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{metrics.statistics.totalEvents}</div>
                <p className="text-xs text-gray-500 mt-1">Last {timeRange} hours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Failed Logins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{metrics.statistics.failedLogins}</div>
                <p className="text-xs text-gray-500 mt-1">Login attempts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Suspicious Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{metrics.statistics.suspiciousActivity}</div>
                <p className="text-xs text-gray-500 mt-1">Detected events</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Critical Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-700">{metrics.statistics.criticalEvents}</div>
                <p className="text-xs text-gray-500 mt-1">Requires attention</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Time Range</label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(Number(e.target.value))}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value={1}>Last Hour</option>
                  <option value={24}>Last 24 Hours</option>
                  <option value={168}>Last 7 Days</option>
                  <option value={720}>Last 30 Days</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Severity</label>
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All</option>
                  <option value="critical">Critical</option>
                  <option value="error">Error</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Event Type</label>
                <select
                  value={selectedEventType}
                  onChange={(e) => setSelectedEventType(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All</option>
                  <option value="login_failed">Failed Logins</option>
                  <option value="login_success">Successful Logins</option>
                  <option value="rate_limit_exceeded">Rate Limit</option>
                  <option value="suspicious_activity">Suspicious Activity</option>
                  <option value="csrf_validation_failed">CSRF Failures</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button onClick={fetchLogs} variant="outline">
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Security Logs</CardTitle>
            <CardDescription>Recent security events and activity</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No security logs found</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Event Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {formatDate(log.created_at)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.event_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(log.severity)}>
                            <span className="flex items-center gap-1">
                              {getSeverityIcon(log.severity)}
                              {log.severity}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{log.email || "N/A"}</TableCell>
                        <TableCell className="text-sm font-mono">{log.ip_address}</TableCell>
                        <TableCell className="text-xs text-gray-500 max-w-xs truncate">
                          {log.details?.reason || JSON.stringify(log.details)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

