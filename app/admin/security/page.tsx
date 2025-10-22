'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SecurityLog {
  timestamp: string;
  level: string;
  event: string;
  message: string;
  details: any;
  ip: string;
  userAgent: string;
  userId?: string;
  severity?: string;
  riskScore?: number;
}

interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  highRiskEvents: number;
  failedLogins: number;
  suspiciousActivity: number;
  topIPs: Array<{ ip: string; count: number }>;
  topEvents: Array<{ event: string; count: number }>;
}

export default function SecurityDashboard() {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      const [logsResponse, metricsResponse] = await Promise.all([
        fetch('/api/admin/security/logs'),
        fetch('/api/admin/security/metrics')
      ]);

      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        setLogs(logsData);
      }

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);
      }
    } catch (error) {
      console.error('Failed to fetch security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading security dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Security Dashboard</h1>
        <Button onClick={fetchSecurityData} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Security Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalEvents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{metrics.criticalEvents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Risk Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{metrics.highRiskEvents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{metrics.failedLogins}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top IPs and Events */}
      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top IP Addresses</CardTitle>
              <CardDescription>Most active IP addresses in security logs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {metrics.topIPs.map((ip, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="font-mono text-sm">{ip.ip}</span>
                    <Badge variant="secondary">{ip.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Events</CardTitle>
              <CardDescription>Most frequent security events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {metrics.topEvents.map((event, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{event.event}</span>
                    <Badge variant="secondary">{event.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
          <CardDescription>Latest security events and alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No security events found
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge className={getSeverityColor(log.severity || log.level)}>
                        {log.severity || log.level}
                      </Badge>
                      <span className="font-mono text-sm text-gray-600">
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </div>
                    {log.riskScore && (
                      <Badge variant="outline">
                        Risk: {log.riskScore}/10
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="font-medium">{log.event}</div>
                    <div className="text-sm text-gray-600">{log.message}</div>
                    <div className="text-xs text-gray-500">
                      IP: {log.ip} | User: {log.userId || 'N/A'}
                    </div>
                  </div>

                  {log.details && Object.keys(log.details).length > 0 && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                        View Details
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
