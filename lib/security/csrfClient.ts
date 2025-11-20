/**
 * Client-side CSRF Token Utilities
 * 
 * This module provides functions to fetch and use CSRF tokens on the client side.
 * 
 * HOW IT WORKS:
 * 1. On page load, make a GET request to any endpoint
 * 2. Server middleware sets CSRF token in both cookie and X-CSRF-Token header
 * 3. Client reads token from header and stores it
 * 4. Client includes token in X-CSRF-Token header for all POST/PUT/DELETE requests
 * 
 * NOTE: The CSRF token cookie is httpOnly, so JavaScript cannot read it directly.
 * We get it from the response header instead.
 */

/**
 * Fetches the CSRF token from the server
 * Makes a GET request to /api/csrf-token endpoint
 * 
 * @returns CSRF token string or null if failed
 */
export async function fetchCSRFToken(): Promise<string | null> {
  try {
    // Make a request to the CSRF token endpoint
    // The middleware will set the CSRF token in the X-CSRF-Token header
    const response = await fetch('/api/csrf-token', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store', // Ensure we get a fresh token
    });

    if (!response.ok) {
      console.error('Failed to fetch CSRF token:', response.status);
      return null;
    }

    // Server sets CSRF token in X-CSRF-Token header
    const token = response.headers.get('X-CSRF-Token');
    
    if (!token) {
      console.warn('CSRF token not found in response headers');
    }
    
    return token;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    return null;
  }
}

/**
 * Gets the CSRF token, fetching it if not already cached
 * Caches the token in memory to avoid unnecessary requests
 */
let csrfTokenCache: string | null = null;

export async function getCSRFToken(): Promise<string | null> {
  if (csrfTokenCache) {
    return csrfTokenCache;
  }

  const token = await fetchCSRFToken();
  if (token) {
    csrfTokenCache = token;
  }

  return token;
}

/**
 * Clears the cached CSRF token
 * Useful when you need to refresh the token
 */
export function clearCSRFTokenCache(): void {
  csrfTokenCache = null;
}

