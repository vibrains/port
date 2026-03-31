/**
 * PostgreSQL database connection and query helpers
 * @module lib/db
 */

import { Pool, QueryResult as PgQueryResult, QueryResultRow, types } from "pg";

// Return TIME and TIMETZ values as raw strings to avoid timezone conversion
types.setTypeParser(1083, (val) => val); // TIME WITHOUT TIME ZONE
types.setTypeParser(1266, (val) => val); // TIME WITH TIME ZONE

/**
 * Singleton pool instance
 */
let pool: Pool | null = null;

/**
 * Returns the shared connection pool, creating it on first call.
 * Uses DATABASE_URL which Sevalla provides for connected databases.
 */
function getPool(): Pool {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "Missing DATABASE_URL environment variable. " +
        "Please check your .env.local file."
    );
  }

  pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  return pool;
}

/**
 * Executes a parameterized SQL query against the database.
 *
 * @param text - SQL query string with $1, $2, … placeholders
 * @param params - Values for the placeholders
 * @returns The pg QueryResult
 *
 * @example
 * const result = await query('SELECT * FROM clients WHERE id = $1', [clientId]);
 * const rows = result.rows;
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: unknown[]
): Promise<PgQueryResult<T>> {
  return getPool().query<T>(text, params);
}

/**
 * Type helper for query results
 */
export type QueryResult<T> = {
  data: T | null;
  error: Error | null;
};

/**
 * Type helper for array query results
 */
export type QueryArrayResult<T> = {
  data: T[] | null;
  error: Error | null;
};

/**
 * Helper function to handle database errors consistently
 *
 * @param error - The error from the database
 * @returns Formatted error message
 */
export function formatDbError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unknown error occurred";
}
