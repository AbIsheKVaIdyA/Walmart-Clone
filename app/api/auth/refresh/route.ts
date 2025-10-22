import { NextRequest, NextResponse } from 'next/server';
import { 
  verifyRefreshToken, 
  generateAccessToken, 
  findUserById,
  logSecurityEvent,
  addSecurityHeaders
} from '@/lib/security';
import { detectSuspiciousActivity } from '@/lib/securityMiddleware';

export async function POST(request: NextRequest) {
  try {
    // Check for suspicious activity
    if (detectSuspiciousActivity(request)) {
      logSecurityEvent('SUSPICIOUS_ACTIVITY', { url: request.url });
      return NextResponse.json(
        { success: false, error: 'Request blocked for security reasons' },
        { status: 403 }
      );
    }

    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Verify refresh token
    const tokenData = verifyRefreshToken(refreshToken);
    if (!tokenData) {
      logSecurityEvent('INVALID_REFRESH_TOKEN', { token: refreshToken.substring(0, 10) + '...' });
      return NextResponse.json(
        { success: false, error: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    // Find user
    const user = await findUserById(tokenData.userId);
    if (!user) {
      logSecurityEvent('USER_NOT_FOUND_REFRESH', { userId: tokenData.userId });
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user.id, user.role);

    // Log successful token refresh
    logSecurityEvent('TOKEN_REFRESH', { userId: user.id });

    const response = NextResponse.json({
      success: true,
      accessToken: newAccessToken,
    });

    // Add security headers
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Token refresh error:', error);
    logSecurityEvent('TOKEN_REFRESH_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
