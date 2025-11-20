import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Create a Supabase client for server-side operations
 * This client uses the anon key and automatically handles authentication via cookies
 * 
 * ✅ SECURE: All queries through this client use parameterized queries
 */
export function createClient() {
  const cookieStore = cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
    );
  }

  // Create Supabase client
  // Note: In Next.js 14 App Router, we use the standard createClient
  // The client automatically uses parameterized queries for all operations
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: {
        getItem: (key: string) => {
          return cookieStore.get(key)?.value ?? null;
        },
        setItem: (key: string, value: string) => {
          try {
            // Note: In Server Components, we don't have access to the request object
            // So we use production mode as a proxy for HTTPS enforcement
            // The middleware will handle HTTPS redirects in production
            const isProduction = process.env.NODE_ENV === 'production';
            cookieStore.set(key, value, {
              httpOnly: true,
              secure: isProduction, // Require secure in production (HTTPS enforced by middleware)
              sameSite: 'lax',
              path: '/',
              // maxAge will be set by Supabase client if needed
            });
          } catch (error) {
            // Ignore errors in Server Components
          }
        },
        removeItem: (key: string) => {
          try {
            cookieStore.delete(key);
          } catch (error) {
            // Ignore errors in Server Components
          }
        },
      },
    },
  });
}

/**
 * Create a Supabase admin client for server-side operations
 * This client uses the service role key and bypasses RLS
 * Use ONLY for admin operations that require elevated privileges
 * 
 * ⚠️ WARNING: This client bypasses Row-Level Security (RLS)
 * Only use for admin operations, never expose to client-side code
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'Missing Supabase admin environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local'
    );
  }

  // Admin client with service role key
  // This bypasses RLS, so use with extreme caution
  return createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

