/**
 * Development Authentication Bypass
 * Allows bypassing OAuth in local development using URL parameter
 * ONLY WORKS IN DEVELOPMENT MODE
 */

import { auth } from '@/auth';
import { cookies } from 'next/headers';
import type { Session } from 'next-auth';

const DEV_BYPASS_PARAM = 'dev_bypass';
const DEV_BYPASS_COOKIE = 'dev_bypass_active';
const DEV_USER_EMAIL = process.env.DEV_BYPASS_EMAIL || 'dev@localhost';
const DEV_USER_NAME = process.env.DEV_BYPASS_NAME || 'Dev User';

/**
 * Mock session for development bypass
 */
const createMockSession = (): Session => ({
  user: {
    id: 'dev-user-id',
    email: DEV_USER_EMAIL,
    name: DEV_USER_NAME,
    image: null,
  },
  expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
});

/**
 * Check if dev bypass is active from cookie
 */
async function isDevBypassActive(): Promise<boolean> {
  if (process.env.NODE_ENV !== 'development') {
    return false;
  }

  try {
    const cookieStore = await cookies();
    return cookieStore.get(DEV_BYPASS_COOKIE)?.value === 'true';
  } catch {
    return false;
  }
}

/**
 * Check if development bypass is enabled
 * Only works in development mode and when URL parameter is present
 */
export function isDevBypassEnabled(searchParams?: URLSearchParams | null): boolean {
  if (process.env.NODE_ENV !== 'development') {
    return false;
  }

  if (!searchParams) {
    return false;
  }

  return searchParams.get(DEV_BYPASS_PARAM) === 'true';
}

/**
 * Get authentication session with optional development bypass
 * Checks for dev bypass cookie set when ?dev_bypass=true is accessed
 *
 * Usage in Server Components:
 *
 * ```typescript
 * import { authWithDevBypass } from '@/lib/auth-dev';
 *
 * export default async function Page() {
 *   const session = await authWithDevBypass();
 *   if (!session) {
 *     redirect('/login');
 *   }
 *   // ... rest of component
 * }
 * ```
 */
export async function authWithDevBypass(): Promise<Session | null> {
  // Check if dev bypass is active from cookie
  if (await isDevBypassActive()) {
    console.log('[Auth Dev] Using development bypass - mock session created');
    return createMockSession();
  }

  // Use normal authentication
  return auth();
}

/**
 * Set dev bypass cookie when bypass is enabled
 * Call this from a server action or route handler when dev_bypass=true is detected
 */
export async function setDevBypassCookie(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  try {
    const cookieStore = await cookies();
    cookieStore.set(DEV_BYPASS_COOKIE, 'true', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });
    console.log('[Auth Dev] Dev bypass cookie set');
  } catch (error) {
    console.error('[Auth Dev] Failed to set dev bypass cookie:', error);
  }
}

/**
 * Clear dev bypass cookie
 */
export async function clearDevBypassCookie(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(DEV_BYPASS_COOKIE);
    console.log('[Auth Dev] Dev bypass cookie cleared');
  } catch (error) {
    console.error('[Auth Dev] Failed to clear dev bypass cookie:', error);
  }
}

/**
 * Get the dev bypass URL parameter string
 * Use this to append to links when dev bypass is active
 */
export function getDevBypassParam(searchParams?: {
  [key: string]: string | string[] | undefined;
}): string {
  const urlSearchParams = searchParams
    ? new URLSearchParams(
        Object.entries(searchParams).reduce(
          (acc, [key, value]) => {
            if (value !== undefined) {
              acc[key] = Array.isArray(value) ? value[0] : value;
            }
            return acc;
          },
          {} as Record<string, string>
        )
      )
    : null;

  return isDevBypassEnabled(urlSearchParams) ? `?${DEV_BYPASS_PARAM}=true` : '';
}
