/**
 * Environment Variable Validation
 *
 * Validates critical environment variables at startup and provides
 * helpful warnings for common configuration issues.
 */

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate OAuth-related environment variables
 */
export function validateOAuthConfig(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check NEXTAUTH_URL
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  if (!nextAuthUrl) {
    warnings.push(
      'NEXTAUTH_URL is not set. Using trustHost mode which may cause issues in production. ' +
        'Set NEXTAUTH_URL to your production URL (e.g., https://ndos-timekit.kinsta.app)'
    );
  } else {
    // Validate format
    if (nextAuthUrl.endsWith('/')) {
      errors.push(
        `NEXTAUTH_URL has a trailing slash: "${nextAuthUrl}". ` +
          'This will cause OAuth redirect URI mismatches. Remove the trailing slash.'
      );
    }

    if (!nextAuthUrl.startsWith('http://') && !nextAuthUrl.startsWith('https://')) {
      errors.push(`NEXTAUTH_URL must start with http:// or https://. Got: "${nextAuthUrl}"`);
    }

    if (process.env.NODE_ENV === 'production' && nextAuthUrl.startsWith('http://')) {
      warnings.push(
        'NEXTAUTH_URL uses http:// in production. This is insecure and may cause OAuth issues. ' +
          'Use https:// for production.'
      );
    }

    // Check for localhost in production
    if (process.env.NODE_ENV === 'production' && nextAuthUrl.includes('localhost')) {
      errors.push(
        'NEXTAUTH_URL contains "localhost" in production environment. ' +
          'Update to your production domain.'
      );
    }
  }

  // Check NEXTAUTH_SECRET
  if (!process.env.NEXTAUTH_SECRET) {
    errors.push(
      'NEXTAUTH_SECRET is not set. This is required for JWT signing. ' +
        'Generate one with: openssl rand -base64 32'
    );
  } else if (process.env.NEXTAUTH_SECRET.length < 32) {
    warnings.push(
      'NEXTAUTH_SECRET is shorter than 32 characters. Use a longer secret for better security.'
    );
  }

  // Check Google OAuth credentials
  if (!process.env.GOOGLE_CLIENT_ID) {
    errors.push('GOOGLE_CLIENT_ID is not set. Get this from Google Cloud Console.');
  }

  if (!process.env.GOOGLE_CLIENT_SECRET) {
    errors.push('GOOGLE_CLIENT_SECRET is not set. Get this from Google Cloud Console.');
  }

  // Check for common mistakes
  if (process.env.GOOGLE_CLIENT_ID?.includes(' ')) {
    warnings.push('GOOGLE_CLIENT_ID contains spaces. This may be a copy-paste error.');
  }

  if (process.env.GOOGLE_CLIENT_SECRET?.includes(' ')) {
    warnings.push('GOOGLE_CLIENT_SECRET contains spaces. This may be a copy-paste error.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate all critical environment variables
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate OAuth config
  const oauthResult = validateOAuthConfig();
  errors.push(...oauthResult.errors);
  warnings.push(...oauthResult.warnings);

  // Check DATABASE_URL
  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is not set. Database connection will fail.');
  } else if (
    !process.env.DATABASE_URL.includes('sslmode=require') &&
    process.env.NODE_ENV === 'production'
  ) {
    warnings.push(
      'DATABASE_URL does not include sslmode=require in production. ' +
        'This is recommended for security.'
    );
  }

  // Check Teamwork API configuration
  if (!process.env.TEAMWORK_API_KEY) {
    warnings.push('TEAMWORK_API_KEY is not set. Teamwork integration will not work.');
  }

  if (!process.env.TEAMWORK_SITE_NAME) {
    warnings.push('TEAMWORK_SITE_NAME is not set. Teamwork integration will not work.');
  }

  // Check S3/R2 configuration
  if (
    !process.env.S3_ENDPOINT ||
    !process.env.S3_ACCESS_KEY_ID ||
    !process.env.S3_SECRET_ACCESS_KEY ||
    !process.env.S3_BUCKET_NAME
  ) {
    warnings.push('S3/R2 storage is not fully configured. Export file storage will not work.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Log validation results
 */
export function logValidationResults(result: ValidationResult, context = 'Environment'): void {
  if (result.errors.length > 0) {
    console.error(`\n❌ ${context} Validation FAILED:\n`);
    result.errors.forEach((error, i) => {
      console.error(`  ${i + 1}. ${error}`);
    });
  }

  if (result.warnings.length > 0) {
    console.warn(`\n⚠️  ${context} Validation Warnings:\n`);
    result.warnings.forEach((warning, i) => {
      console.warn(`  ${i + 1}. ${warning}`);
    });
  }

  if (result.errors.length === 0 && result.warnings.length === 0) {
    console.log(`✓ ${context} validation passed`);
  }

  if (result.errors.length > 0) {
    console.error('\n❌ Application may not function correctly. Please fix the errors above.\n');
  }
}

/**
 * Validate environment and log results at startup
 * Call this in your application entry point
 */
export function validateAndLogEnvironment(): boolean {
  console.log('=== Environment Validation ===');

  const result = validateEnvironment();
  logValidationResults(result);

  console.log('==============================\n');

  return result.valid;
}
