import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "email@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Check environment-based users for development
        const envUsers = process.env.AUTH_USERS?.split(",") || [];
        for (const userEntry of envUsers) {
          const [email, passwordHash] = userEntry.split(":");
          if (
            email === credentials.email &&
            bcrypt.compareSync(credentials.password, passwordHash)
          ) {
            return {
              id: email,
              email: email,
              name: email.split("@")[0],
            };
          }
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // If using Google OAuth, check domain restrictions
      if (account?.provider === "google" && profile?.email) {
        const allowedDomains =
          process.env.GOOGLE_WORKSPACE_DOMAINS?.split(",") || [];

        if (allowedDomains.length > 0) {
          const emailDomain = profile.email.split("@")[1];
          if (!allowedDomains.includes(emailDomain)) {
            console.warn(
              `Sign-in rejected: ${profile.email} not in allowed domains`
            );
            return false;
          }
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = (user as any).id || token.sub || user.email;
      }

      // Store OAuth provider info
      if (account) {
        token.provider = account.provider;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};
