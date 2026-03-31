import { cache } from 'react';
import { auth } from '@/auth';

/**
 * Cached auth function for per-request deduplication in Server Components.
 * Multiple calls to getSession() within the same request will only execute auth() once.
 */
export const getSession = cache(auth);
