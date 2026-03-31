/**
 * NextAuth v5 Configuration
 * Root authentication configuration for the application
 */

import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { validateOAuthConfig, logValidationResults } from '@/lib/env-validation';

// Validate OAuth configuration at startup
const validationResult = validateOAuthConfig();
logValidationResults(validationResult, 'OAuth Configuration');

export const { auth, handlers, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // Note: 'hd' parameter only works for single domain
          // Multiple domain validation happens in signIn callback
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ profile }) {
      // Verify user is from allowed workspace domains
      if (process.env.GOOGLE_WORKSPACE_DOMAINS && profile?.email) {
        const allowedDomains = process.env.GOOGLE_WORKSPACE_DOMAINS.split(',').map((d) => d.trim());
        const userDomain = profile.email.split('@')[1];
        if (!allowedDomains.includes(userDomain)) {
          console.log(`[Auth] Login denied for domain: ${userDomain}`);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      // Add user ID to token on initial sign in
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user ID to session
      if (session.user) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      console.log('[Auth] New user created:', user.email);
    },
    async signIn({ user }) {
      console.log('[Auth] User signed in:', user.email);
    },
  },
  // Enable debug mode in development or when OAUTH_DEBUG is explicitly set
  debug: process.env.NODE_ENV === 'development' || process.env.OAUTH_DEBUG === 'true',
});
