/**
 * Structured Logging Service
 * Custom implementation for Next.js compatibility
 * Provides consistent, structured logging across the application
 */

/**
 * Log levels
 */
export enum LogLevel {
  FATAL = 60,
  ERROR = 50,
  WARN = 40,
  INFO = 30,
  DEBUG = 20,
  TRACE = 10,
}

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

const currentLogLevel = process.env.LOG_LEVEL
  ? LogLevel[process.env.LOG_LEVEL.toUpperCase() as keyof typeof LogLevel] || LogLevel.INFO
  : isDevelopment
    ? LogLevel.DEBUG
    : LogLevel.INFO;

/**
 * Redact sensitive fields from logs
 */
function redactSensitive(obj: any): any {
  const sensitiveKeys = [
    'password',
    'token',
    'apiKey',
    'api_key',
    'googleId',
    'google_id',
    'TEAMWORK_API_KEY',
    'GOOGLE_CLIENT_SECRET',
    'NEXTAUTH_SECRET',
    'CRON_API_KEY',
    'authorization',
    'x-api-key',
  ];

  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const redacted = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const key in redacted) {
    if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive.toLowerCase()))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      redacted[key] = redactSensitive(redacted[key]);
    }
  }

  return redacted;
}

/**
 * Format log entry
 */
function formatLog(level: LogLevel, message: string, context?: Record<string, any>) {
  const timestamp = new Date().toISOString();
  const levelName = LogLevel[level];

  const logEntry = {
    level: levelName,
    time: timestamp,
    app: 'teamwork-advantage',
    env: process.env.NODE_ENV,
    msg: message,
    ...(context ? redactSensitive(context) : {}),
  };

  // In development, format for readability
  if (isDevelopment) {
    const levelColor =
      level >= LogLevel.ERROR
        ? '\x1b[31m'
        : level >= LogLevel.WARN
          ? '\x1b[33m'
          : level >= LogLevel.INFO
            ? '\x1b[36m'
            : '\x1b[90m';
    const resetColor = '\x1b[0m';

    console.log(`${levelColor}[${levelName}]${resetColor} ${timestamp} ${message}`);
    if (context) {
      console.log(JSON.stringify(redactSensitive(context), null, 2));
    }
  } else {
    // In production, output JSON for log aggregation
    console.log(JSON.stringify(logEntry));
  }
}

/**
 * Core logger class
 */
class Logger {
  fatal(context: Record<string, any>, message: string) {
    if (currentLogLevel <= LogLevel.FATAL) {
      formatLog(LogLevel.FATAL, message, context);
    }
  }

  error(context: Record<string, any>, message: string) {
    if (currentLogLevel <= LogLevel.ERROR) {
      formatLog(LogLevel.ERROR, message, context);
    }
  }

  warn(context: Record<string, any>, message: string) {
    if (currentLogLevel <= LogLevel.WARN) {
      formatLog(LogLevel.WARN, message, context);
    }
  }

  info(context: Record<string, any>, message: string) {
    if (currentLogLevel <= LogLevel.INFO) {
      formatLog(LogLevel.INFO, message, context);
    }
  }

  debug(context: Record<string, any>, message: string) {
    if (currentLogLevel <= LogLevel.DEBUG) {
      formatLog(LogLevel.DEBUG, message, context);
    }
  }

  trace(context: Record<string, any>, message: string) {
    if (currentLogLevel <= LogLevel.TRACE) {
      formatLog(LogLevel.TRACE, message, context);
    }
  }
}

export const logger = new Logger();

/**
 * API Request Logger
 * Logs incoming API requests with timing and status
 */
export function logRequest(params: {
  method: string;
  url: string;
  duration?: number;
  statusCode?: number;
  userId?: string;
  error?: Error;
}) {
  const { method, url, duration, statusCode, userId, error } = params;

  const logContext = {
    method,
    url,
    duration,
    statusCode,
    userId,
  };

  if (error) {
    logger.error(
      { ...logContext, err: error.message, stack: error.stack },
      `API Request Failed: ${method} ${url}`
    );
  } else if (statusCode && statusCode >= 500) {
    logger.error(logContext, `API Request Error: ${method} ${url}`);
  } else if (statusCode && statusCode >= 400) {
    logger.warn(logContext, `API Request Warning: ${method} ${url}`);
  } else {
    logger.info(logContext, `API Request: ${method} ${url}`);
  }
}

/**
 * Sync Operation Logger
 * Logs Teamwork sync operations with detailed metrics
 */
export function logSync(params: {
  operation: 'start' | 'complete' | 'error';
  incremental: boolean;
  syncedProjects?: number;
  syncedLogs?: number;
  duration?: number;
  error?: Error;
  customFieldErrors?: number;
}) {
  const { operation, incremental, syncedProjects, syncedLogs, duration, error, customFieldErrors } =
    params;

  const logContext = {
    operation,
    incremental,
    syncedProjects,
    syncedLogs,
    duration,
    customFieldErrors,
  };

  if (operation === 'error' && error) {
    logger.error(
      { ...logContext, err: error.message, stack: error.stack },
      'Sync operation failed'
    );
  } else if (operation === 'complete') {
    logger.info(logContext, `Sync completed: ${syncedLogs} logs, ${syncedProjects} projects`);
  } else {
    logger.info(logContext, `Sync started: ${incremental ? 'incremental' : 'full'}`);
  }
}

/**
 * Export Operation Logger
 * Logs export generation operations
 */
export function logExport(params: {
  operation: 'start' | 'complete' | 'error';
  userId: string;
  startDate: Date;
  endDate: Date;
  fileName?: string;
  duration?: number;
  error?: Error;
}) {
  const { operation, userId, startDate, endDate, fileName, duration, error } = params;

  const logContext = {
    operation,
    userId,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    fileName,
    duration,
  };

  if (operation === 'error' && error) {
    logger.error(
      { ...logContext, err: error.message, stack: error.stack },
      'Export operation failed'
    );
  } else if (operation === 'complete') {
    logger.info(logContext, `Export completed: ${fileName}`);
  } else {
    logger.info(logContext, 'Export started');
  }
}

/**
 * Database Operation Logger
 * Logs database queries with timing
 */
export function logDatabase(params: {
  operation: string;
  model: string;
  duration?: number;
  error?: Error;
  recordCount?: number;
}) {
  const { operation, model, duration, error, recordCount } = params;

  const logContext = {
    operation,
    model,
    duration,
    recordCount,
  };

  if (error) {
    logger.error(
      { ...logContext, err: error.message, stack: error.stack },
      `Database ${operation} failed on ${model}`
    );
  } else if (duration && duration > 1000) {
    // Warn about slow queries (> 1 second)
    logger.warn(logContext, `Slow database ${operation} on ${model}`);
  } else {
    logger.debug(logContext, `Database ${operation} on ${model}`);
  }
}

/**
 * Authentication Logger
 * Logs authentication events
 */
export function logAuth(params: {
  event: 'login' | 'logout' | 'unauthorized' | 'token_refresh';
  email?: string;
  userId?: string;
  reason?: string;
  error?: Error;
}) {
  const { event, email, userId, reason, error } = params;

  const logContext = {
    event,
    email,
    userId,
    reason,
  };

  if (error) {
    logger.error({ ...logContext, err: error.message, stack: error.stack }, `Auth ${event} failed`);
  } else if (event === 'unauthorized') {
    logger.warn(logContext, 'Unauthorized access attempt');
  } else {
    logger.info(logContext, `Auth ${event}`);
  }
}

/**
 * Validation Error Logger
 * Logs validation failures with field details
 */
export function logValidation(params: {
  endpoint: string;
  errors: Array<{ field: string; message: string }>;
  userId?: string;
}) {
  const { endpoint, errors, userId } = params;

  logger.warn(
    {
      endpoint,
      errors,
      userId,
      errorCount: errors.length,
    },
    `Validation failed for ${endpoint}`
  );
}

/**
 * External API Logger
 * Logs calls to external APIs (Teamwork, S3, etc.)
 */
export function logExternalAPI(params: {
  service: 'teamwork' | 's3' | 'google';
  operation: string;
  duration?: number;
  statusCode?: number;
  error?: Error;
}) {
  const { service, operation, duration, statusCode, error } = params;

  const logContext = {
    service,
    operation,
    duration,
    statusCode,
  };

  if (error) {
    logger.error(
      { ...logContext, err: error.message, stack: error.stack },
      `${service} API call failed: ${operation}`
    );
  } else if (statusCode && statusCode >= 500) {
    logger.error(logContext, `${service} API error: ${operation}`);
  } else if (statusCode && statusCode >= 400) {
    logger.warn(logContext, `${service} API warning: ${operation}`);
  } else if (duration && duration > 5000) {
    // Warn about slow external API calls (> 5 seconds)
    logger.warn(logContext, `Slow ${service} API call: ${operation}`);
  } else {
    logger.debug(logContext, `${service} API call: ${operation}`);
  }
}

/**
 * Performance Logger
 * Logs performance metrics
 */
export function logPerformance(params: {
  operation: string;
  duration: number;
  metadata?: Record<string, any>;
}) {
  const { operation, duration, metadata } = params;

  const logContext = {
    operation,
    duration,
    ...metadata,
  };

  if (duration > 5000) {
    logger.warn(logContext, `Slow operation: ${operation}`);
  } else {
    logger.debug(logContext, `Performance: ${operation}`);
  }
}

/**
 * Critical Error Logger
 * Logs critical errors that require immediate attention
 * In production, these should trigger alerts
 */
export function logCritical(params: {
  message: string;
  error: Error;
  context?: Record<string, any>;
}) {
  const { message, error, context } = params;

  const criticalContext = {
    err: error.message,
    stack: error.stack,
    errorName: error.name,
    timestamp: new Date().toISOString(),
    ...context,
  };

  logger.fatal(criticalContext, `CRITICAL: ${message}`);

  // Fallback to console.error in production for immediate visibility in container logs
  // This ensures critical errors are captured even if structured logging fails
  // Note: When error tracking (Sentry, etc.) is added, integrate here
  if (isProduction) {
    console.error(
      'CRITICAL ERROR:',
      JSON.stringify({
        message,
        error: error.message,
        stack: error.stack,
        context,
        timestamp: criticalContext.timestamp,
      })
    );
  }
}

// Export default logger for direct use when needed
export default logger;
