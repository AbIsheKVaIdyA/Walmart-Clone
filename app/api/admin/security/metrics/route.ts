import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken, addSecurityHeaders } from '@/lib/securityMiddleware';
import { getSecurityMetrics } from '@/lib/logging';
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

    // Get security metrics
    const metrics = getSecurityMetrics();

    const response = NextResponse.json(metrics);
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Failed to fetch security metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security metrics' },
      { status: 500 }
    );
  }
}
