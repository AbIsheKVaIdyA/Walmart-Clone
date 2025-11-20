import { NextRequest, NextResponse } from 'next/server';
import { generateCSRFToken, setCSRFTokenCookie, getCSRFTokenFromCookie } from '@/lib/security/csrf';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const existingToken = getCSRFTokenFromCookie(request);
    const token = existingToken || generateCSRFToken();
    const response = NextResponse.json({ success: true, token });
    
    setCSRFTokenCookie(response, token, request);
    response.headers.set('X-CSRF-Token', token);
    
    return response;
  } catch (error: any) {
    console.error('CSRF token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}
