/**
 * Auth Provider component
 * Wraps the application with NextAuth SessionProvider for client-side auth state
 * @module components/auth-provider
 */

"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

/**
 * Props for the AuthProvider component
 */
interface AuthProviderProps {
  /** Child components to be wrapped */
  children: ReactNode;
}

/**
 * Auth Provider component
 * Provides session context to all child components
 * Required for useSession hook and authentication flows
 * 
 * @example
 * ```tsx
 * <AuthProvider>
 *   <YourApp />
 * </AuthProvider>
 * ```
 */
export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider basePath={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/api/auth`}>
      {children}
    </SessionProvider>
  );
}
