export async function fetchCSRFToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/csrf-token', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Failed to fetch CSRF token:', response.status);
      return null;
    }

    const data = await response.json().catch(() => null);
    const headerToken = response.headers.get('X-CSRF-Token');
    const token = data?.token || headerToken;
    
    if (!token) {
      console.warn('CSRF token not found in response');
      return null;
    }
    
    return token;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    return null;
  }
}

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

export function clearCSRFTokenCache(): void {
  csrfTokenCache = null;
}

