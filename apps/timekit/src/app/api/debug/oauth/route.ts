/**
 * OAuth Diagnostic Endpoint
 *
 * Provides detailed information about OAuth configuration and environment
 * to help diagnose redirect_uri_mismatch errors.
 *
 * Access: Protected by simple auth check (requires CRON_API_KEY or dev environment)
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Mask sensitive values for safe display
 */
function maskSecret(value: string | undefined, visibleChars = 4): string {
  if (!value) return '[NOT SET]';
  if (value.length <= visibleChars) return '***';
  return value.substring(0, visibleChars) + '***';
}

/**
 * Check if request is authorized to view diagnostics
 */
function isAuthorized(request: NextRequest): boolean {
  // Allow in development
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  // Check for API key in header or query param
  const authHeader = request.headers.get('authorization');
  const apiKey = request.nextUrl.searchParams.get('key');
  const expectedKey = process.env.CRON_API_KEY;

  if (!expectedKey) {
    return false; // No key configured, deny access
  }

  // Check Bearer token
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token === expectedKey) return true;
  }

  // Check query parameter
  if (apiKey === expectedKey) return true;

  return false;
}

export async function GET(request: NextRequest) {
  // Authorization check
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        message:
          'This endpoint requires authentication. Use ?key=YOUR_CRON_API_KEY or Bearer token in Authorization header.',
      },
      { status: 401 }
    );
  }

  const headers = request.headers;
  const url = new URL(request.url);

  // Construct the base URL from headers (same logic NextAuth uses with trustHost)
  const forwardedProto = headers.get('x-forwarded-proto') || 'http';
  const forwardedHost = headers.get('x-forwarded-host') || headers.get('host') || 'localhost:3000';
  const constructedBaseUrl = `${forwardedProto}://${forwardedHost}`;

  // Build diagnostic information
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      TZ: process.env.TZ || 'Not set',
    },
    oauth_config: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || '[NOT SET - Using trustHost]',
      NEXTAUTH_SECRET: maskSecret(process.env.NEXTAUTH_SECRET),
      GOOGLE_CLIENT_ID: maskSecret(process.env.GOOGLE_CLIENT_ID, 10),
      GOOGLE_CLIENT_SECRET: maskSecret(process.env.GOOGLE_CLIENT_SECRET),
      GOOGLE_WORKSPACE_DOMAINS: process.env.GOOGLE_WORKSPACE_DOMAINS || '[NOT SET]',
      OAUTH_DEBUG: process.env.OAUTH_DEBUG || 'false',
    },
    request_info: {
      method: request.method,
      url: url.toString(),
      pathname: url.pathname,
    },
    headers: {
      host: headers.get('host') || '[NOT SET]',
      'x-forwarded-host': headers.get('x-forwarded-host') || '[NOT SET]',
      'x-forwarded-proto': headers.get('x-forwarded-proto') || '[NOT SET]',
      'x-forwarded-port': headers.get('x-forwarded-port') || '[NOT SET]',
      'x-forwarded-for': headers.get('x-forwarded-for') || '[NOT SET]',
      'x-real-ip': headers.get('x-real-ip') || '[NOT SET]',
      origin: headers.get('origin') || '[NOT SET]',
      referer: headers.get('referer') || '[NOT SET]',
    },
    computed_urls: {
      base_url_from_headers: constructedBaseUrl,
      oauth_callback_url: `${constructedBaseUrl}/api/auth/callback/google`,
      expected_callback_from_env: process.env.NEXTAUTH_URL
        ? `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
        : '[NEXTAUTH_URL not set]',
    },
    validation: {
      nextauth_url_set: !!process.env.NEXTAUTH_URL,
      nextauth_url_has_trailing_slash: process.env.NEXTAUTH_URL?.endsWith('/') || false,
      nextauth_url_is_https: process.env.NEXTAUTH_URL?.startsWith('https://') || false,
      google_client_id_set: !!process.env.GOOGLE_CLIENT_ID,
      google_client_secret_set: !!process.env.GOOGLE_CLIENT_SECRET,
      nextauth_secret_set: !!process.env.NEXTAUTH_SECRET,
      urls_match: process.env.NEXTAUTH_URL
        ? `${process.env.NEXTAUTH_URL}/api/auth/callback/google` ===
          `${constructedBaseUrl}/api/auth/callback/google`
        : null,
    },
    warnings: [] as string[],
    recommendations: [] as string[],
  };

  // Add warnings
  if (!process.env.NEXTAUTH_URL) {
    diagnostics.warnings.push(
      'NEXTAUTH_URL is not set. Relying on trustHost which may cause issues in production.'
    );
    diagnostics.recommendations.push(
      'Set NEXTAUTH_URL to your production URL: https://ndos-timekit.kinsta.app'
    );
  }

  if (process.env.NEXTAUTH_URL?.endsWith('/')) {
    diagnostics.warnings.push(
      'NEXTAUTH_URL has a trailing slash. This may cause redirect URI mismatches.'
    );
    diagnostics.recommendations.push('Remove trailing slash from NEXTAUTH_URL');
  }

  if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.startsWith('https://')) {
    diagnostics.warnings.push(
      'NEXTAUTH_URL does not use HTTPS. Production should always use HTTPS.'
    );
    diagnostics.recommendations.push('Update NEXTAUTH_URL to use https://');
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    diagnostics.warnings.push('Google OAuth credentials are not fully configured.');
  }

  if (!process.env.NEXTAUTH_SECRET) {
    diagnostics.warnings.push('NEXTAUTH_SECRET is not set. This is required for production.');
  }

  if (diagnostics.validation.urls_match === false) {
    diagnostics.warnings.push(
      'MISMATCH DETECTED: The callback URL constructed from headers does not match NEXTAUTH_URL.'
    );
    diagnostics.recommendations.push(
      'Verify that Kinsta is forwarding the correct headers (X-Forwarded-Host, X-Forwarded-Proto)'
    );
    diagnostics.recommendations.push('Ensure NEXTAUTH_URL matches your production domain exactly');
  }

  // Add general recommendations
  if (diagnostics.recommendations.length === 0) {
    diagnostics.recommendations.push(
      'Configuration looks good! If still experiencing issues, check Google Cloud Console authorized redirect URIs.'
    );
  }

  return NextResponse.json(diagnostics, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
