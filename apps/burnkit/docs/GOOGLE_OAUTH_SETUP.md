# Google OAuth Authentication Setup

This document describes the Google OAuth authentication implementation for the Financial Dashboard application.

## Overview

The application now supports both:

1. **Credentials-based authentication** (email/password)
2. **Google OAuth authentication** (Sign in with Google)

## What Was Changed

### 1. Prisma Schema Updates (`prisma/schema.prisma`)

Added OAuth support models:

- **Account**: Stores OAuth provider account information
- **Session**: Stores user session data
- **VerificationToken**: For email verification tokens
- Updated **User** model:
  - Made `passwordHash` optional (OAuth users don't need passwords)
  - Added `emailVerified`, `image` fields
  - Added relations to `accounts` and `sessions`

### 2. NextAuth Configuration (`src/lib/auth.ts`)

- Added `PrismaAdapter` for database session management
- Added `GoogleProvider` with proper configuration
- Implemented domain restriction in `signIn` callback
  - Only allows users from domains specified in `GOOGLE_WORKSPACE_DOMAINS`
- Updated JWT and session callbacks to handle OAuth users

### 3. Login Page (`src/app/(auth)/login/page.tsx`)

- Added "Sign in with Google" button with Google branding
- Added visual separator between OAuth and credentials login
- Improved error handling for OAuth failures

### 4. Database Migration (`prisma/migrations/add_oauth_support.sql`)

SQL migration file to update the database schema when ready.

## Environment Variables

The following environment variables are required in `.env`:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Optional: Restrict to specific domains (comma-separated)
GOOGLE_WORKSPACE_DOMAINS="thegoldenstatecompany.com,moontide.agency,nearanddear.agency"
```

## Google Cloud Console Setup

To get your OAuth credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure the OAuth consent screen
6. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
7. Copy the Client ID and Client Secret to your `.env` file

## Database Migration

When your database is available, run the migration:

```bash
# Option 1: Using Prisma Migrate (recommended)
npx prisma migrate dev --name add_oauth_support

# Option 2: Run the SQL file directly
psql -U username -d burnkit -f prisma/migrations/add_oauth_support.sql
```

## Domain Restrictions

The implementation includes domain restrictions for Google OAuth:

- Only users with email addresses from domains listed in `GOOGLE_WORKSPACE_DOMAINS` can sign in
- If `GOOGLE_WORKSPACE_DOMAINS` is empty or not set, any Google account can sign in
- Domain check happens in the `signIn` callback in [`auth.ts`](../src/lib/auth.ts:78)

## How It Works

### OAuth Flow

1. User clicks "Sign in with Google"
2. User is redirected to Google's OAuth consent screen
3. User authorizes the application
4. Google redirects back with authorization code
5. NextAuth exchanges code for tokens
6. Domain restriction is checked (if configured)
7. User account is created/updated in database
8. Session is created and user is signed in

### Credentials Flow (Unchanged)

1. User enters email and password
2. Credentials are verified against database
3. If database is unavailable, falls back to `AUTH_USERS` env variable
4. JWT session is created

## Testing

### Test Google OAuth

1. Ensure database is running and migrated
2. Start the development server: `npm run dev`
3. Navigate to `http://localhost:3000/login`
4. Click "Sign in with Google"
5. Sign in with a Google account from an allowed domain
6. Verify you're redirected to the dashboard

### Test Domain Restrictions

1. Try signing in with a Google account from a non-allowed domain
2. You should see an error and be redirected back to login
3. Check server logs for: `Sign-in rejected: [email] not in allowed domains`

## Security Considerations

1. **Domain Restrictions**: Configured to only allow specific workspace domains
2. **HTTPS Required**: In production, ensure all OAuth redirects use HTTPS
3. **Secret Management**: Keep `GOOGLE_CLIENT_SECRET` and `NEXTAUTH_SECRET` secure
4. **Token Storage**: OAuth tokens are stored securely in the database
5. **Session Management**: Sessions are managed via database with proper expiration

## Troubleshooting

### "Can't reach database server"

- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Run migrations: `npx prisma migrate dev`

### "Invalid OAuth credentials"

- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`
- Check authorized redirect URIs in Google Cloud Console
- Ensure redirect URI matches exactly (including protocol and port)

### "Sign-in rejected"

- Check server logs for domain restriction message
- Verify user's email domain is in `GOOGLE_WORKSPACE_DOMAINS`
- Ensure domains are comma-separated without spaces

### OAuth button not working

- Check browser console for errors
- Verify NextAuth API route is accessible: `/api/auth/providers`
- Ensure `NEXTAUTH_URL` matches your current URL

## Files Modified

- [`prisma/schema.prisma`](../prisma/schema.prisma) - Database schema
- [`src/lib/auth.ts`](../src/lib/auth.ts) - NextAuth configuration
- [`src/app/(auth)/login/page.tsx`](<../src/app/(auth)/login/page.tsx>) - Login UI
- [`package.json`](../package.json) - Added `@next-auth/prisma-adapter`

## Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Prisma Adapter Documentation](https://authjs.dev/reference/adapter/prisma)
