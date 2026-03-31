/**
 * NextAuth type extensions for custom session data
 * @module types/next-auth
 */

import "next-auth";
import "next-auth/jwt";

/**
 * User role types for the dashboard
 */
export type UserRole = "admin" | "viewer";

/**
 * Extended NextAuth Session interface with custom user properties
 */
declare module "next-auth" {
  /**
   * Extended Session interface with custom user data
   */
  interface Session {
    user: {
      /** Unique user identifier */
      id: string;
      /** User email address */
      email: string;
      /** User display name */
      name?: string | null;
      /** User role for access control */
      role: UserRole;
      /** Array of client IDs the user has access to */
      clientIds: string[];
    };
  }

  /**
   * Extended User interface with role and client access
   */
  interface User {
    /** Unique user identifier */
    id: string;
    /** User email address */
    email: string;
    /** User display name */
    name?: string | null;
    /** User role for access control */
    role: UserRole;
    /** Array of client IDs the user has access to */
    clientIds: string[];
  }
}

/**
 * Extended JWT interface with custom claims
 */
declare module "next-auth/jwt" {
  interface JWT {
    /** User ID */
    sub?: string;
    /** User email */
    email?: string;
    /** User display name */
    name?: string;
    /** User role for access control */
    role: UserRole;
    /** Array of client IDs the user has access to */
    clientIds: string[];
  }
}
