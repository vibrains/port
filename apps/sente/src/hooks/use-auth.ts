/**
 * Custom hook for authentication operations
 * Provides convenient access to session data and auth methods
 * @module hooks/use-auth
 */

import { useSession, signIn, signOut } from "next-auth/react";
import type { UserRole } from "@/types/next-auth";

/**
 * Return type for the useAuth hook
 */
interface UseAuthReturn {
  /** Whether the session is currently loading */
  isLoading: boolean;
  /** Current session status */
  status: "loading" | "authenticated" | "unauthenticated";
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** User data from session */
  user: {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
    clientIds: string[];
  } | null;
  /** Sign in function */
  signIn: typeof signIn;
  /** Sign out function */
  signOut: typeof signOut;
  /** Check if user has admin role */
  isAdmin: () => boolean;
  /** Check if user has access to a specific client */
  hasClientAccess: (clientId: string) => boolean;
  /** Check if user has access to any of the specified clients */
  hasAnyClientAccess: (clientIds: string[]) => boolean;
}

/**
 * Custom hook for authentication state and operations
 * 
 * @example
 * ```tsx
 * const { user, isAuthenticated, isAdmin, signOut } = useAuth();
 * 
 * if (isAuthenticated && isAdmin()) {
 *   return <AdminDashboard />;
 * }
 * ```
 */
export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession();

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  const user = session?.user
    ? {
        ...session.user,
        name: session.user.name ?? null,
      }
    : null;

  /**
   * Check if the current user has admin role
   * @returns true if user is an admin
   */
  const isAdmin = (): boolean => {
    return user?.role === "admin";
  };

  /**
   * Check if the current user has access to a specific client
   * Admins have access to all clients
   * @param clientId - The client ID to check
   * @returns true if user has access to the client
   */
  const hasClientAccess = (clientId: string): boolean => {
    if (!user) return false;
    if (user.role === "admin") return true;
    return user.clientIds.includes(clientId);
  };

  /**
   * Check if the current user has access to any of the specified clients
   * Admins have access to all clients
   * @param clientIds - Array of client IDs to check
   * @returns true if user has access to at least one of the clients
   */
  const hasAnyClientAccess = (clientIds: string[]): boolean => {
    if (!user) return false;
    if (user.role === "admin") return true;
    return clientIds.some((id) => user.clientIds.includes(id));
  };

  return {
    isLoading,
    status,
    isAuthenticated,
    user,
    signIn,
    signOut,
    isAdmin,
    hasClientAccess,
    hasAnyClientAccess,
  };
}
