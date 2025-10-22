import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken, requireAdmin, addSecurityHeaders } from '@/lib/securityMiddleware';
import { getSecurityLogs } from '@/lib/logging';
import { UserRole } from '@/typings/authTypings';

export async function GET(request: NextRequest) {
  try {
    // Authenticate and check admin role
    const auth = authenticateToken(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (auth.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const severity = searchParams.get('severity') || undefined;

    // Get security logs
    const logs = getSecurityLogs(limit, severity);

    const response = NextResponse.json(logs);
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Failed to fetch security logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security logs' },
      { status: 500 }
    );
  }
}
