/**
 * NextAuth configuration for Sente Dashboard
 * Handles credentials-based authentication with PostgreSQL
 * @module lib/auth
 */

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

/**
 * User role type for authentication (simplified to admin/viewer)
 */
export type AuthUserRole = "admin" | "viewer";

/**
 * User data structure returned from authentication
 * Matches NextAuth User interface with custom properties
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: AuthUserRole;
  clientIds: string[];
}

/**
 * Demo user for mock/portfolio mode
 * Accepts any non-empty password
 */
const DEMO_USER: AuthUser = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "demo@sente.com",
  name: "Demo User",
  role: "admin",
  clientIds: ["550e8400-e29b-41d4-a716-446655440000"],
};

/**
 * Validates user credentials — mock mode accepts any non-empty password
 * for the demo user, or any email with any non-empty password.
 */
async function validateCredentials(
  email: string,
  password: string
): Promise<AuthUser | null> {
  const normalizedEmail = email.toLowerCase().trim();

  if (password.length === 0) {
    console.error("[Auth] Password is empty");
    return null;
  }

  // In mock/demo mode, accept any login with a non-empty password
  console.log("[Auth] Mock mode: authenticating", normalizedEmail);
  return {
    ...DEMO_USER,
    email: normalizedEmail,
    name: normalizedEmail === DEMO_USER.email ? DEMO_USER.name : normalizedEmail.split("@")[0],
  };
}

/**
 * NextAuth configuration options
 * Uses JWT strategy for session handling with custom user data
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "you@example.com",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials): Promise<AuthUser | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await validateCredentials(
          credentials.email,
          credentials.password
        );

        return user;
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authUser = user as AuthUser;
        token.sub = authUser.id;
        token.email = authUser.email;
        token.name = authUser.name ?? undefined;
        token.role = authUser.role;
        token.clientIds = authUser.clientIds;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub ?? "";
        session.user.email = token.email ?? "";
        session.user.name = token.name ?? null;
        session.user.role = token.role;
        session.user.clientIds = token.clientIds;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  debug: process.env.NODE_ENV === "development",
};
