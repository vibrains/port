/**
 * Shared database utilities
 * @module lib/db/utils
 */

/**
 * Formats a Date as YYYY-MM-DD for comparison with PostgreSQL DATE columns.
 * Avoids implicit TIMESTAMPTZ casting that can shift dates depending on
 * the server's timezone setting.
 */
export function toDateString(d: Date): string {
  return d.toISOString().split("T")[0];
}

/**
 * Result type for paginated queries
 */
export interface PaginatedResult<T> {
  data: T[];
  count: number;
}

/**
 * Builds a batch INSERT query with chunked VALUES clauses.
 * Returns an array of { sql, params } objects, one per chunk.
 *
 * @param tableName - The table to insert into
 * @param columns - Array of column names
 * @param rows - Array of row value arrays (same order as columns)
 * @param chunkSize - Number of rows per batch (default: 50)
 * @returns Array of { sql, params } ready for query()
 */
export function buildBatchInsert(
  tableName: string,
  columns: string[],
  rows: unknown[][],
  chunkSize = 50
): { sql: string; params: unknown[] }[] {
  const colCount = columns.length;
  const batches: { sql: string; params: unknown[] }[] = [];

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const params: unknown[] = [];
    const valueClauses: string[] = [];

    for (let rowIdx = 0; rowIdx < chunk.length; rowIdx++) {
      const row = chunk[rowIdx];
      const placeholders: string[] = [];
      for (let colIdx = 0; colIdx < colCount; colIdx++) {
        const paramNum = rowIdx * colCount + colIdx + 1;
        placeholders.push(`$${paramNum}`);
        params.push(row[colIdx]);
      }
      valueClauses.push(`(${placeholders.join(", ")})`);
    }

    const sql = `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES ${valueClauses.join(", ")}`;
    batches.push({ sql, params });
  }

  return batches;
}
