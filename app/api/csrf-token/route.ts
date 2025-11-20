/**
 * GET /api/csrf-token
 * 
 * Endpoint to fetch CSRF token for client-side use
 * 
 * This endpoint is called by the client to get the CSRF token.
 * The middleware will generate and set the token in both:
 * - Cookie: csrf-token (httpOnly)
 * - Header: X-CSRF-Token (readable by client)
 * 
 * The client reads the token from the header and includes it
 * in subsequent POST/PUT/DELETE requests.
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleCSRF } from '@/lib/security/csrf';

export async function GET(request: NextRequest) {
  // The handleCSRF function will generate a token and set it in cookie + header
  const response = handleCSRF(request);
  
  if (response) {
    // Token has been set, return success
    return response;
  }
  
  // Fallback: return empty response (shouldn't happen for GET)
  return NextResponse.json({ success: true });
}

